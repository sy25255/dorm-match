create extension if not exists pgcrypto;

create table if not exists public.student_rosters (
  id bigserial primary key,
  school_code text not null,
  student_no text not null,
  name text not null,
  gender integer not null default 1,
  college_name text not null default '',
  major_name text not null default '',
  class_name text not null default '',
  initial_code_hash text not null,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  activation_status text not null default 'PENDING'
    check (activation_status in ('PENDING', 'ACTIVE', 'DISABLED')),
  activated_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists student_rosters_school_student_no_idx
  on public.student_rosters (school_code, student_no);

create index if not exists student_rosters_school_status_idx
  on public.student_rosters (school_code, activation_status, created_at desc);

alter table public.student_rosters enable row level security;

alter table public.profiles
  add column if not exists roster_id bigint references public.student_rosters(id) on delete set null,
  add column if not exists survey_invalid_reason text,
  add column if not exists survey_invalid_at timestamptz;

alter table public.profiles
  add column if not exists is_valid boolean not null default true;

drop policy if exists "school admins can read rosters" on public.student_rosters;
create policy "school admins can read rosters"
  on public.student_rosters for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.school_code = student_rosters.school_code
        and p.role in ('ADMIN', 'DEVELOPER')
    )
  );

drop policy if exists "students can read own roster" on public.student_rosters;
create policy "students can read own roster"
  on public.student_rosters for select
  using (auth_user_id = auth.uid());

create or replace function public.dorm_match_is_school_admin(p_school_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.school_code = p_school_code
      and p.role in ('ADMIN', 'DEVELOPER')
  );
$$;

create or replace function public.dorm_match_hash_initial_code(p_code text)
returns text
language sql
immutable
as $$
  select encode(digest(coalesce(p_code, ''), 'sha256'), 'hex');
$$;

create or replace function public.admin_import_student_rosters(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_school_code text;
  v_row jsonb;
  v_count integer := 0;
begin
  select p.school_code into v_school_code
  from public.profiles p
  where p.id = v_uid
    and p.role in ('ADMIN', 'DEVELOPER');

  if v_school_code is null then
    raise exception 'ADMIN_REQUIRED';
  end if;

  for v_row in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    if nullif(trim(coalesce(v_row ->> 'studentNo', v_row ->> 'student_no')), '') is null then
      continue;
    end if;

    insert into public.student_rosters (
      school_code, student_no, name, gender,
      college_name, major_name, class_name,
      initial_code_hash, created_by, updated_at
    ) values (
      v_school_code,
      upper(trim(coalesce(v_row ->> 'studentNo', v_row ->> 'student_no'))),
      trim(coalesce(v_row ->> 'name', '')),
      case
        when trim(coalesce(v_row ->> 'gender', '')) in ('0', '女', 'F', 'f', 'female', 'Female') then 0
        else 1
      end,
      trim(coalesce(v_row ->> 'collegeName', v_row ->> 'college_name', '')),
      trim(coalesce(v_row ->> 'majorName', v_row ->> 'major_name', '')),
      trim(coalesce(v_row ->> 'className', v_row ->> 'class_name', '')),
      public.dorm_match_hash_initial_code(coalesce(v_row ->> 'initialCode', v_row ->> 'initial_code', '')),
      v_uid,
      now()
    )
    on conflict (school_code, student_no)
    do update set
      name = excluded.name,
      gender = excluded.gender,
      college_name = excluded.college_name,
      major_name = excluded.major_name,
      class_name = excluded.class_name,
      initial_code_hash = excluded.initial_code_hash,
      updated_at = now();

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('imported', v_count);
end;
$$;

create or replace function public.verify_student_roster(
  p_school_code text,
  p_student_no text,
  p_initial_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roster public.student_rosters;
begin
  select *
    into v_roster
    from public.student_rosters
   where school_code = upper(trim(p_school_code))
     and student_no = upper(trim(p_student_no))
   limit 1;

  if v_roster.id is null then
    raise exception 'STUDENT_ROSTER_NOT_FOUND';
  end if;

  if v_roster.activation_status = 'DISABLED' then
    raise exception 'STUDENT_ROSTER_DISABLED';
  end if;

  if v_roster.auth_user_id is not null then
    raise exception 'STUDENT_ROSTER_ALREADY_CLAIMED';
  end if;

  if v_roster.initial_code_hash <> public.dorm_match_hash_initial_code(p_initial_code) then
    raise exception 'STUDENT_INITIAL_CODE_INVALID';
  end if;

  return jsonb_build_object(
    'rosterId', v_roster.id,
    'schoolCode', v_roster.school_code,
    'studentNo', v_roster.student_no,
    'name', v_roster.name,
    'gender', v_roster.gender,
    'collegeName', v_roster.college_name,
    'majorName', v_roster.major_name,
    'className', v_roster.class_name
  );
end;
$$;

create or replace function public.claim_student_roster(
  p_school_code text,
  p_student_no text,
  p_initial_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_roster public.student_rosters;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  perform public.verify_student_roster(p_school_code, p_student_no, p_initial_code);

  select *
    into v_roster
    from public.student_rosters
   where school_code = upper(trim(p_school_code))
     and student_no = upper(trim(p_student_no))
   for update;

  update public.student_rosters
     set auth_user_id = v_uid,
         activation_status = 'ACTIVE',
         activated_at = now(),
         updated_at = now()
   where id = v_roster.id;

  insert into public.profiles (
    id, school_code, student_no, name, role, gender,
    college_name, major_name, class_name, roster_id,
    survey_status, match_status
  ) values (
    v_uid, v_roster.school_code, v_roster.student_no, v_roster.name, 'STUDENT', v_roster.gender,
    v_roster.college_name, v_roster.major_name, v_roster.class_name, v_roster.id,
    'NOT_STARTED', 'WAITING'
  )
  on conflict (id)
  do update set
    school_code = excluded.school_code,
    student_no = excluded.student_no,
    name = excluded.name,
    role = 'STUDENT',
    gender = excluded.gender,
    college_name = excluded.college_name,
    major_name = excluded.major_name,
    class_name = excluded.class_name,
    roster_id = excluded.roster_id;

  return jsonb_build_object('profileId', v_uid, 'schoolCode', v_roster.school_code);
end;
$$;

create or replace function public.admin_reset_student_initial_code(
  p_roster_id bigint,
  p_initial_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roster public.student_rosters;
begin
  select * into v_roster
  from public.student_rosters
  where id = p_roster_id
  for update;

  if v_roster.id is null then
    raise exception 'STUDENT_ROSTER_NOT_FOUND';
  end if;

  if not public.dorm_match_is_school_admin(v_roster.school_code) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.student_rosters
     set initial_code_hash = public.dorm_match_hash_initial_code(p_initial_code),
         auth_user_id = null,
         activation_status = 'PENDING',
         activated_at = null,
         updated_at = now()
   where id = p_roster_id;

  return jsonb_build_object('reset', true);
end;
$$;

create or replace function public.admin_set_student_roster_status(
  p_roster_id bigint,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roster public.student_rosters;
  v_status text := upper(trim(coalesce(p_status, '')));
begin
  if v_status not in ('PENDING', 'ACTIVE', 'DISABLED') then
    raise exception 'INVALID_ROSTER_STATUS';
  end if;

  select * into v_roster
  from public.student_rosters
  where id = p_roster_id
  for update;

  if v_roster.id is null then
    raise exception 'STUDENT_ROSTER_NOT_FOUND';
  end if;

  if not public.dorm_match_is_school_admin(v_roster.school_code) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.student_rosters
     set activation_status = v_status,
         updated_at = now()
   where id = p_roster_id;

  if v_roster.auth_user_id is not null then
    update public.profiles
       set is_valid = (v_status <> 'DISABLED')
     where id = v_roster.auth_user_id;
  end if;

  return jsonb_build_object('status', v_status);
end;
$$;

create or replace function public.get_my_roster_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_uid is null then
    return null;
  end if;

  select * into v_profile
  from public.profiles
  where id = v_uid;

  if v_profile.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'schoolCode', v_profile.school_code,
    'studentNo', v_profile.student_no,
    'name', v_profile.name,
    'gender', v_profile.gender,
    'collegeName', v_profile.college_name,
    'majorName', v_profile.major_name,
    'className', v_profile.class_name,
    'role', v_profile.role,
    'isValid', v_profile.is_valid,
    'surveyStatus', v_profile.survey_status,
    'matchStatus', v_profile.match_status
  );
end;
$$;

create or replace function public.protect_roster_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'STUDENT'
     and old.roster_id is not null
     and auth.uid() = old.id
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('ADMIN', 'DEVELOPER')
     ) then
    new.school_code := old.school_code;
    new.student_no := old.student_no;
    new.name := old.name;
    new.gender := old.gender;
    new.college_name := old.college_name;
    new.major_name := old.major_name;
    new.class_name := old.class_name;
    new.roster_id := old.roster_id;
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_roster_profile_fields_trigger on public.profiles;
create trigger protect_roster_profile_fields_trigger
before update on public.profiles
for each row
execute function public.protect_roster_profile_fields();

create or replace function public.submit_survey_answers(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row jsonb;
  v_question_id bigint;
  v_answer text;
  v_display_index integer;
  v_failed_checks integer := 0;
  v_same_position_count integer := 0;
  v_total_position_count integer := 0;
  v_invalid_reason text := '';
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.role = 'STUDENT'
      and coalesce(p.is_valid, true) = true
  ) then
    raise exception 'ACTIVE_STUDENT_REQUIRED';
  end if;

  for v_row in select value from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    v_question_id := nullif(v_row ->> 'questionId', '')::bigint;
    v_answer := coalesce(v_row ->> 'answerValue', '');
    v_display_index := nullif(v_row ->> 'displayIndex', '')::integer;

    if v_question_id is null then
      continue;
    end if;

    insert into public.survey_answers (user_id, question_id, answer_value, updated_at)
    values (v_uid, v_question_id, v_answer, now())
    on conflict (user_id, question_id)
    do update set answer_value = excluded.answer_value, updated_at = now();

    if v_display_index is not null then
      v_total_position_count := v_total_position_count + 1;
    end if;

    if exists (
      select 1
      from public.survey_questions q
      where q.id = v_question_id
        and q.status = 1
        and coalesce(q.trap_answer, '') <> ''
        and q.trap_answer <> v_answer
    ) then
      v_failed_checks := v_failed_checks + 1;
    end if;
  end loop;

  select coalesce(max(c), 0)
    into v_same_position_count
    from (
      select nullif(value ->> 'displayIndex', '')::integer as display_index, count(*) as c
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
      where nullif(value ->> 'displayIndex', '') is not null
      group by nullif(value ->> 'displayIndex', '')::integer
    ) x;

  if v_failed_checks > 0 then
    v_invalid_reason := '验证题答错';
  elsif v_total_position_count >= 12 and v_same_position_count >= v_total_position_count - 1 then
    v_invalid_reason := '疑似全选同一位置';
  end if;

  if v_invalid_reason <> '' then
    update public.profiles
       set survey_status = 'NEEDS_RETAKE',
           survey_invalid_reason = v_invalid_reason,
           survey_invalid_at = now()
     where id = v_uid;
    return jsonb_build_object('status', 'NEEDS_RETAKE', 'reason', v_invalid_reason);
  end if;

  update public.profiles
     set survey_status = 'COMPLETED',
         survey_invalid_reason = null,
         survey_invalid_at = null
   where id = v_uid;

  return jsonb_build_object('status', 'COMPLETED');
end;
$$;

grant execute on function public.verify_student_roster(text, text, text) to anon, authenticated;
grant execute on function public.claim_student_roster(text, text, text) to authenticated;
grant execute on function public.admin_import_student_rosters(jsonb) to authenticated;
grant execute on function public.admin_reset_student_initial_code(bigint, text) to authenticated;
grant execute on function public.admin_set_student_roster_status(bigint, text) to authenticated;
grant execute on function public.get_my_roster_profile() to authenticated;
grant execute on function public.submit_survey_answers(jsonb) to authenticated;
