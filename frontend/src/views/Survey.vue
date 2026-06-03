<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { surveyApi, type AnswerItem } from '@/api/survey'
import { matchApi } from '@/api/match'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const hasAnswers = computed(() => Object.keys(answers.value).length > 0)

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (!submitted.value && hasAnswers.value) {
    e.preventDefault()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!submitted.value && hasAnswers.value) {
    ElMessageBox.confirm('你有未提交的问卷内容，离开将丢失当前节的修改（已保存的草稿不会丢失）。确定离开吗？', '提示', {
      confirmButtonText: '确定离开',
      cancelButtonText: '继续填写',
      type: 'warning',
    }).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
})

interface Question {
  id: number
  questionCode: string
  dimension: string
  questionText: string
  questionType: string
  optionsJson: string | Record<string, any>[] | null
  isRequired: number
  isAttentionCheck: number
  hasSupplement?: boolean
  supplementPlaceholder?: string
  scenarioCategory?: string
  placeholder?: string
  trapAnswer?: string
  trapSection?: string
  leaderWeight?: number
  dropdownPlaceholder?: string
}

interface Section {
  key: string
  title: string
  desc: string
  color: string
  questionIds: number[]
}

const questions = ref<Question[]>([])
const answers = ref<Record<number, string>>({})
const supplements = ref<Record<number, string>>({})
const currentSectionIndex = ref(0)
const loading = ref(false)
const sectionChanging = ref(false)
const submitted = ref(false)
const sectionFromDraft = ref<number | null>(null)

const selfIntro = ref({
  hobbies: '',
  personality: '',
  specialConditions: '',
  bio: '',
})

function getIntroDraftKey() {
  return `demo_survey_intro_${getCurrentUserId() || 'anonymous'}`
}

function getSupplementDraftKey() {
  return `demo_survey_supplements_${getCurrentUserId() || 'anonymous'}`
}

function persistIntroDraft() {
  localStorage.setItem(getIntroDraftKey(), JSON.stringify(selfIntro.value))
}

function persistSupplementDraft() {
  localStorage.setItem(getSupplementDraftKey(), JSON.stringify(supplements.value))
}

async function loadIntroDraft() {
  const uid = getCurrentUserId()
  if (uid) {
    const { data } = await supabase
      .from('profiles')
      .select('bio')
      .eq('id', uid)
      .single()
    if (data?.bio && !selfIntro.value.bio) selfIntro.value.bio = data.bio
  }

  try {
    const savedIntro = JSON.parse(localStorage.getItem(getIntroDraftKey()) || 'null')
    if (savedIntro) selfIntro.value = { ...selfIntro.value, ...savedIntro }
  } catch {}

  try {
    const savedSupplements = JSON.parse(localStorage.getItem(getSupplementDraftKey()) || '{}')
    Object.entries(savedSupplements).forEach(([k, v]) => { supplements.value[Number(k)] = v as string })
  } catch {}
}

async function saveIntroToProfile() {
  const uid = getCurrentUserId()
  if (!uid) return
  const bio = selfIntro.value.bio?.trim()
  if (!bio) return
  await supabase.from('profiles').update({ bio }).eq('id', uid)
}

// 查看我的问卷
const showMySurvey = ref(false)
const mySurvey = ref<any>(null)
const mySurveyLoading = ref(false)
const activeMySurveySections = ref<string[]>([])

const dimIcons: Record<string, string> = {
  sleep: '🛏️', hygiene: '🧹', study: '📚', hobby: '🎮',
  social: '👥', spending: '💰', personality: '🎭',
  lifestyle: '📋', attention: '🔍', psychology: '⚖️', extension: '📝',
}

async function viewMySurvey() {
  mySurveyLoading.value = true
  try {
    const res = await surveyApi.getMySurvey()
    mySurvey.value = res.data.data
    showMySurvey.value = true
    if (mySurvey.value?.sections) {
      activeMySurveySections.value = mySurvey.value.sections.map((s: any) => s.key)
    }
  } catch {
    ElMessage.error('获取问卷失败')
  } finally {
    mySurveyLoading.value = false
  }
}

const sections = ref<Section[]>([])

const safeSectionIndex = computed(() => {
  if (sections.value.length === 0) return 0
  return Math.min(Math.max(currentSectionIndex.value, 0), sections.value.length - 1)
})
const currentSection = computed(() => sections.value[safeSectionIndex.value] ?? sections.value[0])
const currentQuestions = computed(() => {
  if (!currentSection.value || currentSection.value.key === 'intro') return []
  return questions.value.filter(q => currentSection.value.questionIds.includes(q.id))
})
const isIntroSection = computed(() => currentSection.value?.key === 'intro')
const isLastSection = computed(() => safeSectionIndex.value >= sections.value.length - 1)
const isFirstSection = computed(() => safeSectionIndex.value === 0)
const totalSections = computed(() => sections.value.length)
const overallProgress = computed(() => totalSections.value ? Math.round((safeSectionIndex.value + 1) / totalSections.value * 100) : 0)
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || (route.params.schoolCode as string))

const answeredInSection = computed(() => {
  if (isIntroSection.value) {
    const bioLen = (selfIntro.value.bio || '').replace(/\s/g, '').length
    return bioLen > 0 ? 1 : 0
  }
  return currentQuestions.value.filter(q => answers.value[q.id]).length
})

const totalInSection = computed(() => {
  if (isIntroSection.value) return 1
  return currentQuestions.value.length
})

const requiredInSection = computed(() => {
  if (isIntroSection.value) return []
  return currentQuestions.value.filter(q => q.isRequired && q.dimension !== 'TRAP')
})

const allRequiredAnswered = computed(() => {
  if (isIntroSection.value) return true
  return requiredInSection.value.every(q => answers.value[q.id])
})
const unansweredRequiredCount = computed(() => {
  if (isIntroSection.value) return 0
  return requiredInSection.value.filter(q => !answers.value[q.id]).length
})

const bioCharCount = computed(() => (selfIntro.value.bio || '').replace(/\s/g, '').length)
const bioStatus = computed(() => {
  if (bioCharCount.value > 500) return 'too-long'
  return 'ok'
})

async function checkCompleted() {
  const uid = getCurrentUserId()
  if (!uid) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('survey_status')
    .eq('id', uid)
    .single()
  if (profile?.survey_status === 'COMPLETED') {
    submitted.value = true
  }
}

watch(() => route.path, checkCompleted, { immediate: true })

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  if (submitted.value) return
  try {
    const res = await surveyApi.getQuestions()
    questions.value = res.data.data || []
    const draft = await surveyApi.getDraft()
    const draftData = draft.data.data || []
    draftData.forEach((item: AnswerItem) => {
      if (Number(item.questionId) > 0) {
        answers.value[item.questionId] = item.answerValue
      }
    })
    await loadIntroDraft()

    buildSections()

    const lastSection = localStorage.getItem('demo_survey_section')
    if (lastSection !== null) {
      const idx = Number(lastSection)
      if (idx >= 0 && idx < sections.value.length) sectionFromDraft.value = idx
    }
  } catch {
    buildSections()
  }
})

function buildSections() {
  const dimOrder = ['LIFESTYLE', 'SLEEP', 'HYGIENE', 'STUDY', 'HOBBY', 'SOCIAL', 'SPENDING', 'PERSONALITY', 'ATTENTION', 'PSYCHOLOGY', 'EXTENSION']
  const dimMeta: Record<string, { title: string; desc: string; color: string }> = {
    LIFESTYLE: { title: '基础信息采集', desc: '生活习惯与健康信息', color: '#1890ff' },
    SLEEP: { title: '生活作息', desc: '了解你的睡眠和作息习惯', color: '#722ed1' },
    HYGIENE: { title: '卫生习惯', desc: '个人卫生与公共区域维护', color: '#13c2c2' },
    STUDY: { title: '学习习惯', desc: '学习时间与环境偏好', color: '#52c41a' },
    HOBBY: { title: '兴趣爱好', desc: '运动、音乐、游戏等兴趣偏好', color: '#fa8c16' },
    SOCIAL: { title: '社交偏好', desc: '社交习惯与沟通方式', color: '#eb2f96' },
    SPENDING: { title: '消费观念', desc: '消费习惯与共享态度', color: '#faad14' },
    PERSONALITY: { title: '性格特征', desc: '性格特质与处事风格', color: '#2f54eb' },
    ATTENTION: { title: '注意力检测', desc: '请认真阅读每个题目，根据真实情况作答', color: '#f5222d' },
    PSYCHOLOGY: { title: '情景心理测试', desc: '通过日常情景判断了解你的价值观和处事方式（匿名分析，仅用于匹配）', color: '#a0d911' },
    EXTENSION: { title: '扩展信息', desc: '学习规划与宿舍生活偏好', color: '#5b8c00' },
  }
  const trapSections: Record<string, string> = {
    sleep: 'SLEEP', hygiene: 'HYGIENE', study: 'STUDY',
    hobby: 'HOBBY', social: 'SOCIAL', spending: 'SPENDING', personality: 'PERSONALITY',
    attention: 'ATTENTION', psychology: 'PSYCHOLOGY', extension: 'EXTENSION',
  }

  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr]
    let s = seed
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647
      const j = s % (i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const result: Section[] = []
  const usedTrapIds: number[] = []

  for (let di = 0; di < dimOrder.length; di++) {
    const dim = dimOrder[di]
    const ids = questions.value.filter(q => q.dimension === dim).map(q => q.id)
    if (ids.length === 0) continue

    const allIds = [...ids]

    // 陷阱题：随机插入（禁首尾），跳过第一页
    if (di > 0) {
      const trapId = questions.value.filter(q => q.dimension === 'TRAP' && trapSections[q.trapSection || ''] === dim && !usedTrapIds.includes(q.id)).map(q => q.id)[0]
      if (trapId != null) {
        usedTrapIds.push(trapId)
        const seed = trapId * 7919 + di
        const insertPos = 1 + (seededShuffle([0], seed)[0] % Math.max(1, allIds.length - 1))
        allIds.splice(insertPos, 0, trapId)
      }
    }

    if (dimMeta[dim]) {
      result.push({ key: dim.toLowerCase(), title: dimMeta[dim].title, desc: dimMeta[dim].desc, color: dimMeta[dim].color, questionIds: allIds })
    }
  }

  if (result.length > 0) {
    result.push({ key: 'intro', title: '自我介绍', desc: '写一段话让未来的舍友更好地了解你（选填）', color: '#595959', questionIds: [] })
  }
  sections.value = result
}

interface OptionItem { label: string; value: string; text: string; trait?: string }

function hashSeed(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function stableShuffle<T>(arr: T[], seedText: string): T[] {
  const copy = [...arr]
  let seed = hashSeed(seedText) || 1
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 48271) % 2147483647
    const j = seed % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function shouldShuffleOptions(q: Question) {
  return ['SINGLE_CHOICE', 'MULTI_CHOICE', 'SCENARIO', 'VALUE_JUDGE'].includes(q.questionType)
}

function getOption(q: Question): OptionItem[] {
  if (!q.optionsJson) return []
  try {
    const raw = typeof q.optionsJson === 'string'
      ? JSON.parse(q.optionsJson)
      : q.optionsJson as unknown as OptionItem[]
    if (!Array.isArray(raw) || !shouldShuffleOptions(q)) return raw
    return stableShuffle(raw, `${getCurrentUserId() || 'anonymous'}:${q.id}`)
  } catch {
    return []
  }
}

function getDisplayIndexForAnswer(questionId: number, value: string) {
  const q = questions.value.find(item => item.id === questionId)
  if (!q || !value) return undefined
  const firstValue = String(value).split(',').filter(Boolean)[0]
  const index = getOption(q).findIndex(opt => opt.value === firstValue)
  return index >= 0 ? index : undefined
}

function setAnswer(questionId: number, value: string) {
  answers.value[questionId] = value
}

function isMultiSelected(questionId: number, value: string): boolean {
  const current = answers.value[questionId] || ''
  return current.split(',').includes(value)
}

function toggleMulti(questionId: number, value: string) {
  const current = answers.value[questionId] || ''
  const arr = current ? current.split(',') : []
  const idx = arr.indexOf(value)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(value)
  }
  answers.value[questionId] = arr.join(',')
}

async function previousSection() {
  if (sectionChanging.value) return
  if (currentSectionIndex.value > 0) {
    sectionChanging.value = true
    try {
      await saveDraft()
      currentSectionIndex.value = Math.max(0, currentSectionIndex.value - 1)
      localStorage.setItem('demo_survey_section', String(currentSectionIndex.value))
    } finally {
      sectionChanging.value = false
    }
  }
}

async function nextSection() {
  if (sectionChanging.value) return
  if (!allRequiredAnswered.value) {
    const count = requiredInSection.value.filter(q => !answers.value[q.id]).length
    ElMessage.warning(`还有 ${count} 道必答题未作答，请先完成所有标注 *必答 的题目`)
    return
  }
  if (currentSectionIndex.value < sections.value.length - 1) {
    sectionChanging.value = true
    try {
      await saveDraft()
      currentSectionIndex.value = Math.min(sections.value.length - 1, currentSectionIndex.value + 1)
      localStorage.setItem('demo_survey_section', String(currentSectionIndex.value))
    } finally {
      sectionChanging.value = false
    }
  }
}

async function gotoSection(idx: number) {
  if (sectionChanging.value) return
  const nextIdx = Math.min(Math.max(idx, 0), Math.max(0, sections.value.length - 1))
  sectionChanging.value = true
  try {
    await saveDraft()
    currentSectionIndex.value = nextIdx
    localStorage.setItem('demo_survey_section', String(nextIdx))
  } finally {
    sectionChanging.value = false
  }
}

async function saveDraft() {
  if (isIntroSection.value) {
    persistIntroDraft()
    await saveIntroToProfile().catch(() => {})
    return
  }
  const items: AnswerItem[] = currentQuestions.value
    .filter(q => answers.value[q.id])
    .map(q => ({ questionId: q.id, answerValue: answers.value[q.id] }))
  persistSupplementDraft()
  if (items.length === 0) return
  await surveyApi.saveDraft(items).catch(() => {})
}

function saveIntroDraft() {
  persistIntroDraft()
  saveIntroToProfile().catch(() => {})
}

const scenarioCategoryColors: Record<string, string> = {
  '合作与责任': '#1890ff',
  '冲突处理': '#f5222d',
  '压力应对': '#722ed1',
  '责任承担': '#13c2c2',
  '价值判断': '#fa8c16',
  '共情关怀': '#eb2f96',
  '协商沟通': '#52c41a',
}

async function handleSubmit() {
  // 全局必答题校验
  const allRequired = questions.value.filter(q => q.isRequired && q.dimension !== 'TRAP')
  const unanswered = allRequired.filter(q => !answers.value[q.id])
  if (unanswered.length > 0) {
    ElMessage.warning(`还有 ${unanswered.length} 道必答题未作答，请完成所有标注 *必答 的题目后再提交`)
    return
  }

  try {
    await ElMessageBox.confirm('确认提交问卷？提交后将无法修改。', '确认提交', {
      confirmButtonText: '确认提交',
      cancelButtonText: '再检查一下',
      type: 'warning',
    })
  } catch {
    return
  }

  loading.value = true
  try {
    const allItems: AnswerItem[] = Object.entries(answers.value).map(([qid, val]) => ({
      questionId: Number(qid),
      answerValue: val,
      displayIndex: getDisplayIndexForAnswer(Number(qid), val),
    }))
    persistIntroDraft()
    persistSupplementDraft()
    await saveIntroToProfile().catch(() => {})
    const submitResult = await surveyApi.submit(allItems)
    const status = submitResult.data.data?.status
    if (status === 'NEEDS_RETAKE') {
      ElMessage.warning(`问卷需要重填：${submitResult.data.data?.reason || '验证未通过'}`)
      submitted.value = false
      return
    }
    const userId = localStorage.getItem('userId') || '0'
    localStorage.removeItem('demo_survey_intro')
    localStorage.removeItem('demo_survey_supplements')
    localStorage.removeItem(getIntroDraftKey())
    localStorage.removeItem(getSupplementDraftKey())
    localStorage.removeItem(`demo_survey_draft_${userId}`)
    localStorage.removeItem('demo_survey_section')
    ElMessage.success('问卷提交成功！正在为你计算匹配结果...')
    submitted.value = true
    try {
      await matchApi.calculate()
      ElMessage.success('匹配计算完成，点击查看推荐！')
      router.push(`/${route.params.schoolCode}/matches`)
    } catch {
      ElMessage.info('匹配计算将在后台进行，稍后可查看')
    }
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="survey-hero">
      <div>
        <p class="eyebrow">{{ schoolName }} · 问卷会用于当前学校匹配</p>
        <h1>偏好调查问卷</h1>
        <p>题目较多是为了让宿舍匹配更准确。系统会自动保存草稿，你可以按分组逐步完成。</p>
      </div>
      <div class="hero-progress">
        <el-progress type="circle" :percentage="overallProgress" :width="86" />
        <span>第 {{ safeSectionIndex + 1 }} / {{ totalSections || 1 }} 部分</span>
      </div>
    </div>

    <div v-if="submitted" class="submitted-box">
      <el-result icon="success" title="问卷已提交" sub-title="你已完成偏好问卷，系统已根据你的回答生成了智能匹配结果">
        <template #extra>
          <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/matches`)">查看匹配推荐</el-button>
          <el-button @click="viewMySurvey">查看我的问卷</el-button>
        </template>
      </el-result>
    </div>

    <template v-else-if="sections.length > 0">
      <div class="progress-panel">
        <div class="progress-copy">
          <strong>{{ currentSection?.title || '问卷' }}</strong>
          <span>{{ currentSection?.desc || '请按真实情况填写' }}</span>
        </div>
        <el-progress :percentage="overallProgress" :stroke-width="8" class="survey-progress" />
      </div>

      <div class="section-nav" aria-label="问卷分组导航">
        <el-tag
          v-for="(sec, idx) in sections"
          :key="sec.key"
          size="default"
          :effect="idx === currentSectionIndex ? 'dark' : 'plain'"
          :type="idx < currentSectionIndex ? 'success' : idx === currentSectionIndex ? 'primary' : 'info'"
          class="section-tag"
          @click="idx <= safeSectionIndex ? gotoSection(idx) : undefined"
          :style="{ cursor: idx <= safeSectionIndex ? 'pointer' : 'default' }"
        >
          <template v-if="idx < safeSectionIndex">✓</template>
          {{ sec.title }}
        </el-tag>
      </div>

      <!-- ===== 题目区 ===== -->
      <template v-if="!isIntroSection">
        <div class="section-header" :style="{ '--sec-color': currentSection.color }">
          <h2>{{ currentSection.title }}</h2>
          <p>{{ currentSection.desc }}</p>
        </div>

        <el-card class="survey-card">
          <div class="step-indicator">
            <span>本部分 {{ answeredInSection }}/{{ totalInSection }} 已答</span>
            <span v-if="unansweredRequiredCount > 0">还差 {{ unansweredRequiredCount }} 道必答题</span>
            <span v-else>本部分必答题已完成</span>
          </div>
          <el-divider />

          <div v-for="q in currentQuestions" :key="q.id" class="question-item">
            <div class="q-header">
              <span class="q-dim">{{ q.dimension === 'PSYCHOLOGY' ? '价值观' : q.dimension === 'LIFESTYLE' ? '基础信息' : q.dimension === 'TRAP' ? '验证题' : q.dimension === 'EXTENSION' ? '扩展信息' : q.dimension === 'ATTENTION' ? '注意力' : q.dimension }}</span>
              <span v-if="q.isRequired && q.dimension !== 'TRAP'" class="q-required">* 必答</span>
              <span v-if="q.isAttentionCheck" class="q-attention">※ 注意力检测</span>
              <span v-if="q.trapAnswer" class="q-trap">🔒 验证题</span>
            </div>
            <p class="q-text" :class="{ 'scenario-text': q.questionType === 'SCENARIO', 'trap-text': !!q.trapAnswer }">
              <template v-if="q.questionType === 'SCENARIO' && q.scenarioCategory">
                <span class="scenario-badge" :style="{ background: scenarioCategoryColors[q.scenarioCategory] || '#666' }">
                  {{ q.scenarioCategory }}
                </span>
              </template>
              {{ q.questionText }}
            </p>

            <!-- SCENARIO / VALUE_JUDGE -->
            <template v-if="q.questionType === 'SCENARIO' || q.questionType === 'VALUE_JUDGE'">
              <div class="scenario-options">
                <el-radio-group v-model="answers[q.id]" @change="setAnswer(q.id, $event as string)" class="scenario-radio-group">
                  <div v-for="opt in getOption(q)" :key="opt.value" class="scenario-option"
                    :class="{ selected: answers[q.id] === opt.value }">
                    <el-radio :value="opt.value" class="scenario-radio">
                      <span class="opt-label">{{ opt.label }}.</span>
                      <span class="opt-text">{{ opt.text }}</span>
                    </el-radio>
                  </div>
                </el-radio-group>
              </div>
            </template>

            <!-- LIKERT5 / LIKERT7 -->
            <template v-else-if="q.questionType === 'LIKERT5' || q.questionType === 'LIKERT7'">
              <el-radio-group v-model="answers[q.id]" @change="setAnswer(q.id, $event as string)">
                <el-radio-button v-for="opt in getOption(q)" :key="opt.value" :value="opt.value">
                  {{ opt.text }}
                </el-radio-button>
              </el-radio-group>
            </template>

            <!-- SINGLE_CHOICE -->
            <template v-else-if="q.questionType === 'SINGLE_CHOICE'">
              <el-radio-group v-model="answers[q.id]" @change="setAnswer(q.id, $event as string)">
                <el-radio v-for="opt in getOption(q)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}. {{ opt.text }}
                </el-radio>
              </el-radio-group>

              <template v-if="q.hasSupplement">
                <el-input
                  v-model="supplements[q.id]"
                  :placeholder="q.supplementPlaceholder || '补充说明...'"
                  type="textarea"
                  :rows="2"
                  class="supplement-input"
                  maxlength="200"
                  show-word-limit
                />
              </template>
            </template>

            <!-- MULTI_CHOICE -->
            <template v-else-if="q.questionType === 'MULTI_CHOICE'">
              <el-checkbox-group
                :model-value="(answers[q.id] || '').split(',').filter(Boolean)"
                @update:model-value="(vals: any) => { answers[q.id] = (Array.isArray(vals) ? vals : [vals]).join(',') }"
              >
                <el-checkbox v-for="opt in getOption(q)" :key="opt.value" :value="opt.value">
                  {{ opt.text }}
                </el-checkbox>
              </el-checkbox-group>
            </template>

            <!-- LONG_TEXT -->
            <template v-else-if="q.questionType === 'LONG_TEXT'">
              <el-input
                v-model="answers[q.id]"
                type="textarea"
                :rows="4"
                :placeholder="q.placeholder || '请输入...'"
                maxlength="500"
                show-word-limit
              />
            </template>

            <!-- DROPDOWN -->
            <template v-else-if="q.questionType === 'DROPDOWN'">
              <el-select
                v-model="answers[q.id]"
                :placeholder="q.dropdownPlaceholder || '请选择'"
                filterable
                style="width: 100%; max-width: 400px;"
                @change="setAnswer(q.id, $event as string)"
              >
                <el-option
                  v-for="opt in getOption(q)"
                  :key="opt.value"
                  :label="opt.text"
                  :value="opt.value"
                />
              </el-select>
            </template>
          </div>

          <el-divider />

          <div class="survey-actions">
            <el-button @click="previousSection" :disabled="isFirstSection || sectionChanging">上一部分</el-button>
            <el-button @click="saveDraft" type="info" plain :disabled="sectionChanging">暂存草稿</el-button>
            <el-button v-if="!isLastSection" type="primary" :loading="sectionChanging" @click="nextSection">下一部分</el-button>
            <el-button v-else type="primary" :loading="loading" :disabled="sectionChanging" @click="handleSubmit">前往自我介绍</el-button>
          </div>

          <template v-if="currentSection.key === 'lifestyle'">
            <el-divider style="margin-top:20px" />
            <div class="special-conditions-block">
              <h4 style="margin-bottom:8px;color:#1d2129">📋 特殊情况说明（选填）</h4>
              <p style="font-size:12px;color:#86909c;margin-bottom:10px">如对某些物质过敏、有特殊作息需求、需要定期服药等希望舍友了解的情况</p>
              <el-input
                v-model="selfIntro.specialConditions"
                type="textarea"
                :rows="2"
                maxlength="200"
                show-word-limit
                placeholder="例如：对花粉过敏、需要每晚11点前熄灯、每周二四需提前起床去校医院等"
                @change="saveIntroDraft"
              />
            </div>
          </template>
        </el-card>
      </template>

      <!-- ===== 自我介绍区 ===== -->
      <template v-else>
        <div class="section-header" :style="{ '--sec-color': currentSection.color }">
          <h2>{{ currentSection.title }}</h2>
          <p>{{ currentSection.desc }}</p>
        </div>

        <el-card class="survey-card intro-card">
          <el-alert
            title="自我介绍将展示给匹配到的潜在舍友，帮助他们更好地了解你"
            type="info"
            :closable="false"
            show-icon
            class="intro-alert"
          />

          <el-form label-position="top" class="intro-form">
            <el-form-item label="兴趣爱好">
              <el-input
                v-model="selfIntro.hobbies"
                type="textarea"
                :rows="2"
                maxlength="120"
                show-word-limit
                placeholder="例如：喜欢打篮球、弹吉他、看科幻电影、徒步旅行等"
              />
            </el-form-item>

            <el-form-item label="性格特点">
              <el-input
                v-model="selfIntro.personality"
                type="textarea"
                :rows="2"
                maxlength="120"
                show-word-limit
                placeholder="例如：性格开朗外向，喜欢交朋友；做事认真细致，比较有计划性"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <div class="bio-label">
                  <span>自我介绍（选填，建议300-500字）</span>
                  <span class="bio-count" :class="bioStatus">
                    {{ bioCharCount }}/建议300-500字
                  </span>
                </div>
              </template>
              <el-input
                v-model="selfIntro.bio"
                type="textarea"
                :rows="8"
                maxlength="550"
                show-word-limit
                placeholder="写一段话介绍自己，可以包括你的成长经历、大学期望、对舍友的期待、生活方式等。这将直接影响舍友对你的第一印象哦！"
              />
              <div v-if="bioCharCount > 500" class="bio-warning bio-too-long">
                <el-icon><WarningFilled /></el-icon> 已超出 {{ bioCharCount - 500 }} 字，建议精简
              </div>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="intro-preview" v-if="bioCharCount >= 50">
            <h4>预览效果</h4>
            <div class="preview-card">
              <div class="preview-header">
                <el-avatar :size="40">{{ '我' }}</el-avatar>
                <div>
                  <strong>你的自我介绍</strong>
                  <p class="preview-meta">其他同学看到的将是这段文字</p>
                </div>
              </div>
              <div class="preview-content">
                <p v-if="selfIntro.hobbies"><span class="preview-label">🎯 兴趣爱好：</span>{{ selfIntro.hobbies }}</p>
                <p v-if="selfIntro.personality"><span class="preview-label">🌟 性格特点：</span>{{ selfIntro.personality }}</p>
                <p v-if="selfIntro.specialConditions"><span class="preview-label">📋 特殊情况：</span>{{ selfIntro.specialConditions }}</p>
                <el-divider style="margin:10px 0" />
                <p class="preview-bio">{{ selfIntro.bio || '（待填写）' }}</p>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="survey-actions">
            <el-button @click="previousSection" :disabled="sectionChanging">上一部分</el-button>
            <el-button @click="saveDraft" type="info" plain :disabled="sectionChanging">暂存草稿</el-button>
            <el-button type="primary" :loading="loading" :disabled="sectionChanging" @click="handleSubmit">提交问卷</el-button>
          </div>
        </el-card>
      </template>
    </template>

    <el-empty v-else description="加载中..." />

    <!-- 查看我的问卷弹窗 -->
    <el-dialog
      v-model="showMySurvey"
      title="我的偏好问卷"
      width="800px"
      top="5vh"
      destroy-on-close
    >
      <div v-if="mySurvey" class="survey-dialog-content">
        <el-collapse v-model="activeMySurveySections" v-if="mySurvey.sections?.length">
          <el-collapse-item
            v-for="sec in mySurvey.sections"
            :key="sec.key"
            :name="sec.key"
          >
            <template #title>
              <span class="section-title">
                <span class="section-icon">{{ dimIcons[sec.key] || '📋' }}</span>
                {{ sec.title }}
                <el-tag size="small" type="info" style="margin-left: 8px;">{{ sec.questions.length }}题</el-tag>
              </span>
            </template>
            <div class="survey-questions">
              <div v-for="q in sec.questions" :key="q.id" class="survey-q-item">
                <div class="q-text">{{ q.questionText }}</div>
                <div class="q-answer">
                  <span class="q-answer-label">回答：</span>
                  <span class="q-answer-value">{{ q.answerText }}</span>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-empty v-else description="暂未填写问卷" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.survey-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  margin-bottom: 18px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}

.survey-hero h1 {
  margin: 0;
  color: #172033;
  font-size: 26px;
}

.survey-hero p {
  margin: 8px 0 0;
  color: #667085;
  line-height: 1.6;
}

.eyebrow {
  margin: 0 0 6px !important;
  color: #2563eb !important;
  font-size: 13px;
  font-weight: 700;
}

.hero-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  color: #667085;
  font-size: 13px;
}

.progress-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}

.progress-copy {
  display: grid;
  gap: 4px;
  min-width: 220px;
}

.progress-copy strong {
  color: #172033;
}

.progress-copy span {
  color: #667085;
  font-size: 13px;
}

.survey-progress {
  flex: 1;
  min-width: 220px;
  margin: 0;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}

.section-tag {
  font-size: 12px;
  transition: all 0.2s;
}

.section-header {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  border-left: 4px solid var(--sec-color, #1890ff);
  box-shadow: none;
}

.section-header h2 {
  font-size: 18px;
  margin-bottom: 4px;
  color: #1d2129;
}

.section-header p {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

.survey-card {
  max-width: 860px;
  border-radius: 8px;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #667085;
}

.question-item {
  padding: 18px;
  margin-bottom: 28px;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.q-dim {
  font-size: 12px;
  color: #1890ff;
  background: #e8f4ff;
  padding: 1px 8px;
  border-radius: 4px;
}

.q-required {
  font-size: 12px;
  color: #f53f3f;
}

.q-attention {
  font-size: 12px;
  color: #fa8c16;
  font-weight: 500;
}

.q-trap {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  letter-spacing: 1px;
}

.q-text {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #1d2129;
  line-height: 1.7;
}

.q-text.scenario-text {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  font-weight: 400;
  font-size: 14px;
}

.q-text.trap-text {
  background: #fafafa;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
  font-weight: 400;
  font-size: 13px;
  color: #8c8c8c;
}

.q-text.leader-text {
  border-left: 3px solid #d48806;
  padding-left: 12px;
}

.scenario-badge {
  display: inline-block;
  color: #fff;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  margin-right: 6px;
  font-weight: 500;
}

.scenario-options {
  margin-top: 4px;
}

.scenario-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scenario-option {
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 10px 14px;
  transition: all 0.2s;
  cursor: pointer;
}

.scenario-option:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.scenario-option.selected {
  border-color: #1890ff;
  background: #e8f4ff;
}

.scenario-radio {
  width: 100%;
  margin-right: 0;
}

.opt-label {
  font-weight: 600;
  color: #1890ff;
  margin-right: 6px;
}

.opt-text {
  color: #1d2129;
}

.supplement-input {
  margin-top: 8px;
  max-width: 400px;
}

.survey-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.submitted-box {
  max-width: 500px;
  margin: 40px auto;
}

/* ===== 自我介绍样式 ===== */
.intro-card {
  max-width: 800px;
}

.intro-alert {
  margin-bottom: 20px;
}

.intro-form {
  margin-top: 8px;
}

.bio-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.bio-count {
  font-size: 13px;
  font-weight: 500;
}

.bio-count.too-short {
  color: #fa8c16;
}

.bio-count.ok {
  color: #52c41a;
}

.bio-count.too-long {
  color: #f5222d;
}

.bio-warning {
  margin-top: 6px;
  font-size: 13px;
  color: #fa8c16;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bio-warning.bio-too-long {
  color: #f5222d;
}

.intro-preview {
  margin-top: 8px;
}

.intro-preview h4 {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 10px;
}

.preview-card {
  background: #f7f8fa;
  border-radius: 10px;
  padding: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-header strong {
  font-size: 14px;
}

.preview-meta {
  font-size: 12px;
  color: #c9cdd4;
  margin: 2px 0 0;
}

.preview-content p {
  font-size: 13px;
  line-height: 1.8;
  color: #4e5969;
  margin-bottom: 4px;
}

.preview-label {
  font-weight: 500;
  color: #1d2129;
}

.preview-bio {
  font-size: 13px;
  line-height: 1.8;
  color: #4e5969;
  white-space: pre-wrap;
}

/* 查看问卷弹窗样式 */
.survey-dialog-content {
  max-height: 65vh;
  overflow-y: auto;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
}

.survey-questions {
  padding: 0 4px;
}

.survey-q-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.survey-q-item:last-child {
  border-bottom: none;
}

.survey-q-item .q-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.5;
}

.q-answer {
  font-size: 13px;
  color: #606266;
}

.q-answer-label {
  color: #909399;
}

.q-answer-value {
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 760px) {
  .survey-hero,
  .progress-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-progress {
    width: 100%;
    justify-content: space-between;
  }

  .survey-progress,
  .progress-copy,
  .survey-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .step-indicator {
    align-items: flex-start;
    flex-direction: column;
  }

  .question-item {
    padding: 14px;
  }
}
</style>
