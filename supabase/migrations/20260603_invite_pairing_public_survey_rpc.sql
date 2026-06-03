-- Stabilize invite/pairing writes behind SECURITY DEFINER RPCs and return
-- readable public survey answers for the matching detail page.

create or replace function public.dorm_match_decode_answer(
  p_options jsonb,
  p_answer text
)
returns text
language plpgsql
stable
as $$
declare
  v_part text;
  v_option jsonb;
  v_piece text;
  v_result text := '';
begin
  if p_answer is null or btrim(p_answer) = '' then
    return '';
  end if;

  if p_options is null or jsonb_typeof(p_options) <> 'array' then
    return p_answer;
  end if;

  foreach v_part in array string_to_array(p_answer, ',') loop
    v_part := btrim(v_part);
    if v_part = '' then
      continue;
    end if;

    select opt.value
      into v_option
      from jsonb_array_elements(p_options) as opt(value)
     where opt.value ->> 'value' = v_part
     limit 1;

    if v_option is null then
      v_piece := v_part;
    elsif coalesce(v_option ->> 'label', '') <> '' and coalesce(v_option ->> 'text', '') <> '' then
      v_piece := (v_option ->> 'label') || '. ' || (v_option ->> 'text');
    else
      v_piece := coalesce(v_option ->> 'text', v_option ->> 'label', v_part);
    end if;

    if v_result <> '' then
      v_result := v_result || ' / ';
    end if;
    v_result := v_result || v_piece;
  end loop;

  return coalesce(nullif(v_result, ''), p_answer);
end;
$$;

create or replace function public.send_invite_to_student(
  p_target_id uuid,
  p_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_school_code text;
  v_target_school_code text;
  v_invite_id bigint;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_target_id is null or p_target_id = v_uid then
    raise exception 'INVITE_SELF_NOT_ALLOWED';
  end if;

  select p.school_code
    into v_school_code
    from public.profiles p
   where p.id = v_uid
     and p.role = 'STUDENT';

  if v_school_code is null then
    raise exception 'SENDER_NOT_STUDENT';
  end if;

  select p.school_code
    into v_target_school_code
    from public.profiles p
   where p.id = p_target_id
     and p.role = 'STUDENT';

  if v_target_school_code is null then
    raise exception 'TARGET_NOT_STUDENT';
  end if;

  if v_school_code <> v_target_school_code then
    raise exception 'INVITE_CROSS_SCHOOL_DENIED';
  end if;

  update public.invites
     set status = 3
   where status = 0
     and expires_at is not null
     and expires_at <= now()
     and (
       (from_user_id = v_uid and to_user_id = p_target_id)
       or
       (from_user_id = p_target_id and to_user_id = v_uid)
     );

  if exists (
    select 1
      from public.invites i
     where i.status = 0
       and (i.expires_at is null or i.expires_at > now())
       and (
         (i.from_user_id = v_uid and i.to_user_id = p_target_id)
         or
         (i.from_user_id = p_target_id and i.to_user_id = v_uid)
       )
  ) then
    raise exception 'INVITE_ALREADY_PENDING';
  end if;

  insert into public.invites (
    from_user_id,
    to_user_id,
    school_code,
    message,
    status,
    expires_at
  ) values (
    v_uid,
    p_target_id,
    v_school_code,
    coalesce(p_message, ''),
    0,
    now() + interval '72 hours'
  )
  returning id into v_invite_id;

  return jsonb_build_object('id', v_invite_id);
end;
$$;

create or replace function public.accept_invite_and_create_pairing(p_invite_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite record;
  v_from_school_code text;
  v_to_school_code text;
  v_from_group_id bigint;
  v_to_group_id bigint;
  v_group_id bigint;
  v_capacity integer := 8;
  v_member_count integer := 0;
  v_additions integer := 0;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
    into v_invite
    from public.invites
   where id = p_invite_id
   for update;

  if v_invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_invite.to_user_id <> v_uid then
    raise exception 'INVITE_PERMISSION_DENIED';
  end if;

  if v_invite.status <> 0 then
    raise exception 'INVITE_STATUS_CHANGED';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    update public.invites
       set status = 3
     where id = p_invite_id;
    raise exception 'INVITE_EXPIRED';
  end if;

  select p.school_code
    into v_from_school_code
    from public.profiles p
   where p.id = v_invite.from_user_id
     and p.role = 'STUDENT';

  select p.school_code
    into v_to_school_code
    from public.profiles p
   where p.id = v_invite.to_user_id
     and p.role = 'STUDENT';

  if v_from_school_code is null or v_to_school_code is null or v_from_school_code <> v_to_school_code then
    raise exception 'INVITE_CROSS_SCHOOL_DENIED';
  end if;

  if v_invite.school_code is not null and v_invite.school_code <> v_from_school_code then
    raise exception 'INVITE_SCHOOL_MISMATCH';
  end if;

  select dr.capacity
    into v_capacity
    from public.dormitory_rooms dr
   where dr.school_code = v_from_school_code
     and coalesce(dr.status, '') <> 'MAINTENANCE'
     and dr.capacity is not null
     and dr.capacity > 0
   group by dr.capacity
   order by count(*) desc, dr.capacity desc
   limit 1;

  v_capacity := coalesce(v_capacity, 8);

  select pm.group_id
    into v_from_group_id
    from public.pair_members pm
   where pm.user_id = v_invite.from_user_id
   limit 1;

  select pm.group_id
    into v_to_group_id
    from public.pair_members pm
   where pm.user_id = v_invite.to_user_id
   limit 1;

  if v_from_group_id is not null
     and v_to_group_id is not null
     and v_from_group_id <> v_to_group_id then
    raise exception 'USERS_ALREADY_IN_DIFFERENT_GROUPS';
  end if;

  v_group_id := coalesce(v_from_group_id, v_to_group_id);

  if v_group_id is null then
    insert into public.pair_groups (school_code, status)
    values (v_from_school_code, 1)
    returning id into v_group_id;
  else
    perform 1
      from public.pair_groups pg
     where pg.id = v_group_id
       and pg.school_code = v_from_school_code
     for update;

    if not found then
      raise exception 'PAIR_GROUP_SCHOOL_MISMATCH';
    end if;
  end if;

  select count(*)
    into v_member_count
    from public.pair_members pm
   where pm.group_id = v_group_id;

  v_additions :=
    case when v_from_group_id is null then 1 else 0 end +
    case when v_to_group_id is null then 1 else 0 end;

  if v_member_count + v_additions > v_capacity then
    raise exception 'PAIR_GROUP_FULL';
  end if;

  insert into public.pair_members (group_id, user_id, is_initiator)
  values
    (v_group_id, v_invite.from_user_id, 1),
    (v_group_id, v_invite.to_user_id, 0)
  on conflict (group_id, user_id)
  do update set is_initiator = excluded.is_initiator;

  update public.invites
     set status = 1
   where id = p_invite_id;

  update public.profiles
     set match_status = 'PAIRED'
   where id in (v_invite.from_user_id, v_invite.to_user_id);

  return jsonb_build_object('groupId', v_group_id);
end;
$$;

create or replace function public.get_public_student_survey(p_target_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_school_code text;
  v_target_school_code text;
  v_result jsonb;
begin
  if v_uid is null or p_target_id is null then
    return null;
  end if;

  select p.school_code
    into v_school_code
    from public.profiles p
   where p.id = v_uid;

  select p.school_code
    into v_target_school_code
    from public.profiles p
   where p.id::text = p_target_id
     and p.role = 'STUDENT'
     and p.survey_status = 'COMPLETED';

  if v_school_code is null or v_target_school_code is null or v_school_code <> v_target_school_code then
    return null;
  end if;

  with allowed_dims(dimension, sort_rank) as (
    values
      ('LIFESTYLE', 10),
      ('SLEEP', 20),
      ('HYGIENE', 30),
      ('STUDY', 40),
      ('HOBBY', 50),
      ('SOCIAL', 60),
      ('SPENDING', 70),
      ('EXTENSION', 80)
  ),
  raw_answers as (
    select
      lower(q.dimension) as key,
      q.dimension,
      ad.sort_rank,
      q.id,
      q.question_text,
      a.answer_value,
      q.options_json::jsonb as options_json,
      q.sort_order
    from public.survey_answers a
    join public.survey_questions q
      on q.id = a.question_id
     and q.status = 1
    join allowed_dims ad
      on ad.dimension = q.dimension
    where a.user_id::text = p_target_id
  ),
  grouped_sections as (
    select
      key,
      dimension,
      sort_rank,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'questionText', question_text,
          'answerValue', answer_value,
          'answerText', public.dorm_match_decode_answer(options_json, answer_value::text)
        )
        order by sort_order
      ) as questions
    from raw_answers
    group by key, dimension, sort_rank
  )
  select jsonb_build_object(
    'sections',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'key', key,
          'dimension', dimension,
          'title', dimension,
          'desc', '',
          'questions', questions
        )
        order by sort_rank
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from grouped_sections;

  return coalesce(v_result, '{"sections":[]}'::jsonb);
end;
$$;

revoke all on function public.dorm_match_decode_answer(jsonb, text) from public;
revoke all on function public.send_invite_to_student(uuid, text) from public;
revoke all on function public.accept_invite_and_create_pairing(bigint) from public;
revoke all on function public.get_public_student_survey(text) from public;

grant execute on function public.send_invite_to_student(uuid, text) to authenticated;
grant execute on function public.accept_invite_and_create_pairing(bigint) to authenticated;
grant execute on function public.get_public_student_survey(text) to authenticated;
