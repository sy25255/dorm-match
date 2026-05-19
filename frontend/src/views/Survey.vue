<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { surveyApi, type AnswerItem } from '@/api/survey'
import { matchApi } from '@/api/match'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'

const router = useRouter()
const route = useRoute()

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
const submitted = ref(false)
const sectionFromDraft = ref<number | null>(null)

const selfIntro = ref({
  hobbies: '',
  personality: '',
  specialConditions: '',
  bio: '',
})

const sections = ref<Section[]>([])

const currentSection = computed(() => sections.value[currentSectionIndex.value] ?? sections.value[0])
const currentQuestions = computed(() => {
  if (!currentSection.value || currentSection.value.key === 'intro') return []
  return questions.value.filter(q => currentSection.value.questionIds.includes(q.id))
})
const isIntroSection = computed(() => currentSection.value?.key === 'intro')
const isLastSection = computed(() => currentSectionIndex.value >= sections.value.length - 1)
const isFirstSection = computed(() => currentSectionIndex.value === 0)
const totalSections = computed(() => sections.value.length)

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
      if (Number(item.questionId) < 0) {
        supplements.value[-Number(item.questionId)] = item.answerValue
      } else {
        answers.value[item.questionId] = item.answerValue
      }
    })
    const savedIntro = JSON.parse(localStorage.getItem('demo_survey_intro') || 'null')
    if (savedIntro) selfIntro.value = { ...selfIntro.value, ...savedIntro }
    const savedSupplements = JSON.parse(localStorage.getItem('demo_survey_supplements') || '{}')
    Object.entries(savedSupplements).forEach(([k, v]) => { supplements.value[Number(k)] = v as string })

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

function getOption(q: Question): OptionItem[] {
  if (!q.optionsJson) return []
  try {
    if (typeof q.optionsJson === 'string') {
      return JSON.parse(q.optionsJson)
    }
    return q.optionsJson as unknown as OptionItem[]
  } catch {
    return []
  }
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

function previousSection() {
  if (currentSectionIndex.value > 0) {
    saveDraft()
    currentSectionIndex.value--
    localStorage.setItem('demo_survey_section', String(currentSectionIndex.value))
  }
}

function nextSection() {
  if (!allRequiredAnswered.value) {
    const count = requiredInSection.value.filter(q => !answers.value[q.id]).length
    ElMessage.warning(`还有 ${count} 道必答题未作答，请先完成所有标注 *必答 的题目`)
    return
  }
  if (currentSectionIndex.value < sections.value.length - 1) {
    saveDraft()
    currentSectionIndex.value++
    localStorage.setItem('demo_survey_section', String(currentSectionIndex.value))
  }
}

function gotoSection(idx: number) {
  saveDraft()
  currentSectionIndex.value = idx
  localStorage.setItem('demo_survey_section', String(idx))
}

async function saveDraft() {
  if (isIntroSection.value) {
    localStorage.setItem('demo_survey_intro', JSON.stringify(selfIntro.value))
    return
  }
  const items: AnswerItem[] = currentQuestions.value
    .filter(q => answers.value[q.id])
    .map(q => ({ questionId: q.id, answerValue: answers.value[q.id] }))
  if (items.length === 0) return
  try {
    await surveyApi.saveDraft(items)
  } catch {}
  localStorage.setItem('demo_survey_supplements', JSON.stringify(supplements.value))
}

function saveIntroDraft() {
  localStorage.setItem('demo_survey_intro', JSON.stringify(selfIntro.value))
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
    }))
    Object.entries(supplements.value).forEach(([qid, val]) => {
      if (val) allItems.push({ questionId: -Number(qid), answerValue: val })
    })
    allItems.push({ questionId: -1, answerValue: JSON.stringify(selfIntro.value) })
    await surveyApi.submit(allItems)
    const userId = localStorage.getItem('userId') || '0'
    localStorage.removeItem('demo_survey_intro')
    localStorage.removeItem('demo_survey_supplements')
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
    <div class="page-header">
      <h1>偏好调查问卷</h1>
      <p>请认真如实填写，这将帮助系统精准匹配与你最合拍的舍友（预计约12-15分钟）</p>
    </div>

    <div v-if="submitted" class="submitted-box">
      <el-result icon="success" title="问卷已提交" sub-title="你已完成偏好问卷，系统已根据你的回答生成了智能匹配结果">
        <template #extra>
          <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/matches`)">查看匹配推荐</el-button>
        </template>
      </el-result>
    </div>

    <template v-else-if="sections.length > 0">
      <el-progress
        :percentage="Math.round((currentSectionIndex + 1) / totalSections * 100)"
        :stroke-width="8"
        class="survey-progress"
      />

      <div class="section-nav">
        <el-tag
          v-for="(sec, idx) in sections"
          :key="sec.key"
          size="default"
          :effect="idx === currentSectionIndex ? 'dark' : 'plain'"
          :type="idx < currentSectionIndex ? 'success' : idx === currentSectionIndex ? 'primary' : 'info'"
          class="section-tag"
          @click="idx <= currentSectionIndex ? gotoSection(idx) : undefined"
          :style="{ cursor: idx <= currentSectionIndex ? 'pointer' : 'default' }"
        >
          <template v-if="idx < currentSectionIndex">✓</template>
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
            第 {{ currentSectionIndex + 1 }} / {{ totalSections }} 部分（本部分 {{ answeredInSection }}/{{ totalInSection }} 已答）
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
                @update:model-value="(vals: string[]) => { answers[q.id] = vals.join(',') }"
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
            <el-button @click="previousSection" :disabled="isFirstSection">上一部分</el-button>
            <el-button @click="saveDraft" type="info" plain>暂存草稿</el-button>
            <el-button v-if="!isLastSection" type="primary" @click="nextSection">下一部分</el-button>
            <el-button v-else type="primary" :loading="loading" @click="handleSubmit">前往自我介绍</el-button>
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
            <el-button @click="previousSection">上一部分</el-button>
            <el-button @click="saveDraft" type="info" plain>暂存草稿</el-button>
            <el-button type="primary" :loading="loading" @click="handleSubmit">提交问卷</el-button>
          </div>
        </el-card>
      </template>
    </template>

    <el-empty v-else description="加载中..." />
  </div>
</template>

<style scoped>
.survey-progress {
  margin-bottom: 12px;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.section-tag {
  font-size: 12px;
  transition: all 0.2s;
}

.section-header {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 10px;
  border-left: 4px solid var(--sec-color, #1890ff);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
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
  max-width: 800px;
}

.step-indicator {
  font-size: 13px;
  color: #86909c;
  text-align: center;
}

.question-item {
  margin-bottom: 28px;
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
  justify-content: center;
  gap: 12px;
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
</style>
