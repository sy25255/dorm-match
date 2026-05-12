import request from './request'

export const schoolApi = {
  getConfig() { return request.get('/admin/school/config') },
  updateConfig(data: any) { return request.put('/admin/school/config', data) },
  getColleges() { return request.get('/admin/school/colleges') },
  createCollege(data: any) { return request.post('/admin/school/colleges', data) },
  updateCollege(id: number, data: any) { return request.put(`/admin/school/colleges/${id}`, data) },
  getMajors(collegeId?: number) { return request.get('/admin/school/majors', { params: { collegeId } }) },
  createMajor(data: any) { return request.post('/admin/school/majors', data) },
  updateMajor(id: number, data: any) { return request.put(`/admin/school/majors/${id}`, data) },
  getClasses(majorId?: number) { return request.get('/admin/school/classes', { params: { majorId } }) },
  createClass(data: any) { return request.post('/admin/school/classes', data) },
  updateClass(id: number, data: any) { return request.put(`/admin/school/classes/${id}`, data) },
}
