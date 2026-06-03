import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'
import { getDefaultRoomCapacity } from '@/api/dormitory'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

function mapInvite(invite: any) {
  return {
    ...invite,
    fromStudentId: invite.from_user_id,
    toStudentId: invite.to_user_id,
    processedAt: invite.processed_at || '',
    expiresAt: invite.expires_at || '',
    createdAt: invite.created_at || '',
  }
}

function mapPairGroup(group: any, groupSize = 0) {
  if (!group) return null
  return {
    ...group,
    pairingCode: group.pairing_code || `PAIR-${String(group.id).padStart(4, '0')}`,
    groupSize: group.group_size || groupSize,
    lockedAt: group.locked_at || '',
    createdAt: group.created_at || '',
  }
}

function canFallbackFromMissingRpc(error: any) {
  const message = `${error?.message || ''} ${error?.details || ''}`
  return /Could not find the function|schema cache|does not exist|not exist/i.test(message)
}

function getInviteErrorMessage(error: any, fallback = '邀请操作失败') {
  const raw = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  if (canFallbackFromMissingRpc(error)) return '邀请接口还没有部署，请先在 Supabase 执行最新迁移'
  if (/NOT_AUTHENTICATED/i.test(raw)) return '登录状态已失效，请重新登录'
  if (/INVITE_SELF_NOT_ALLOWED/i.test(raw)) return '不能邀请自己'
  if (/SENDER_NOT_STUDENT/i.test(raw)) return '当前账号不是学生账号，不能发送邀请'
  if (/TARGET_NOT_STUDENT/i.test(raw)) return '目标学生不存在或不是学生账号'
  if (/INVITE_CROSS_SCHOOL_DENIED|INVITE_SCHOOL_MISMATCH|PAIR_GROUP_SCHOOL_MISMATCH/i.test(raw)) return '只能邀请同一学校的学生'
  if (/INVITE_ALREADY_PENDING/i.test(raw)) return '双方已有待处理邀请，请先处理现有邀请'
  if (/INVITE_PERMISSION_DENIED/i.test(raw)) return '你没有权限处理这条邀请'
  if (/INVITE_STATUS_CHANGED/i.test(raw)) return '邀请状态已变化，请刷新后查看'
  if (/INVITE_EXPIRED/i.test(raw)) return '邀请已过期，请重新发送'
  if (/INVITE_NOT_FOUND/i.test(raw)) return '邀请不存在或已被删除'
  if (/USERS_ALREADY_IN_DIFFERENT_GROUPS/i.test(raw)) return '双方已在不同配对组，不能合并'
  if (/PAIR_GROUP_FULL/i.test(raw)) return '当前配对组已满，不能再加入'
  return error?.message || fallback
}

async function ensurePairingForInvite(invite: any) {
  if (!invite?.from_user_id || !invite?.to_user_id) {
    throw new Error('邀请缺少学生信息，无法创建配对组')
  }

  const capacity = await getDefaultRoomCapacity()
  const memberIds = [String(invite.from_user_id), String(invite.to_user_id)]
  const { data: existingMembers, error: existingError } = await supabase
    .from('pair_members')
    .select('group_id, user_id')
    .in('user_id', memberIds)

  if (existingError) throw existingError

  const currentMembers = existingMembers || []
  const fromMember = currentMembers.find((m: any) => m.user_id === invite.from_user_id)
  const toMember = currentMembers.find((m: any) => m.user_id === invite.to_user_id)

  if (fromMember?.group_id && toMember?.group_id && fromMember.group_id !== toMember.group_id) {
    throw new Error('双方已在不同配对组，不能合并')
  }

  let groupId = fromMember?.group_id || toMember?.group_id

  if (!groupId) {
    const { data: group, error: groupError } = await supabase
      .from('pair_groups')
      .insert({
        school_code: invite.school_code || getCurrentSchool(),
        status: 1,
      })
      .select('id')
      .single()

    if (groupError) throw groupError
    groupId = group?.id
  }

  if (!groupId) throw new Error('配对组创建失败')

  const { count, error: countError } = await supabase
    .from('pair_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if (countError) throw countError

  const alreadyInGroup = new Set(currentMembers
    .filter((member: any) => member.group_id === groupId)
    .map((member: any) => String(member.user_id)))
  const additions = memberIds.filter(id => !alreadyInGroup.has(id)).length

  if ((count || 0) + additions > capacity) throw new Error('当前配对组已满')

  const { error: memberError } = await supabase.from('pair_members').upsert([
    { group_id: groupId, user_id: invite.from_user_id, is_initiator: 1 },
    { group_id: groupId, user_id: invite.to_user_id, is_initiator: 0 },
  ], { onConflict: 'group_id,user_id' })

  if (memberError) throw memberError

  await supabase
    .from('profiles')
    .update({ match_status: 'PAIRED' })
    .in('id', memberIds)

  return groupId
}

async function getPairMemberRowsForUser(uid: string) {
  const { data: members, error: memberError } = await supabase
    .from('pair_members')
    .select('group_id')
    .eq('user_id', uid)

  if (memberError) throw memberError
  if (members && members.length > 0) return members

    const { data: acceptedInvites, error: acceptedError } = await supabase
      .from('invites')
      .select('*')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .eq('status', 1)
      .order('created_at', { ascending: false })
      .limit(1)

  if (acceptedError) throw acceptedError
  const acceptedInvite = acceptedInvites?.[0]
  if (!acceptedInvite) return []

  if (!import.meta.env.DEV) return []

  try {
    await ensurePairingForInvite(acceptedInvite)
  } catch {
    return []
  }

  const { data: repairedMembers, error: repairedError } = await supabase
    .from('pair_members')
    .select('group_id')
    .eq('user_id', uid)

  if (repairedError) throw repairedError
  return repairedMembers || []
}

async function getLatestAcceptedInviteForUser(uid: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
    .eq('status', 1)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function mapInviteToPairing(invite: any) {
  if (!invite) return null
  const capacity = await getDefaultRoomCapacity()
  return {
    id: `invite-${invite.id}`,
    school_code: invite.school_code || getCurrentSchool(),
    pairingCode: `INV-${String(invite.id).padStart(4, '0')}`,
    groupSize: 2,
    capacity,
    status: 1,
    createdAt: invite.created_at || '',
    source: 'accepted_invite',
  }
}

async function getInvitePairingMembers(invite: any) {
  if (!invite?.from_user_id || !invite?.to_user_id) return []
  const ids = [invite.from_user_id, invite.to_user_id]
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, college_name, major_name')
    .in('id', ids)

  if (error) throw error
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]))
  return ids.map((id, index) => ({
    studentId: id,
    name: profileMap.get(id)?.name || '',
    avatarUrl: profileMap.get(id)?.avatar_url || '',
    collegeName: profileMap.get(id)?.college_name || '',
    majorName: profileMap.get(id)?.major_name || '',
    isInitiator: index === 0 ? 1 : 0,
  }))
}

export const inviteApi = {
  async send(data: { targetId: string | number; message: string }) {
    const uid = getCurrentUserId()
    const targetId = String(data.targetId)

    if (!uid || !targetId || uid === targetId) {
      throw new Error('不能邀请自己')
    }

    const result = await supabase.rpc('send_invite_to_student', {
      p_target_id: targetId,
      p_message: data.message || '',
    })
    if (result.error) throw new Error(getInviteErrorMessage(result.error, '发送邀请失败'))
    return wrap(result.data)
  },

  async accept(inviteId: number) {
    const rpcResult = await supabase.rpc('accept_invite_and_create_pairing', { p_invite_id: inviteId })
    if (!rpcResult.error) return wrap(rpcResult.data || null)
    if (!canFallbackFromMissingRpc(rpcResult.error) || !import.meta.env.DEV) {
      throw new Error(getInviteErrorMessage(rpcResult.error, '接受邀请失败'))
    }

    const { data: invite } = await supabase.from('invites').select('*').eq('id', inviteId).single()
    if (!invite || invite.status !== 0) throw new Error('邀请状态已变化')
    if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
      await supabase.from('invites').update({ status: 3 }).eq('id', inviteId)
      throw new Error('邀请已过期')
    }
    const { error: updateError } = await supabase
      .from('invites')
      .update({ status: 1 })
      .eq('id', inviteId)
    if (updateError) throw updateError

    let groupId: any = null
    try {
      groupId = await ensurePairingForInvite({ ...invite, status: 1 })
    } catch {
      groupId = null
    }
    return wrap({ groupId })
  },

  async reject(inviteId: number) {
    await supabase.from('invites').update({ status: 2 }).eq('id', inviteId)
    return wrap(null)
  },

  async withdraw(inviteId: number) {
    await supabase.from('invites').update({ status: 3 }).eq('id', inviteId)
    return wrap(null)
  },

  async getReceived() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('to_user_id', uid)
      .order('created_at', { ascending: false })
    return wrap((data || []).map(mapInvite))
  },

  async getSent() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('from_user_id', uid)
      .order('created_at', { ascending: false })
    return wrap((data || []).map(mapInvite))
  },

  async getQuota() {
    const uid = getCurrentUserId()
    const { count: sentCount } = await supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', uid)
    const used = sentCount || 0
    const limit = 10
    return wrap({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      maxSent: limit,
      usedSent: used,
      remainingSent: Math.max(0, limit - used),
      maxReceived: 10,
      usedReceived: 0,
      remainingReceived: 10,
    })
  },

  async getPairing() {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()

    const members = await getPairMemberRowsForUser(uid)
    if (!members || members.length === 0) {
      const acceptedInvite = await getLatestAcceptedInviteForUser(uid)
      return wrap(await mapInviteToPairing(acceptedInvite))
    }

    const groupIds = (members as any[]).map((m: any) => m.group_id)
    const { data: groups } = await supabase
      .from('pair_groups')
      .select('*')
      .in('id', groupIds)
      .eq('school_code', sc)

    const group = groups?.[0]
    if (!group) return wrap(null)

    const { count } = await supabase
      .from('pair_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)

    return wrap(mapPairGroup(group, count || 0))
  },

  async getPairingDiagnostics() {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()
    if (!uid) return wrap({ hasUser: false, acceptedInvites: [], pairMembers: [], groups: [] })

    const { data: acceptedInvites, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .eq('status', 1)
      .order('created_at', { ascending: false })

    if (inviteError) throw inviteError

    const { data: pairMembers, error: memberError } = await supabase
      .from('pair_members')
      .select('group_id, user_id, is_initiator')
      .eq('user_id', uid)

    if (memberError) throw memberError

    const groupIds = [...new Set((pairMembers || []).map((m: any) => m.group_id).filter(Boolean))]
    const { data: groups, error: groupError } = groupIds.length
      ? await supabase.from('pair_groups').select('*').in('id', groupIds).eq('school_code', sc)
      : { data: [], error: null }

    if (groupError) throw groupError

    return wrap({
      hasUser: true,
      acceptedInvites: (acceptedInvites || []).map(mapInvite),
      pairMembers: pairMembers || [],
      groups: groups || [],
      canRepair: (acceptedInvites || []).length > 0 && (pairMembers || []).length === 0,
    })
  },

  async repairCurrentPairing() {
    const uid = getCurrentUserId()
    if (!uid) throw new Error('当前登录状态无效')

    const { data: acceptedInvites, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .eq('status', 1)
      .order('created_at', { ascending: false })
      .limit(1)

    if (inviteError) throw inviteError
    const invite = acceptedInvites?.[0]
    if (!invite) throw new Error('没有找到已接受的邀请，无法修复配对组')

    const groupId = await ensurePairingForInvite(invite)
    return wrap({ groupId })
  },

  async getPairingMembers() {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()

    const members = await getPairMemberRowsForUser(uid)
    if (!members || members.length === 0) {
      const acceptedInvite = await getLatestAcceptedInviteForUser(uid)
      return wrap(await getInvitePairingMembers(acceptedInvite))
    }

    const groupIds = (members as any[]).map((m: any) => m.group_id)
    const { data: allMembers } = await supabase
      .from('pair_members')
      .select('user_id, is_initiator')
      .in('group_id', groupIds)

    if (!allMembers) return wrap([])

    const userIds = (allMembers as any[]).map((m: any) => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, college_name, major_name')
      .in('id', userIds)

    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]))
    return wrap((allMembers as any[]).map((m: any) => ({
      studentId: m.user_id,
      name: profileMap.get(m.user_id)?.name || '',
      avatarUrl: profileMap.get(m.user_id)?.avatar_url || '',
      collegeName: profileMap.get(m.user_id)?.college_name || '',
      majorName: profileMap.get(m.user_id)?.major_name || '',
      isInitiator: m.is_initiator || 0,
    })))
  },
}

export const allocationApi = {
  async getMyAllocation() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('allocations')
      .select('*, dormitory_rooms(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
    const allocation = data?.[0]
    if (!allocation) return wrap(null)

    const room = Array.isArray(allocation.dormitory_rooms)
      ? allocation.dormitory_rooms[0]
      : allocation.dormitory_rooms

    const { data: roommateRows } = await supabase
      .from('allocations')
      .select('*, profiles(id, name, avatar_url, bio, college_name, major_name)')
      .eq('room_id', allocation.room_id)
      .neq('user_id', uid)

    const roommates = (roommateRows || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        studentId: row.user_id,
        name: profile?.name || '',
        avatarUrl: profile?.avatar_url || '',
        bio: profile?.bio || '',
        collegeName: profile?.college_name || '',
        majorName: profile?.major_name || '',
        bedNo: row.bed_no,
        allocationType: row.allocation_type,
      }
    })

    return wrap({
      ...allocation,
      roomNumber: allocation.room_number || room?.room_number || '',
      bedNo: allocation.bed_no || 0,
      allocationType: allocation.allocation_type || 'ALGORITHM',
      batchCode: allocation.batch_code || '',
      confirmedByStudent: allocation.confirmed_by_student || 0,
      roommates,
    })
  },

  async confirm() {
    const uid = getCurrentUserId()
    await supabase.from('allocations').update({ confirmed_by_student: 1, status: 'CONFIRMED' }).eq('user_id', uid)
    return wrap(null)
  },

  async submitObjection(reason: string, attachmentUrls?: string) {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()
    const result = await supabase.from('allocation_objections').insert({
      school_code: sc,
      user_id: uid,
      reason: reason + (attachmentUrls ? `\n附件：${attachmentUrls}` : ''),
      status: 'PENDING',
    }).select('id').single()
    return wrap(result.data)
  },

  async getMyObjections() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('allocation_objections')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getObjectionDetail(objectionId: number) {
    const { data } = await supabase
      .from('allocation_objections')
      .select('*')
      .eq('id', objectionId)
      .single()
    return wrap(data || null)
  },
}
