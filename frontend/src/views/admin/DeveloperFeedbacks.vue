<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { devApi } from '@/api/dev'
import { ElMessage } from 'element-plus'

const feedbacks = ref<any[]>([])
const loading = ref(false)
const activeTab = ref<'PENDING' | 'ADOPTED' | 'DECLINED' | 'ALL'>('PENDING')

const replyDialogVisible = ref(false)
const currentItem = ref<any>(null)
const replyForm = ref({ comment: '', status: 'ADOPTED' })

const filteredFeedbacks = computed(() => {
  if (activeTab.value === 'ALL') return feedbacks.value
  return feedbacks.value.filter(f => f.status === activeTab.value)
})

const statusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待处理', type: 'warning' },
  REVIEWING: { label: '处理中', type: 'info' },
  ADOPTED: { label: '已采纳', type: 'success' },
  DECLINED: { label: '已回绝', type: 'danger' },
}

const tabCounts = computed(() => ({
  PENDING: feedbacks.value.filter(f => f.status === 'PENDING').length,
  ALL: feedbacks.value.length,
}))

async function loadFeedbacks() {
  loading.value = true
  try {
    const res = await devApi.getDevFeedbacks()
    feedbacks.value = res.data.data || []
  } finally { loading.value = false }
}

function openReply(row: any) {
  currentItem.value = row
  replyForm.value = { comment: row.reply || '', status: row.status || 'ADOPTED' }
  replyDialogVisible.value = true
}

async function submitReply() {
  if (!currentItem.value) return
  try {
    await devApi.replyDevFeedback(currentItem.value.id, {
      reply: replyForm.value.comment,
      status: replyForm.value.status,
    })
    ElMessage.success('反馈已处理')
    replyDialogVisible.value = false
    loadFeedbacks()
  } catch {
    ElMessage.error('处理失败')
  }
}

onMounted(loadFeedbacks)
</script>

<template>
  <div>
    <div class="page-header">
      <h1>用户反馈</h1>
      <p style="color:#6b7280;margin-top:4px">查看所有学生对系统开发者的建议和反馈</p>
    </div>

    <el-card>
      <el-tabs v-model="activeTab" @tab-change="() => {}">
        <el-tab-pane name="PENDING">
          <template #label>
            <span>待处理 <el-badge :value="tabCounts.PENDING" type="warning" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane name="ADOPTED" label="已采纳" />
        <el-tab-pane name="DECLINED" label="已回绝" />
        <el-tab-pane name="ALL" :label="`全部 (${tabCounts.ALL})`" />
      </el-tabs>

      <el-table :data="filteredFeedbacks" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="建议内容" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:#6b7280">{{ row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提交者" width="120">
          <template #default="{ row }">
            <span>{{ row.submitterName }}</span>
            <el-tag size="small" style="margin-left:4px">{{ row.schoolName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusMap[row.status]?.type || 'info') as any">{{ statusMap[row.status]?.label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openReply(row)" :disabled="row.status !== 'PENDING' && row.status !== 'REVIEWING'">
              {{ row.status === 'PENDING' || row.status === 'REVIEWING' ? '处理' : '详情' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredFeedbacks.length === 0" description="暂无反馈" />
    </el-card>

    <el-dialog v-model="replyDialogVisible" title="处理反馈" width="500px" destroy-on-close>
      <div v-if="currentItem" style="margin-bottom:16px">
        <p style="font-weight:600">{{ currentItem.title }}</p>
        <p style="color:#4e5969;margin-top:4px">{{ currentItem.content }}</p>
        <p style="color:#86909c;font-size:12px;margin-top:4px">
          {{ currentItem.submitterName }} · {{ currentItem.schoolName }} · {{ currentItem.createdAt }}
        </p>
      </div>
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="replyForm.status">
            <el-radio value="ADOPTED">采纳</el-radio>
            <el-radio value="DECLINED">回绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyForm.comment" type="textarea" :rows="4" placeholder="回复说明..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 22px; }
</style>
