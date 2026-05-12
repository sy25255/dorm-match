import request from './request'

export interface AnswerItem {
  questionId: number
  answerValue: string
}

export const surveyApi = {
  getQuestions() {
    return request.get('/survey/questions')
  },
  getProgress() {
    return request.get('/survey/progress')
  },
  saveDraft(answers: AnswerItem[]) {
    return request.post('/survey/draft', { answers })
  },
  getDraft() {
    return request.get('/survey/draft')
  },
  submit(answers: AnswerItem[]) {
    return request.post('/survey/submit', { answers })
  },
}
