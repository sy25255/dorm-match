import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { supabase } from '@/lib/supabase'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const userId = ref(Number(localStorage.getItem('userId')) || 0)
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(localStorage.getItem('role') || '')
  const schoolCode = ref(localStorage.getItem('schoolCode') || '')
  const schoolName = ref(localStorage.getItem('schoolName') || '')
  const supabaseUserId = ref(localStorage.getItem('supabase_user_id') || '')

  const isLoggedIn = computed(() => !!token.value || !!supabaseUserId.value)

  function setSchoolInfo(code: string, name: string) {
    schoolCode.value = code
    schoolName.value = name
    localStorage.setItem('schoolCode', code)
    localStorage.setItem('schoolName', name)
  }

  function getRememberedAccount(): string {
    return localStorage.getItem('remembered_studentNo') || ''
  }

  function saveRememberedAccount(studentNo: string) {
    localStorage.setItem('remembered_studentNo', studentNo)
  }

  function clearRememberedAccount() {
    localStorage.removeItem('remembered_studentNo')
  }

  // ========== Supabase 真实登录/注册 ==========
  async function supabaseLogin(email: string, password: string) {
    const result = await authApi.signIn(email, password)
    const profile = result.profile

    supabaseUserId.value = result.user.id
    token.value = result.session.access_token
    refreshToken.value = result.session.refresh_token || ''
    userId.value = profile?.id || 0
    username.value = profile?.name || email
    role.value = profile?.role || 'STUDENT'
    if (profile?.school_code) {
      schoolCode.value = profile.school_code
      localStorage.setItem('schoolCode', profile.school_code)
    }

    localStorage.setItem('token', result.session.access_token)
    localStorage.setItem('refreshToken', result.session.refresh_token || '')
    localStorage.setItem('userId', String(profile?.id || 0))
    localStorage.setItem('username', profile?.name || email)
    localStorage.setItem('role', profile?.role || 'STUDENT')
    localStorage.setItem('supabase_user_id', result.user.id)
    saveRememberedAccount(email)
  }

  async function supabaseRegister(
    email: string, password: string, name: string,
    schoolCodeParam: string, studentNo: string
  ) {
    const data = await authApi.signUp(email, password, name, schoolCodeParam, studentNo)

    if (data.session) {
      supabaseUserId.value = data.user!.id
      token.value = data.session.access_token
      refreshToken.value = data.session.refresh_token || ''
      userId.value = 0
      username.value = name
      role.value = 'STUDENT'

      localStorage.setItem('token', data.session.access_token)
      localStorage.setItem('refreshToken', data.session.refresh_token || '')
      localStorage.setItem('userId', '0')
      localStorage.setItem('username', name)
      localStorage.setItem('role', 'STUDENT')
      localStorage.setItem('supabase_user_id', data.user!.id)
      saveRememberedAccount(email)
    }
  }

  async function restoreSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      supabaseUserId.value = session.user.id
      token.value = session.access_token
      refreshToken.value = session.refresh_token || ''
      username.value = profile?.name || session.user.email || ''
      role.value = profile?.role || 'STUDENT'
      if (profile?.school_code) {
        schoolCode.value = profile.school_code
        localStorage.setItem('schoolCode', profile.school_code)
      }

      localStorage.setItem('token', session.access_token)
      localStorage.setItem('refreshToken', session.refresh_token || '')
      localStorage.setItem('userId', String(profile?.id || 0))
      localStorage.setItem('username', profile?.name || session.user.email || '')
      localStorage.setItem('role', profile?.role || 'STUDENT')
      localStorage.setItem('supabase_user_id', session.user.id)
      return true
    }
    return false
  }

  // ========== 旧版 mock/demo 登录（保留兼容） ==========
  async function login(studentNo: string, password: string, schoolCodeParam?: string) {
    const res = await authApi.login({ studentNo, password, schoolCode: schoolCodeParam })
    const data = res.data.data || res.data
    token.value = data.token
    refreshToken.value = data.refreshToken
    userId.value = data.userId
    username.value = data.username
    role.value = data.role
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('username', data.username)
    localStorage.setItem('role', data.role)
    saveRememberedAccount(studentNo)
  }

  async function register(schoolCodeParam: string, studentNo: string, realName: string, password: string) {
    const res = await authApi.register({ schoolCode: schoolCodeParam, studentNo, realName, password })
    const data = res.data.data || res.data
    token.value = data.token
    refreshToken.value = data.refreshToken
    userId.value = data.userId
    username.value = data.username || realName
    role.value = data.role || 'STUDENT'
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('username', data.username || realName)
    localStorage.setItem('role', data.role || 'STUDENT')
    saveRememberedAccount(studentNo)
  }

  function demoLogin(studentNo: string, name: string) {
    const fakeToken = 'demo-token-' + Date.now()
    token.value = fakeToken
    refreshToken.value = fakeToken
    userId.value = parseInt(studentNo.replace('202400', '')) || 1
    username.value = name
    role.value = 'STUDENT'
    localStorage.setItem('token', fakeToken)
    localStorage.setItem('refreshToken', fakeToken)
    localStorage.setItem('userId', String(userId.value))
    localStorage.setItem('username', name)
    localStorage.setItem('role', 'STUDENT')
    saveRememberedAccount(studentNo)
  }

  function demoDevLogin() {
    token.value = 'demo-dev-token'
    refreshToken.value = 'demo-dev-refresh'
    userId.value = 0
    username.value = '系统开发者'
    role.value = 'DEVELOPER'
    localStorage.setItem('token', 'demo-dev-token')
    localStorage.setItem('refreshToken', 'demo-dev-refresh')
    localStorage.setItem('userId', '0')
    localStorage.setItem('username', '系统开发者')
    localStorage.setItem('role', 'DEVELOPER')
  }

  async function logout() {
    if (supabaseUserId.value) {
      await authApi.signOut().catch(() => {})
    }
    token.value = ''
    refreshToken.value = ''
    userId.value = 0
    username.value = ''
    role.value = ''
    supabaseUserId.value = ''
    schoolCode.value = ''
    schoolName.value = ''
    const authKeys = ['token', 'refreshToken', 'userId', 'username', 'role', 'supabase_user_id']
    authKeys.forEach(key => localStorage.removeItem(key))
  }

  return {
    token, refreshToken, userId, username, role,
    schoolCode, schoolName, supabaseUserId, isLoggedIn,
    setSchoolInfo,
    getRememberedAccount, saveRememberedAccount, clearRememberedAccount,
    login, register, demoLogin, demoDevLogin, logout,
    supabaseLogin, supabaseRegister, restoreSession,
  }
})