import { supabase } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const studentApi = {
  async getStudent(id: string | number) {
    const { data } = await supabase.from('profiles').select('*').eq('id', String(id)).single()
    return wrap(data || null)
  },

  async getProfile() {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return wrap(null)
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    return wrap(data || null)
  },

  async updateProfile(data: any) {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return wrap(null)
    await supabase.from('profiles').update(data).eq('id', uid)
    return wrap(null)
  },
}
