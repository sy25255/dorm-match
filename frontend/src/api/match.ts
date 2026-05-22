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
    // 获取该学生的问卷答案和所有题目
    const [answerRes, questionRes] = await Promise.all([
      supabase.from('survey_answers').select('question_id, answer_value').eq('user_id', String(targetId)),
      supabase.from('survey_questions').select('*').eq('status', 1).order('sort_order'),
    ])

    const answers = answerRes.data || []
    const questions = questionRes.data || []
    if (answers.length === 0) return wrap(null)

    const answerMap = new Map(answers.map((a: any) => [a.question_id, a.answer_value]))
    const questionMap = new Map(questions.map((q: any) => [q.id, q]))

    // 维度元信息
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

    // 解析选项
    function parseOptions(q: any): any[] {
      if (!q.options_json) return []
      try {
        if (typeof q.options_json === 'string') return JSON.parse(q.options_json)
        return q.options_json as any[]
      } catch { return [] }
    }

    // 获取答案显示文本
    function getAnswerText(q: any, answerValue: string): string {
      if (!answerValue) return '未作答'
      const opts = parseOptions(q)
      if (opts.length === 0) return answerValue

      // 多选答案
      if (q.question_type === 'MULTI_CHOICE') {
        const vals = answerValue.split(',')
        return vals.map(v => {
          const opt = opts.find((o: any) => o.value === v.trim())
          return opt ? opt.text : v
        }).join('、')
      }

      // 单选/量表
      const opt = opts.find((o: any) => o.value === answerValue)
      return opt ? `${opt.label || ''}. ${opt.text}` : answerValue
    }

    // 按维度分组构建 sections
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
          answerText: getAnswerText(q, answerMap.get(q.id)),
        })),
      })
    }

    return wrap({ sections })
  },
}