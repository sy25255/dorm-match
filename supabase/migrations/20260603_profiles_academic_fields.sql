alter table public.profiles
  add column if not exists college_name text,
  add column if not exists major_name text,
  add column if not exists class_name text;
