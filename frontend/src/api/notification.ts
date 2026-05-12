import request from './request'

export const notificationApi = {
  getList(params?: { isRead?: number }) {
    return request.get('/notification/list', { params })
  },
  getUnreadCount() {
    return request.get('/notification/unread-count')
  },
  markRead(id: number) {
    return request.put(`/notification/${id}/read`)
  },
  markAllRead() {
    return request.put('/notification/read-all')
  },
}
