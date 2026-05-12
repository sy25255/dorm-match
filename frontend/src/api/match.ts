import request from './request'

export const matchApi = {
  calculate() {
    return request.post('/match/calculate')
  },
  getRecommendations() {
    return request.get('/match/recommendations')
  },
  getDetail(targetId: number) {
    return request.get(`/match/detail/${targetId}`)
  },
  search(params: { keyword?: string; collegeId?: number; majorId?: number; hobby?: string }) {
    return request.get('/match/search', { params })
  },
}
