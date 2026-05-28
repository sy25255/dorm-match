import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

type StudentStatus = 'NOT_STARTED' | 'DRAFT' | 'COMPLETED' | number | null | undefined
type MatchStatus = 'WAITING' | 'INVITING' | 'PAIRED' | 'ALLOCATED' | number | null | undefined

function surveyStatusToNumber(status: StudentStatus) {
  if (typeof status === 'number') return status
  if (status === 'COMPLETED') return 2
  if (status === 'DRAFT') return 1
  return 0
}

function matchStatusToNumber(status: MatchStatus) {
  if (typeof status === 'number') return status
  if (status === 'ALLOCATED') return 3
  if (status === 'PAIRED') return 2
  if (status === 'INVITING') return 1
  return 0
}

function normalizeStudent(s: any) {
  const isValid = s.is_valid ?? s.isValid ?? s.status !== 0
  const surveyStatus = surveyStatusToNumber(s.survey_status ?? s.surveyStatus)
  const matchStatus = matchStatusToNumber(s.match_status ?? s.matchStatus)
  return {
    ...s,
    id: s.id,
    name: s.name || s.real_name || '',
    gender: s.gender ?? 1,
    collegeName: s.college_name || s.collegeName || '',
    majorName: s.major_name || s.majorName || '',
    className: s.class_name || s.className || '',
    studentNo: s.student_no || s.studentNo || '',
    surveyStatus,
    matchStatus,
    status: isValid ? 1 : 0,
    isValid,
    email: s.email || '',
    phone: s.phone || '',
  }
}

function normalizeBuilding(row: any) {
  return {
    ...row,
    id: row.id,
    name: row.name || row.building_name || '',
    code: row.code || row.building_code || '',
    gender: row.gender ?? 1,
    floors: row.floors ?? 1,
    status: row.status ?? 1,
  }
}

function normalizeRoom(row: any) {
  const building = Array.isArray(row.dormitory_buildings) ? row.dormitory_buildings[0] : row.dormitory_buildings
  return {
    ...row,
    id: row.id,
    buildingId: row.building_id ?? row.buildingId,
    buildingName: building?.name || row.building_name || row.buildingName || '',
    buildingCode: building?.code || row.building_code || row.buildingCode || '',
    roomNumber: row.room_number || row.roomNumber || '',
    floor: row.floor ?? 1,
    capacity: row.capacity ?? 4,
    occupied: row.occupied ?? 0,
    roomType: row.room_type || row.roomType || 'NORMAL',
    status: row.status || 'AVAILABLE',
  }
}

function normalizeAllocation(row: any) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const room = Array.isArray(row.dormitory_rooms) ? row.dormitory_rooms[0] : row.dormitory_rooms
  const building = Array.isArray(room?.dormitory_buildings) ? room.dormitory_buildings[0] : room?.dormitory_buildings
  return {
    ...row,
    id: row.id,
    studentId: row.user_id || row.student_id || row.studentId || '',
    studentName: profile?.name || row.student_name || row.studentName || '',
    studentNo: profile?.student_no || row.student_no || row.studentNo || '',
    collegeName: profile?.college_name || row.college_name || row.collegeName || '',
    majorName: profile?.major_name || row.major_name || row.majorName || '',
    roomId: row.room_id || row.roomId,
    roomNumber: row.room_number || room?.room_number || row.roomNumber || '',
    buildingName: building?.name || room?.building_name || row.building_name || row.buildingName || '',
    bedNo: row.bed_no || row.bedNo || 0,
    allocationType: row.allocation_type || row.allocationType || 'ALGORITHM',
    batchCode: row.batch_code || row.batchCode || '',
    status: row.status || 'PENDING',
    confirmedByStudent: row.confirmed_by_student || row.confirmedByStudent || 0,
  }
}

function normalizeObjection(row: any) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    ...row,
    allocationId: row.allocation_id ?? row.allocationId,
    studentId: row.user_id ?? row.student_id ?? row.studentId,
    studentName: profile?.name || row.student_name || row.studentName || '',
    studentNo: profile?.student_no || row.student_no || row.studentNo || '',
    currentHandler: row.handler_id ?? row.currentHandler ?? null,
    reviewComment: row.review_comment || row.reviewComment || '',
    createdAt: row.created_at || row.createdAt || '',
    resolvedAt: row.resolved_at || row.resolvedAt || '',
  }
}

function buildingPayload(data: any) {
  return {
    name: data.name || data.buildingName || '',
    code: data.code || data.buildingCode || '',
    gender: data.gender ?? 1,
    floors: data.floors ?? 1,
    status: data.status ?? 1,
  }
}

function roomPayload(data: any) {
  return {
    building_id: data.buildingId ?? data.building_id,
    room_number: data.roomNumber || data.room_number || '',
    floor: data.floor ?? 1,
    capacity: data.capacity ?? 4,
    occupied: data.occupied ?? 0,
    room_type: data.roomType || data.room_type || 'NORMAL',
    status: data.status || 'AVAILABLE',
  }
}

async function hydrateAllocations(rows: any[]) {
  const userIds = [...new Set(rows.map(r => r.user_id || r.student_id).filter(Boolean))]
  const roomIds = [...new Set(rows.map(r => r.room_id).filter(Boolean))]

  const [{ data: profiles }, { data: rooms }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, name, student_no, gender, college_name, major_name, class_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    roomIds.length
      ? supabase.from('dormitory_rooms').select('*').in('id', roomIds)
      : Promise.resolve({ data: [] }),
  ])

  const roomRows = rooms || []
  const buildingIds = [...new Set(roomRows.map((r: any) => r.building_id).filter(Boolean))]
  const { data: buildings } = buildingIds.length
    ? await supabase.from('dormitory_buildings').select('id, name, code').in('id', buildingIds)
    : { data: [] }

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const buildingMap = new Map((buildings || []).map((b: any) => [b.id, b]))
  const roomMap = new Map(roomRows.map((r: any) => [r.id, { ...r, dormitory_buildings: buildingMap.get(r.building_id) }]))

  return rows.map(row => normalizeAllocation({
    ...row,
    profiles: profileMap.get(row.user_id || row.student_id),
    dormitory_rooms: roomMap.get(row.room_id),
  }))
}

function answerDiff(a: unknown, b: unknown) {
  const av = String(a ?? '')
  const bv = String(b ?? '')
  const an = Number(av)
  const bn = Number(bv)

  if (Number.isFinite(an) && Number.isFinite(bn)) {
    return Math.min(Math.abs(an - bn), 4)
  }

  if (av.includes(',') || bv.includes(',')) {
    const as = new Set(av.split(',').map(v => v.trim()).filter(Boolean))
    const bs = new Set(bv.split(',').map(v => v.trim()).filter(Boolean))
    const union = new Set([...as, ...bs])
    if (union.size === 0) return 0
    const intersection = [...as].filter(v => bs.has(v)).length
    return (1 - intersection / union.size) * 4
  }

  return av === bv ? 0 : 4
}

export const adminApi = {
  // ========== 学生管理 ==========
  async getStudents(params?: { page?: number; size?: number; keyword?: string; collegeId?: number; surveyStatus?: string }) {
    const sc = getCurrentSchool()
    let q = supabase.from('profiles').select('*', { count: 'exact' }).eq('school_code', sc).eq('role', 'STUDENT')

    if (params?.keyword) {
      q = q.or(`name.ilike.%${params.keyword}%,student_no.ilike.%${params.keyword}%`)
    }
    if (params?.surveyStatus) {
      q = q.eq('survey_status', params.surveyStatus)
    }

    const page = params?.page || 1
    const size = params?.size || 20
    const { data, count } = await q.range((page - 1) * size, page * size - 1).order('created_at', { ascending: false })

    return wrap({
      items: (data || []).map(normalizeStudent),
      total: count || 0,
      page,
      size,
    })
  },

  async importStudents(list: any[]) {
    const sc = getCurrentSchool()
    for (const s of list) {
      await supabase.from('profiles').upsert({
        id: s.id || crypto.randomUUID(),
        school_code: sc,
        student_no: s.studentNo,
        name: s.name,
        role: 'STUDENT',
        gender: s.gender || 1,
      })
    }
    return wrap(null)
  },

  async disableStudent(id: string) {
    await supabase.from('profiles').update({ is_valid: false }).eq('id', id)
    return wrap(null)
  },

  async enableStudent(id: string) {
    await supabase.from('profiles').update({ is_valid: true }).eq('id', id)
    return wrap(null)
  },

  async toggleStudent(id: string, newStatus: number) {
    await supabase.from('profiles').update({ is_valid: newStatus === 1 }).eq('id', id)
    return wrap(null)
  },

  async createStudent(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('profiles').insert({
      school_code: sc,
      student_no: data.studentNo || '',
      name: data.name,
      role: 'STUDENT',
      gender: data.gender ?? 1,
      college_name: data.collegeName || '',
      major_name: data.majorName || '',
      class_name: data.className || '',
      hometown: data.hometown || '',
    })
    return wrap(null)
  },

  async updateStudent(id: string | number, data: any) {
    const payload: any = {
      student_no: data.studentNo,
      name: data.name,
      gender: data.gender,
      college_name: data.collegeName || '',
      major_name: data.majorName || '',
      class_name: data.className || '',
      hometown: data.hometown || '',
    }
    if (data.status !== undefined) payload.is_valid = data.status === 1
    await supabase.from('profiles').update(payload).eq('id', String(id))
    return wrap(null)
  },

  async getInviteCodes() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('invite_codes').select('*').eq('school_code', sc).order('created_at', { ascending: false })
    return wrap((data || []).map((row: any) => ({
      ...row,
      isUsed: row.is_used ?? row.isUsed ?? false,
      createdAt: row.created_at || row.createdAt || '',
    })))
  },

  async generateInviteCode() {
    const sc = getCurrentSchool()
    const code = 'INV' + Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase()
    const { data } = await supabase.from('invite_codes').insert({
      school_code: sc,
      code,
      is_used: false,
    }).select('code, is_used, created_at').single()
    return wrap(data || { code, is_used: false })
  },

  // ========== 宿舍管理 ==========
  async getBuildings() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('dormitory_buildings').select('*').eq('school_code', sc).order('created_at')
    return wrap((data || []).map(normalizeBuilding))
  },

  async createBuilding(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('dormitory_buildings').insert({ ...buildingPayload(data), school_code: sc })
    return wrap(null)
  },

  async updateBuilding(id: number, data: any) {
    await supabase.from('dormitory_buildings').update(buildingPayload(data)).eq('id', id)
    return wrap(null)
  },

  async deleteBuilding(id: number) {
    await supabase.from('dormitory_buildings').delete().eq('id', id)
    return wrap(null)
  },

  async getRooms(buildingId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('dormitory_rooms').select('*').eq('school_code', sc)
    if (buildingId) q = q.eq('building_id', buildingId)
    const { data } = await q.order('floor').order('room_number')
    return wrap((data || []).map(normalizeRoom))
  },

  async createRoom(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('dormitory_rooms').insert({ ...roomPayload(data), school_code: sc })
    return wrap(null)
  },

  async updateRoom(id: number, data: any) {
    await supabase.from('dormitory_rooms').update(roomPayload(data)).eq('id', id)
    return wrap(null)
  },

  async deleteRoom(id: number) {
    await supabase.from('dormitory_rooms').delete().eq('id', id)
    return wrap(null)
  },

  // ========== 分配管理 ==========
  async executeAllocation(data: { type: string; gender?: number } | string) {
    // 兼容 AllocationManage.vue 直接传 batchCode 字符串的情况
    if (typeof data === 'string') {
      data = { type: 'ALGORITHM' }
    }
    const sc = getCurrentSchool()

    let q = supabase.from('profiles').select('*').eq('school_code', sc).eq('survey_status', 'COMPLETED')
    if (data.gender !== undefined) q = q.eq('gender', data.gender)

    const { data: students } = await q
    if (!students || students.length === 0) return wrap({ allocated: 0 })

    const { data: rooms } = await supabase.from('dormitory_rooms').select('*').eq('school_code', sc).eq('status', 'AVAILABLE')
    if (!rooms || rooms.length === 0) return wrap({ allocated: 0 })

    const studentIds = (students as any[]).map((s: any) => s.id)
    await supabase.from('allocations').delete().in('user_id', studentIds)

    const roomCapacity = (rooms as any[])[0]?.capacity || 4

    // Step 1: 拉取所有学生的问卷答案
    const { data: allAnswers } = await supabase
      .from('survey_answers')
      .select('user_id, question_id, answer_value')
      .in('user_id', studentIds)

    const answerMap = new Map<string, Map<number, any>>()
    for (const a of (allAnswers as any[]) || []) {
      if (!answerMap.has(a.user_id)) answerMap.set(a.user_id, new Map())
      answerMap.get(a.user_id)!.set(a.question_id, a.answer_value)
    }

    // Step 2: 计算两个学生偏好相似度（0~1，越高越相似）
    function calcSimilarity(a: Map<number, any>, b: Map<number, any>): number {
      let totalDiff = 0, count = 0
      for (const [qid, val] of a) {
        const ov = b.get(qid)
        if (ov !== undefined) { totalDiff += answerDiff(val, ov); count++ }
      }
      return count > 0 ? 1 - totalDiff / (count * 4) : 0
    }

    // Step 3: 贪心分组 — 每次选一个学生当"锚点"，拉最相似的 roomCapacity-1 人组队
    const unassigned = [...(students as any[])]
    const groups: any[][] = []

    while (unassigned.length > 0) {
      const anchor = unassigned.shift()!
      const anchorAnswers = answerMap.get(anchor.id)
      const group = [anchor]

      if (anchorAnswers && unassigned.length > 0) {
        const scored = unassigned.map(s => ({
          student: s,
          score: answerMap.has(s.id) ? calcSimilarity(anchorAnswers, answerMap.get(s.id)!) : 0,
        }))
        scored.sort((a, b) => b.score - a.score)
        const need = roomCapacity - 1
        for (let i = 0; i < Math.min(need, scored.length); i++) {
          group.push(scored[i].student)
          const idx = unassigned.indexOf(scored[i].student)
          if (idx >= 0) unassigned.splice(idx, 1)
        }
      }

      groups.push(group)
    }

    // Step 4: 按组分配到宿舍房间
    const batchCode = 'BATCH-' + Date.now()
    let allocated = 0
    let roomIdx = 0

    for (const group of groups) {
      if (roomIdx >= rooms.length) break
      const room = (rooms as any[])[roomIdx]
      let bedNo = (room.occupied || 0)

      for (const student of group) {
        bedNo++
        await supabase.from('allocations').insert({
          school_code: sc,
          user_id: student.id,
          room_id: room.id,
          room_number: room.room_number,
          bed_no: bedNo,
          allocation_type: data.type || 'ALGORITHM',
          batch_code: batchCode,
        })
        await supabase.from('profiles').update({ match_status: 'ALLOCATED' }).eq('id', student.id)
        allocated++
      }

      // 更新房间状态
      if (bedNo >= room.capacity) {
        await supabase.from('dormitory_rooms').update({ occupied: bedNo, status: 'FULL' }).eq('id', room.id)
        roomIdx++
      } else {
        await supabase.from('dormitory_rooms').update({ occupied: bedNo, status: 'PARTIAL' }).eq('id', room.id)
      }
    }

    return wrap({ allocated, batchCode })
  },

  async getResults(params?: { allocationType?: string }) {
    const sc = getCurrentSchool()
    let q = supabase.from('allocations').select('*').eq('school_code', sc)
    if (params?.allocationType) q = q.eq('allocation_type', params.allocationType)
    const { data } = await q.order('room_number').order('bed_no')
    return wrap(await hydrateAllocations(data || []))
  },

  // AllocationManage.vue 兼容别名
  async getAllocationResults(batchCode: string) {
    const sc = getCurrentSchool()
    let q = supabase.from('allocations').select('*').eq('school_code', sc)
    if (batchCode) q = q.eq('batch_code', batchCode)
    const { data } = await q.order('room_number').order('bed_no')
    return wrap(await hydrateAllocations(data || []))
  },

  async publishResults(batchCode: string) {
    await supabase.from('allocations').update({ status: 'PUBLISHED' }).eq('batch_code', batchCode)
    return wrap(null)
  },

  async finalizeResults(batchCode: string) {
    await supabase.from('allocations').update({ status: 'FINALIZED' }).eq('batch_code', batchCode)
    return wrap(null)
  },

  async manualAllocate(studentId: string, roomId: number, bedNo: number) {
    const sc = getCurrentSchool()
    const { data: room } = await supabase.from('dormitory_rooms').select('*').eq('id', roomId).single()

    await supabase.from('allocations').delete().eq('user_id', studentId)
    await supabase.from('allocations').insert({
      school_code: sc,
      user_id: studentId,
      room_id: roomId,
      room_number: room?.room_number || '',
      bed_no: bedNo,
      allocation_type: 'MANUAL',
    })
    await supabase.from('dormitory_rooms').update({ occupied: (room?.occupied || 0) + 1 }).eq('id', roomId)
    await supabase.from('profiles').update({ match_status: 'ALLOCATED' }).eq('id', studentId)
    return wrap(null)
  },

  async clearAllocations(batchCode?: string) {
    const sc = getCurrentSchool()
    let q = supabase.from('allocations').delete().eq('school_code', sc)
    if (batchCode) q = q.eq('batch_code', batchCode)
    await q
    await supabase.from('dormitory_rooms').update({ occupied: 0, status: 'AVAILABLE' }).eq('school_code', sc)
    await supabase.from('profiles').update({ match_status: 'WAITING' }).eq('school_code', sc).eq('role', 'STUDENT')
    return wrap(null)
  },

  async publishAllocations(batchCode: string) {
    await supabase.from('allocations').update({ status: 'PUBLISHED' }).eq('batch_code', batchCode)
    return wrap(null)
  },

  async finalizeAllocations(batchCode: string) {
    await supabase.from('allocations').update({ status: 'FINALIZED' }).eq('batch_code', batchCode)
    return wrap(null)
  },

  // ========== 异议处理 ==========
  async getObjections(params?: { status?: string }) {
    const sc = getCurrentSchool()
    let q = supabase.from('allocation_objections').select('*, profiles(name, student_no)').eq('school_code', sc)
    if (params?.status) q = q.eq('status', params.status)
    const { data } = await q.order('created_at', { ascending: false })
    return wrap((data || []).map(normalizeObjection))
  },

  async handleObjection(objectionId: number, data: { status: string; reviewComment: string }) {
    const uid = (await supabase.auth.getUser()).data.user?.id
    await supabase.from('allocation_objections').update({
      status: data.status,
      handler_id: uid,
      review_comment: data.reviewComment,
      resolved_at: new Date().toISOString(),
    }).eq('id', objectionId)
    return wrap(null)
  },

  // ========== 问卷管理 ==========
  async getSurveyQuestions() {
    const { data } = await supabase.from('survey_questions').select('*').order('id')
    return wrap(data || [])
  },

  async updateQuestion(id: number, data: any) {
    await supabase.from('survey_questions').update(data).eq('id', id)
    return wrap(null)
  },

  async createQuestion(data: any) {
    await supabase.from('survey_questions').insert({
      question_code: data.questionCode || '',
      dimension: data.dimension || '',
      question_text: data.questionText || '',
      question_type: data.questionType || 'SINGLE_CHOICE',
      options_json: data.optionsJson || null,
      sort_order: data.sortOrder ?? 0,
      is_required: data.isRequired ?? 1,
      is_attention_check: data.isAttentionCheck ?? 0,
      status: data.status ?? 1,
    })
    return wrap(null)
  },

  async toggleQuestionStatus(id: number, newStatus?: number) {
    if (newStatus !== undefined) {
      await supabase.from('survey_questions').update({ status: newStatus }).eq('id', id)
    } else {
      const { data } = await supabase.from('survey_questions').select('status').eq('id', id).single()
      const status = data?.status === 1 ? 0 : 1
      await supabase.from('survey_questions').update({ status }).eq('id', id)
    }
    return wrap(null)
  },

  async deleteQuestion(id: number) {
    await supabase.from('survey_questions').delete().eq('id', id)
    return wrap(null)
  },

  // ========== 清理测试账号 ==========
  async cleanupGuests() {
    const { data, error } = await supabase.rpc('cleanup_guest_users')
    if (error) throw error
    return wrap(data?.[0] || { deleted_users: 0, deleted_profiles: 0, deleted_answers: 0, deleted_allocations: 0 })
  },

  // ========== 统计 ==========
  async getStatistics() {
    const sc = getCurrentSchool()

    const { data: students } = await supabase
      .from('profiles')
      .select('id, gender, college_name, survey_status, match_status, created_at')
      .eq('school_code', sc)
      .eq('role', 'STUDENT')
    const studentRows = students || []
    const totalStudents = studentRows.length
    const completedSurvey = studentRows.filter((s: any) => surveyStatusToNumber(s.survey_status) === 2).length
    const draftingSurvey = studentRows.filter((s: any) => surveyStatusToNumber(s.survey_status) === 1).length
    const notStartedSurvey = Math.max(0, totalStudents - completedSurvey - draftingSurvey)
    const paired = studentRows.filter((s: any) => matchStatusToNumber(s.match_status) >= 2).length
    const maleStudents = studentRows.filter((s: any) => Number(s.gender) === 1).length

    const { count: allocatedCount } = await supabase
      .from('allocations').select('*', { count: 'exact', head: true }).eq('school_code', sc)
    const { count: objectionsCount } = await supabase
      .from('allocation_objections').select('*', { count: 'exact', head: true }).eq('school_code', sc)
    const { count: pendingObjections } = await supabase
      .from('allocation_objections').select('*', { count: 'exact', head: true }).eq('school_code', sc).eq('status', 'PENDING')
    const { count: totalRoomsCount } = await supabase
      .from('dormitory_rooms').select('*', { count: 'exact', head: true }).eq('school_code', sc)

    const collegeCounts = new Map<string, number>()
    const dailyCounts = new Map<string, number>()
    for (const s of studentRows) {
      const college = s.college_name || '未设置学院'
      collegeCounts.set(college, (collegeCounts.get(college) || 0) + 1)
      const day = s.created_at ? String(s.created_at).slice(0, 10) : '未知日期'
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1)
    }

    return wrap({
      totalStudents,
      completedSurvey,
      paired,
      pendingObjections: pendingObjections || 0,
      maleStudents,
      femaleStudents: totalStudents - maleStudents,
      allocated: allocatedCount || 0,
      objections: objectionsCount || 0,
      totalRooms: totalRoomsCount || 0,
      surveyStatus: {
        completed: completedSurvey,
        drafting: draftingSurvey,
        notStarted: notStartedSurvey,
      },
      collegeDistribution: [...collegeCounts.entries()].map(([name, count]) => ({ name, count })),
      dailyRegistrations: [...dailyCounts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, count]) => ({ date, count })),
      dimensionAverages: {},
    })
  },

  // ========== 审计日志 ==========
  async getAuditLogs(params?: { action?: string; page?: number; size?: number }) {
    const sc = getCurrentSchool()
    let q = supabase.from('audit_logs').select('*', { count: 'exact' }).eq('school_code', sc)

    if (params?.action) q = q.eq('action', params.action)

    const page = params?.page || 1
    const size = params?.size || 20
    const { data, count } = await q.order('created_at', { ascending: false }).range((page - 1) * size, page * size - 1)

    return wrap({
      items: data || [],
      total: count || 0,
      page,
      size,
    })
  },

  async writeAuditLog(entry: { action: string; targetType?: string; targetId?: string; detail?: string }) {
    const sc = getCurrentSchool()
    const { data: user } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert({
      school_code: sc,
      user_id: user.user?.id,
      username: user.user?.email,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      detail: entry.detail,
    })
    return wrap(null)
  },
}
