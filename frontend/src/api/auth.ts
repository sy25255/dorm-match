import request from './request'

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
}