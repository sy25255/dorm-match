import { supabase, getCurrentSchool } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

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
      items: (data || []).map(s => ({
        ...s,
        id: s.id,
        name: s.name,
        gender: s.gender,
        collegeName: s.college_name,
        majorName: s.major_name,
        className: s.class_name,
        studentNo: s.student_no,
        surveyStatus: s.survey_status,
        matchStatus: s.match_status,
        isValid: s.is_valid,
        email: s.email || '',
        phone: '',
      })),
      total: count || 0,
      page,
      size,
    })
  },

  async importStudents(list: any[]) {
    const sc = getCurrentSchool()
    for (const s of list) {
      await supabase.from('profiles').upsert({
        id: s.id,
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

  // ========== 宿舍管理 ==========
  async getBuildings() {
    const sc = getCurrentSchool()
    const { data } = await supabase.from('dormitory_buildings').select('*').eq('school_code', sc).order('created_at')
    return wrap(data || [])
  },

  async createBuilding(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('dormitory_buildings').insert({ ...data, school_code: sc })
    return wrap(null)
  },

  async updateBuilding(id: number, data: any) {
    await supabase.from('dormitory_buildings').update(data).eq('id', id)
    return wrap(null)
  },

  async deleteBuilding(id: number) {
    await supabase.from('dormitory_buildings').delete().eq('id', id)
    return wrap(null)
  },

  async getRooms(buildingId?: number) {
    const sc = getCurrentSchool()
    let q = supabase.from('dormitory_rooms').select('*, dormitory_buildings(name, code)').eq('dormitory_rooms.school_code', sc)
    if (buildingId) q = q.eq('building_id', buildingId)
    const { data } = await q.order('floor').order('room_number')
    return wrap(data || [])
  },

  async createRoom(data: any) {
    const sc = getCurrentSchool()
    await supabase.from('dormitory_rooms').insert({ ...data, school_code: sc })
    return wrap(null)
  },

  async updateRoom(id: number, data: any) {
    await supabase.from('dormitory_rooms').update(data).eq('id', id)
    return wrap(null)
  },

  async deleteRoom(id: number) {
    await supabase.from('dormitory_rooms').delete().eq('id', id)
    return wrap(null)
  },

  // ========== 分配管理 ==========
  async executeAllocation(data: { type: string; gender?: number }) {
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

    const answerMap = new Map<string, Map<number, number>>()
    for (const a of (allAnswers as any[]) || []) {
      if (!answerMap.has(a.user_id)) answerMap.set(a.user_id, new Map())
      answerMap.get(a.user_id)!.set(a.question_id, Number(a.answer_value))
    }

    // Step 2: 计算两个学生偏好相似度（0~1，越高越相似）
    function calcSimilarity(a: Map<number, number>, b: Map<number, number>): number {
      let totalDiff = 0, count = 0
      for (const [qid, val] of a) {
        const ov = b.get(qid)
        if (ov !== undefined) { totalDiff += Math.abs(val - ov); count++ }
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
    let q = supabase.from('allocations').select('*, profiles(name, student_no, gender, college_name, major_name, class_name)').eq('school_code', sc)
    if (params?.allocationType) q = q.eq('allocation_type', params.allocationType)
    const { data } = await q.order('room_number').order('bed_no')
    return wrap(data || [])
  },

  async manualAllocate(studentId: string, roomId: number, bedNo: number) {
    const sc = getCurrentSchool()
    const { data: room } = await supabase.from('dormitory_rooms').select('*').eq('id', roomId).single()

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
    return wrap(data || [])
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

  async toggleQuestionStatus(id: number) {
    const { data } = await supabase.from('survey_questions').select('status').eq('id', id).single()
    const newStatus = data?.status === 1 ? 0 : 1
    await supabase.from('survey_questions').update({ status: newStatus }).eq('id', id)
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

    const { count: totalStudents } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true }).eq('school_code', sc).eq('role', 'STUDENT')
    const { count: completedSurvey } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true }).eq('school_code', sc).eq('role', 'STUDENT').eq('survey_status', 'COMPLETED')
    const { count: allocatedCount } = await supabase
      .from('allocations').select('*', { count: 'exact', head: true }).eq('school_code', sc)
    const { count: objectionsCount } = await supabase
      .from('allocation_objections').select('*', { count: 'exact', head: true }).eq('school_code', sc)
    const { count: totalRoomsCount } = await supabase
      .from('dormitory_rooms').select('*', { count: 'exact', head: true }).eq('school_code', sc)
    const { count: maleStudents } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true }).eq('school_code', sc).eq('role', 'STUDENT').eq('gender', 1)

    return wrap({
      totalStudents: totalStudents || 0,
      completedSurvey: completedSurvey || 0,
      maleStudents: maleStudents || 0,
      femaleStudents: (totalStudents || 0) - (maleStudents || 0),
      allocated: allocatedCount || 0,
      objections: objectionsCount || 0,
      totalRooms: totalRoomsCount || 0,
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