import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

function assertOk(result: { error?: any }, message = '操作失败') {
  if (result.error) {
    const text = result.error.message || result.error.details || result.error.hint || message
    throw new Error(text)
  }
}

function mapSchool(row: any) {
  if (!row) return null
  return {
    ...row,
    schoolCode: row.code || row.school_code || row.schoolCode || '',
    schoolName: row.name || row.school_name || row.schoolName || '',
    academicYear: row.academic_year || row.academicYear || '',
    contactPhone: row.contact_phone || row.contactPhone || '',
    contactEmail: row.contact_email || row.contactEmail || '',
  }
}

function schoolPayload(data: any) {
  return {
    name: data.schoolName || data.name,
    academic_year: data.academicYear || data.academic_year,
    contact_phone: data.contactPhone || data.contact_phone,
    contact_email: data.contactEmail || data.contact_email,
  }
}

function mapCollege(row: any) {
  return {
    ...row,
    id: row.id,
    name: row.name || '',
    code: row.code || '',
    description: row.description || '',
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
  }
}

function mapMajor(row: any) {
  return {
    ...row,
    id: row.id,
    collegeId: row.college_id ?? row.collegeId,
    name: row.name || '',
    code: row.code || '',
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
  }
}

function mapClass(row: any) {
  return {
    ...row,
    id: row.id,
    majorId: row.major_id ?? row.majorId,
    name: row.name || '',
    grade: row.grade ?? new Date().getFullYear(),
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
  }
}

export const schoolApi = {
  async verifyStudentInviteCode(schoolCode: string, code: string) {
    const { data, error } = await supabase.rpc('verify_student_invite_code', {
      p_school_code: schoolCode,
      p_code: code,
    })
    assertOk({ error }, '邀请码无效或已过期')
    return wrap(data)
  },
  async getStudentInviteCodes() {
    const sc = getCurrentSchool()
    const { data, error } = await supabase
      .from('student_invite_codes')
      .select('*')
      .eq('school_code', sc)
      .order('created_at', { ascending: false })
    assertOk({ error }, '加载学生邀请码失败')
    return wrap(data || [])
  },
  async createStudentInviteCode(data: any) {
    const sc = getCurrentSchool()
    const code = String(data.code || '').trim().toUpperCase()
    const result = await supabase.from('student_invite_codes').insert({
      school_code: sc,
      code,
      name: data.name || '新生入学邀请码',
      max_uses: data.maxUses || null,
      expires_at: data.expiresAt || null,
    })
    assertOk(result, '创建学生邀请码失败')
    return wrap(null)
  },
  async getConfig() {
    const sc = getCurrentSchool()
    const { data, error } = await supabase.from('schools').select('*').eq('code', sc).single()
    assertOk({ error }, '加载学校配置失败')
    return wrap(mapSchool(data))
  },
  async updateConfig(data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('schools').update(schoolPayload(data)).eq('code', sc)
    assertOk(result, '保存学校配置失败')
    return wrap(null)
  },
  async getColleges() {
    const sc = getCurrentSchool()
    const { data, error } = await supabase.from('colleges').select('*').eq('school_code', sc).order('sort_order')
    assertOk({ error }, '加载学院失败')
    return wrap((data || []).map(mapCollege))
  },
  async createCollege(data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('colleges').insert({
      school_code: sc,
      name: data.name,
      code: data.code || '',
      description: data.description || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    assertOk(result, '新增学院失败')
    return wrap(null)
  },
  async updateCollege(id: number, data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('colleges').update({
      name: data.name,
      code: data.code || '',
      description: data.description || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id).eq('school_code', sc)
    assertOk(result, '保存学院失败')
    return wrap(null)
  },
  async deleteCollege(id: number) {
    const sc = getCurrentSchool()
    const result = await supabase.from('colleges').delete().eq('id', id).eq('school_code', sc)
    assertOk(result, '删除学院失败')
    return wrap(null)
  },
  async getMajors(collegeId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('majors').select('*').eq('school_code', sc)
    if (collegeId) q = q.eq('college_id', collegeId)
    const { data, error } = await q.order('sort_order')
    assertOk({ error }, '加载专业失败')
    return wrap((data || []).map(mapMajor))
  },
  async createMajor(data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('majors').insert({
      school_code: sc,
      college_id: data.collegeId ?? data.college_id,
      name: data.name,
      code: data.code || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    assertOk(result, '新增专业失败')
    return wrap(null)
  },
  async updateMajor(id: number, data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('majors').update({
      college_id: data.collegeId ?? data.college_id,
      name: data.name,
      code: data.code || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id).eq('school_code', sc)
    assertOk(result, '保存专业失败')
    return wrap(null)
  },
  async deleteMajor(id: number) {
    const sc = getCurrentSchool()
    const result = await supabase.from('majors').delete().eq('id', id).eq('school_code', sc)
    assertOk(result, '删除专业失败')
    return wrap(null)
  },
  async getClasses(majorId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('classes').select('*').eq('school_code', sc)
    if (majorId) q = q.eq('major_id', majorId)
    const { data, error } = await q.order('sort_order')
    assertOk({ error }, '加载班级失败')
    return wrap((data || []).map(mapClass))
  },
  async createClass(data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('classes').insert({
      school_code: sc,
      major_id: data.majorId ?? data.major_id,
      name: data.name,
      grade: data.grade,
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    assertOk(result, '新增班级失败')
    return wrap(null)
  },
  async updateClass(id: number, data: any) {
    const sc = getCurrentSchool()
    const result = await supabase.from('classes').update({
      major_id: data.majorId ?? data.major_id,
      name: data.name,
      grade: data.grade,
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id).eq('school_code', sc)
    assertOk(result, '保存班级失败')
    return wrap(null)
  },
  async deleteClass(id: number) {
    const sc = getCurrentSchool()
    const result = await supabase.from('classes').delete().eq('id', id).eq('school_code', sc)
    assertOk(result, '删除班级失败')
    return wrap(null)
  },
}
