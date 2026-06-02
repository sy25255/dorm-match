create table if not exists public.student_invite_codes (
  id bigserial primary key,
  school_code text not null,
  code text not null unique,
  name text not null default '新生入学邀请码',
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'PAUSED', 'EXPIRED')),
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists student_invite_codes_school_status_idx
  on public.student_invite_codes (school_code, status, created_at desc);

alter table public.student_invite_codes enable row level security;

drop policy if exists "admins can manage student invite codes" on public.student_invite_codes;
create policy "admins can manage student invite codes"
  on public.student_invite_codes
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_code = student_invite_codes.school_code
        and p.role in ('ADMIN', 'DEVELOPER')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.school_code = student_invite_codes.school_code
        and p.role in ('ADMIN', 'DEVELOPER')
    )
  );

create or replace function public.verify_student_invite_code(
  p_school_code text,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.student_invite_codes;
begin
  select *
    into invite
    from public.student_invite_codes
   where school_code = upper(trim(p_school_code))
     and code = upper(trim(p_code))
     and status = 'ACTIVE'
     and (expires_at is null or expires_at > now())
     and (max_uses is null or used_count < max_uses)
   order by created_at desc
   limit 1;

  if invite.id is null then
    raise exception 'STUDENT_INVITE_INVALID';
  end if;

  return jsonb_build_object(
    'id', invite.id,
    'schoolCode', invite.school_code,
    'name', invite.name
  );
end;
$$;

grant execute on function public.verify_student_invite_code(text, text) to anon, authenticated;
