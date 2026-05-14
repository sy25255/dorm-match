<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { feedbackApi } from '@/api/feedback'
import { ElMessage, type FormInstance } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const feedbacks = ref<any[]>([])
const loading = ref(false)
const activeTab = ref<'all' | 'DEVELOPER' | 'ADMIN'>('ADMIN')

const replyDialogVisible = ref(false)
const replyFormRef = ref<FormInstance>()
const currentItem = ref<any>(null)
const replyForm = ref({ comment: '', status: 'ADOPTED' })

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '示范大学')

const statusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待处理', type: 'warning' },
  REVIEWING: { label: '处理中', type: 'info' },
  ADOPTED: { label: '已采纳', type: 'success' },
  DECLINED: { label: '已回绝', type: 'danger' },
}

const problemTypeMap: Record<string, string> = {
  DORM: '宿舍问题', FACILITY: '设施维修', ALLOCATION: '分配问题', HYGIENE: '卫生问题', OTHER: '其他',
}

const targetMap: Record<string, string> = {
  DEVELOPER: '给开发者',
  ADMIN: '给管理员',
}

const filteredFeedbacks = computed(() => {
  if (activeTab.value === 'all') return feedbacks.value
  return feedbacks.value.filter((f: any) => f.targetRole === activeTab.value)
})

const unreadCount = computed(() =>
  feedbacks.value.filter((f: any) => f.status === 'PENDING' && f.targetRole === 'ADMIN').length
)

async function loadFeedbacks() {
  loading.value = true
  try {
    const res = await feedbackApi.getAdminList()
    feedbacks.value = res.data.data || []
  } catch {
    feedbacks.value = []
  } finally {
    loading.value = false
  }
}

function openReply(row: any) {
  currentItem.value = row
  replyForm.value = { comment: '', status: 'ADOPTED' }
  replyDialogVisible.value = true
}

async function submitReply() {
  if (!currentItem.value || !replyFormRef.value) return
  await replyFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await feedbackApi.adminReply(currentItem.value.id, {
        status: replyForm.value.status,
        reply: replyForm.value.comment,
      })
      const statusLabel = replyForm.value.status === 'ADOPTED' ? '已采纳' : '已回绝'
      ElMessage.success(`已标记为${statusLabel}`)
      replyDialogVisible.value = false
      await loadFeedbacks()
    } catch {
      ElMessage.error('操作失败')
    }
  })
}

onMounted(loadFeedbacks)
</script>

<template>
  <div>
    <div class="page-toolbar">
      <div>
        <h2>反馈管理</h2>
        <p class="page-desc">查看和处理本校学生提交的反馈，确保问题及时解决。</p>
      </div>
      <div>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-tag v-if="unreadCount > 0" type="danger" size="large">{{ unreadCount }} 条待处理</el-tag>
        </el-badge>
      </div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="ADMIN">🔧 给管理员</el-radio-button>
        <el-radio-button value="DEVELOPER">👑 给开发者</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="filteredFeedbacks" v-loading="loading" stripe>
      <el-table-column label="发送者" width="100">
        <template #default="{ row }">
          <div class="submitter-cell">
            <el-tag
              size="small"
              :type="row.submitterRole === 'ADMIN' ? '' : row.submitterRole === 'DEVELOPER' ? 'warning' : 'info'"
              effect="plain"
            >
              {{ row.submitterRole === 'STUDENT' ? '学生' : row.submitterRole === 'ADMIN' ? '管理员' : '开发者' }}
            </el-tag>
            <span>{{ row.submitterName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="反馈对象" width="110">
        <template #default="{ row }">
          <el-tag :type="row.targetRole === 'ADMIN' ? 'warning' : ''" size="small" effect="dark">
            {{ targetMap[row.targetRole] || row.targetRole }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="问题类型" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.problemType" size="small" type="danger" effect="plain">
            {{ problemTypeMap[row.problemType] || row.problemType }}
          </el-tag>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="所属" width="180">
        <template #default="{ row }">
          <span v-if="row.collegeName" class="location-text">
            {{ row.collegeName }} / {{ row.majorName }} / {{ row.className }}
          </span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="提交时间" width="110">
        <template #default="{ row }">{{ row.createdAt?.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="row.targetRole === 'ADMIN' && (row.status === 'PENDING' || row.status === 'REVIEWING')"
            type="primary" link size="small" @click="openReply(row)"
          >
            处理
          </el-button>
          <el-tag v-else-if="row.status === 'ADOPTED'" type="success" size="small" effect="plain">已采纳</el-tag>
          <el-tag v-else-if="row.status === 'DECLINED'" type="danger" size="small" effect="plain">已回绝</el-tag>
          <span v-else style="color:#c0c4cc">开发者处理</span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && filteredFeedbacks.length === 0" description="暂无反馈" />

    <!-- 处理弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="处理反馈"
      width="550px"
      destroy-on-close
    >
      <div v-if="currentItem" class="reply-dialog-content">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag v-if="currentItem.problemType" size="small" type="danger">
              {{ problemTypeMap[currentItem.problemType] || currentItem.problemType }}
            </el-tag>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="学生信息">
            {{ currentItem.submitterName }}
            <span v-if="currentItem.collegeName"> · {{ currentItem.collegeName }} / {{ currentItem.className }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="反馈内容">{{ currentItem.content }}</el-descriptions-item>
        </el-descriptions>

        <el-form ref="replyFormRef" :model="replyForm" label-position="top">
          <el-form-item label="处理结果" required>
            <el-radio-group v-model="replyForm.status">
              <el-radio value="ADOPTED">采纳并解决</el-radio>
              <el-radio value="DECLINED">暂时无法处理</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            label="回复意见"
            :rules="[{ required: true, message: '请填写回复意见', trigger: 'blur' }]"
            prop="comment"
          >
            <el-input
              v-model="replyForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入处理意见或回复内容，学生将在反馈页面看到此回复..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.page-toolbar h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.page-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.filter-bar {
  margin-bottom: 16px;
}

.submitter-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.location-text {
  font-size: 12px;
  color: #909399;
}

.reply-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
