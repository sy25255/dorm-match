import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

function mapFeedback(row: any) {
  return {
    ...row,
    targetRole: row.target_role || row.targetRole,
    submitterId: row.submitter_id || row.submitterId,
    submitterName: row.submitter_name || row.submitterName || row.submitter_id || '测试用户',
    submitterRole: row.submitter_role || row.submitterRole || 'STUDENT',
    problemType: row.problem_type || row.problemType,
    collegeName: row.college_name || row.collegeName || '',
    majorName: row.major_name || row.majorName || '',
    className: row.class_name || row.className || '',
    schoolCode: row.school_code || row.schoolCode || getCurrentSchool(),
    schoolName: row.school_name || row.schoolName || localStorage.getItem('schoolName') || '',
    createdAt: row.created_at || row.createdAt || '',
    resolvedAt: row.resolved_at || row.resolvedAt || '',
    handlerId: row.handler_id || row.handlerId || '',
  }
}

export const feedbackApi = {
  async getList() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('submitter_id', uid)
      .order('created_at', { ascending: false })
    return wrap((data || []).map(mapFeedback))
  },

  async submit(payload: {
    targetRole: string
    title: string
    content: string
    problemType?: string
    collegeName?: string
    majorName?: string
    className?: string
  }) {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()
    await supabase.from('feedbacks').insert({
      school_code: sc,
      submitter_id: uid,
      target_role: payload.targetRole,
      title: payload.title,
      content: payload.content,
      problem_type: payload.problemType,
      college_name: payload.collegeName,
      major_name: payload.majorName,
      class_name: payload.className,
      status: 'PENDING',
    })
    return wrap(null)
  },

  async getAdminList() {
    const sc = getCurrentSchool()
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('school_code', sc)
      .order('created_at', { ascending: false })
    return wrap((data || []).map(mapFeedback))
  },

  async adminReply(
    id: number,
    payload: { status: string; reply: string },
  ) {
    const { data: user } = await supabase.auth.getUser()
    await supabase
      .from('feedbacks')
      .update({
        status: payload.status,
        reply: payload.reply,
        handler_id: user.user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
    return wrap(null)
  },
}
