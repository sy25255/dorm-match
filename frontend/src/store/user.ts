import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { supabase, setAuthState, clearAuthState, getCurrentSchool } from '@/lib/supabase'

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

  function saveRememberedAccount(email: string) {
    localStorage.setItem('remembered_email', email)
  }

  function getRememberedAccount(): string {
    return localStorage.getItem('remembered_email') || ''
  }

  // ========== Supabase 真实登录/注册 ==========
  async function supabaseLogin(email: string, password: string) {
    const result = await authApi.signIn(email, password)
    const profile = result.profile

    setAuthState(result.user.id, result.session.access_token, result.session.refresh_token || '')
    userId.value = result.user.id
    token.value = result.session.access_token
    refreshToken.value = result.session.refresh_token || ''
    username.value = profile?.name || email
    role.value = profile?.role || 'STUDENT'
    if (profile?.school_code) {
      schoolCode.value = profile.school_code
      localStorage.setItem('schoolCode', profile.school_code)
    }
    localStorage.setItem('username', profile?.name || email)
    localStorage.setItem('role', profile?.role || 'STUDENT')
    saveRememberedAccount(email)
  }

  async function supabaseRegister(
    email: string, password: string, name: string,
    schoolCodeParam: string, studentNo: string
  ) {
    const data = await authApi.signUp(email, password, name, schoolCodeParam, studentNo)

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
        schoolCode.value = profile.school_code
        localStorage.setItem('schoolCode', profile.school_code)
      }
      localStorage.setItem('username', profile?.name || session.user.email || '')
      localStorage.setItem('role', profile?.role || 'STUDENT')
      return true
    }
    return false
  }

  // ======================== 免登录测试 ========================
  const GUEST_PASSWORD = 'Guest2024!'

  async function guestLogin(schoolCode: string, name: string, collegeName: string, majorName: string) {
    const displayName = name.trim() || `Guest-${Date.now().toString(36)}`
    // 使用确定性邮箱，方便下次免密码重新登录
    const safeName = displayName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 10)
    const email = `guest_${schoolCode.toLowerCase()}_${safeName}_${Date.now().toString(36)}@test.local`

    const { data, error } = await supabase.auth.signUp({
      email,
      password: GUEST_PASSWORD,
      options: {
        data: { name: displayName, school_code: schoolCode, role: 'STUDENT', is_guest: true }
      }
    })

    if (error) throw error
    if (!data.user) throw new Error('免登录注册失败')

    // 创建带 is_guest 标记的 profile，含姓名、学院、专业
    await supabase.from('profiles').upsert({
      id: data.user.id,
      school_code: schoolCode,
      name: displayName,
      role: 'STUDENT',
      gender: 1,
      is_guest: true,
      college_name: collegeName || null,
      major_name: majorName || null,
    })

    // 设置登录状态
    const uid = data.user.id
    const t = data.session?.access_token || ''
    const r = data.session?.refresh_token || ''
    userId.value = uid
    token.value = t
    refreshToken.value = r
    username.value = displayName
    role.value = 'STUDENT'
    setAuthState(uid, t, r)
    saveRememberedAccount(email)
    // 记住免登录账号，方便下次免密码重新登录
    localStorage.setItem('guest_account', JSON.stringify({
      email, name: displayName, schoolCode, collegeName, majorName,
    }))
    return { email }
  }

  function getGuestAccount(): { email: string; name: string; schoolCode: string; collegeName: string; majorName: string } | null {
    try {
      const raw = localStorage.getItem('guest_account')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  async function guestReLogin(email: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: GUEST_PASSWORD })
    if (error) throw error
    if (!data.user || !data.session) throw new Error('免登录恢复失败')

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    userId.value = data.user.id
    token.value = data.session.access_token
    refreshToken.value = data.session.refresh_token || ''
    username.value = profile?.name || data.user.email || ''
    role.value = profile?.role || 'STUDENT'
    if (profile?.school_code) {
      schoolCode.value = profile.school_code
      localStorage.setItem('schoolCode', profile.school_code)
    }
    setAuthState(data.user.id, data.session.access_token, data.session.refresh_token || '')
    saveRememberedAccount(email)
    return true
  }

  function clearGuestAccount() {
    localStorage.removeItem('guest_account')
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
    logout, supabaseLogin, supabaseRegister, restoreSession, guestLogin,
    getGuestAccount, guestReLogin, clearGuestAccount,
  }
})