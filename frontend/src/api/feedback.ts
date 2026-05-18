import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const feedbackApi = {
  async getList() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('submitter_id', uid)
      .order('created_at', { ascending: false })
    return wrap(data || [])
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
    return wrap(data || [])
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