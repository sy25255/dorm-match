<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { feedbackApi } from '@/api/feedback'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const showDialog = ref(false)
const feedbacks = ref<any[]>([])
const activeTab = ref<'all' | 'STUDENT' | 'ADMIN'>('all')
const formRef = ref<FormInstance>()

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '示范大学')
const currentRole = computed(() => userStore.role || localStorage.getItem('role') || 'STUDENT')
const currentUsername = computed(() => userStore.username || localStorage.getItem('username') || '未知用户')

const form = ref({
  category: currentRole.value === 'ADMIN' ? 'ADMIN' : 'STUDENT',
  title: '',
  content: '',
})

const rules: FormRules = {
  category: [{ required: true, message: '请选择建议类别', trigger: 'change' }],
  title: [
    { required: true, message: '请输入建议标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入建议内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
}

const filteredFeedbacks = computed(() => {
  if (activeTab.value === 'all') return feedbacks.value
  return feedbacks.value.filter((f: any) => f.category === activeTab.value)
})

const statusMap: Record<string, { text: string; type: string }> = {
  PENDING: { text: '待处理', type: 'warning' },
  REVIEWING: { text: '处理中', type: 'info' },
  ADOPTED: { text: '已采纳', type: 'success' },
  DECLINED: { text: '已回绝', type: 'danger' },
}

const categoryMap: Record<string, { text: string; type: string }> = {
  ADMIN: { text: '管理员建议', type: '' },
  STUDENT: { text: '学生建议', type: 'success' },
}

async function loadFeedbacks() {
  loading.value = true
  try {
    const res = await feedbackApi.getList()
    feedbacks.value = res.data.data || []
  } catch {
    feedbacks.value = []
  } finally {
    loading.value = false
  }
}

function openDialog() {
  form.value = {
    category: currentRole.value === 'ADMIN' ? 'ADMIN' : 'STUDENT',
    title: '',
    content: '',
  }
  showDialog.value = true
}

async function submitFeedback() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await feedbackApi.submit({
        category: form.value.category,
        title: form.value.title,
        content: form.value.content,
      })
      ElMessage.success('建议提交成功，感谢您的反馈！')
      showDialog.value = false
      await loadFeedbacks()
    } catch {
      ElMessage.error('提交失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadFeedbacks)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>建议反馈</h1>
      <p class="page-desc">欢迎提出对系统的改进意见和创新想法，我们会认真对待每一条建议。</p>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="all">全部建议</el-radio-button>
        <el-radio-button value="STUDENT">学生建议</el-radio-button>
        <el-radio-button value="ADMIN">管理员建议</el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="openDialog">
        <el-icon><EditPen /></el-icon> 提交建议
      </el-button>
    </div>

    <div v-loading="loading" class="feedback-list">
      <template v-if="filteredFeedbacks.length">
        <div v-for="item in filteredFeedbacks" :key="item.id" class="feedback-card">
          <div class="card-header">
            <div class="card-meta">
              <el-tag
                :type="categoryMap[item.category]?.type as any || 'info'"
                size="small"
                effect="dark"
              >
                {{ categoryMap[item.category]?.text || item.category }}
              </el-tag>
              <el-tag
                :type="statusMap[item.status]?.type as any || 'info'"
                size="small"
                effect="plain"
              >
                {{ statusMap[item.status]?.text || item.status }}
              </el-tag>
            </div>
            <span class="card-time">{{ item.createdAt?.slice(0, 10) }}</span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-content">{{ item.content }}</p>
          <div class="card-footer">
            <div class="submitter-info">
              <el-icon :size="14"><User /></el-icon>
              <span>{{ item.submitterName }}</span>
              <el-tag size="small" type="info" effect="plain" class="school-tag">
                <el-icon :size="12"><School /></el-icon>
                {{ item.schoolName }}
              </el-tag>
            </div>
            <span v-if="item.reply" class="reply-text">
              <el-icon :size="14"><ChatLineSquare /></el-icon>
              回复：{{ item.reply }}
            </span>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无建议，快来提交第一条吧！" />
    </div>

    <el-dialog
      v-model="showDialog"
      title="提交建议"
      width="580px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" label-position="top">
        <el-form-item label="建议类别" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio value="STUDENT">学生建议</el-radio>
            <el-radio value="ADMIN">管理员建议</el-radio>
          </el-radio-group>
          <div class="form-hint">
            管理员建议：针对系统管理、问卷设计、匹配算法等管理层面的意见；
            学生建议：针对使用体验、功能需求、界面优化等学生端的意见。
          </div>
        </el-form-item>

        <el-form-item label="所属学校">
          <el-input :model-value="schoolName" disabled>
            <template #prefix>
              <el-icon><School /></el-icon>
            </template>
          </el-input>
          <div class="form-hint">建议将自动关联到当前学校，便于追溯来源。</div>
        </el-form-item>

        <el-form-item label="建议标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请用一句简短的话概括你的建议"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="建议内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="请详细描述你的建议或想法，包括遇到的问题、期望的改进方案等..."
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitFeedback">
          提交建议
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 14px;
  color: #909399;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.feedback-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.card-time {
  font-size: 13px;
  color: #c0c4cc;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.card-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  margin-bottom: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.submitter-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.school-tag {
  margin-left: 4px;
}

.reply-text {
  font-size: 13px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
