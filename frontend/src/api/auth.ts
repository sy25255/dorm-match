import { supabase } from '@/lib/supabase'

function cleanSchoolCode(value: string) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

function cleanStudentNo(value: string) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

export function buildStudentAuthEmail(schoolCode: string, studentNo: string) {
  const school = cleanSchoolCode(schoolCode).replace(/-/g, '_').toLowerCase()
  const no = cleanStudentNo(studentNo).replace(/_/g, '-').toLowerCase()
  return `student.${school}.${no}@students.dormmatch.local`
}

async function profileForUser(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return profile
}

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
      const profile = await profileForUser(data.user.id)

      return {
        user: data.user,
        session: data.session,
        profile,
      }
    }

    return data
  },

  async activateStudent(schoolCode: string, studentNo: string, initialCode: string, password: string) {
    const cleanCode = cleanSchoolCode(schoolCode)
    const cleanNo = cleanStudentNo(studentNo)
    if (!cleanCode || !cleanNo) throw new Error('学校编码或学号无效')

    const verify = await supabase.rpc('verify_student_roster', {
      p_school_code: cleanCode,
      p_student_no: cleanNo,
      p_initial_code: initialCode,
    })
    if (verify.error) throw verify.error

    const email = buildStudentAuthEmail(cleanCode, cleanNo)
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'STUDENT',
          school_code: cleanCode,
          student_no: cleanNo,
          name: verify.data?.name || cleanNo,
        },
      },
    })
    if (signUpResult.error) throw signUpResult.error

    let session = signUpResult.data.session
    let user = signUpResult.data.user
    if (!session || !user) {
      const signInResult = await supabase.auth.signInWithPassword({ email, password })
      if (signInResult.error) throw signInResult.error
      session = signInResult.data.session
      user = signInResult.data.user
    }
    if (!session || !user) throw new Error('学生账号已创建，但当前项目未返回登录会话')

    const claim = await supabase.rpc('claim_student_roster', {
      p_school_code: cleanCode,
      p_student_no: cleanNo,
      p_initial_code: initialCode,
    })
    if (claim.error) throw claim.error

    return {
      user,
      session,
      profile: await profileForUser(user.id),
    }
  },

  async signInStudent(schoolCode: string, studentNo: string, password: string) {
    const cleanCode = cleanSchoolCode(schoolCode)
    const cleanNo = cleanStudentNo(studentNo)
    const email = buildStudentAuthEmail(cleanCode, cleanNo)
    const result = await this.signIn(email, password)
    if (result.profile?.school_code !== cleanCode || result.profile?.student_no !== cleanNo) {
      await supabase.auth.signOut().catch(() => {})
      throw new Error('学号不属于当前学校')
    }
    if (result.profile?.role !== 'STUDENT') {
      await supabase.auth.signOut().catch(() => {})
      throw new Error('该账号不是学生账号')
    }
    if (result.profile?.is_valid === false) {
      await supabase.auth.signOut().catch(() => {})
      throw new Error('该学生账号已被学校禁用')
    }
    return result
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
