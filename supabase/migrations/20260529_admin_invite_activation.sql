create extension if not exists pgcrypto;

create table if not exists public.admin_invites (
  id bigserial primary key,
  school_code text not null,
  email text not null,
  token_hash text not null unique,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'CLAIMED', 'REVOKED', 'EXPIRED')),
  created_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_invites_school_status_idx
  on public.admin_invites (school_code, status, created_at desc);

create index if not exists admin_invites_email_status_idx
  on public.admin_invites (lower(email), status);

alter table public.admin_invites enable row level security;

drop policy if exists "developers can read admin invites" on public.admin_invites;
create policy "developers can read admin invites"
  on public.admin_invites for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'DEVELOPER'
    )
  );

drop policy if exists "school admins can read school admin invites" on public.admin_invites;
create policy "school admins can read school admin invites"
  on public.admin_invites for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'ADMIN'
        and p.school_code = admin_invites.school_code
    )
  );

create or replace function public.create_admin_invite(
  p_school_code text,
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz default now() + interval '7 days'
)
returns public.admin_invites
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller_role text;
  inserted public.admin_invites;
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role is distinct from 'DEVELOPER' then
    raise exception 'Only platform developers can create admin invites';
  end if;

  if nullif(trim(p_school_code), '') is null then
    raise exception 'School code is required';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'Email is required';
  end if;

  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid invite token hash';
  end if;

  insert into public.admin_invites (
    school_code, email, token_hash, created_by, expires_at
  ) values (
    upper(trim(p_school_code)),
    lower(trim(p_email)),
    lower(p_token_hash),
    auth.uid(),
    p_expires_at
  )
  returning * into inserted;

  return inserted;
end;
$$;

create or replace function public.claim_admin_invite(
  p_school_code text,
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  invite public.admin_invites;
begin
  if current_user_id is null then
    raise exception 'Login required';
  end if;

  select lower(email) into current_email
  from auth.users
  where id = current_user_id;

  select *
  into invite
  from public.admin_invites
  where school_code = upper(trim(p_school_code))
    and token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and lower(email) = current_email
    and status = 'PENDING'
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if invite.id is null then
    raise exception 'Invite is invalid, expired, or not issued to this email';
  end if;

  insert into public.profiles (id, school_code, name, role)
  values (current_user_id, invite.school_code, current_email, 'ADMIN')
  on conflict (id) do update set
    school_code = excluded.school_code,
    role = 'ADMIN';

  update public.admin_invites
  set status = 'CLAIMED',
      claimed_by = current_user_id,
      claimed_at = now()
  where id = invite.id;

  return jsonb_build_object(
    'schoolCode', invite.school_code,
    'role', 'ADMIN'
  );
end;
$$;

grant execute on function public.create_admin_invite(text, text, text, timestamptz) to authenticated;
grant execute on function public.claim_admin_invite(text, text) to authenticated;
