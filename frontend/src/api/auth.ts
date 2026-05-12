import request from './request'

export const authApi = {
  login(data: { studentNo: string; password: string }) {
    return request.post('/auth/login', data)
  },
  refreshToken(token: string) {
    return request.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
