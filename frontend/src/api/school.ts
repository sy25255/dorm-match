import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

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
  async getConfig() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('schools').select('*').eq('code', sc).single()
    return wrap(mapSchool(data))
  },
  async updateConfig(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('schools').update(schoolPayload(data)).eq('code', sc)
    return wrap(null)
  },
  async getColleges() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('colleges').select('*').eq('school_code', sc).order('sort_order')
    return wrap((data || []).map(mapCollege))
  },
  async createCollege(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('colleges').insert({
      school_code: sc,
      name: data.name,
      code: data.code || '',
      description: data.description || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    return wrap(null)
  },
  async updateCollege(id: number, data: any) {
    await supabase.from('colleges').update({
      name: data.name,
      code: data.code || '',
      description: data.description || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id)
    return wrap(null)
  },
  async deleteCollege(id: number) {
    await supabase.from('colleges').delete().eq('id', id)
    return wrap(null)
  },
  async getMajors(collegeId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('majors').select('*').eq('school_code', sc)
    if (collegeId) q = q.eq('college_id', collegeId)
    const { data } = await q.order('sort_order')
    return wrap((data || []).map(mapMajor))
  },
  async createMajor(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('majors').insert({
      school_code: sc,
      college_id: data.collegeId ?? data.college_id,
      name: data.name,
      code: data.code || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    return wrap(null)
  },
  async updateMajor(id: number, data: any) {
    await supabase.from('majors').update({
      college_id: data.collegeId ?? data.college_id,
      name: data.name,
      code: data.code || '',
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id)
    return wrap(null)
  },
  async deleteMajor(id: number) {
    await supabase.from('majors').delete().eq('id', id)
    return wrap(null)
  },
  async getClasses(majorId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('classes').select('*').eq('school_code', sc)
    if (majorId) q = q.eq('major_id', majorId)
    const { data } = await q.order('sort_order')
    return wrap((data || []).map(mapClass))
  },
  async createClass(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('classes').insert({
      school_code: sc,
      major_id: data.majorId ?? data.major_id,
      name: data.name,
      grade: data.grade,
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    })
    return wrap(null)
  },
  async updateClass(id: number, data: any) {
    await supabase.from('classes').update({
      major_id: data.majorId ?? data.major_id,
      name: data.name,
      grade: data.grade,
      sort_order: data.sortOrder ?? data.sort_order ?? 0,
    }).eq('id', id)
    return wrap(null)
  },
  async deleteClass(id: number) {
    await supabase.from('classes').delete().eq('id', id)
    return wrap(null)
  },
}
