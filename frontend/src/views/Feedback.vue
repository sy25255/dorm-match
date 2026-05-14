<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { feedbackApi } from '@/api/feedback'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/api/request'

interface College { id: number; name: string; code: string }
interface Major { id: number; name: string; code: string; collegeId?: number }
interface Clazz { id: number; majorId: number; name: string; grade: number }

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const showDialog = ref(false)
const feedbacks = ref<any[]>([])
const activeTab = ref<'all' | 'DEVELOPER' | 'ADMIN'>('all')
const formRef = ref<FormInstance>()

const colleges = ref<College[]>([])
const majors = ref<Major[]>([])
const classes = ref<Clazz[]>([])

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '示范大学')
const currentRole = computed(() => userStore.role || localStorage.getItem('role') || 'STUDENT')

const form = ref({
  targetRole: 'DEVELOPER' as 'DEVELOPER' | 'ADMIN',
  title: '',
  content: '',
  problemType: '' as string,
  collegeId: null as number | null,
  majorId: null as number | null,
  classId: null as number | null,
})

const problemTypes = [
  { value: 'DORM', label: '宿舍问题', desc: '住宿环境、室友矛盾、调换宿舍等' },
  { value: 'FACILITY', label: '设施维修', desc: '水电、门窗、空调、网络等报修' },
  { value: 'ALLOCATION', label: '分配问题', desc: '宿舍分配结果、床位调整等' },
  { value: 'HYGIENE', label: '卫生问题', desc: '公共区域卫生、垃圾处理等' },
  { value: 'OTHER', label: '其他问题', desc: '其他需要管理员处理的事项' },
]

const adminRules: FormRules = {
  targetRole: [{ required: true, message: '请选择反馈对象', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
  problemType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  collegeId: [{ required: true, message: '请选择学院', trigger: 'change' }],
  majorId: [{ required: true, message: '请选择专业', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
}

const devRules: FormRules = {
  targetRole: [{ required: true, message: '请选择反馈对象', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度在 10 到 1000 个字符', trigger: 'blur' },
  ],
}

const currentRules = computed(() => form.value.targetRole === 'ADMIN' ? adminRules : devRules)

const isAdminForm = computed(() => form.value.targetRole === 'ADMIN')

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

const problemTypeMap: Record<string, string> = {
  DORM: '宿舍问题', FACILITY: '设施维修', ALLOCATION: '分配问题', HYGIENE: '卫生问题', OTHER: '其他问题',
}

const targetMap: Record<string, { text: string; type: string; icon: string; desc: string }> = {
  DEVELOPER: { text: '给系统开发者', type: '', icon: '👑', desc: '功能建议 · Bug反馈 · 系统优化' },
  ADMIN: { text: '给管理员', type: 'warning', icon: '🔧', desc: '宿舍管理 · 设施报修 · 分配问题' },
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

async function loadColleges() {
  try { const res = await request.get('/school/colleges'); colleges.value = res.data.data || [] } catch {}
}

watch(() => form.value.collegeId, async (cid) => {
  form.value.majorId = null
  form.value.classId = null
  if (!cid) { majors.value = []; classes.value = []; return }
  try { const res = await request.get('/school/majors', { params: { collegeId: cid } }); majors.value = res.data.data || [] } catch {}
})

watch(() => form.value.majorId, async (mid) => {
  form.value.classId = null
  if (!mid) { classes.value = []; return }
  try { const res = await request.get('/school/classes', { params: { majorId: mid } }); classes.value = res.data.data || [] } catch {}
})

watch(() => form.value.targetRole, () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
})

function getCollegeNameById(id: number | null) {
  if (!id) return ''
  return colleges.value.find(c => c.id === id)?.name || String(id)
}

function getMajorNameById(id: number | null) {
  if (!id) return ''
  return majors.value.find(m => m.id === id)?.name || String(id)
}

function getClassNameById(id: number | null) {
  if (!id) return ''
  return classes.value.find(c => c.id === id)?.name || String(id)
}

function openDialog() {
  form.value = {
    targetRole: 'DEVELOPER',
    title: '',
    content: '',
    problemType: '',
    collegeId: null,
    majorId: null,
    classId: null,
  }
  showDialog.value = true
}

async function submitFeedback() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: any = {
        targetRole: form.value.targetRole,
        title: form.value.title,
        content: form.value.content,
      }
      if (form.value.targetRole === 'ADMIN') {
        payload.problemType = form.value.problemType
        payload.collegeName = getCollegeNameById(form.value.collegeId)
        payload.majorName = getMajorNameById(form.value.majorId)
        payload.className = getClassNameById(form.value.classId)
      }
      await feedbackApi.submit(payload)
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

onMounted(() => { loadFeedbacks(); loadColleges() })
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
              <el-tag v-if="item.problemType" size="small" type="danger" effect="plain">
                {{ problemTypeMap[item.problemType] || item.problemType }}
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
          <div v-if="item.collegeName" class="card-location">
            <el-icon :size="14"><School /></el-icon>
            <span>{{ item.collegeName }}</span>
            <el-icon :size="12" style="margin:0 2px"><ArrowRight /></el-icon>
            <span>{{ item.majorName }}</span>
            <el-icon :size="12" style="margin:0 2px"><ArrowRight /></el-icon>
            <span>{{ item.className }}</span>
          </div>
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
          </div>

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
      width="620px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="currentRules" label-position="top">
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
              <p class="target-desc">功能建议 · Bug反馈 · 系统优化</p>
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
              <p class="target-desc">宿舍管理 · 设施报修 · 分配问题</p>
              <div class="target-check" v-if="form.targetRole === 'ADMIN'">
                <el-icon color="#d48806"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- ====== 给管理员的表单（结构化） ====== -->
        <template v-if="isAdminForm">
          <el-alert type="warning" :closable="false" style="margin-bottom:16px">
            <template #title>
              请仔细填写以下信息，以便管理员快速定位和处理你的问题。
            </template>
          </el-alert>

          <el-form-item label="问题类型" prop="problemType">
            <el-select v-model="form.problemType" placeholder="请选择问题类型" style="width:100%">
              <el-option v-for="pt in problemTypes" :key="pt.value" :label="pt.label" :value="pt.value">
                <div class="problem-option">
                  <span>{{ pt.label }}</span>
                  <span class="problem-option-desc">{{ pt.desc }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="学院" prop="collegeId">
                <el-select v-model="form.collegeId" placeholder="选择学院" style="width:100%">
                  <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="专业" prop="majorId">
                <el-select v-model="form.majorId" placeholder="选择专业" style="width:100%" :disabled="!form.collegeId">
                  <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="班级" prop="classId">
                <el-select v-model="form.classId" placeholder="选择班级" style="width:100%" :disabled="!form.majorId">
                  <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="所属学校">
            <el-input :model-value="schoolName" disabled>
              <template #prefix><el-icon><School /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item label="问题概述" prop="title">
            <el-input
              v-model="form.title"
              placeholder="一句话概括你要反馈的问题，如：M1栋3楼热水供应不足"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="详细描述" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              placeholder="请详细描述：问题发生的具体时间、地点、影响范围、期望的处理方式等..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </template>

        <!-- ====== 给开发者的表单（简洁） ====== -->
        <template v-else>
          <el-form-item label="所属学校">
            <el-input :model-value="schoolName" disabled>
              <template #prefix><el-icon><School /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item label="标题" prop="title">
            <el-input
              v-model="form.title"
              placeholder="简要描述你的功能建议或Bug"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="详细内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              placeholder="详细描述：期望的功能、复现步骤、改进方案等..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </template>
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
  flex-wrap: wrap;
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

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 6px;
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

/* 问题类型选项 */
.problem-option {
  display: flex;
  flex-direction: column;
}

.problem-option-desc {
  font-size: 11px;
  color: #c0c4cc;
}

.form-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
