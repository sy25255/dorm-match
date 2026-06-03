import { supabase, getCurrentSchool } from '@/lib/supabase'
import { getDefaultRoomCapacity } from '@/api/dormitory'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

function assertOk(result: { error?: any }, message = '操作失败') {
  if (result.error) {
    const text = result.error.message || result.error.details || result.error.hint || message
    throw new Error(text)
  }
}

type StudentStatus = 'NOT_STARTED' | 'DRAFT' | 'COMPLETED' | 'NEEDS_RETAKE' | number | null | undefined
type MatchStatus = 'WAITING' | 'INVITING' | 'PAIRED' | 'ALLOCATED' | number | null | undefined

function surveyStatusToNumber(status: StudentStatus) {
  if (typeof status === 'number') return status
  if (status === 'COMPLETED') return 2
  if (status === 'DRAFT') return 1
  if (status === 'NEEDS_RETAKE') return 3
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
    surveyInvalidReason: s.survey_invalid_reason || s.surveyInvalidReason || '',
    matchStatus,
    status: isValid ? 1 : 0,
    isValid,
    email: s.email || '',
    phone: s.phone || '',
  }
}

function normalizeRoster(row: any) {
  return {
    ...row,
    id: row.id,
    schoolCode: row.school_code || row.schoolCode || '',
    studentNo: row.student_no || row.studentNo || '',
    name: row.name || '',
    gender: row.gender ?? 1,
    collegeName: row.college_name || row.collegeName || '',
    majorName: row.major_name || row.majorName || '',
    className: row.class_name || row.className || '',
    activationStatus: row.activation_status || row.activationStatus || 'PENDING',
    authUserId: row.auth_user_id || row.authUserId || '',
    activatedAt: row.activated_at || row.activatedAt || '',
    createdAt: row.created_at || row.createdAt || '',
    updatedAt: row.updated_at || row.updatedAt || '',
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

function normalizeSurveyQuestion(row: any) {
  return {
    ...row,
    questionCode: row.question_code || row.questionCode || '',
    questionText: row.question_text || row.questionText || '',
    questionType: row.question_type || row.questionType || 'SINGLE_CHOICE',
    optionsJson: row.options_json ?? row.optionsJson ?? null,
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
    isRequired: row.is_required ?? row.isRequired ?? 1,
    isAttentionCheck: row.is_attention_check ?? row.isAttentionCheck ?? 0,
    hasSupplement: row.has_supplement ?? row.hasSupplement ?? false,
    supplementPlaceholder: row.supplement_placeholder || row.supplementPlaceholder || '',
    scenarioCategory: row.scenario_category || row.scenarioCategory || '',
    trapAnswer: row.trap_answer || row.trapAnswer || '',
    trapSection: row.trap_section || row.trapSection || '',
    leaderWeight: row.leader_weight ?? row.leaderWeight ?? 0,
    dropdownPlaceholder: row.dropdown_placeholder || row.dropdownPlaceholder || '',
  }
}

function surveyQuestionPayload(data: any) {
  return {
    question_code: data.questionCode || data.question_code || '',
    dimension: data.dimension || '',
    question_text: data.questionText || data.question_text || '',
    question_type: data.questionType || data.question_type || 'SINGLE_CHOICE',
    options_json: data.optionsJson ?? data.options_json ?? null,
    sort_order: data.sortOrder ?? data.sort_order ?? 0,
    is_required: data.isRequired ?? data.is_required ?? 1,
    is_attention_check: data.isAttentionCheck ?? data.is_attention_check ?? 0,
    has_supplement: data.hasSupplement ?? data.has_supplement ?? false,
    supplement_placeholder: data.supplementPlaceholder ?? data.supplement_placeholder ?? null,
    scenario_category: data.scenarioCategory ?? data.scenario_category ?? null,
    placeholder: data.placeholder ?? null,
    trap_answer: data.trapAnswer ?? data.trap_answer ?? null,
    trap_section: data.trapSection ?? data.trap_section ?? null,
    leader_weight: data.leaderWeight ?? data.leader_weight ?? 0,
    dropdown_placeholder: data.dropdownPlaceholder ?? data.dropdown_placeholder ?? null,
    status: data.status ?? 1,
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

function roomStatusFromOccupancy(occupied: number, capacity: number, currentStatus?: string) {
  if (currentStatus === 'MAINTENANCE') return 'MAINTENANCE'
  if (occupied <= 0) return 'AVAILABLE'
  if (occupied >= capacity) return 'FULL'
  return 'PARTIAL'
}

async function recomputeRoomOccupancy(schoolCode: string, roomIds?: number[]) {
  let roomQuery = supabase
    .from('dormitory_rooms')
    .select('id, capacity, status')
    .eq('school_code', schoolCode)
  if (roomIds?.length) roomQuery = roomQuery.in('id', [...new Set(roomIds)])

  const { data: rooms, error: roomError } = await roomQuery
  assertOk({ error: roomError }, '加载房间失败')
  const targetRooms = rooms || []
  if (targetRooms.length === 0) return

  const ids = targetRooms.map((room: any) => room.id)
  const { data: allocations, error: allocError } = await supabase
    .from('allocations')
    .select('room_id')
    .eq('school_code', schoolCode)
    .in('room_id', ids)
  assertOk({ error: allocError }, '加载分配记录失败')

  const counts = new Map<number, number>()
  for (const row of allocations || []) {
    counts.set(row.room_id, (counts.get(row.room_id) || 0) + 1)
  }

  for (const room of targetRooms as any[]) {
    const occupied = counts.get(room.id) || 0
    const capacity = Number(room.capacity) || 0
    const status = roomStatusFromOccupancy(occupied, capacity, room.status)
    const result = await supabase
      .from('dormitory_rooms')
      .update({ occupied, status })
      .eq('id', room.id)
      .eq('school_code', schoolCode)
    assertOk(result, '更新房间占用失败')
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

  async getStudentRosters(params?: { keyword?: string; status?: string }) {
    const sc = getCurrentSchool()
    let q = supabase
      .from('student_rosters')
      .select('*')
      .eq('school_code', sc)
      .order('created_at', { ascending: false })

    if (params?.keyword) {
      q = q.or(`name.ilike.%${params.keyword}%,student_no.ilike.%${params.keyword}%`)
    }
    if (params?.status) {
      q = q.eq('activation_status', params.status)
    }

    const { data, error } = await q
    assertOk({ error }, '加载学生名册失败')
    return wrap((data || []).map(normalizeRoster))
  },

  async importStudentRosters(rows: any[]) {
    const { data, error } = await supabase.rpc('admin_import_student_rosters', { p_rows: rows })
    assertOk({ error }, '导入学生名册失败')
    return wrap(data || { imported: 0 })
  },

  async resetStudentInitialCode(rosterId: number, initialCode: string) {
    const { data, error } = await supabase.rpc('admin_reset_student_initial_code', {
      p_roster_id: rosterId,
      p_initial_code: initialCode,
    })
    assertOk({ error }, '重置初始码失败')
    return wrap(data || null)
  },

  async setStudentRosterStatus(rosterId: number, status: 'PENDING' | 'ACTIVE' | 'DISABLED') {
    const { data, error } = await supabase.rpc('admin_set_student_roster_status', {
      p_roster_id: rosterId,
      p_status: status,
    })
    assertOk({ error }, '更新名册状态失败')
    return wrap(data || null)
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

    let q = supabase
      .from('profiles')
      .select('*')
      .eq('school_code', sc)
      .eq('role', 'STUDENT')
      .eq('survey_status', 'COMPLETED')
      .or('is_valid.is.null,is_valid.eq.true')
    if (data.gender !== undefined) q = q.eq('gender', data.gender)

    const { data: students, error: studentError } = await q
    assertOk({ error: studentError }, '加载待分配学生失败')
    if (!students || students.length === 0) return wrap({ allocated: 0 })

    const studentIds = (students as any[]).map((s: any) => s.id)
    const deleteResult = await supabase
      .from('allocations')
      .delete()
      .eq('school_code', sc)
      .in('user_id', studentIds)
    assertOk(deleteResult, '清理旧分配失败')
    await recomputeRoomOccupancy(sc)

    const { data: roomRows, error: roomError } = await supabase
      .from('dormitory_rooms')
      .select('*')
      .eq('school_code', sc)
      .neq('status', 'MAINTENANCE')
      .order('room_number')
    assertOk({ error: roomError }, '加载可用房间失败')

    const rooms = (roomRows || []).filter((room: any) => (room.occupied || 0) < (room.capacity || 0))
    if (rooms.length === 0) return wrap({ allocated: 0 })

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
      let studentIdx = 0

      while (studentIdx < group.length && roomIdx < rooms.length) {
        const room = (rooms as any[])[roomIdx]
        let bedNo = room.occupied || 0

        while (studentIdx < group.length && bedNo < room.capacity) {
          const student = group[studentIdx]
          bedNo++
          const insertResult = await supabase.from('allocations').insert({
            school_code: sc,
            user_id: student.id,
            room_id: room.id,
            room_number: room.room_number,
            bed_no: bedNo,
            allocation_type: data.type || 'ALGORITHM',
            batch_code: batchCode,
          })
          assertOk(insertResult, '写入分配结果失败')
          const profileResult = await supabase.from('profiles').update({ match_status: 'ALLOCATED' }).eq('id', student.id)
          assertOk(profileResult, '更新学生分配状态失败')
          allocated++
          studentIdx++
        }

        room.occupied = bedNo
        const roomResult = await supabase.from('dormitory_rooms').update({
          occupied: bedNo,
          status: roomStatusFromOccupancy(bedNo, room.capacity, room.status),
        }).eq('id', room.id)
        assertOk(roomResult, '更新房间状态失败')

        if (bedNo >= room.capacity) roomIdx++
        else if (studentIdx < group.length) roomIdx++
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
    const sc = getCurrentSchool()
    const result = await supabase
      .from('allocations')
      .update({ status: 'PUBLISHED' })
      .eq('school_code', sc)
      .eq('batch_code', batchCode)
      .select('id')
    assertOk(result, '发布分配结果失败')
    if (!result.data?.length) {
      throw new Error('未找到当前批次的分配记录，发布未生效')
    }
    return wrap(null)
  },

  async finalizeResults(batchCode: string) {
    const sc = getCurrentSchool()
    const result = await supabase
      .from('allocations')
      .update({ status: 'FINALIZED' })
      .eq('school_code', sc)
      .eq('batch_code', batchCode)
      .select('id')
    assertOk(result, '确认分配结果失败')
    if (!result.data?.length) {
      throw new Error('未找到当前批次的分配记录，确认未生效')
    }
    return wrap(null)
  },

  async manualAllocate(studentId: string, roomId: number, bedNo: number, batchCode?: string) {
    const sc = getCurrentSchool()
    const { data: room, error: roomError } = await supabase
      .from('dormitory_rooms')
      .select('*')
      .eq('school_code', sc)
      .eq('id', roomId)
      .single()
    assertOk({ error: roomError }, '加载目标房间失败')
    if (!room) throw new Error('目标房间不存在')
    if (room.status === 'MAINTENANCE') throw new Error('维修中的房间不能分配')

    const { data: currentAllocation, error: currentError } = await supabase
      .from('allocations')
      .select('*')
      .eq('school_code', sc)
      .eq('user_id', studentId)
      .maybeSingle()
    assertOk({ error: currentError }, '加载学生当前分配失败')

    const { data: roomAllocations, error: allocationError } = await supabase
      .from('allocations')
      .select('user_id, bed_no')
      .eq('school_code', sc)
      .eq('room_id', roomId)
    assertOk({ error: allocationError }, '加载房间床位失败')

    const otherOccupants = (roomAllocations || []).filter((row: any) => row.user_id !== studentId)
    if (otherOccupants.some((row: any) => Number(row.bed_no) === Number(bedNo))) {
      throw new Error('目标床位已被占用')
    }
    if (otherOccupants.length >= Number(room.capacity || 0)) {
      throw new Error('目标房间已满')
    }

    const oldRoomId = currentAllocation?.room_id
    if (currentAllocation) {
      const deleteResult = await supabase
        .from('allocations')
        .delete()
        .eq('school_code', sc)
        .eq('user_id', studentId)
      assertOk(deleteResult, '移除旧分配失败')
    }

    const insertResult = await supabase.from('allocations').insert({
      school_code: sc,
      user_id: studentId,
      room_id: roomId,
      room_number: room?.room_number || '',
      bed_no: bedNo,
      allocation_type: 'MANUAL',
      batch_code: batchCode || currentAllocation?.batch_code || `BATCH-MANUAL-${Date.now()}`,
    })
    assertOk(insertResult, '写入手动分配失败')
    const profileResult = await supabase.from('profiles').update({ match_status: 'ALLOCATED' }).eq('id', studentId)
    assertOk(profileResult, '更新学生分配状态失败')

    await recomputeRoomOccupancy(sc, [oldRoomId, roomId].filter(Boolean) as number[])
    return wrap(null)
  },

  async clearAllocations(batchCode?: string) {
    const sc = getCurrentSchool()
    let existingQuery = supabase.from('allocations').select('user_id, room_id').eq('school_code', sc)
    if (batchCode) existingQuery = existingQuery.eq('batch_code', batchCode)
    const { data: existingRows, error: existingError } = await existingQuery
    assertOk({ error: existingError }, '加载待清理分配失败')

    let q = supabase.from('allocations').delete().eq('school_code', sc)
    if (batchCode) q = q.eq('batch_code', batchCode)
    const deleteResult = await q
    assertOk(deleteResult, '清理分配失败')

    const roomIds = [...new Set((existingRows || []).map((row: any) => row.room_id).filter(Boolean))] as number[]
    await recomputeRoomOccupancy(sc, batchCode ? roomIds : undefined)

    const userIds = [...new Set((existingRows || []).map((row: any) => row.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: stillAllocated, error: stillError } = await supabase
        .from('allocations')
        .select('user_id')
        .eq('school_code', sc)
        .in('user_id', userIds)
      assertOk({ error: stillError }, '检查剩余分配失败')
      const stillAllocatedIds = new Set((stillAllocated || []).map((row: any) => row.user_id))
      const waitingIds = userIds.filter(id => !stillAllocatedIds.has(id))
      if (waitingIds.length > 0) {
        const updateResult = await supabase
          .from('profiles')
          .update({ match_status: 'WAITING' })
          .eq('school_code', sc)
          .eq('role', 'STUDENT')
          .in('id', waitingIds)
        assertOk(updateResult, '更新学生状态失败')
      }
    }
    return wrap(null)
  },

  async publishAllocations(batchCode: string) {
    return this.publishResults(batchCode)
  },

  async finalizeAllocations(batchCode: string) {
    return this.finalizeResults(batchCode)
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
    const { data, error } = await supabase
      .from('survey_questions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true })
    assertOk({ error }, '加载问卷题目失败')
    return wrap((data || []).map(normalizeSurveyQuestion))
  },

  async updateQuestion(id: number, data: any) {
    const result = await supabase
      .from('survey_questions')
      .update(surveyQuestionPayload(data))
      .eq('id', id)
    assertOk(result, '保存题目失败')
    return wrap(null)
  },

  async createQuestion(data: any) {
    const result = await supabase.from('survey_questions').insert(surveyQuestionPayload(data))
    assertOk(result, '新增题目失败')
    return wrap(null)
  },

  async toggleQuestionStatus(id: number, newStatus?: number) {
    if (newStatus !== undefined) {
      const result = await supabase.from('survey_questions').update({ status: newStatus }).eq('id', id)
      assertOk(result, '更新题目状态失败')
    } else {
      const { data, error } = await supabase.from('survey_questions').select('status').eq('id', id).single()
      assertOk({ error }, '读取题目状态失败')
      const status = data?.status === 1 ? 0 : 1
      const result = await supabase.from('survey_questions').update({ status }).eq('id', id)
      assertOk(result, '更新题目状态失败')
    }
    return wrap(null)
  },

  async getPairGroups() {
    const sc = getCurrentSchool()
    const defaultCapacity = await getDefaultRoomCapacity()
    const { data: groups, error: groupError } = await supabase
      .from('pair_groups')
      .select('*')
      .eq('school_code', sc)
      .order('created_at', { ascending: false })
    assertOk({ error: groupError }, '加载配对组失败')

    const groupRows = groups || []
    if (groupRows.length === 0) return wrap([])

    const groupIds = groupRows.map((g: any) => g.id)
    const { data: members, error: memberError } = await supabase
      .from('pair_members')
      .select('group_id, user_id, is_initiator')
      .in('group_id', groupIds)
    assertOk({ error: memberError }, '加载配对成员失败')

    const userIds = [...new Set((members || []).map((m: any) => m.user_id).filter(Boolean))]
    const { data: profiles, error: profileError } = userIds.length
      ? await supabase
        .from('profiles')
        .select('id, name, student_no, college_name, major_name, class_name, match_status')
        .in('id', userIds)
      : { data: [], error: null }
    assertOk({ error: profileError }, '加载学生信息失败')

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const membersByGroup = new Map<number, any[]>()
    for (const member of members || []) {
      if (!membersByGroup.has(member.group_id)) membersByGroup.set(member.group_id, [])
      const profile = (profileMap.get(member.user_id) || {}) as any
      membersByGroup.get(member.group_id)!.push({
        studentId: member.user_id,
        isInitiator: member.is_initiator || 0,
        name: profile.name || '',
        studentNo: profile.student_no || '',
        collegeName: profile.college_name || '',
        majorName: profile.major_name || '',
        className: profile.class_name || '',
        matchStatus: profile.match_status || '',
      })
    }

    return wrap(groupRows.map((group: any) => {
      const groupMembers = membersByGroup.get(group.id) || []
      return {
        ...group,
        pairingCode: group.pairing_code || `PAIR-${String(group.id).padStart(4, '0')}`,
        groupSize: groupMembers.length,
        capacity: group.capacity || defaultCapacity,
        status: group.status ?? 1,
        createdAt: group.created_at || '',
        members: groupMembers,
      }
    }))
  },

  async getUnpairedCompletedStudents() {
    const sc = getCurrentSchool()
    const { data: students, error: studentError } = await supabase
      .from('profiles')
      .select('id, name, student_no, college_name, major_name, class_name, survey_status, match_status, created_at')
      .eq('school_code', sc)
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: true })
    assertOk({ error: studentError }, '加载未组队学生失败')

    const studentRows = (students || []).filter((s: any) => surveyStatusToNumber(s.survey_status) === 2)
    if (studentRows.length === 0) return wrap([])

    const { data: members, error: memberError } = await supabase
      .from('pair_members')
      .select('user_id')
      .in('user_id', studentRows.map((s: any) => s.id))
    assertOk({ error: memberError }, '加载队伍成员失败')

    const pairedIds = new Set((members || []).map((m: any) => m.user_id))
    return wrap(studentRows.filter((s: any) => !pairedIds.has(s.id)).map(normalizeStudent))
  },

  async autoCompletePairGroups() {
    const sc = getCurrentSchool()
    const capacity = await getDefaultRoomCapacity()
    const res = await this.getUnpairedCompletedStudents()
    const students = res.data.data || []
    let createdGroups = 0
    let assignedStudents = 0

    for (let i = 0; i < students.length; i += capacity) {
      const chunk = students.slice(i, i + capacity)
      if (chunk.length === 0) continue
      const { data: group, error: groupError } = await supabase
        .from('pair_groups')
        .insert({ school_code: sc, status: 2 })
        .select('id')
        .single()
      assertOk({ error: groupError }, '创建补全队伍失败')

      const memberRows = chunk.map((student: any, index: number) => ({
        group_id: group.id,
        user_id: student.id,
        is_initiator: index === 0 ? 1 : 0,
      }))
      const memberResult = await supabase.from('pair_members').insert(memberRows)
      assertOk(memberResult, '写入补全队伍成员失败')
      const profileResult = await supabase
        .from('profiles')
        .update({ match_status: 'PAIRED' })
        .in('id', chunk.map((student: any) => student.id))
      assertOk(profileResult, '更新学生组队状态失败')
      createdGroups += 1
      assignedStudents += chunk.length
    }

    return wrap({ createdGroups, assignedStudents })
  },

  async confirmPairGroups() {
    const sc = getCurrentSchool()
    const result = await supabase
      .from('pair_groups')
      .update({ status: 2 })
      .eq('school_code', sc)
      .eq('status', 1)
    assertOk(result, '确认队伍失败')
    return wrap(null)
  },

  async getAcceptedInvitesWithoutGroups() {
    const sc = getCurrentSchool()
    const { data: invites, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('school_code', sc)
      .eq('status', 1)
      .order('created_at', { ascending: false })
    assertOk({ error: inviteError }, '加载已接受邀请失败')

    const accepted = invites || []
    if (accepted.length === 0) return wrap([])

    const userIds = [...new Set(accepted.flatMap((i: any) => [i.from_user_id, i.to_user_id]).filter(Boolean))]
    const { data: pairMembers, error: memberError } = await supabase
      .from('pair_members')
      .select('user_id')
      .in('user_id', userIds)
    assertOk({ error: memberError }, '加载配对成员失败')

    const pairedIds = new Set((pairMembers || []).map((m: any) => m.user_id))
    const broken = accepted.filter((invite: any) => !pairedIds.has(invite.from_user_id) || !pairedIds.has(invite.to_user_id))
    if (broken.length === 0) return wrap([])

    const brokenUserIds = [...new Set(broken.flatMap((i: any) => [i.from_user_id, i.to_user_id]).filter(Boolean))]
    const { data: profiles } = brokenUserIds.length
      ? await supabase.from('profiles').select('id, name, student_no').in('id', brokenUserIds)
      : { data: [] }
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    return wrap(broken.map((invite: any) => ({
      ...invite,
      fromName: (profileMap.get(invite.from_user_id) as any)?.name || '',
      toName: (profileMap.get(invite.to_user_id) as any)?.name || '',
      fromStudentNo: (profileMap.get(invite.from_user_id) as any)?.student_no || '',
      toStudentNo: (profileMap.get(invite.to_user_id) as any)?.student_no || '',
      createdAt: invite.created_at || '',
    })))
  },

  async deleteQuestion(id: number) {
    const result = await supabase.from('survey_questions').delete().eq('id', id)
    assertOk(result, '删除题目失败')
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
    const { data, count, error } = await q.order('created_at', { ascending: false }).range((page - 1) * size, page * size - 1)
    assertOk({ error }, '加载审计日志失败')

    return wrap({
      items: (data || []).map((row: any) => ({
        ...row,
        targetType: row.target_type || row.targetType || '',
        targetId: row.target_id || row.targetId || '',
        ipAddress: row.ip_address || row.ipAddress || '',
        createdAt: row.created_at || row.createdAt || '',
      })),
      total: count || 0,
      page,
      size,
    })
  },

  async writeAuditLog(entry: { action: string; targetType?: string; targetId?: string; detail?: string }) {
    const sc = getCurrentSchool()
    const { data: user } = await supabase.auth.getUser()
    const result = await supabase.from('audit_logs').insert({
      school_code: sc,
      user_id: user.user?.id,
      username: user.user?.email,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      detail: entry.detail,
    })
    assertOk(result, '写入审计日志失败')
    return wrap(null)
  },
}
