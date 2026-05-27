-- Server-side matching RPCs for production RLS.
-- Run this in the Supabase SQL editor as the project owner before locking down
-- survey_answers so students cannot read other students' raw answers.

create or replace function public.dorm_match_answer_diff(a text, b text)
returns numeric
language plpgsql
immutable
as $$
declare
  an numeric;
  bn numeric;
  a_parts text[];
  b_parts text[];
  union_count integer;
  intersection_count integer;
begin
  if a is null or b is null then
    return null;
  end if;

  begin
    an := a::numeric;
    bn := b::numeric;
    return least(abs(an - bn), 4);
  exception when others then
    null;
  end;

  if position(',' in a) > 0 or position(',' in b) > 0 then
    select array_agg(distinct trim(value))
      into a_parts
      from unnest(string_to_array(coalesce(a, ''), ',')) as raw(value)
     where trim(value) <> '';

    select array_agg(distinct trim(value))
      into b_parts
      from unnest(string_to_array(coalesce(b, ''), ',')) as raw(value)
     where trim(value) <> '';

    select count(*)
      into union_count
      from (
        select unnest(coalesce(a_parts, '{}'::text[]))
        union
        select unnest(coalesce(b_parts, '{}'::text[]))
      ) u;

    select count(*)
      into intersection_count
      from (
        select unnest(coalesce(a_parts, '{}'::text[]))
        intersect
        select unnest(coalesce(b_parts, '{}'::text[]))
      ) i;

    if union_count = 0 then
      return 0;
    end if;

    return (1 - intersection_count::numeric / union_count) * 4;
  end if;

  if a = b then
    return 0;
  end if;

  return 4;
end;
$$;

create or replace function public.get_match_recommendations(p_limit integer default 20)
returns table (
  id uuid,
  student_id uuid,
  name text,
  gender integer,
  college_name text,
  major_name text,
  class_name text,
  hometown text,
  bio text,
  avatar_url text,
  smoking text,
  snoring text,
  leader_score numeric,
  match_status text,
  student_no text,
  match_score integer,
  total_score integer,
  dimension_scores jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_school_code text;
begin
  if v_uid is null then
    return;
  end if;

  select p.school_code
    into v_school_code
    from public.profiles p
   where p.id = v_uid;

  if v_school_code is null then
    return;
  end if;

  return query
  with scored_questions as (
    select
      oa.user_id as target_id,
      q.dimension,
      public.dorm_match_answer_diff(ma.answer_value::text, oa.answer_value::text) as diff
    from public.survey_answers ma
    join public.survey_answers oa
      on oa.question_id = ma.question_id
     and oa.user_id <> v_uid
    join public.profiles p
      on p.id = oa.user_id
    left join public.survey_questions q
      on q.id = ma.question_id
     and q.status = 1
    where ma.user_id = v_uid
      and p.school_code = v_school_code
      and p.role = 'STUDENT'
      and p.survey_status = 'COMPLETED'
  ),
  total_scores as (
    select
      target_id,
      greatest(least(round((1 - sum(diff) / (count(*) * 4)) * 100)::integer, 100), 0) as score
    from scored_questions
    where diff is not null
    group by target_id
  ),
  dimension_scores as (
    select
      target_id,
      dimension,
      greatest(least(round((1 - sum(diff) / (count(*) * 4)) * 100)::integer, 100), 0) as score
    from scored_questions
    where diff is not null
      and dimension is not null
    group by target_id, dimension
  )
  select
    p.id,
    p.id as student_id,
    p.name::text,
    p.gender::integer,
    p.college_name::text,
    p.major_name::text,
    p.class_name::text,
    p.hometown::text,
    p.bio::text,
    p.avatar_url::text,
    p.smoking::text,
    p.snoring::text,
    p.leader_score::numeric,
    p.match_status::text,
    p.student_no::text,
    t.score as match_score,
    t.score as total_score,
    coalesce((
      select jsonb_object_agg(ds.dimension, ds.score)
        from dimension_scores ds
       where ds.target_id = p.id
    ), '{}'::jsonb) as dimension_scores
  from total_scores t
  join public.profiles p
    on p.id = t.target_id
  order by t.score desc
  limit greatest(least(coalesce(p_limit, 20), 100), 1);
end;
$$;

create or replace function public.get_match_detail(p_target_id text)
returns table (
  id uuid,
  student_id uuid,
  name text,
  gender integer,
  college_name text,
  major_name text,
  class_name text,
  hometown text,
  bio text,
  avatar_url text,
  smoking text,
  snoring text,
  leader_score numeric,
  match_status text,
  student_no text,
  match_score integer,
  total_score integer,
  dimension_scores jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_school_code text;
begin
  if v_uid is null or p_target_id is null then
    return;
  end if;

  select p.school_code
    into v_school_code
    from public.profiles p
   where p.id = v_uid;

  if v_school_code is null then
    return;
  end if;

  return query
  with scored_questions as (
    select
      oa.user_id as target_id,
      q.dimension,
      public.dorm_match_answer_diff(ma.answer_value::text, oa.answer_value::text) as diff
    from public.survey_answers ma
    join public.survey_answers oa
      on oa.question_id = ma.question_id
     and oa.user_id::text = p_target_id
    join public.profiles p
      on p.id = oa.user_id
    left join public.survey_questions q
      on q.id = ma.question_id
     and q.status = 1
    where ma.user_id = v_uid
      and p.school_code = v_school_code
      and p.role = 'STUDENT'
      and p.survey_status = 'COMPLETED'
      and p.id <> v_uid
  ),
  total_scores as (
    select
      target_id,
      greatest(least(round((1 - sum(diff) / (count(*) * 4)) * 100)::integer, 100), 0) as score
    from scored_questions
    where diff is not null
    group by target_id
  ),
  dimension_scores as (
    select
      target_id,
      dimension,
      greatest(least(round((1 - sum(diff) / (count(*) * 4)) * 100)::integer, 100), 0) as score
    from scored_questions
    where diff is not null
      and dimension is not null
    group by target_id, dimension
  )
  select
    p.id,
    p.id as student_id,
    p.name::text,
    p.gender::integer,
    p.college_name::text,
    p.major_name::text,
    p.class_name::text,
    p.hometown::text,
    p.bio::text,
    p.avatar_url::text,
    p.smoking::text,
    p.snoring::text,
    p.leader_score::numeric,
    p.match_status::text,
    p.student_no::text,
    t.score as match_score,
    t.score as total_score,
    coalesce((
      select jsonb_object_agg(ds.dimension, ds.score)
        from dimension_scores ds
       where ds.target_id = p.id
    ), '{}'::jsonb) as dimension_scores
  from total_scores t
  join public.profiles p
    on p.id = t.target_id;
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

  with allowed_dims(dimension, title, sort_rank) as (
    values
      ('LIFESTYLE', '生活习惯', 10),
      ('SLEEP', '生活作息', 20),
      ('HYGIENE', '卫生习惯', 30),
      ('STUDY', '学习习惯', 40),
      ('HOBBY', '兴趣爱好', 50),
      ('SOCIAL', '社交偏好', 60),
      ('SPENDING', '消费观念', 70),
      ('EXTENSION', '扩展信息', 80)
  ),
  raw_answers as (
    select
      lower(q.dimension) as key,
      ad.title,
      ad.sort_rank,
      q.id,
      q.question_text,
      a.answer_value,
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
      title,
      sort_rank,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'questionText', question_text,
          'answerValue', answer_value,
          'answerText', answer_value
        )
        order by sort_order
      ) as questions
    from raw_answers
    group by key, title, sort_rank
  )
  select jsonb_build_object(
    'sections',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'key', key,
          'title', title,
          'desc', '只展示非敏感公开偏好',
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

revoke all on function public.dorm_match_answer_diff(text, text) from public;
revoke all on function public.get_match_recommendations(integer) from public;
revoke all on function public.get_match_detail(text) from public;
revoke all on function public.get_public_student_survey(text) from public;

grant execute on function public.get_match_recommendations(integer) to authenticated;
grant execute on function public.get_match_detail(text) to authenticated;
grant execute on function public.get_public_student_survey(text) to authenticated;
