<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchApi } from '@/api/match'
import { inviteApi } from '@/api/invite'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const targetId = Number(route.params.targetId)

const detail = ref<any>(null)
const loading = ref(false)
const inviting = ref(false)

const showSurveyDialog = ref(false)
const targetSurvey = ref<any>(null)
const surveyLoading = ref(false)
const activeSurveySections = ref<string[]>([])

const dimLabels: Record<string, string> = {
  LIFESTYLE: '生活习惯',
  SLEEP: '生活作息',
  HYGIENE: '卫生习惯',
  SOCIAL: '社交偏好',
  PERSONALITY: '性格特征',
  STUDY: '学习习惯',
  HOBBY: '兴趣爱好',
  SPENDING: '消费观念',
  PSYCHOLOGY: '心理特质',
}

const dimIcons: Record<string, string> = {
  sleep: '🛏️',
  hygiene: '🧹',
  study: '📚',
  hobby: '🎮',
  social: '👥',
  spending: '💰',
  personality: '🎭',
  basic: '📋',
  extension: '📝',
  scenario: '⚖️',
  attention: '🔍',
  intro: '👤',
}

const coreDimensionsGreen = computed(() => {
  if (!detail.value?.dimensionScores) return false
  const ds = detail.value.dimensionScores
  return (ds.LIFESTYLE ?? 0) >= 80 && (ds.SLEEP ?? 0) >= 80 && (ds.HYGIENE ?? 0) >= 80
})

const scoreColor = computed(() => coreDimensionsGreen.value ? '#67c23a' : '#e6a23c')

const dimensionNames = ['LIFESTYLE', 'SLEEP', 'HYGIENE']

const sortedDimensions = computed(() => {
  if (!detail.value?.dimensionScores) return []
  const ds = { ...detail.value.dimensionScores }
  const entries: { key: string; label: string; score: number }[] = []
  const dimOrder = ['LIFESTYLE', 'SLEEP', 'HYGIENE', 'SOCIAL', 'PERSONALITY', 'STUDY', 'HOBBY', 'SPENDING', 'PSYCHOLOGY']
  dimOrder.forEach(key => {
    if (ds[key] !== undefined) {
      entries.push({ key, label: dimLabels[key] || key, score: ds[key] })
    }
  })
  return entries
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await matchApi.getDetail(targetId)
    detail.value = res.data.data
  } catch {
    ElMessage.error('获取详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

async function sendInvite() {
  inviting.value = true
  try {
    await inviteApi.send({ targetId, message: '' })
    ElMessage.success('邀请已发送')
  } catch {} finally {
    inviting.value = false
  }
}

async function viewSurvey() {
  surveyLoading.value = true
  try {
    const res = await matchApi.getStudentSurvey(targetId)
    targetSurvey.value = res.data.data
    showSurveyDialog.value = true
  } catch {
    ElMessage.error('获取问卷失败')
  } finally {
    surveyLoading.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="page-container">
    <div v-loading="loading">
      <template v-if="detail">
        <div class="page-header">
          <el-button @click="$router.back()" text>
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <h1 style="margin-top: 12px;">{{ detail.name }} 的匹配详情</h1>
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="info-card">
              <div class="profile-section">
                <el-avatar :size="80">{{ detail.name?.charAt(0) }}</el-avatar>
                <h2>{{ detail.name }}</h2>
                <p>{{ detail.hometown || '未填写生源地' }}</p>
                <p class="bio">{{ detail.bio || '这个人很懒，什么都没写...' }}</p>
                <el-tag v-if="detail.mayBeDormLeader" type="warning" size="small" effect="dark" style="margin-top:8px;">🔑 可能适合做舍长</el-tag>
              </div>
              <el-divider />
              <div class="score-section">
                <div class="total-score">
                  <span class="score-num" :style="{ color: scoreColor }">{{ detail.totalScore }}</span>
                  <span class="score-unit" :style="{ color: scoreColor }">%</span>
                </div>
                <span class="score-label">综合匹配度</span>
              </div>
              <div v-if="!coreDimensionsGreen" class="score-tip">
                <el-icon color="#e6a23c"><WarningFilled /></el-icon>
                <span>核心维度（生活习惯/生活作息/卫生习惯）未全部达标，综合匹配度仅供参考</span>
              </div>
              <div v-else class="score-tip green">
                <el-icon color="#67c23a"><SuccessFilled /></el-icon>
                <span>三大核心维度匹配良好</span>
              </div>
              <el-divider />
              <div class="tag-section">
                <h4>共同点</h4>
                <div class="tag-list">
                  <el-tag v-for="tag in detail.commonTags" :key="tag" type="success" effect="plain" size="small">
                    {{ tag }}
                  </el-tag>
                  <span v-if="!detail.commonTags?.length" class="no-tags">暂无共同标签</span>
                </div>
              </div>
              <el-button type="primary" size="large" :loading="inviting" class="invite-btn" @click="sendInvite">
                发送邀请
              </el-button>
              <el-button size="large" class="survey-btn" @click="viewSurvey" :loading="surveyLoading">
                <el-icon><Document /></el-icon> 查看问卷
              </el-button>
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-card shadow="never">
              <h3>各维度匹配分析</h3>
              <p class="dim-tip">⭐ 生活习惯、生活作息、卫生习惯为核心匹配维度</p>
              <div class="dimension-list">
                <div v-for="item in sortedDimensions" :key="item.key" class="dim-item">
                  <div class="dim-header">
                    <span class="dim-name">
                      <span v-if="dimensionNames.includes(item.key)" class="core-badge">核心</span>
                      {{ item.label }}
                    </span>
                    <span class="dim-score" :class="item.score >= 80 ? 'high' : item.score >= 60 ? 'mid' : 'low'">
                      {{ item.score }}%
                    </span>
                  </div>
                  <el-progress
                    :percentage="item.score"
                    :stroke-width="10"
                    :color="item.score >= 80 ? '#67c23a' : item.score >= 60 ? '#e6a23c' : '#f56c6c'"
                  />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </div>

    <!-- 查看问卷弹窗 -->
    <el-dialog
      v-model="showSurveyDialog"
      :title="`${detail?.name || ''} 的偏好问卷`"
      width="800px"
      top="5vh"
      destroy-on-close
    >
      <div v-if="targetSurvey" class="survey-dialog-content">
        <el-alert
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #title>
            温馨提示：以下仅展示非敏感维度问卷内容，心理特质、价值观判断等隐私问题已隐藏。
          </template>
        </el-alert>
        <el-collapse v-model="activeSurveySections" v-if="targetSurvey.sections?.length">
          <el-collapse-item
            v-for="sec in targetSurvey.sections"
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
        <el-empty v-else description="该同学暂未填写问卷" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.info-card {
  text-align: center;
}

.profile-section {
  padding: 8px 0;
}

.profile-section h2 {
  margin-top: 12px;
  font-size: 18px;
}

.profile-section p {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

.bio {
  margin-top: 8px !important;
  color: #4e5969 !important;
  line-height: 1.6;
}

.score-section {
  padding: 8px 0;
}

.score-num {
  font-size: 48px;
  font-weight: 700;
}

.score-unit {
  font-size: 20px;
}

.score-label {
  display: block;
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}

.score-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #e6a23c;
  margin-top: 8px;
  padding: 6px 12px;
  background: #fdf6ec;
  border-radius: 6px;
}

.score-tip.green {
  color: #67c23a;
  background: #f0f9eb;
}

.tag-section {
  text-align: left;
}

.tag-section h4 {
  font-size: 14px;
  margin-bottom: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.no-tags {
  font-size: 13px;
  color: #c9cdd4;
}

.invite-btn {
  width: 100%;
  margin-top: 16px;
}

.survey-btn {
  width: 100%;
  margin-top: 10px;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
}

.dim-tip {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 8px;
  margin-bottom: 0;
}

.dim-item {
  padding: 0;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.dim-name {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.core-badge {
  display: inline-block;
  font-size: 10px;
  color: #fff;
  background: #e6a23c;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

.dim-score {
  font-size: 16px;
  font-weight: 600;
}

.dim-score.high { color: #67c23a; }
.dim-score.mid { color: #e6a23c; }
.dim-score.low { color: #f56c6c; }

/* 问卷弹窗样式 */
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

.q-text {
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
</style>
