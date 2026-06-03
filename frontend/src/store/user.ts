import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { supabase, setAuthState, clearAuthState } from '@/lib/supabase'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const userId = ref(localStorage.getItem('supabase_user_id') || '')
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(localStorage.getItem('role') || 'STUDENT')
  const schoolCode = ref(localStorage.getItem('schoolCode') || '')
  const schoolName = ref(localStorage.getItem('schoolName') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setSchoolInfo(code: string, name: string) {
    schoolCode.value = code
    schoolName.value = name
    localStorage.setItem('schoolCode', code)
    localStorage.setItem('schoolName', name)
  }

  function syncProfileSchool(code: string) {
    const previousCode = localStorage.getItem('schoolCode') || ''
    schoolCode.value = code
    localStorage.setItem('schoolCode', code)
    if (previousCode && previousCode !== code) {
      schoolName.value = code
      localStorage.setItem('schoolName', code)
    }
  }

  function saveRememberedAccount(email: string) {
    localStorage.setItem('remembered_email', email)
  }

  function getRememberedAccount(): string {
    return localStorage.getItem('remembered_email') || ''
  }

  function saveRememberedStudentNo(studentNo: string) {
    localStorage.setItem('remembered_student_no', studentNo)
  }

  function getRememberedStudentNo(): string {
    return localStorage.getItem('remembered_student_no') || ''
  }

  function applyAuthResult(result: any, fallbackName: string) {
    const profile = result.profile
    setAuthState(result.user.id, result.session.access_token, result.session.refresh_token || '')
    userId.value = result.user.id
    token.value = result.session.access_token
    refreshToken.value = result.session.refresh_token || ''
    username.value = profile?.name || fallbackName
    role.value = profile?.role || 'STUDENT'
    if (profile?.school_code) {
      syncProfileSchool(profile.school_code)
    }
    localStorage.setItem('username', profile?.name || fallbackName)
    localStorage.setItem('role', profile?.role || 'STUDENT')
  }

  // ========== Supabase 真实登录/注册 ==========
  async function supabaseLogin(email: string, password: string) {
    const result = await authApi.signIn(email, password)
    applyAuthResult(result, email)
    saveRememberedAccount(email)
  }

  async function studentLogin(schoolCodeParam: string, studentNo: string, password: string) {
    const result = await authApi.signInStudent(schoolCodeParam, studentNo, password)
    applyAuthResult(result, studentNo)
    saveRememberedStudentNo(studentNo)
  }

  async function activateStudent(schoolCodeParam: string, studentNo: string, initialCode: string, password: string) {
    const result = await authApi.activateStudent(schoolCodeParam, studentNo, initialCode, password)
    applyAuthResult(result, studentNo)
    saveRememberedStudentNo(studentNo)
  }

  async function supabaseRegister(
    email: string, password: string, name: string,
    schoolCodeParam: string, studentNo: string,
    collegeName = '', majorName = '', className = '',
  ) {
    const data = await authApi.signUp(
      email,
      password,
      name,
      schoolCodeParam,
      studentNo,
      collegeName,
      majorName,
      className,
    )

    if (data.session && data.user) {
      userId.value = data.user.id
      token.value = data.session.access_token
      refreshToken.value = data.session.refresh_token || ''
      username.value = name
      role.value = 'STUDENT'
      schoolCode.value = schoolCodeParam

      setAuthState(data.user.id, data.session.access_token, data.session.refresh_token || '')
      localStorage.setItem('username', name)
      localStorage.setItem('role', 'STUDENT')
      localStorage.setItem('schoolCode', schoolCodeParam)
      saveRememberedAccount(email)
    }
  }

  async function restoreSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      userId.value = session.user.id
      token.value = session.access_token
      refreshToken.value = session.refresh_token || ''
      setAuthState(session.user.id, session.access_token, session.refresh_token || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      username.value = profile?.name || session.user.email || ''
      role.value = profile?.role || 'STUDENT'
      if (profile?.school_code) {
        syncProfileSchool(profile.school_code)
      }
      localStorage.setItem('username', profile?.name || session.user.email || '')
      localStorage.setItem('role', profile?.role || 'STUDENT')
      return true
    }
    return false
  }

  async function logout() {
    await authApi.signOut().catch(() => {})
    token.value = ''
    refreshToken.value = ''
    userId.value = ''
    username.value = ''
    role.value = 'STUDENT'
    clearAuthState()
  }

  return {
    token, refreshToken, userId, username, role,
    schoolCode, schoolName, isLoggedIn,
    setSchoolInfo,
    getRememberedAccount, saveRememberedAccount,
    getRememberedStudentNo, saveRememberedStudentNo,
    logout, supabaseLogin, supabaseRegister, studentLogin, activateStudent, restoreSession,
  }
})
