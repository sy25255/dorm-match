import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  const userId = ref(Number(localStorage.getItem('userId')) || 0)
  const username = ref(localStorage.getItem('username') || '')
  const role = ref(localStorage.getItem('role') || '')
  const schoolCode = ref(localStorage.getItem('schoolCode') || '')
  const schoolName = ref(localStorage.getItem('schoolName') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setSchoolInfo(code: string, name: string) {
    schoolCode.value = code
    schoolName.value = name
    localStorage.setItem('schoolCode', code)
    localStorage.setItem('schoolName', name)
  }

  async function login(studentNo: string, password: string) {
    const res = await authApi.login({ studentNo, password })
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

  function logout() {
    token.value = ''
    refreshToken.value = ''
    userId.value = 0
    username.value = ''
    role.value = ''
    schoolCode.value = ''
    schoolName.value = ''
    localStorage.clear()
  }

  return { token, refreshToken, userId, username, role, schoolCode, schoolName, isLoggedIn, setSchoolInfo, login, demoLogin, demoDevLogin, logout }
})
