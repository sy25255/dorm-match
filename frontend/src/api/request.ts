import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const schoolCode = localStorage.getItem('schoolCode')
  if (schoolCode) {
    config.headers['X-School-Code'] = schoolCode
  }
  return config
})

let mockData: any = null
async function loadMockData() {
  if (!mockData) {
    const mod = await import('@/mock/data')
    mockData = mod
  }
  return mockData
}

const isDemoMode = () => localStorage.getItem('token')?.startsWith('demo-token-')

function makeMockResponse(data: any) {
  return { data: { code: 200, message: '操作成功', data } }
}

function getDraftFromStorage() {
  const userId = localStorage.getItem('userId') || '0'
  return JSON.parse(localStorage.getItem(`demo_survey_draft_${userId}`) || '{}')
}

function parseBody(data: any) {
  if (!data) return {}
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return {} }
  }
  return data
}

async function handleMock(url: string, method: string, bodyData?: any, schoolCodeParam?: string): Promise<any> {
  const m = await loadMockData()
  const userId = Number(localStorage.getItem('userId')) || 1
  const schoolCode = schoolCodeParam || localStorage.getItem('schoolCode') || 'DEMO-UNI'
  const surveyDone = localStorage.getItem(`demo_survey_completed_${userId}`) === 'true'

  // 读取共享测试用户注册表，合并到 mock 数据中（同一浏览器内可见）
  function mergeTestUsers(baseList: any[]) {
    const raw = localStorage.getItem('demo_registered_test_users')
    if (!raw) return baseList
    try {
      const registry: any[] = JSON.parse(raw)
      // 去重：按 id 排除已在 baseList 中的
      const baseIds = new Set(baseList.map((s: any) => s.id))
      const newUsers = registry.filter((u: any) => !baseIds.has(u.id))
      return [...baseList, ...newUsers]
    } catch { return baseList }
  }

  // ========== School Validation ==========
  if (url.includes('/school/validate')) {
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const code = b.code || new URLSearchParams(url.split('?')[1] || '').get('code')
    const school = m.getSchoolByCode(code)
    if (school) return makeMockResponse({ valid: true, school })
    return makeMockResponse({ valid: false, school: null })
  }

  // ========== Auth ==========
  if (url.includes('/auth/login')) {
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    if (b.studentNo === 'developer' && b.password === 'dev@dorm#2024') {
      return makeMockResponse({ token: 'demo-dev-token', refreshToken: 'demo-dev-refresh', userId: 0, username: '系统开发者', role: 'DEVELOPER' })
    }
    if (b.studentNo === 'admin' && b.password === 'admin123') {
      return makeMockResponse({ token: 'demo-admin-token', refreshToken: 'demo-admin-refresh', userId: 99, username: '系统管理员', role: 'ADMIN' })
    }
    return makeMockResponse({ token: 'demo-token', refreshToken: 'demo-refresh', userId: 1, username: '张伟（演示）', role: 'STUDENT' })
  }
  if (url.includes('/auth/register')) {
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const school = m.getSchoolByCode(b.schoolCode)
    if (!school) return { data: { code: 400, message: '学校编码不存在', data: null } }
    const newId = m.mockAllStudents.length + 1
    const newStudent = {
      id: newId,
      studentNo: b.studentNo,
      name: b.realName,
      gender: 'UNKNOWN',
      college: school.name,
      major: '待分配',
      className: '待分配',
      surveyCompleted: false,
      paired: false,
      allocated: false,
    }
    m.mockAllStudents.push(newStudent)
    if (!m.schoolStudentsMap[b.schoolCode]) {
      m.schoolStudentsMap[b.schoolCode] = []
    }
    m.schoolStudentsMap[b.schoolCode].push(newStudent)
    return makeMockResponse({ token: 'demo-token-reg-' + newId, refreshToken: 'demo-refresh-reg-' + newId, userId: newId, username: b.realName, role: 'STUDENT' })
  }
  if (url.includes('/auth/refresh')) return makeMockResponse({ token: 'demo-token-2', refreshToken: 'demo-refresh-2', userId: 1, username: '张伟（演示）', role: 'STUDENT' })

  // ========== Survey ==========
  if (url === '/survey/questions' || url.includes('/survey/questions')) return makeMockResponse(m.mockQuestions)
  if (url.includes('/survey/progress')) {
    const draft = getDraftFromStorage()
    const answered = Object.keys(draft).length
    return makeMockResponse({ total: 91, answered, percentage: Math.round(answered * 100 / 91) })
  }
  if (url.includes('/survey/draft')) {
    if (method === 'post' || method === 'put') {
      if (bodyData?.answers) {
        const draft: Record<string, string> = getDraftFromStorage()
        bodyData.answers.forEach((a: any) => { draft[String(a.questionId)] = a.answerValue })
        localStorage.setItem(`demo_survey_draft_${userId}`, JSON.stringify(draft))
      }
      return makeMockResponse(null)
    }
    const draft = getDraftFromStorage()
    const items = Object.entries(draft).map(([qid, val]) => ({ questionId: Number(qid), answerValue: val }))
    return makeMockResponse(items)
  }
  if (url.includes('/survey/submit')) {
    localStorage.setItem(`demo_survey_completed_${userId}`, 'true')
    return makeMockResponse(null)
  }

  // ========== Match ==========
  if (url.includes('/match/calculate')) return makeMockResponse(null)
  if (url.includes('/match/recommendations')) return makeMockResponse(m.getUserRecommendations(userId))
  if (url.includes('/match/search')) return makeMockResponse(mergeTestUsers(m.mockSearchResults))
  if (url.includes('/match/detail/')) {
    const id = Number(url.split('/match/detail/')[1])
    return makeMockResponse(m.getMockMatchDetail(id))
  }
  if (url.includes('/match/survey/')) {
    const id = Number(url.split('/match/survey/')[1])
    return makeMockResponse(m.getMockStudentSurvey(id))
  }

  // ========== Invite ==========
  if (url.includes('/invite/send')) {
    const body = parseBody(bodyData)
    const fromId = userId
    const toId = body?.targetId || 0
    const sc = schoolCode

    console.log('[Mock] POST /invite/send - from:', fromId, 'to:', toId, 'school:', sc)

    const { addSentInvite, addReceivedInvite } = m
    const invite: any = {
      id: Date.now(),
      fromStudentId: fromId,
      toStudentId: toId,
      message: body?.message || '',
      status: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(),
      schoolCode: sc,
    }
    addSentInvite(invite)
    addReceivedInvite(invite)
    ElMessage.success('邀请已发送')
    return makeMockResponse({ id: invite.id, status: 0 })
  }
  if (url.includes('/invite/quota')) {
    const { computeQuota } = m
    const quota = computeQuota(userId > 0 ? userId : 1)
    console.log('[Mock] GET /invite/quota - userId:', userId, 'quota:', quota)
    return makeMockResponse(quota)
  }
  if (url.includes('/invite/pairing/members')) {
    const { getPersistedPairGroups } = m
    const sc = schoolCode || 'DEMO-UNI'
    const uid = userId > 0 ? userId : 1
    const groups = getPersistedPairGroups()
    const group = groups.find((g: any) => g.members.includes(uid) && g.schoolCode === sc)
    console.log('[Mock] GET /invite/pairing/members - uid:', uid, 'found:', !!group, 'members:', group?.members)
    if (group) {
      return makeMockResponse(group.members.map((sid: number) => ({
        studentId: sid, name: `学生${sid}`, avatarUrl: '', isInitiator: 0
      })))
    }
    return makeMockResponse([])
  }
  if (url.includes('/invite/pairing')) {
    const { getPersistedPairGroups } = m
    const sc = schoolCode || 'DEMO-UNI'
    const uid = userId > 0 ? userId : 1
    const groups = getPersistedPairGroups()
    const group = groups.find((g: any) => g.members.includes(uid) && g.schoolCode === sc)
    console.log('[Mock] GET /invite/pairing - uid:', uid, 'found:', !!group)
    if (group) {
      return makeMockResponse({ id: group.pairId, pairingCode: group.pairingCode, groupSize: group.members.length, status: group.status, lockedAt: new Date().toISOString(), createdAt: new Date().toISOString() })
    }
    return makeMockResponse(null)
  }
  const nowIso = new Date().toISOString()
  const laterIso = new Date(Date.now() + 72 * 3600000).toISOString()
  if (url.includes('/invite/received')) {
    const { getPersistedReceivedInvites } = m
    const all = getPersistedReceivedInvites()
    const mine = all.filter((i: any) => i.toStudentId === (userId > 0 ? userId : 1) && i.schoolCode === (schoolCode || 'DEMO-UNI'))
    console.log('[Mock] GET /invite/received - count:', mine.length, 'for user:', userId)
    return makeMockResponse(mine)
  }
  if (url.includes('/invite/sent')) {
    const { getPersistedSentInvites } = m
    const all = getPersistedSentInvites()
    const mine = all.filter((i: any) => i.fromStudentId === (userId > 0 ? userId : 1) && i.schoolCode === (schoolCode || 'DEMO-UNI'))
    console.log('[Mock] GET /invite/sent - count:', mine.length, 'for user:', userId)
    return makeMockResponse(mine)
  }
  if (url.includes('/invite/') && url.includes('/accept')) {
    const idMatch = url.match(/\/invite\/(\d+)\/accept/)
    const inviteId = idMatch ? Number(idMatch[1]) : 0
    console.log('[Mock] PUT /invite/:id/accept - inviteId:', inviteId, 'userId:', userId)
    const { updateInviteStatus, getPersistedReceivedInvites, getPersistedPairGroups, addPairMember } = m
    updateInviteStatus(inviteId, 1)

    const received = getPersistedReceivedInvites()
    const inv = received.find((i: any) => i.id === inviteId)
    if (inv) {
      const sc = inv.schoolCode || schoolCode || 'DEMO-UNI'
      const groups = getPersistedPairGroups()
      const senderGroup = groups.find((g: any) => g.members.includes(inv.fromStudentId) && g.schoolCode === sc)
      const recvGroup = groups.find((g: any) => g.members.includes(inv.toStudentId) && g.schoolCode === sc)
      const roomCapacity = m.getRoomCapacityConfig()

      if (senderGroup && senderGroup.members.length >= roomCapacity) {
        ElMessage.warning(`宿舍为${roomCapacity}人间，对方组已满员，无法接受邀请`)
        return makeMockResponse(null)
      }
      if (recvGroup && recvGroup.members.length >= roomCapacity) {
        ElMessage.warning(`宿舍为${roomCapacity}人间，你的组已满员，无法接受邀请`)
        return makeMockResponse(null)
      }

      if (senderGroup && !senderGroup.members.includes(inv.toStudentId)) {
        const combined = new Set([...senderGroup.members, ...(recvGroup?.members || []), inv.toStudentId])
        if (combined.size > roomCapacity) {
          ElMessage.warning(`合并后将超过${roomCapacity}人，请先减少成员`)
          return makeMockResponse(null)
        }
        addPairMember(senderGroup.pairId, inv.toStudentId, sc)
        if (recvGroup) recvGroup.members.filter((m: number) => m !== inv.toStudentId).forEach((m: number) => addPairMember(senderGroup.pairId, m, sc))
      } else if (recvGroup && !recvGroup.members.includes(inv.fromStudentId)) {
        addPairMember(recvGroup.pairId, inv.fromStudentId, sc)
        if (senderGroup) senderGroup.members.filter((m: number) => m !== inv.fromStudentId).forEach((m: number) => addPairMember(recvGroup.pairId, m, sc))
      } else if (senderGroup) {
        addPairMember(senderGroup.pairId, inv.toStudentId, sc)
      } else if (recvGroup) {
        addPairMember(recvGroup.pairId, inv.fromStudentId, sc)
      } else {
        const newId = Math.max(...groups.map((g: any) => g.pairId), 0) + 1
        addPairMember(newId, inv.fromStudentId, sc)
        addPairMember(newId, inv.toStudentId, sc)
      }
    }
    ElMessage.success('配对成功！')
    return makeMockResponse(null)
  }
  if (url.includes('/invite/') && url.includes('/reject')) {
    const idMatch = url.match(/\/invite\/(\d+)\/reject/)
    const inviteId = idMatch ? Number(idMatch[1]) : 0
    console.log('[Mock] PUT /invite/reject - id:', inviteId)
    const { updateInviteStatus } = m
    updateInviteStatus(inviteId, 2)
    return makeMockResponse(null)
  }
  if (url.includes('/invite/') && url.includes('/withdraw')) {
    const idMatch = url.match(/\/invite\/(\d+)\/withdraw/)
    const inviteId = idMatch ? Number(idMatch[1]) : 0
    console.log('[Mock] PUT /invite/withdraw - id:', inviteId)
    const { updateInviteStatus } = m
    updateInviteStatus(inviteId, 3)
    return makeMockResponse(null)
  }

  // ========== Allocation (student) ==========
  if (url.includes('/allocation/my')) {
    if (!surveyDone) {
      console.log('[Mock] GET /allocation/my - 问卷未完成，返回 null')
      return makeMockResponse(null)
    }
    const alloc = m.getUserAllocation(userId)
    console.log('[Mock] GET /allocation/my - 用户分配结果:', alloc ? { roomNumber: alloc.roomNumber, status: alloc.status } : '无分配')
    return makeMockResponse(alloc)
  }
  if (url === '/allocation/objections' || url.includes('/allocation/objections')) {
    console.log('[Mock] GET /allocation/objections - 学生查看我的异议列表')
    return makeMockResponse(m.mockObjections)
  }
  if (url.includes('/allocation/objection/') && method === 'get') {
    const id = Number(url.split('/allocation/objection/')[1])
    console.log('[Mock] GET /allocation/objection/:id - 获取异议详情:', id)
    const obj = m.mockAllObjections.find((o: any) => o.id === id)
    console.log('[Mock] 异议详情查询结果:', obj ? { id: obj.id, status: obj.status } : '未找到')
    return makeMockResponse(obj || null)
  }
  if (url.includes('/allocation/objection') && method === 'post') {
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const reason = b.reason || b
    console.log('[Mock] POST /allocation/objection - 收到学生异议:', { userId, reason: typeof reason === 'string' ? reason.substring(0, 80) : reason })
    
    const studentName = localStorage.getItem('username') || `学生${userId}`
    const myAlloc = m.getUserAllocation(userId)
    const newObj = {
      id: m.mockAllObjections.length + 1,
      allocationId: myAlloc?.allocationId || 1,
      studentId: userId,
      studentName,
      reason: typeof reason === 'string' ? reason : String(reason || ''),
      status: 'PENDING',
      currentHandler: null,
      reviewComment: '',
      createdAt: new Date().toISOString(),
    }
    m.mockAllObjections.unshift(newObj)
    console.log('[Mock] 异议已写入 mockAllObjections:', { id: newObj.id, status: newObj.status, total: m.mockAllObjections.length })
    ElMessage.success('异议已提交，管理员将尽快处理')
    return makeMockResponse(newObj)
  }
  if (url.includes('/allocation/confirm')) {
    ElMessage.success('已确认')
    return makeMockResponse(null)
  }

  // ========== Student ==========
  if (url.match(/\/student\/\d+$/)) {
    const id = Number(url.split('/student/')[1])
    const student = m.mockStudents.find((s: any) => s.id === id)
    return makeMockResponse(student || { id, name: `学生${id}` })
  }
  if (url.includes('/student/profile') && method === 'put') {
    ElMessage.success('个人信息已更新')
    return makeMockResponse(null)
  }

  // ========== Admin: Students ==========
  if (url.includes('/admin/students/import')) {
    ElMessage.success('学生数据导入成功')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/students/') && url.includes('/toggle')) {
    ElMessage.success('状态已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/students/') && method === 'put') {
    ElMessage.success('学生信息已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/students/')) {
    const id = Number(url.split('/admin/students/')[1])
    const s = m.mockAllStudents.find((st: any) => st.id === id)
    return makeMockResponse(s || null)
  }
  if (url.includes('/admin/students') && method === 'post') {
    ElMessage.success('学生已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/students')) {
    const scStudents = m.schoolStudentsMap[schoolCode] || m.mockAllStudents
    return makeMockResponse(mergeTestUsers(scStudents))
  }

  // ========== Admin: School Management ==========
  if (url.includes('/admin/school/config')) {
    if (method === 'put') {
      ElMessage.success('学校配置已更新')
      return makeMockResponse(null)
    }
    return makeMockResponse(m.mockSchoolConfig)
  }
  if (url.includes('/admin/school/colleges') && method === 'post') {
    ElMessage.success('学院已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/colleges/') && method === 'put') {
    ElMessage.success('学院已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/colleges')) {
    return makeMockResponse(m.mockColleges)
  }
  if (url.includes('/admin/school/majors') && method === 'post') {
    ElMessage.success('专业已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/majors/') && method === 'put') {
    ElMessage.success('专业已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/majors')) {
    const collegeId = new URLSearchParams(url.split('?')[1] || '').get('collegeId')
    if (collegeId) return makeMockResponse((m.mockMajors[Number(collegeId)] || []))
    const all = Object.entries(m.mockMajors as Record<number, any[]>).flatMap(([cid, majors]) =>
      majors.map((maj: any) => ({ ...maj, collegeId: Number(cid) }))
    )
    return makeMockResponse(all)
  }
  if (url.includes('/admin/school/classes') && method === 'post') {
    ElMessage.success('班级已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/classes/') && method === 'put') {
    ElMessage.success('班级已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/school/classes')) {
    const majorId = new URLSearchParams(url.split('?')[1] || '').get('majorId')
    if (majorId) return makeMockResponse(m.mockClasses.filter((c: any) => c.majorId === Number(majorId)))
    return makeMockResponse(m.mockClasses)
  }

  // ========== Student: Search (cascaded) ==========
  if (url.includes('/school/colleges')) {
    return makeMockResponse(m.mockColleges)
  }
  if (url.includes('/school/majors')) {
    const collegeId = new URLSearchParams(url.split('?')[1] || '').get('collegeId')
    if (collegeId) return makeMockResponse((m.mockMajors[Number(collegeId)] || []))
    const all = Object.entries(m.mockMajors as Record<number, any[]>).flatMap(([cid, majors]) =>
      majors.map((maj: any) => ({ ...maj, collegeId: Number(cid) }))
    )
    return makeMockResponse(all)
  }
  if (url.includes('/school/classes')) {
    const majorId = new URLSearchParams(url.split('?')[1] || '').get('majorId')
    if (majorId) return makeMockResponse(m.mockClasses.filter((c: any) => c.majorId === Number(majorId)))
    return makeMockResponse(m.mockClasses)
  }

  // ========== Admin: Survey ==========
  if (url.includes('/admin/survey/questions/') && url.includes('/toggle')) {
    ElMessage.success('题目状态已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/survey/questions/') && method === 'put') {
    ElMessage.success('题目已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/survey/questions/') && method === 'delete') {
    ElMessage.success('题目已删除')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/survey/questions') && method === 'post') {
    ElMessage.success('题目已创建')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/survey/questions')) {
    return makeMockResponse(m.mockQuestions)
  }

  // ========== Admin: Dormitory ==========
  if (url.includes('/admin/dormitory/buildings') && method === 'post') {
    ElMessage.success('宿舍楼已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dormitory/buildings/') && method === 'put') {
    ElMessage.success('宿舍楼已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dormitory/buildings')) {
    const scBld = m.schoolBuildingsMap[schoolCode] || m.mockDormBuildings
    return makeMockResponse(scBld)
  }
  if (url.includes('/admin/dormitory/rooms') && method === 'post') {
    ElMessage.success('房间已添加')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dormitory/rooms/') && method === 'put') {
    ElMessage.success('房间已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dormitory/rooms')) {
    const scRooms = m.schoolRoomsMap[schoolCode] || m.mockDormRooms
    return makeMockResponse(scRooms)
  }

  // ========== Admin: Allocation ==========
  if (url.includes('/admin/allocation/execute')) {
    ElMessage.success('批量分配已执行')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/allocation/publish')) {
    ElMessage.success('预分配结果已发布公示')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/allocation/finalize')) {
    ElMessage.success('正式分配结果已确认')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/allocation/results')) {
    const scAlloc = m.schoolAllocationsMap[schoolCode] || m.mockAllocations
    return makeMockResponse(scAlloc)
  }

  // ========== Admin: Statistics ==========
  if (url.includes('/admin/statistics')) {
    const scStats = m.getSchoolStatistics(schoolCode)
    return makeMockResponse(scStats)
  }

  // ========== Admin: Audit Logs ==========
  if (url.includes('/admin/audit-logs')) {
    let auditLogs = [...m.mockAuditLogs]
    // Parse query string for action filter
    const queryStr = url.split('?')[1] || ''
    const params = new URLSearchParams(queryStr)
    const actionFilter = params.get('action')
    if (actionFilter) {
      auditLogs = auditLogs.filter((l: any) => l.action === actionFilter)
    }
    return makeMockResponse(auditLogs)
  }

  // ========== Admin: Objections ==========
  if (url.includes('/admin/objections/') && method === 'put') {
    const id = Number(url.split('/admin/objections/')[1])
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const scObj = m.schoolObjectionsMap[schoolCode] || m.mockAllObjections
    const obj = scObj.find((o: any) => o.id === id)
    if (obj) {
      obj.status = b.status || 'RESOLVED'
      obj.reviewComment = b.reviewComment || ''
      obj.currentHandler = userId
      if (b.status === 'RESOLVED') obj.resolvedAt = new Date().toISOString()
    }
    ElMessage.success('异议已处理')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/objections')) {
    const scObj = m.schoolObjectionsMap[schoolCode] || m.mockAllObjections
    return makeMockResponse(scObj)
  }

  // ========== Admin: Invite Codes ==========
  if (url.includes('/admin/invite-codes/generate')) {
    return makeMockResponse({ code: m.generateInviteCode(), createdAt: new Date().toISOString() })
  }
  if (url.includes('/admin/invite-codes')) {
    return makeMockResponse([
      { id: 1, code: 'INV-A8K3M2', usedBy: null, isUsed: false, createdAt: '2024-08-24T10:00:00' },
      { id: 2, code: 'INV-P9J4Q1', usedBy: '20240001', isUsed: true, createdAt: '2024-08-24T10:00:00' },
      { id: 3, code: 'INV-R2L7N5', usedBy: null, isUsed: false, createdAt: '2024-08-24T10:00:00' },
    ])
  }

  // ========== Notifications ==========
  if (url.includes('/notification/') && url.includes('/read') && !url.includes('read-all')) {
    return makeMockResponse(null)
  }
  if (url.includes('/notification/read-all')) {
    return makeMockResponse(null)
  }
  if (url.includes('/notification/unread-count')) {
    return makeMockResponse({ count: m.mockNotifications.filter((n: any) => n.studentId === userId && n.isRead === 0).length })
  }
  if (url.includes('/notification/list')) {
    return makeMockResponse(m.mockNotifications.filter((n: any) => n.studentId === userId))
  }

  // ========== Developer API: Platform Stats ==========
  if (url.includes('/admin/dev/platform-stats')) {
    return makeMockResponse(m.getPlatformStats())
  }
  if (url.includes('/admin/dev/schools')) {
    return makeMockResponse(m.mockSchools)
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/statistics')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.getSchoolStatistics(code))
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/students')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.schoolStudentsMap[code] || [])
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/buildings')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.schoolBuildingsMap[code] || [])
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/rooms')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.schoolRoomsMap[code] || [])
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/allocations')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.schoolAllocationsMap[code] || [])
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/objections')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    return makeMockResponse(m.schoolObjectionsMap[code] || [])
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/config') && method === 'put') {
    ElMessage.success('学校配置已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dev/schools/') && url.includes('/config')) {
    const code = url.split('/admin/dev/schools/')[1].split('/')[0]
    const school = m.mockSchools.find((s: any) => s.code === code)
    return makeMockResponse(school || null)
  }
  if (url.includes('/admin/dev/admins') && method === 'post') {
    ElMessage.success('管理员账号已创建')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dev/admins/') && method === 'put') {
    ElMessage.success('管理员账号已更新')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dev/admins/') && method === 'delete') {
    ElMessage.success('管理员账号已删除')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dev/admins')) {
    return makeMockResponse(m.mockAdminAccounts)
  }
  if (url.includes('/admin/dev/feedbacks')) {
    const devFeedbacks = m.mockFeedbacks
      .filter((f: any) => f.targetRole === 'DEVELOPER')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return makeMockResponse(devFeedbacks)
  }
  if (url.includes('/admin/dev/feedbacks/') && url.includes('/reply')) {
    const id = Number(url.split('/admin/dev/feedbacks/')[1]?.split('/')[0])
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const fb = m.mockFeedbacks.find((f: any) => f.id === id)
    if (fb) {
      fb.status = b.status || 'ADOPTED'
      fb.reply = b.reply || ''
      fb.replierRole = 'DEVELOPER'
    }
    ElMessage.success('反馈已处理')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/dev/notifications/send')) {
    ElMessage.success('系统通知已发送')
    return makeMockResponse(null)
  }

  // ========== Feedback ==========
  if (url.includes('/admin/feedback/') && url.includes('/reply')) {
    const id = Number(url.split('/admin/feedback/')[1]?.split('/')[0])
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const fb = m.mockFeedbacks.find((f: any) => f.id === id)
    if (fb) {
      fb.status = b.status || 'ADOPTED'
      fb.reply = b.reply || ''
      fb.replierRole = 'ADMIN'
      const statusLabel = b.status === 'ADOPTED' ? '已采纳' : '已回绝'
      m.mockNotifications.unshift({
        id: m.mockNotifications.length + 1,
        studentId: userId,
        title: '反馈已处理',
        content: `你提交的「${fb.title}」已被管理员标记为"${statusLabel}"。${b.reply ? '回复：' + b.reply.substring(0, 50) + '...' : ''}`,
        type: 'FEEDBACK',
        relatedId: fb.id,
        isRead: 0,
        createdAt: new Date().toISOString(),
      })
    }
    ElMessage.success('反馈已处理')
    return makeMockResponse(null)
  }
  if (url.includes('/admin/feedback/list')) {
    const currentSchool = localStorage.getItem('schoolName') || '示范大学'
    const adminFeedbacks = m.mockFeedbacks
      .filter((f: any) => f.schoolName === currentSchool)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return makeMockResponse(adminFeedbacks)
  }
  if (url.includes('/feedback/list')) {
    const currentSchool = localStorage.getItem('schoolName') || '示范大学'
    const sameSchoolFeedbacks = m.mockFeedbacks
      .filter((f: any) => f.schoolName === currentSchool)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return makeMockResponse(sameSchoolFeedbacks)
  }
  if (url.includes('/feedback/submit')) {
    const b = bodyData ? (typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData) : {}
    const schoolCode = localStorage.getItem('schoolCode') || 'DEMO-UNI'
    const school = m.getSchoolByCode(schoolCode)
    const newFeedback: any = {
      id: m.mockFeedbacks.length + 1,
      targetRole: b.targetRole || 'DEVELOPER',
      title: b.title || '',
      content: b.content || '',
      schoolName: school?.name || localStorage.getItem('schoolName') || '示范大学',
      submitterName: localStorage.getItem('username') || '匿名用户',
      submitterRole: localStorage.getItem('role') || 'STUDENT',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    if (b.targetRole === 'ADMIN') {
      newFeedback.problemType = b.problemType || 'OTHER'
      newFeedback.collegeName = b.collegeName || ''
      newFeedback.majorName = b.majorName || ''
      newFeedback.className = b.className || ''
    }
    m.mockFeedbacks.unshift(newFeedback)
    const targetName = b.targetRole === 'DEVELOPER' ? '系统开发者' : '管理员'
    ElMessage.success(`已向${targetName}提交，感谢您的反馈！`)
    return makeMockResponse(newFeedback)
  }

  return null
}

request.interceptors.response.use(
  async (response) => {
    const data = response.data
    const isHtml = typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('<html'))
    if (isHtml || isDemoMode()) {
      const url: string = response.config?.url || ''
      const method = response.config?.method || 'get'
      const bodyData = response.config?.data
      const sc = (response.config?.headers as any)?.['X-School-Code'] || localStorage.getItem('schoolCode') || undefined
      console.log('[Interceptor] Response - triggering mock for:', method, url)
      const mock = await handleMock(url, method, bodyData, sc)
      if (mock) return mock
    }
    return response
  },
  async (error) => {
    const url: string = error.config?.url || ''
    const method = error.config?.method || 'get'
    const bodyData = error.config?.data
    const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ERR_BAD_RESPONSE' || error.code === 'ERR_CONNECTION_RESET' || !error.response
    const isHtmlError = error.response && typeof error.response.data === 'string' && (error.response.data.includes('<!DOCTYPE html>') || error.response.data.includes('<html'))
    const sc = (error.config?.headers as any)?.['X-School-Code'] || localStorage.getItem('schoolCode') || undefined

    if (isNetworkError || isHtmlError || isDemoMode()) {
      const mock = await handleMock(url, method, bodyData, sc)
      if (mock) return mock
    }

    if (error.response?.status === 401) {
      const authKeys = ['token', 'refreshToken', 'userId', 'username', 'role']
      authKeys.forEach(key => localStorage.removeItem(key))
      router.push('/')
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足')
    }
    return Promise.reject(error)
  }
)

export default request
