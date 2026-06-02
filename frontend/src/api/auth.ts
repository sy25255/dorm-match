import { supabase } from '@/lib/supabase'

export const authApi = {
  async signUp(
    email: string,
    password: string,
    name: string,
    schoolCode: string,
    studentNo: string,
    collegeName = '',
    majorName = '',
    className = '',
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          school_code: schoolCode,
          student_no: studentNo,
          college_name: collegeName,
          major_name: majorName,
          class_name: className,
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
        college_name: collegeName,
        major_name: majorName,
        class_name: className,
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

  async claimAdminInvite(schoolCode: string, token: string) {
    const { data, error } = await supabase.rpc('claim_admin_invite', {
      p_school_code: schoolCode,
      p_token: token,
    })
    if (error) throw error
    return data
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
