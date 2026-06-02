<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { matchApi } from '@/api/match'
import { inviteApi } from '@/api/invite'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { getDefaultRoomCapacity } from '@/api/dormitory'
import SearchView from './Search.vue'
import InvitesView from './Invites.vue'

interface Recommendation {
  studentId: string | number
  name: string
  avatarUrl: string
  collegeName: string
  majorName: string
  bio: string
  matchScore: number
  dimensionScores: Record<string, number>
  commonTags: string[]
}

const activeTab = ref<'recommendations' | 'search' | 'invites'>('recommendations')
const list = ref<Recommendation[]>([])
const loading = ref(false)
const inviting = ref<string | number | null>(null)
const surveyCompleted = ref(false)
const userStore = useUserStore()
const roomCapacity = ref(8)

const headerTitle = computed(() => {
  if (activeTab.value === 'search') return '搜索舍友'
  if (activeTab.value === 'invites') return '邀请管理'
  return '舍友匹配推荐'
})

const headerDesc = computed(() => {
  if (activeTab.value === 'search') return '按学院、专业、班级或关键词找到同学，适合你已经知道想邀请谁的情况。'
  if (activeTab.value === 'invites') return '查看收到和发出的邀请，双方确认后才会形成稳定配对。'
  return '系统根据问卷回答生成候选舍友，你可以先看原因，再决定是否发送邀请。'
})

const sortedList = computed(() => [...list.value].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)))
const topScore = computed(() => sortedList.value[0]?.matchScore || 0)

async function loadRoomCapacity() {
  roomCapacity.value = await getDefaultRoomCapacity()
}

async function checkSurveyCompletion() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('survey_status')
    .eq('id', userStore.userId)
    .single()
  surveyCompleted.value = profile?.survey_status === 'COMPLETED'
}

async function loadRecommendations() {
  if (!surveyCompleted.value) {
    ElMessage.warning('请先完成偏好问卷，再查看匹配推荐')
    return
  }
  loading.value = true
  try {
    const res = await matchApi.getRecommendations()
    list.value = res.data.data || []
  } catch {
    ElMessage.error('加载推荐列表失败')
  } finally {
    loading.value = false
  }
}

async function sendInvite(targetId: string | number) {
  inviting.value = targetId
  try {
    await inviteApi.send({ targetId, message: '' })
    ElMessage.success('邀请已发送')
    activeTab.value = 'invites'
  } catch {
    ElMessage.error('发送邀请失败')
  } finally {
    inviting.value = null
  }
}

function scoreType(score: number) {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

onMounted(async () => {
  await Promise.all([loadRoomCapacity(), checkSurveyCompletion()])
  if (surveyCompleted.value) loadRecommendations()
})
</script>

<template>
  <div class="matches-page">
    <section class="matches-hero">
      <div>
        <p class="eyebrow">{{ userStore.schoolName || '当前学校' }} · {{ roomCapacity }} 人间宿舍</p>
        <h2>{{ headerTitle }}</h2>
        <p>{{ headerDesc }}</p>
      </div>
      <div class="hero-summary">
        <div>
          <strong>{{ sortedList.length }}</strong>
          <span>候选推荐</span>
        </div>
        <div>
          <strong>{{ topScore }}</strong>
          <span>最高匹配度</span>
        </div>
      </div>
    </section>

    <section class="tab-strip">
      <el-radio-group v-model="activeTab">
        <el-radio-button value="recommendations">推荐列表</el-radio-button>
        <el-radio-button value="search">搜索同学</el-radio-button>
        <el-radio-button value="invites">邀请管理</el-radio-button>
      </el-radio-group>
      <el-button v-if="activeTab === 'recommendations'" @click="loadRecommendations" :disabled="!surveyCompleted">刷新推荐</el-button>
    </section>

    <section v-show="activeTab === 'recommendations'" v-loading="loading">
      <el-empty v-if="!surveyCompleted" description="请先完成偏好问卷，系统才能计算匹配推荐">
        <template #extra>
          <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/survey`)">前往填写问卷</el-button>
        </template>
      </el-empty>

      <el-empty v-else-if="sortedList.length === 0 && !loading" description="暂无推荐结果">
        <template #extra>
          <el-button type="primary" @click="loadRecommendations">重新加载推荐</el-button>
        </template>
      </el-empty>

      <div v-else class="match-grid">
        <el-card v-for="item in sortedList" :key="item.studentId" shadow="hover" class="match-card">
          <div class="card-top">
            <div class="person">
              <el-avatar :size="46">{{ item.name?.slice(0, 1) || '同' }}</el-avatar>
              <div>
                <h3>{{ item.name }}</h3>
                <p>{{ item.collegeName || '未设置学院' }} · {{ item.majorName || '未设置专业' }}</p>
              </div>
            </div>
            <el-tag :type="scoreType(item.matchScore) as any" effect="plain">{{ item.matchScore }}%</el-tag>
          </div>

          <div class="score-block">
            <el-progress :percentage="item.matchScore" :stroke-width="10" :status="scoreType(item.matchScore) as any" />
            <span>匹配度越高，说明问卷偏好越接近。</span>
          </div>

          <p class="bio">{{ item.bio || '这位同学还没有填写自我介绍。' }}</p>

          <div class="reason-box">
            <strong>推荐理由</strong>
            <div v-if="item.commonTags?.length" class="tag-list">
              <el-tag v-for="tag in item.commonTags" :key="tag" size="small" type="success" effect="plain">{{ tag }}</el-tag>
            </div>
            <p v-else>系统根据问卷维度计算综合相似度，暂无公开共同标签。</p>
          </div>

          <div class="card-actions">
            <el-button @click="$router.push(`/${$route.params.schoolCode}/matches/${item.studentId}`)">查看详情</el-button>
            <el-button type="primary" :loading="inviting === item.studentId" @click="sendInvite(item.studentId)">
              发送邀请
            </el-button>
          </div>
        </el-card>
      </div>
    </section>

    <section v-if="activeTab === 'search'" class="embedded-view">
      <KeepAlive>
        <SearchView />
      </KeepAlive>
    </section>

    <section v-if="activeTab === 'invites'" class="embedded-view">
      <KeepAlive>
        <InvitesView />
      </KeepAlive>
    </section>
  </div>
</template>

<style scoped>
.matches-page {
  display: grid;
  gap: 18px;
}
.matches-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}
.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}
.matches-hero h2 {
  margin: 0;
  font-size: 24px;
  color: #172033;
}
.matches-hero p {
  margin: 8px 0 0;
  color: #667085;
}
.hero-summary {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.hero-summary div {
  min-width: 94px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  text-align: center;
}
.hero-summary strong {
  display: block;
  font-size: 24px;
  color: #111827;
}
.hero-summary span {
  color: #667085;
  font-size: 12px;
}
.tab-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}
.match-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.match-card {
  border-radius: 8px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.person {
  display: flex;
  gap: 12px;
  min-width: 0;
}
.person h3 {
  margin: 0;
  font-size: 17px;
  color: #172033;
}
.person p {
  margin: 5px 0 0;
  color: #667085;
  font-size: 12px;
}
.score-block {
  margin: 18px 0 12px;
}
.score-block span {
  display: block;
  margin-top: 6px;
  color: #8a95a5;
  font-size: 12px;
}
.bio {
  min-height: 44px;
  color: #475467;
  line-height: 1.6;
}
.reason-box {
  min-height: 80px;
  margin: 14px 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.reason-box strong {
  display: block;
  margin-bottom: 8px;
  color: #172033;
}
.reason-box p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
}
.embedded-view :deep(.page-header) {
  display: none;
}
@media (max-width: 760px) {
  .matches-hero,
  .tab-strip {
    align-items: flex-start;
    flex-direction: column;
  }
  .hero-summary {
    width: 100%;
  }
  .hero-summary div {
    flex: 1;
  }
}
</style>
