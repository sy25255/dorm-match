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
