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
    for (const a of answers) {
      await supabase.from('survey_answers').upsert({
        user_id: uid,
        question_id: a.questionId,
        answer_value: a.answerValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,question_id' })
    }
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
    for (const a of answers) {
      await supabase.from('survey_answers').upsert({
        user_id: uid,
        question_id: a.questionId,
        answer_value: a.answerValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,question_id' })
    }
    await supabase.from('profiles').update({ survey_status: 'COMPLETED' }).eq('id', uid)
    return wrap(null)
  },
}