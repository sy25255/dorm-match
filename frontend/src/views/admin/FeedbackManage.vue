<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { feedbackApi } from '@/api/feedback'
import { adminApi } from '@/api/admin'
import { ElMessage, type FormInstance } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '示范大学')

// ========== 反馈管理 ==========
const feedbacks = ref<any[]>([])
const loadingFeedback = ref(false)
const activeTab = ref<'all' | 'DEVELOPER' | 'ADMIN'>('ADMIN')

const replyDialogVisible = ref(false)
const replyFormRef = ref<FormInstance>()
const currentFeedback = ref<any>(null)
const replyForm = ref({ comment: '', status: 'ADOPTED' })

const statusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待处理', type: 'warning' },
  REVIEWING: { label: '处理中', type: 'info' },
  ADOPTED: { label: '已采纳', type: 'success' },
  DECLINED: { label: '已回绝', type: 'danger' },
  RESOLVED: { label: '已解决', type: 'success' },
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
  return (feedbacks.value || []).filter((f: any) => f.targetRole === activeTab.value)
})

const unreadCount = computed(() =>
  (feedbacks.value || []).filter((f: any) => f.status === 'PENDING' && f.targetRole === 'ADMIN').length
)

async function loadFeedbacks() {
  loadingFeedback.value = true
  try {
    const res = await feedbackApi.getAdminList()
    feedbacks.value = res.data.data || []
  } catch {
    feedbacks.value = []
  } finally {
    loadingFeedback.value = false
  }
}

function openReply(row: any) {
  currentFeedback.value = row
  replyForm.value = { comment: '', status: 'ADOPTED' }
  replyDialogVisible.value = true
}

async function submitReply() {
  if (!currentFeedback.value || !replyFormRef.value) return
  await replyFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await feedbackApi.adminReply(currentFeedback.value.id, {
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

// ========== 异议处理 ==========
interface Objection {
  id: number
  allocationId: number
  studentId: number
  studentName: string
  reason: string
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED'
  currentHandler: number | null
  reviewComment: string
  createdAt: string
  resolvedAt?: string
}

const objections = ref<Objection[]>([])
const loadingObjections = ref(false)
const objectionStatusFilter = ref('')
const objectionDetailVisible = ref(false)
const currentObjection = ref<Objection | null>(null)
const objectionForm = ref({ status: 'RESOLVED' as string, comment: '' })
const submittingObjection = ref(false)

const objectionStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待处理' },
  { value: 'REVIEWING', label: '处理中' },
  { value: 'RESOLVED', label: '已解决' },
]

const filteredObjections = computed(() => {
  if (!objectionStatusFilter.value) return objections.value
  return (objections.value || []).filter(o => o.status === objectionStatusFilter.value)
})

const pendingObjectionCount = computed(() =>
  (objections.value || []).filter(o => o.status === 'PENDING').length
)

async function loadObjections() {
  loadingObjections.value = true
  try {
    const res = await adminApi.getObjections()
    objections.value = res.data.data || []
  } catch {
    objections.value = []
  } finally {
    loadingObjections.value = false
  }
}

function showObjectionDetail(item: Objection) {
  currentObjection.value = item
  objectionForm.value = {
    status: item.status === 'PENDING' ? 'REVIEWING' : item.status,
    comment: item.reviewComment || '',
  }
  objectionDetailVisible.value = true
}

async function submitObjectionReply() {
  if (!currentObjection.value) return
  submittingObjection.value = true
  try {
    await adminApi.handleObjection(currentObjection.value.id, {
      status: objectionForm.value.status,
      reviewComment: objectionForm.value.comment,
    })
    currentObjection.value.status = objectionForm.value.status as any
    currentObjection.value.reviewComment = objectionForm.value.comment
    ElMessage.success('异议处理已更新')
    objectionDetailVisible.value = false
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submittingObjection.value = false
  }
}

// ========== 整体 Tab ==========
const mainTab = ref<'feedback' | 'objection'>(route.query.tab === 'objection' ? 'objection' : 'feedback')

watch(() => route.query.tab, (tab) => {
  mainTab.value = tab === 'objection' ? 'objection' : 'feedback'
})

onMounted(() => {
  loadFeedbacks()
  loadObjections()
})
</script>

<template>
  <div>
    <div class="page-toolbar">
      <div>
        <h2>反馈与异议</h2>
        <p class="page-desc">统一管理学生提交的反馈建议和分配结果异议申诉，确保问题及时解决。</p>
      </div>
      <div class="toolbar-badges">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" v-if="mainTab === 'feedback'">
          <el-tag v-if="unreadCount > 0" type="danger" size="large">{{ unreadCount }} 条待反馈</el-tag>
        </el-badge>
        <el-badge :value="pendingObjectionCount" :hidden="pendingObjectionCount === 0" :max="99" v-if="mainTab === 'objection'">
          <el-tag v-if="pendingObjectionCount > 0" type="danger" size="large">{{ pendingObjectionCount }} 条待处理异议</el-tag>
        </el-badge>
      </div>
    </div>

    <el-tabs v-model="mainTab" class="main-tabs">
      <el-tab-pane label="反馈管理" name="feedback">
        <div class="sub-filter-bar">
          <el-radio-group v-model="activeTab" size="default">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="ADMIN">给管理员</el-radio-button>
            <el-radio-button value="DEVELOPER">给开发者</el-radio-button>
          </el-radio-group>
        </div>

        <el-table :data="filteredFeedbacks" v-loading="loadingFeedback" stripe>
          <el-table-column label="发送者" width="100">
            <template #default="{ row }">
              <div class="submitter-cell">
                <el-tag
                  size="small"
                  :type="(row.submitterRole === 'ADMIN' ? 'primary' : row.submitterRole === 'DEVELOPER' ? 'warning' : 'info') as any"
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
              <el-tag :type="(row.targetRole === 'ADMIN' ? 'warning' : 'primary') as any" size="small" effect="dark">
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
              <el-tag :type="(statusMap[row.status]?.type || 'info') as any" size="small">
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

        <el-empty v-if="!loadingFeedback && filteredFeedbacks.length === 0" description="暂无反馈" />
      </el-tab-pane>

      <el-tab-pane name="objection">
        <template #label>
          <span>异议处理</span>
          <el-badge v-if="pendingObjectionCount > 0" :value="pendingObjectionCount" class="tab-badge" />
        </template>

        <div class="sub-filter-bar">
          <el-select v-model="objectionStatusFilter" placeholder="状态筛选" clearable style="width:160px">
            <el-option v-for="o in objectionStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-button @click="loadObjections">刷新</el-button>
        </div>

        <el-table :data="filteredObjections" v-loading="loadingObjections" stripe>
          <el-table-column prop="id" label="编号" width="80" />
          <el-table-column prop="studentName" label="申诉学生" width="120" />
          <el-table-column prop="reason" label="申诉理由" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="(statusMap[row.status]?.type || 'info') as any">
                {{ statusMap[row.status]?.label || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="showObjectionDetail(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loadingObjections && filteredObjections.length === 0" description="暂无异议记录" />
      </el-tab-pane>
    </el-tabs>

    <!-- 反馈处理弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="处理反馈"
      width="550px"
      destroy-on-close
    >
      <div v-if="currentFeedback" class="reply-dialog-content">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="标题">{{ currentFeedback.title }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag v-if="currentFeedback.problemType" size="small" type="danger">
              {{ problemTypeMap[currentFeedback.problemType] || currentFeedback.problemType }}
            </el-tag>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="学生信息">
            {{ currentFeedback.submitterName }}
            <span v-if="currentFeedback.collegeName"> · {{ currentFeedback.collegeName }} / {{ currentFeedback.className }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="反馈内容">{{ currentFeedback.content }}</el-descriptions-item>
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
              placeholder="请输入处理意见或回复内容..."
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

    <!-- 异议处理弹窗 -->
    <el-dialog v-model="objectionDetailVisible" title="处理异议" width="550px" destroy-on-close>
      <template v-if="currentObjection">
        <el-descriptions :column="1" border size="small" style="margin-bottom:20px">
          <el-descriptions-item label="申诉学生">{{ currentObjection.studentName }}</el-descriptions-item>
          <el-descriptions-item label="申诉理由">{{ currentObjection.reason }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentObjection.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="(statusMap[currentObjection.status]?.type || 'info') as any">
              {{ statusMap[currentObjection.status]?.label }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-position="top">
          <el-form-item label="处理结果">
            <el-select v-model="objectionForm.status" style="width:100%">
              <el-option label="标记为处理中" value="REVIEWING" />
              <el-option label="已解决" value="RESOLVED" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理意见">
            <el-input
              v-model="objectionForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入处理意见..."
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="objectionDetailVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingObjection" @click="submitObjectionReply">保存处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
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

.toolbar-badges {
  padding-top: 4px;
}

.main-tabs {
  margin-top: 4px;
}

.sub-filter-bar {
  margin-bottom: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
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

.tab-badge {
  margin-left: 6px;
}
</style>
