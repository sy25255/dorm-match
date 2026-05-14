import request from './request'

export const feedbackApi = {
  getList() {
    return request.get('/feedback/list')
  },
  submit(data: { category: string; title: string; content: string }) {
    return request.post('/feedback/submit', data)
  },
}
