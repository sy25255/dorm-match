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
    const payload = {
      bio: data.bio,
      hometown: data.hometown,
      class_name: data.className ?? data.class_name,
      visibility_settings: data.visibilitySettings ?? data.visibility_settings,
    }
    const { error } = await supabase.from('profiles').update(payload).eq('id', uid)
    if (error) {
      const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`
      if (!text.includes('visibility_settings')) throw error
      await supabase.from('profiles').update({
        bio: payload.bio,
        hometown: payload.hometown,
        class_name: payload.class_name,
      }).eq('id', uid)
    }
    return wrap(null)
  },
}
