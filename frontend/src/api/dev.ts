import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function createInviteToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const devApi = {
  async getPlatformStats() {
    const { count: totalSchools } = await supabase.from('schools').select('*', { count: 'exact', head: true })
    const { count: totalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT')
    const { count: totalBuildings } = await supabase.from('dormitory_buildings').select('*', { count: 'exact', head: true })
    const { count: totalRooms } = await supabase.from('dormitory_rooms').select('*', { count: 'exact', head: true })
    const { count: totalAllocations } = await supabase.from('allocations').select('*', { count: 'exact', head: true })
    return wrap({
      totalSchools: totalSchools || 0,
      totalStudents: totalStudents || 0,
      totalBuildings: totalBuildings || 0,
      totalRooms: totalRooms || 0,
      totalAllocations: totalAllocations || 0,
    })
  },

  async getSchools() {
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getSchoolStatistics(code: string) {
    const { count: totalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_code', code).eq('role', 'STUDENT')
    const { count: completedSurvey } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_code', code).eq('role', 'STUDENT').eq('survey_status', 'COMPLETED')
    const { count: allocatedCount } = await supabase.from('allocations').select('*', { count: 'exact', head: true }).eq('school_code', code)
    const { count: objectionsCount } = await supabase.from('allocation_objections').select('*', { count: 'exact', head: true }).eq('school_code', code)
    return wrap({
      totalStudents: totalStudents || 0,
      completedSurvey: completedSurvey || 0,
      allocated: allocatedCount || 0,
      objections: objectionsCount || 0,
    })
  },

  async getSchoolStudents(code: string) {
    const { data } = await supabase.from('profiles').select('*').eq('school_code', code).eq('role', 'STUDENT').order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getSchoolBuildings(code: string) {
    const { data } = await supabase.from('dormitory_buildings').select('*').eq('school_code', code).order('created_at')
    return wrap(data || [])
  },

  async getSchoolRooms(code: string) {
    const { data } = await supabase.from('dormitory_rooms').select('*').eq('school_code', code).order('floor').order('room_number')
    return wrap(data || [])
  },

  async getSchoolAllocations(code: string) {
    const { data } = await supabase.from('allocations').select('*, profiles(name, student_no)').eq('allocations.school_code', code).order('room_number')
    return wrap(data || [])
  },

  async getSchoolObjections(code: string) {
    const { data } = await supabase.from('allocation_objections').select('*').eq('school_code', code).order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getSchoolConfig(code: string) {
    const { data } = await supabase.from('schools').select('*').eq('code', code).single()
    return wrap(data)
  },

  async updateSchoolConfig(code: string, config: any) {
    await supabase.from('schools').update(config).eq('code', code)
    return wrap(null)
  },

  async getAdmins() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'ADMIN').order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async createAdmin(adminData: any) {
    const token = createInviteToken()
    const tokenHash = await sha256Hex(token)
    const expiresAt = adminData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase.rpc('create_admin_invite', {
      p_school_code: adminData.schoolCode,
      p_email: adminData.email,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    })
    if (error) throw error
    return wrap({ invite: data, token })
  },

  async updateAdmin(id: number, adminData: any) {
    await supabase.from('profiles').update(adminData).eq('id', String(id)).eq('role', 'ADMIN')
    return wrap(null)
  },

  async deleteAdmin(id: number) {
    await supabase.from('profiles').delete().eq('id', String(id)).eq('role', 'ADMIN')
    return wrap(null)
  },

  async getDevFeedbacks() {
    const { data } = await supabase.from('feedbacks').select('*').eq('target_role', 'DEVELOPER').order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async replyDevFeedback(id: number, replyData: any) {
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('feedbacks').update({
      status: replyData.status,
      reply: replyData.reply,
      handler_id: user.user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', id)
    return wrap(null)
  },

  async sendNotification(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('notifications').insert({
      school_code: sc,
      title: data.title,
      content: data.content,
      type: data.type || 'ANNOUNCEMENT',
      target_role: data.targetRole || 'ALL',
    })
    return wrap(null)
  },
}
