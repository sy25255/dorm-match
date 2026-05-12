<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
                  <span class="score-num">{{ detail.totalScore }}</span>
                  <span class="score-unit">%</span>
                </div>
                <span class="score-label">综合匹配度</span>
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
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-card shadow="never">
              <h3>各维度匹配分析</h3>
              <div class="dimension-list">
                <div v-for="(score, dim) in detail.dimensionScores" :key="dim" class="dim-item">
                  <div class="dim-header">
                    <span class="dim-name">{{ dimLabels[dim as string] || dim }}</span>
                    <span class="dim-score" :class="score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low'">
                      {{ score }}%
                    </span>
                  </div>
                  <el-progress
                    :percentage="score"
                    :stroke-width="10"
                    :color="score >= 80 ? '#67c23a' : score >= 60 ? '#e6a23c' : '#f56c6c'"
                  />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </div>
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
  color: #67c23a;
}

.score-unit {
  font-size: 20px;
  color: #67c23a;
}

.score-label {
  display: block;
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
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

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
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
}

.dim-score {
  font-size: 16px;
  font-weight: 600;
}

.dim-score.high { color: #67c23a; }
.dim-score.mid { color: #e6a23c; }
.dim-score.low { color: #f56c6c; }
</style>
