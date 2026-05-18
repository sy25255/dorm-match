import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const inviteApi = {
  async send(data: { targetId: number; message: string }) {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()

    const result = await supabase.from('invites').insert({
      from_user_id: uid,
      to_user_id: String(data.targetId),
      school_code: sc,
      message: data.message,
      status: 0,
      expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    }).select('id').single()
    return wrap(result.data)
  },

  async accept(inviteId: number) {
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
    return wrap(data || [])
  },

  async getSent() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('from_user_id', uid)
      .order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getQuota() {
    const uid = getCurrentUserId()
    const { count: sentCount } = await supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', uid)
    const used = sentCount || 0
    const limit = 10
    return wrap({ used, limit, remaining: Math.max(0, limit - used) })
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

    return wrap(groups?.[0] || null)
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

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
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
    return wrap(data?.[0] || null)
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