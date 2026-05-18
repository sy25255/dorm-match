import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const schoolApi = {
  async getConfig() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('schools').select('*').eq('code', sc).single()
    return wrap(data)
  },
  async updateConfig(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('schools').update(data).eq('code', sc)
    return wrap(null)
  },
  async getColleges() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('colleges').select('*').eq('school_code', sc).order('sort_order')
    return wrap(data || [])
  },
  async createCollege(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('colleges').insert({ ...data, school_code: sc })
    return wrap(null)
  },
  async updateCollege(id: number, data: any) {
    await supabase.from('colleges').update(data).eq('id', id)
    return wrap(null)
  },
  async deleteCollege(id: number) {
    await supabase.from('colleges').delete().eq('id', id)
    return wrap(null)
  },
  async getMajors(collegeId?: number) {
    let q = supabase.from('majors').select('*')
    if (collegeId) q = q.eq('college_id', collegeId)
    const { data } = await q.order('sort_order')
    return wrap(data || [])
  },
  async createMajor(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('majors').insert({ ...data, school_code: sc })
    return wrap(null)
  },
  async updateMajor(id: number, data: any) {
    await supabase.from('majors').update(data).eq('id', id)
    return wrap(null)
  },
  async deleteMajor(id: number) {
    await supabase.from('majors').delete().eq('id', id)
    return wrap(null)
  },
  async getClasses(majorId?: number) {
    let q = supabase.from('classes').select('*')
    if (majorId) q = q.eq('major_id', majorId)
    const { data } = await q.order('sort_order')
    return wrap(data || [])
  },
  async createClass(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('classes').insert({ ...data, school_code: sc })
    return wrap(null)
  },
  async updateClass(id: number, data: any) {
    await supabase.from('classes').update(data).eq('id', id)
    return wrap(null)
  },
  async deleteClass(id: number) {
    await supabase.from('classes').delete().eq('id', id)
    return wrap(null)
  },
}