import { supabase, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export interface AnswerItem {
  questionId: number
  answerValue: string
}

export const surveyApi = {
  async getQuestions() {
    const { data } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('status', 1)
      .order('sort_order')
    const items = (data || []).map((q: any) => ({
      id: q.id,
      questionCode: q.question_code,
      dimension: q.dimension,
      questionText: q.question_text,
      questionType: q.question_type,
      optionsJson: q.options_json,
      isRequired: q.is_required ?? 1,
      isAttentionCheck: q.is_attention_check ?? 0,
      hasSupplement: q.has_supplement ?? false,
      supplementPlaceholder: q.supplement_placeholder,
      scenarioCategory: q.scenario_category,
      placeholder: q.placeholder,
      trapAnswer: q.trap_answer,
      trapSection: q.trap_section,
      leaderWeight: q.leader_weight,
      dropdownPlaceholder: q.dropdown_placeholder,
    }))
    return wrap(items)
  },

  async getProgress() {
    const uid = getCurrentUserId()
    const { count } = await supabase
      .from('survey_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
    const answered = count || 0

    const { count: totalCount } = await supabase
      .from('survey_questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1)
    const total = totalCount || 0

    return wrap({ total, answered, percentage: total > 0 ? Math.round(answered * 100 / total) : 0 })
  },

  async saveDraft(answers: AnswerItem[]) {
    const uid = getCurrentUserId()
    if (answers.length === 0) return wrap(null)
    const rows = answers.map(a => ({
      user_id: uid,
      question_id: a.questionId,
      answer_value: a.answerValue,
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('survey_answers').upsert(rows, { onConflict: 'user_id,question_id' })
    return wrap(null)
  },

  async getDraft() {
    const uid = getCurrentUserId()
    const { data } = await supabase
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', uid)
    const items = (data || []).map((r: any) => ({
      questionId: r.question_id,
      answerValue: r.answer_value,
    }))
    return wrap(items)
  },

  async submit(answers: AnswerItem[]) {
    const uid = getCurrentUserId()
    if (answers.length > 0) {
      const rows = answers.map(a => ({
        user_id: uid,
        question_id: a.questionId,
        answer_value: a.answerValue,
        updated_at: new Date().toISOString(),
      }))
      await supabase.from('survey_answers').upsert(rows, { onConflict: 'user_id,question_id' })
    }
    await supabase.from('profiles').update({ survey_status: 'COMPLETED' }).eq('id', uid)
    return wrap(null)
  },

  async getMySurvey() {
    const uid = getCurrentUserId()
    // 复用 match.ts 中的 getStudentSurvey 逻辑
    const [answerRes, questionRes] = await Promise.all([
      supabase.from('survey_answers').select('question_id, answer_value').eq('user_id', uid),
      supabase.from('survey_questions').select('*').eq('status', 1).order('sort_order'),
    ])

    const answers = answerRes.data || []
    const questions = questionRes.data || []
    if (answers.length === 0) return wrap(null)

    const answerMap = new Map<number, string>((answers as any[]).map((a: any) => [a.question_id, a.answer_value]))

    const dimMeta: Record<string, { title: string; desc: string }> = {
      LIFESTYLE: { title: '基础信息采集', desc: '生活习惯与健康信息' },
      SLEEP: { title: '生活作息', desc: '睡眠和作息习惯' },
      HYGIENE: { title: '卫生习惯', desc: '个人卫生与公共区域维护' },
      STUDY: { title: '学习习惯', desc: '学习时间与环境偏好' },
      HOBBY: { title: '兴趣爱好', desc: '运动、音乐、游戏等兴趣偏好' },
      SOCIAL: { title: '社交偏好', desc: '社交习惯与沟通方式' },
      SPENDING: { title: '消费观念', desc: '消费习惯与共享态度' },
      PERSONALITY: { title: '性格特征', desc: '性格特质与处事风格' },
      ATTENTION: { title: '注意力检测', desc: '注意力检测题目' },
      PSYCHOLOGY: { title: '情景心理测试', desc: '价值观和处事方式' },
      EXTENSION: { title: '扩展信息', desc: '学习规划与宿舍生活偏好' },
    }

    const dimOrder = ['LIFESTYLE', 'SLEEP', 'HYGIENE', 'STUDY', 'HOBBY', 'SOCIAL', 'SPENDING', 'PERSONALITY', 'ATTENTION', 'PSYCHOLOGY', 'EXTENSION']

    function parseOptions(q: any): any[] {
      if (!q.options_json) return []
      try {
        if (typeof q.options_json === 'string') return JSON.parse(q.options_json)
        return q.options_json as any[]
      } catch { return [] }
    }

    function getAnswerText(q: any, answerValue: string): string {
      if (!answerValue) return '未作答'
      const opts = parseOptions(q)
      if (opts.length === 0) return answerValue
      if (q.question_type === 'MULTI_CHOICE') {
        const vals = answerValue.split(',')
        return vals.map(v => {
          const opt = opts.find((o: any) => o.value === v.trim())
          return opt ? opt.text : v
        }).join('、')
      }
      const opt = opts.find((o: any) => o.value === answerValue)
      return opt ? `${opt.label || ''}. ${opt.text}` : answerValue
    }

    const sections: any[] = []
    for (const dim of dimOrder) {
      const dimQuestions = questions.filter((q: any) => q.dimension === dim)
      const answeredQuestions = dimQuestions.filter((q: any) => answerMap.has(q.id))
      if (answeredQuestions.length === 0) continue
      const meta = dimMeta[dim]
      sections.push({
        key: dim.toLowerCase(),
        title: meta?.title || dim,
        desc: meta?.desc || '',
        questions: answeredQuestions.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          answerValue: answerMap.get(q.id),
          answerText: getAnswerText(q, answerMap.get(q.id) || ''),
        })),
      })
    }

    return wrap({ sections })
  },
}
