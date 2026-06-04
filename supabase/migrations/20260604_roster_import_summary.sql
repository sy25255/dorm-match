alter table public.schools
  add column if not exists expected_new_student_count integer not null default 0;

create or replace function public.admin_get_roster_import_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_school_code text;
  v_expected integer := 0;
  v_total integer := 0;
  v_pending integer := 0;
  v_active integer := 0;
  v_disabled integer := 0;
  v_completed integer := 0;
  v_retake integer := 0;
  v_paired integer := 0;
  v_allocated integer := 0;
begin
  select p.school_code into v_school_code
  from public.profiles p
  where p.id = auth.uid()
    and p.role in ('ADMIN', 'DEVELOPER');

  if v_school_code is null then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select coalesce(s.expected_new_student_count, 0)
    into v_expected
    from public.schools s
   where upper(s.code) = upper(v_school_code);

  select
    count(*),
    count(*) filter (where activation_status = 'PENDING'),
    count(*) filter (where activation_status = 'ACTIVE'),
    count(*) filter (where activation_status = 'DISABLED')
    into v_total, v_pending, v_active, v_disabled
    from public.student_rosters
   where school_code = v_school_code;

  select
    count(*) filter (where survey_status = 'COMPLETED'),
    count(*) filter (where survey_status = 'NEEDS_RETAKE'),
    count(*) filter (where match_status in ('PAIRED', 'ALLOCATED')),
    count(*) filter (where match_status = 'ALLOCATED')
    into v_completed, v_retake, v_paired, v_allocated
    from public.profiles
   where school_code = v_school_code
     and role = 'STUDENT';

  return jsonb_build_object(
    'schoolCode', v_school_code,
    'expectedNewStudents', coalesce(v_expected, 0),
    'totalRosters', coalesce(v_total, 0),
    'pendingActivation', coalesce(v_pending, 0),
    'activeStudents', coalesce(v_active, 0),
    'disabledStudents', coalesce(v_disabled, 0),
    'completedSurvey', coalesce(v_completed, 0),
    'needsRetake', coalesce(v_retake, 0),
    'pairedStudents', coalesce(v_paired, 0),
    'allocatedStudents', coalesce(v_allocated, 0),
    'missingRosters', greatest(coalesce(v_expected, 0) - coalesce(v_total, 0), 0)
  );
end;
$$;

create or replace function public.admin_set_expected_new_students(p_expected_count integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_school_code text;
  v_count integer := greatest(coalesce(p_expected_count, 0), 0);
begin
  select p.school_code into v_school_code
  from public.profiles p
  where p.id = auth.uid()
    and p.role in ('ADMIN', 'DEVELOPER');

  if v_school_code is null then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.schools
     set expected_new_student_count = v_count
   where upper(code) = upper(v_school_code);

  return public.admin_get_roster_import_summary();
end;
$$;

grant execute on function public.admin_get_roster_import_summary() to authenticated;
grant execute on function public.admin_set_expected_new_students(integer) to authenticated;
