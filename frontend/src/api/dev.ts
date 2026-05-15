import request from './request'

export const devApi = {
  getPlatformStats: () => request.get('/admin/dev/platform-stats'),
  getSchools: () => request.get('/admin/dev/schools'),
  getSchoolStatistics: (code: string) => request.get(`/admin/dev/schools/${code}/statistics`),
  getSchoolStudents: (code: string) => request.get(`/admin/dev/schools/${code}/students`),
  getSchoolBuildings: (code: string) => request.get(`/admin/dev/schools/${code}/buildings`),
  getSchoolRooms: (code: string) => request.get(`/admin/dev/schools/${code}/rooms`),
  getSchoolAllocations: (code: string) => request.get(`/admin/dev/schools/${code}/allocations`),
  getSchoolObjections: (code: string) => request.get(`/admin/dev/schools/${code}/objections`),
  getSchoolConfig: (code: string) => request.get(`/admin/dev/schools/${code}/config`),
  updateSchoolConfig: (code: string, data: any) => request.put(`/admin/dev/schools/${code}/config`, data),
  getAdmins: () => request.get('/admin/dev/admins'),
  createAdmin: (data: any) => request.post('/admin/dev/admins', data),
  updateAdmin: (id: number, data: any) => request.put(`/admin/dev/admins/${id}`, data),
  deleteAdmin: (id: number) => request.delete(`/admin/dev/admins/${id}`),
  getDevFeedbacks: () => request.get('/admin/dev/feedbacks'),
  replyDevFeedback: (id: number, data: any) => request.put(`/admin/dev/feedbacks/${id}/reply`, data),
  sendNotification: (data: any) => request.post('/admin/dev/notifications/send', data),
}