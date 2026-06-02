create extension if not exists pgcrypto;

create table if not exists public.schools (
  code text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.schools
  add column if not exists short_name text,
  add column if not exists admin_email text,
  add column if not exists description text,
  add column if not exists status integer not null default 1,
  add column if not exists academic_year text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists schools_code_unique_idx
  on public.schools (upper(code));

create or replace function public.create_school_for_platform(
  p_code text,
  p_name text,
  p_short_name text default null,
  p_admin_email text default null,
  p_description text default null
)
returns public.schools
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role text;
  clean_code text;
  inserted public.schools;
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role is distinct from 'DEVELOPER' then
    raise exception 'Only platform developers can create schools';
  end if;

  clean_code := upper(regexp_replace(trim(coalesce(p_code, '')), '[^A-Z0-9-]', '', 'g'));
  if clean_code = '' or char_length(clean_code) < 3 then
    raise exception 'School code is required';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'School name is required';
  end if;

  insert into public.schools (
    code, name, short_name, admin_email, description, status
  ) values (
    clean_code,
    trim(p_name),
    nullif(trim(coalesce(p_short_name, '')), ''),
    nullif(lower(trim(coalesce(p_admin_email, ''))), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    1
  )
  returning * into inserted;

  return inserted;
end;
$$;

grant execute on function public.create_school_for_platform(text, text, text, text, text) to authenticated;
