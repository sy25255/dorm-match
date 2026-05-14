import request from './request'

export const adminApi = {
  getStudents(params?: { keyword?: string; collegeId?: number; status?: number }) {
    return request.get('/admin/students', { params })
  },
  getStudent(id: number) {
    return request.get(`/admin/students/${id}`)
  },
  createStudent(data: any) {
    return request.post('/admin/students', data)
  },
  updateStudent(id: number, data: any) {
    return request.put(`/admin/students/${id}`, data)
  },
  toggleStudent(id: number, status: number) {
    return request.put(`/admin/students/${id}/toggle`, null, { params: { status } })
  },
  importStudents(data: any[]) {
    return request.post('/admin/students/import', data)
  },

  getSurveyQuestions() {
    return request.get('/admin/survey/questions')
  },
  createQuestion(data: any) {
    return request.post('/admin/survey/questions', data)
  },
  updateQuestion(id: number, data: any) {
    return request.put(`/admin/survey/questions/${id}`, data)
  },
  toggleQuestion(id: number, status: number) {
    return request.put(`/admin/survey/questions/${id}/toggle`, null, { params: { status } })
  },
  deleteQuestion(id: number) {
    return request.delete(`/admin/survey/questions/${id}`)
  },

  getBuildings() {
    return request.get('/admin/dormitory/buildings')
  },
  createBuilding(data: any) {
    return request.post('/admin/dormitory/buildings', data)
  },
  updateBuilding(id: number, data: any) {
    return request.put(`/admin/dormitory/buildings/${id}`, data)
  },
  getRooms(buildingId?: number) {
    return request.get('/admin/dormitory/rooms', { params: { buildingId } })
  },
  createRoom(data: any) {
    return request.post('/admin/dormitory/rooms', data)
  },
  updateRoom(id: number, data: any) {
    return request.put(`/admin/dormitory/rooms/${id}`, data)
  },

  getAllocationResults(batchCode: string) {
    return request.get('/admin/allocation/results', { params: { batchCode } })
  },
  executeAllocation(batchCode: string) {
    return request.post('/admin/allocation/execute', null, { params: { batchCode } })
  },
  publishResults(batchCode: string) {
    return request.post('/admin/allocation/publish', null, { params: { batchCode } })
  },
  finalizeResults(batchCode: string) {
    return request.post('/admin/allocation/finalize', null, { params: { batchCode } })
  },



  getStatistics() {
    return request.get('/admin/statistics')
  },

  getAuditLogs(params?: { page?: number; action?: string }) {
    return request.get('/admin/audit-logs', { params })
  },

  getInviteCodes() {
    return request.get('/admin/invite-codes')
  },
  generateInviteCode() {
    return request.post('/admin/invite-codes/generate')
  },
}
