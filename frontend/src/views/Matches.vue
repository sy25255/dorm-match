<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { matchApi } from '@/api/match'
import { inviteApi } from '@/api/invite'
import { ElMessage } from 'element-plus'

interface Recommendation {
  studentId: number
  name: string
  avatarUrl: string
  collegeName: string
  majorName: string
  bio: string
  matchScore: number
  dimensionScores: Record<string, number>
  commonTags: string[]
}

const list = ref<Recommendation[]>([])
const loading = ref(false)
const inviting = ref<number | null>(null)

async function loadRecommendations() {
  loading.value = true
  try {
    const res = await matchApi.getRecommendations()
    list.value = res.data.data || []
  } catch { ElMessage.error('加载推荐列表失败') } finally {
    loading.value = false
  }
}

async function sendInvite(targetId: number) {
  inviting.value = targetId
  try {
    await inviteApi.send({ targetId, message: '' })
    ElMessage.success('邀请已发送')
  } catch { ElMessage.error('发送邀请失败') } finally {
    inviting.value = null
  }
}

onMounted(loadRecommendations)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>舍友匹配推荐</h1>
      <p>系统基于你的偏好问卷，为你推荐最匹配的舍友</p>
    </div>

    <div v-loading="loading">
      <el-empty v-if="list.length === 0 && !loading" description="暂无推荐，请先提交偏好问卷并触发匹配计算">
        <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/survey`)">去填写问卷</el-button>
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
</style>
