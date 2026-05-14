import request from './request'

export const feedbackApi = {
  getList() {
    return request.get('/feedback/list')
  },
  submit(data: { targetRole: string; title: string; content: string; problemType?: string; collegeName?: string; majorName?: string; className?: string }) {
    return request.post('/feedback/submit', data)
  },
  getAdminList() {
    return request.get('/admin/feedback/list')
  },
  adminReply(id: number, data: { status: string; reply: string }) {
    return request.put(`/admin/feedback/${id}/reply`, data)
  },
}
