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

export const inviteApi = {
  async send(data: { targetId: string | number; message: string }) {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()
    const targetId = String(data.targetId)

    if (!uid || !targetId || uid === targetId) {
      throw new Error('不能向自己发送邀请')
    }

    const { data: existing } = await supabase
      .from('invites')
      .select('id')
      .or(`and(from_user_id.eq.${uid},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${uid})`)
      .eq('status', 0)
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    if ((existing || []).length > 0) {
      throw new Error('已经发送过待处理邀请')
    }

    const result = await supabase.from('invites').insert({
      from_user_id: uid,
      to_user_id: targetId,
      school_code: sc,
      message: data.message,
      status: 0,
      expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    }).select('id').single()
    return wrap(result.data)
  },

  async accept(inviteId: number) {
    const { data: invite } = await supabase.from('invites').select('*').eq('id', inviteId).single()
    if (!invite || invite.status !== 0) throw new Error('邀请状态已变化')
    if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
      await supabase.from('invites').update({ status: 3 }).eq('id', inviteId)
      throw new Error('邀请已过期')
    }
    if (invite?.from_user_id && invite?.to_user_id) {
      const fallbackCapacity = await getDefaultRoomCapacity()
      const memberIds = [invite.from_user_id, invite.to_user_id]
      const { data: existingMembers } = await supabase
        .from('pair_members')
        .select('group_id, user_id')
        .in('user_id', memberIds)

      const currentMembers = existingMembers || []
      const fromMember = currentMembers.find((m: any) => m.user_id === invite.from_user_id)
      const toMember = currentMembers.find((m: any) => m.user_id === invite.to_user_id)
      if (fromMember?.group_id && toMember?.group_id && fromMember.group_id !== toMember.group_id) {
        throw new Error('双方已在不同配对组，不能合并')
      }

      let capacity = fallbackCapacity
      let groupId = fromMember?.group_id || toMember?.group_id
      if (!groupId) {
        const { data: group } = await supabase
          .from('pair_groups')
          .insert({
            school_code: invite.school_code || getCurrentSchool(),
            status: 1,
            capacity,
          })
          .select('id')
          .single()
        groupId = group?.id
      } else {
        const { data: group } = await supabase
          .from('pair_groups')
          .select('capacity')
          .eq('id', groupId)
          .single()
        capacity = Number(group?.capacity) || fallbackCapacity
      }

      if (groupId) {
        const { count } = await supabase
          .from('pair_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
        const alreadyInGroup = new Set(currentMembers
          .filter((member: any) => member.group_id === groupId)
          .map((member: any) => member.user_id))
        const additions = memberIds.filter(id => !alreadyInGroup.has(id)).length
        if ((count || 0) + additions > capacity) throw new Error('当前配对组已满')
        await supabase.from('pair_members').upsert([
          { group_id: groupId, user_id: invite.from_user_id, is_initiator: 1 },
          { group_id: groupId, user_id: invite.to_user_id, is_initiator: 0 },
        ], { onConflict: 'group_id,user_id' })
      }
    }
    await supabase.from('invites').update({ status: 1 }).eq('id', inviteId)
    return wrap(null)
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

    const { data: members } = await supabase
      .from('pair_members')
      .select('group_id')
      .eq('user_id', uid)

    if (!members || members.length === 0) return wrap(null)

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

  async getPairingMembers() {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()

    const { data: members } = await supabase
      .from('pair_members')
      .select('group_id')
      .eq('user_id', uid)

    if (!members || members.length === 0) return wrap([])

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
