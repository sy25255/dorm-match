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

async function loadRoomCapacity() {
  roomCapacity.value = await getDefaultRoomCapacity()
}

const headerTitle = computed(() => {
  switch (activeTab.value) {
    case 'recommendations': return '舍友匹配推荐'
    case 'search': return '搜索舍友'
    case 'invites': return '邀请管理'
  }
})

const headerDesc = computed(() => {
  switch (activeTab.value) {
    case 'recommendations': return '系统基于你的偏好问卷，为你推荐最匹配的舍友'
    case 'search': return '通过学院→专业→班级精确找到同班同学，或按关键词搜索'
    case 'invites': return '管理收到和发出的舍友邀请'
  }
})

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
    ElMessage.warning('请先完成偏好问卷再查看推荐')
    return
  }
  loading.value = true
  try {
    const res = await matchApi.getRecommendations()
    list.value = res.data.data || []
  } catch { ElMessage.error('加载推荐列表失败') } finally {
    loading.value = false
  }
}

async function sendInvite(targetId: string | number) {
  inviting.value = targetId
  try {
    await inviteApi.send({ targetId, message: '' })
    ElMessage.success('邀请已发送')
  } catch { ElMessage.error('发送邀请失败') } finally {
    inviting.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadRoomCapacity(), checkSurveyCompletion()])
  if (surveyCompleted.value) loadRecommendations()
})
</script>

<template>
  <div class="page-container">
    <div class="unified-header">
      <div class="header-left">
        <h1>{{ headerTitle }}</h1>
        <p>{{ headerDesc }} · <el-tag type="warning" size="small">{{ roomCapacity }}人间宿舍</el-tag></p>
      </div>
      <div class="header-tabs">
        <el-radio-group v-model="activeTab" size="small">
          <el-radio-button value="recommendations">舍友推荐</el-radio-button>
          <el-radio-button value="search">搜索舍友</el-radio-button>
          <el-radio-button value="invites">邀请管理</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-show="activeTab === 'recommendations'" v-loading="loading">
      <el-empty v-if="!surveyCompleted" description="请先完成偏好问卷，系统才能为你推荐匹配的舍友">
        <template #extra>
          <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/survey`)">前往填写问卷</el-button>
        </template>
      </el-empty>
      <el-empty v-else-if="list.length === 0 && !loading" description="暂无推荐，请先提交偏好问卷并触发匹配计算">
      </el-empty>

      <div class="card-grid">
        <el-card v-for="item in list" :key="item.studentId" shadow="hover" class="match-card">
          <div class="match-score">
            <el-progress type="circle" :percentage="item.matchScore" :width="64" :stroke-width="6"
              :color="item.matchScore >= 80 ? '#67c23a' : item.matchScore >= 60 ? '#e6a23c' : '#f56c6c'" />
            <span class="score-label">匹配度</span>
          </div>

          <div class="card-body">
            <h3>{{ item.name }}</h3>
            <p class="card-meta">{{ item.collegeName }} · {{ item.majorName }}</p>
            <p class="card-bio">{{ item.bio || '这个人很懒，什么都没写...' }}</p>

            <div v-if="item.commonTags?.length" class="common-tags">
              <el-tag v-for="tag in item.commonTags" :key="tag" size="small" type="success" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="card-actions">
            <el-button @click="$router.push(`/${$route.params.schoolCode}/matches/${item.studentId}`)" text size="small">查看详情</el-button>
            <el-button type="primary" :loading="inviting === item.studentId"
              @click="sendInvite(item.studentId)">发送邀请</el-button>
          </div>
        </el-card>
      </div>
    </div>

    <div v-if="activeTab === 'search'" class="embedded-view">
      <KeepAlive>
        <SearchView />
      </KeepAlive>
    </div>

    <div v-if="activeTab === 'invites'" class="embedded-view">
      <KeepAlive>
        <InvitesView />
      </KeepAlive>
    </div>
  </div>
</template>

<style scoped>
.match-card {
  text-align: center;
}

.match-score {
  padding: 16px 0;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.card-body {
  padding: 0 8px;
}

.card-body h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.card-meta {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
}

.card-bio {
  font-size: 13px;
  color: #4e5969;
  margin-bottom: 8px;
  min-height: 36px;
}

.common-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 8px;
}

.card-actions {
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unified-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.unified-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
}

.unified-header p {
  margin-top: 8px;
  color: #86909c;
  font-size: 14px;
}

.header-tabs {
  flex-shrink: 0;
  padding-top: 2px;
}

.embedded-view :deep(.page-header) {
  display: none;
}
</style>
