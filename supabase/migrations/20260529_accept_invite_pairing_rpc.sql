-- Accept an invite and create/repair the pair group in one database transaction.
-- Deploy this in Supabase before tightening RLS on invites, pair_groups, or pair_members.

create or replace function public.accept_invite_and_create_pairing(p_invite_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite record;
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
    values (v_invite.school_code, 1)
    returning id into v_group_id;
  else
    perform 1
      from public.pair_groups pg
     where pg.id = v_group_id
     for update;
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

grant execute on function public.accept_invite_and_create_pairing(bigint) to authenticated;
