create table if not exists public.room_messages (
  id bigserial primary key,
  school_code text not null,
  room_number text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_idx
  on public.room_messages (school_code, room_number, created_at);

alter table public.room_messages enable row level security;

drop policy if exists "room members can read messages" on public.room_messages;
create policy "room members can read messages"
  on public.room_messages for select
  using (
    exists (
      select 1
      from public.allocations a
      where a.school_code = room_messages.school_code
        and a.room_number = room_messages.room_number
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "room members can send messages" on public.room_messages;
create policy "room members can send messages"
  on public.room_messages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.allocations a
      where a.school_code = room_messages.school_code
        and a.room_number = room_messages.room_number
        and a.user_id = auth.uid()
    )
  );

alter table public.profiles
  add column if not exists visibility_settings jsonb not null default '{}'::jsonb;

create table if not exists public.feedbacks (
  id bigserial primary key,
  school_code text not null,
  submitter_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null check (target_role in ('DEVELOPER', 'ADMIN')),
  title text not null check (char_length(title) between 2 and 80),
  content text not null check (char_length(content) between 10 and 2000),
  problem_type text,
  college_name text,
  major_name text,
  class_name text,
  status text not null default 'PENDING' check (status in ('PENDING', 'REVIEWING', 'ADOPTED', 'DECLINED')),
  reply text,
  handler_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedbacks_submitter_idx
  on public.feedbacks (submitter_id, created_at desc);

create index if not exists feedbacks_school_status_idx
  on public.feedbacks (school_code, target_role, status, created_at desc);

alter table public.feedbacks enable row level security;

drop policy if exists "users can create own feedback" on public.feedbacks;
create policy "users can create own feedback"
  on public.feedbacks for insert
  with check (submitter_id = auth.uid());

drop policy if exists "users can read own feedback" on public.feedbacks;
create policy "users can read own feedback"
  on public.feedbacks for select
  using (submitter_id = auth.uid());

drop policy if exists "school admins can read school feedback" on public.feedbacks;
create policy "school admins can read school feedback"
  on public.feedbacks for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'ADMIN'
        and p.school_code = feedbacks.school_code
    )
  );

drop policy if exists "school admins can update school feedback" on public.feedbacks;
create policy "school admins can update school feedback"
  on public.feedbacks for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'ADMIN'
        and p.school_code = feedbacks.school_code
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'ADMIN'
        and p.school_code = feedbacks.school_code
    )
  );

drop policy if exists "developers can read developer feedback" on public.feedbacks;
create policy "developers can read developer feedback"
  on public.feedbacks for select
  using (
    target_role = 'DEVELOPER'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'DEVELOPER'
    )
  );

drop policy if exists "developers can update developer feedback" on public.feedbacks;
create policy "developers can update developer feedback"
  on public.feedbacks for update
  using (
    target_role = 'DEVELOPER'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'DEVELOPER'
    )
  )
  with check (
    target_role = 'DEVELOPER'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'DEVELOPER'
    )
  );
