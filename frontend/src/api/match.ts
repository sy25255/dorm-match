import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const matchApi = {
  async calculate() {
    return wrap(null)
  },

  async getRecommendations() {
    const uid = getCurrentUserId()
    const sc = getCurrentSchool()

    const { data: myAnswers } = await supabase
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', uid)

    if (!myAnswers || myAnswers.length === 0) return wrap([])

    const myMap = new Map((myAnswers as any[]).map((a: any) => [a.question_id, a.answer_value]))

    const { data: others } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_code', sc)
      .eq('survey_status', 'COMPLETED')
      .neq('id', uid)

    if (!others) return wrap([])

    const results = []
    for (const other of others as any[]) {
      const { data: otherAnswers } = await supabase
        .from('survey_answers')
        .select('question_id, answer_value')
        .eq('user_id', other.id)

      if (!otherAnswers || otherAnswers.length === 0) continue

      const otherMap = new Map((otherAnswers as any[]).map((a: any) => [a.question_id, a.answer_value]))
      let totalDiff = 0
      let count = 0

      for (const [qid, myVal] of myMap) {
        const otherVal = otherMap.get(qid)
        if (otherVal !== undefined) {
          totalDiff += Math.abs(Number(myVal) - Number(otherVal))
          count++
        }
      }

      const score = count > 0 ? Math.round((1 - totalDiff / (count * 4)) * 100) : 0
      results.push({
        targetId: other.id,
        name: other.name,
        gender: other.gender,
        collegeName: other.college_name || '',
        majorName: other.major_name || '',
        className: other.class_name || '',
        hometown: other.hometown || '',
        bio: other.bio || '',
        avatarUrl: other.avatar_url || '',
        smoking: other.smoking || '2',
        snoring: other.snoring || '1',
        leaderScore: other.leader_score || 0,
        matchScore: Math.max(score, 30),
        dimensionScores: {},
      })
    }

    results.sort((a, b) => b.matchScore - a.matchScore)
    return wrap(results.slice(0, 20))
  },

  async search(params: { keyword?: string; collegeId?: number; majorId?: number; hobby?: string }) {
    const sc = getCurrentSchool()
    const uid = getCurrentUserId()

    let q = supabase.from('profiles').select('*').eq('school_code', sc).neq('id', uid)

    if (params.collegeId) {
      const { data: college } = await supabase.from('colleges').select('name').eq('id', params.collegeId).single()
      if (college) q = q.eq('college_name', college.name)
    }
    if (params.majorId) {
      const { data: major } = await supabase.from('majors').select('name').eq('id', params.majorId).single()
      if (major) q = q.eq('major_name', major.name)
    }

    const { data } = await q.limit(50)

    const results = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      collegeName: p.college_name,
      majorName: p.major_name,
      className: p.class_name,
      hometown: p.hometown,
      bio: p.bio,
      avatarUrl: p.avatar_url,
      smoking: p.smoking,
      snoring: p.snoring,
      leaderScore: p.leader_score,
      matchStatus: p.match_status,
      studentNo: p.student_no,
    }))

    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      return wrap(results.filter((r: any) =>
        r.name.toLowerCase().includes(kw) ||
        (r.collegeName && r.collegeName.toLowerCase().includes(kw)) ||
        (r.majorName && r.majorName.toLowerCase().includes(kw)) ||
        (r.hometown && r.hometown.toLowerCase().includes(kw))
      ))
    }

    return wrap(results)
  },

  async getDetail(targetId: number) {
    const uid = getCurrentUserId()

    const { data: other } = await supabase.from('profiles').select('*').eq('id', String(targetId)).single()
    if (!other) return wrap(null)

    const { data: myAnswers } = await supabase
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', uid)
    const { data: otherAnswers } = await supabase
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', String(targetId))

    const myMap = new Map((myAnswers || []).map((a: any) => [a.question_id, a.answer_value]))
    const otherMap = new Map((otherAnswers || []).map((a: any) => [a.question_id, a.answer_value]))

    let totalDiff = 0; let count = 0
    for (const [qid, val] of myMap) {
      const ov = otherMap.get(qid)
      if (ov !== undefined) { totalDiff += Math.abs(Number(val) - Number(ov)); count++ }
    }
    const score = count > 0 ? Math.round((1 - totalDiff / (count * 4)) * 100) : 0

    return wrap({
      targetId: other.id,
      name: other.name,
      gender: other.gender,
      collegeName: other.college_name,
      majorName: other.major_name,
      className: other.class_name,
      hometown: other.hometown,
      bio: other.bio,
      avatarUrl: other.avatar_url,
      smoking: other.smoking,
      snoring: other.snoring,
      leaderScore: other.leader_score,
      matchScore: Math.max(score, 30),
      dimensionScores: {},
    })
  },

  async getStudentSurvey(targetId: number) {
    const { data } = await supabase
      .from('survey_answers')
      .select('question_id, answer_value')
      .eq('user_id', String(targetId))
    return wrap((data || []).map((a: any) => ({
      questionId: a.question_id,
      answerValue: a.answer_value,
    })))
  },
}