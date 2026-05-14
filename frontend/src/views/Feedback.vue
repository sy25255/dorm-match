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
const activeTab = ref<'all' | 'DEVELOPER' | 'ADMIN'>('all')
const formRef = ref<FormInstance>()

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '示范大学')
const currentRole = computed(() => userStore.role || localStorage.getItem('role') || 'STUDENT')
const currentUsername = computed(() => userStore.username || localStorage.getItem('username') || '未知用户')
const isDev = computed(() => currentRole.value === 'DEVELOPER')

const form = ref({
  targetRole: 'DEVELOPER' as 'DEVELOPER' | 'ADMIN',
  title: '',
  content: '',
})

const rules: FormRules = {
  targetRole: [{ required: true, message: '请选择反馈对象', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
}

const filteredFeedbacks = computed(() => {
  if (activeTab.value === 'all') return feedbacks.value
  return feedbacks.value.filter((f: any) => f.targetRole === activeTab.value)
})

const statusMap: Record<string, { text: string; type: string }> = {
  PENDING: { text: '待处理', type: 'warning' },
  REVIEWING: { text: '处理中', type: 'info' },
  ADOPTED: { text: '已采纳', type: 'success' },
  DECLINED: { text: '已回绝', type: 'danger' },
}

const targetMap: Record<string, { text: string; type: string; icon: string; desc: string }> = {
  DEVELOPER: { text: '给系统开发者', type: '', icon: '👑', desc: '发给系统开发者，适用于功能建议、Bug反馈、系统优化等' },
  ADMIN: { text: '给管理员', type: 'warning', icon: '🔧', desc: '发给学校管理员，适用于宿舍管理、分配问题、学校事务等' },
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
    targetRole: 'DEVELOPER',
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
        targetRole: form.value.targetRole,
        title: form.value.title,
        content: form.value.content,
      })
      const targetName = form.value.targetRole === 'DEVELOPER' ? '系统开发者' : '管理员'
      ElMessage.success(`已向${targetName}提交，感谢您的反馈！`)
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
      <p class="page-desc">选择反馈对象，你的消息将准确传达给对应的人处理。</p>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="DEVELOPER">
          <span style="display:flex;align-items:center;gap:4px">👑 给开发者</span>
        </el-radio-button>
        <el-radio-button value="ADMIN">
          <span style="display:flex;align-items:center;gap:4px">🔧 给管理员</span>
        </el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="openDialog">
        <el-icon><EditPen /></el-icon> 提交反馈
      </el-button>
    </div>

    <div v-loading="loading" class="feedback-list">
      <template v-if="filteredFeedbacks.length">
        <div v-for="item in filteredFeedbacks" :key="item.id" class="feedback-card">
          <div class="card-header">
            <div class="card-meta">
              <el-tag
                :type="targetMap[item.targetRole]?.type as any || 'info'"
                size="small"
                effect="dark"
                class="target-tag"
              >
                {{ targetMap[item.targetRole]?.icon }} {{ targetMap[item.targetRole]?.text || item.targetRole }}
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
              <el-tag size="small" type="info" effect="plain" class="role-tag">
                {{ item.submitterRole === 'DEVELOPER' ? '👑 开发者' : item.submitterRole === 'ADMIN' ? '🔧 管理员' : '👤 学生' }}
              </el-tag>
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

          <!-- 回复区域 -->
          <div v-if="item.reply" class="reply-section">
            <div class="reply-header">
              <el-icon :size="14"><ChatLineSquare /></el-icon>
              <span class="reply-from">{{ item.replierRole === 'DEVELOPER' ? '系统开发者' : '管理员' }} 回复：</span>
            </div>
            <p class="reply-content">{{ item.reply }}</p>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无反馈，快来提交第一条吧！" />
    </div>

    <!-- 提交弹窗 -->
    <el-dialog
      v-model="showDialog"
      title="提交反馈"
      width="580px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="top">
        <el-form-item label="反馈给谁" prop="targetRole">
          <div class="target-select">
            <div
              class="target-card"
              :class="{ selected: form.targetRole === 'DEVELOPER' }"
              @click="form.targetRole = 'DEVELOPER'"
            >
              <div class="target-card-header">
                <span class="target-icon">👑</span>
                <span class="target-name">系统开发者</span>
              </div>
              <p class="target-desc">功能建议 · Bug反馈 · 系统优化 · 新增需求</p>
              <div class="target-check" v-if="form.targetRole === 'DEVELOPER'">
                <el-icon color="#722ed1"><CircleCheckFilled /></el-icon>
              </div>
            </div>
            <div
              class="target-card"
              :class="{ selected: form.targetRole === 'ADMIN' }"
              @click="form.targetRole = 'ADMIN'"
            >
              <div class="target-card-header">
                <span class="target-icon">🔧</span>
                <span class="target-name">学校管理员</span>
              </div>
              <p class="target-desc">宿舍管理 · 分配问题 · 学校事务 · 日常反馈</p>
              <div class="target-check" v-if="form.targetRole === 'ADMIN'">
                <el-icon color="#d48806"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="所属学校">
          <el-input :model-value="schoolName" disabled>
            <template #prefix>
              <el-icon><School /></el-icon>
            </template>
          </el-input>
          <div class="form-hint">反馈将自动关联到当前学校，便于追溯来源。</div>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            :placeholder="form.targetRole === 'DEVELOPER' ? '简要描述你的功能建议或Bug' : '简要描述需要管理员处理的问题'"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="详细内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            :placeholder="form.targetRole === 'DEVELOPER' ? '详细描述：期望的功能、复现步骤、改进方案等...' : '详细描述：遇到的问题、期望的处理方式、相关背景等...'"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitFeedback">
          提交反馈
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

.target-tag {
  font-weight: 600;
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
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.submitter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.role-tag {
  flex-shrink: 0;
}

.school-tag {
  margin-left: 4px;
}

.reply-section {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #67c23a;
  font-weight: 600;
  margin-bottom: 6px;
}

.reply-content {
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
  margin: 0;
}

.reply-text {
  font-size: 13px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 目标选择卡片 */
.target-select {
  display: flex;
  gap: 16px;
  width: 100%;
}

.target-card {
  flex: 1;
  border: 2px solid #e5e6eb;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  text-align: center;
}

.target-card:hover {
  border-color: #c0c4cc;
}

.target-card.selected {
  border-color: #722ed1;
  background: #f9f0ff;
}

.target-card:last-child.selected {
  border-color: #d48806;
  background: #fffbe6;
}

.target-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.target-icon {
  font-size: 24px;
}

.target-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.target-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

.target-check {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
}

.form-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
