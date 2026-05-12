import request from './request'

export const inviteApi = {
  send(data: { targetId: number; message: string }) {
    return request.post('/invite/send', data)
  },
  accept(inviteId: number) {
    return request.put(`/invite/${inviteId}/accept`)
  },
  reject(inviteId: number) {
    return request.put(`/invite/${inviteId}/reject`)
  },
  withdraw(inviteId: number) {
    return request.put(`/invite/${inviteId}/withdraw`)
  },
  getReceived() {
    return request.get('/invite/received')
  },
  getSent() {
    return request.get('/invite/sent')
  },
  getQuota() {
    return request.get('/invite/quota')
  },
  getPairing() {
    return request.get('/invite/pairing')
  },
  getPairingMembers() {
    return request.get('/invite/pairing/members')
  },
}

export const allocationApi = {
  getMyAllocation() {
    return request.get('/allocation/my')
  },
  confirm() {
    return request.put('/allocation/confirm')
  },
  submitObjection(reason: string, attachmentUrls?: string) {
    return request.post('/allocation/objection', null, { params: { reason, attachmentUrls } })
  },
  getMyObjections() {
    return request.get('/allocation/objections')
  },
  getObjectionDetail(objectionId: number) {
    return request.get(`/allocation/objection/${objectionId}`)
  },
}
