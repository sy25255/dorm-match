import request from './request'
import { supabase } from '@/lib/supabase'

export const authApi = {
  login(data: { studentNo: string; password: string; schoolCode?: string }) {
    return request.post('/auth/login', data)
  },
  register(data: { schoolCode: string; studentNo: string; realName: string; password: string }) {
    return request.post('/auth/register', data)
  },
  refreshToken(token: string) {
    return request.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // ========== Supabase 真实认证 ==========
  async signUp(email: string, password: string, name: string, schoolCode: string, studentNo: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          school_code: schoolCode,
          student_no: studentNo,
          role: 'STUDENT',
        },
      },
    })
    if (error) throw error

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        school_code: schoolCode,
        student_no: studentNo,
        name,
        role: 'STUDENT',
      })
    }

    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },
}