import request from './request'

export const studentApi = {
  getStudent(id: number) {
    return request.get(`/student/${id}`)
  },
}
