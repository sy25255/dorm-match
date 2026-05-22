<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SurveyQuestion } from '@/api/survey'

const questions = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const dimensions = ['SLEEP', 'HYGIENE', 'STUDY', 'HOBBY', 'SOCIAL', 'SPENDING', 'PERSONALITY', 'PSYCHOLOGY', 'LIFESTYLE', 'ATTENTION', 'TRAP', 'EXTENSION']

const form = ref({
  id: null as number | null,
  questionCode: '',
  dimension: '',
  questionText: '',
  questionType: 'SINGLE_CHOICE' as string,
  optionsText: '',
  sortOrder: 0,
  isRequired: 1,
  isAttentionCheck: 0,
  status: 1,
})

const questionTypes = [
  { value: 'SINGLE_CHOICE', label: '单选题' },
  { value: 'MULTI_CHOICE', label: '多选题' },
  { value: 'LIKERT5', label: '评分题 5级' },
  { value: 'LIKERT7', label: '评分题 7级' },
  { value: 'TEXT', label: '文本题' },
  { value: 'LONG_TEXT', label: '长文本题' },
  { value: 'DROPDOWN', label: '下拉题' },
  { value: 'VALUE_JUDGE', label: '价值观判断' },
]

const needsOptions = computed(() => form.value.questionType !== 'TEXT' && form.value.questionType !== 'LONG_TEXT')

const optionsPlaceholder = computed(() => {
  if (form.value.questionType === 'LIKERT5' || form.value.questionType === 'LIKERT7') {
    return '1. 非常不同意\n2. 不同意\n3. 一般\n4. 同意\n5. 非常同意'
  }
  return 'A. 选项A\nB. 选项B\nC. 选项C\nD. 选项D'
})

const optionsHint = computed(() => {
  if (form.value.questionType === 'LIKERT5' || form.value.questionType === 'LIKERT7') {
    return '每行一个选项，格式：数字. 文字说明'
  }
  return '每行一个选项，格式：字母. 文字说明'
})

function resetForm() {
  form.value = { id: null, questionCode: '', dimension: '', questionText: '', questionType: 'SINGLE_CHOICE', optionsText: '', sortOrder: 0, isRequired: 1, isAttentionCheck: 0, status: 1 }
}

function optionsJsonToText(optionsJson: string | null): string {
  if (!optionsJson) return ''
  try {
    const arr = JSON.parse(optionsJson) as Array<{ label: string; value: string; text: string }>
    return arr.map(item => `${item.label}. ${item.text}`).join('\n')
  } catch { return '' }
}

function optionsTextToJson(text: string): string | null {
  if (!text.trim()) return null
  const lines = text.trim().split('\n').filter(line => line.trim())
  const arr = lines.map(line => {
    const match = line.match(/^([A-Za-z0-9]+)\.\s*(.+)$/)
    if (match) {
      return { label: match[1], value: match[1], text: match[2].trim() }
    }
    return { label: String(lines.indexOf(line) + 1), value: String(lines.indexOf(line) + 1), text: line.trim() }
  })
  return JSON.stringify(arr)
}

async function loadQuestions() {
  loading.value = true
  try {
    const res = await adminApi.getSurveyQuestions()
    questions.value = res.data.data || []
  } finally { loading.value = false }
}

function openEdit(row?: any) {
  if (row) {
    isEdit.value = true
    form.value = {
      ...row,
      optionsText: row.optionsJson ? optionsJsonToText(typeof row.optionsJson === 'string' ? row.optionsJson : JSON.stringify(row.optionsJson)) : '',
      optionsJson: undefined as any,
    }
  } else {
    isEdit.value = false
    resetForm()
  }
  dialogVisible.value = true
}

async function saveQuestion() {
  try {
    const data: any = { ...form.value }
    data.optionsJson = needsOptions.value ? optionsTextToJson(form.value.optionsText) : null
    delete data.optionsText
    if (isEdit.value && data.id) {
      await adminApi.updateQuestion(data.id, data)
    } else {
      await adminApi.createQuestion(data)
    }
    dialogVisible.value = false
    loadQuestions()
  } catch {
    ElMessage.warning('保存失败，请检查填写内容')
  }
}

async function toggleQuestion(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 0 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${actionText}题目"${row.questionText.slice(0, 20)}..."吗？`, '提示', { type: 'warning' })
    await adminApi.toggleQuestionStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(`题目已${actionText}`)
  } catch {}
}

async function deleteQuestion(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除题目"${row.questionText.slice(0, 20)}..."吗？`, '警告', { type: 'warning' })
    await adminApi.deleteQuestion(row.id)
    loadQuestions()
  } catch {}
}

const dimLabelMap: Record<string, string> = {
  SLEEP: '生活作息', HYGIENE: '卫生习惯', STUDY: '学习习惯', HOBBY: '兴趣爱好',
  SOCIAL: '社交偏好', SPENDING: '消费观念', PERSONALITY: '性格特征', PSYCHOLOGY: '价值观',
  LIFESTYLE: '生活方式', ATTENTION: '注意力检测', TRAP: '验证题', EXTENSION: '扩展信息'
}

const dimCodeHint: Record<string, string> = {
  SLEEP: '如 SLEEP_01', HYGIENE: '如 HYGIENE_01', STUDY: '如 STUDY_01',
  HOBBY: '如 HOBBY_01', SOCIAL: '如 SOCIAL_01', SPENDING: '如 SPEND_01',
  PERSONALITY: '如 PERS_01', PSYCHOLOGY: '如 VALUE_01', LIFESTYLE: '如 LIFE_01',
  ATTENTION: '如 ATTN_01', TRAP: '如 TRAP_01', EXTENSION: '如 EXT_01'
}

onMounted(loadQuestions)
</script>

<template>
  <div>
    <div class="page-toolbar">
      <h2>问卷管理</h2>
      <el-button type="primary" @click="openEdit()">新增题目</el-button>
    </div>

    <el-table :data="questions" v-loading="loading" stripe max-height="calc(100vh - 180px)">
      <el-table-column prop="sortOrder" label="序号" width="60" />
      <el-table-column prop="questionCode" label="编码" width="100" />
      <el-table-column label="维度" width="100">
        <template #default="{ row }">{{ dimLabelMap[row.dimension] || row.dimension }}</template>
      </el-table-column>
      <el-table-column prop="questionText" label="题干" min-width="250" show-overflow-tooltip />
      <el-table-column label="题型" width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ questionTypes.find(t => t.value === row.questionType)?.label || row.questionType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="必答" width="60">
        <template #default="{ row }">{{ row.isRequired ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="70">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleQuestion(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button type="danger" link size="small" @click="deleteQuestion(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '新增题目'" width="650px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item>
              <template #label>
                题目编码
                <el-tooltip placement="top" effect="dark" content="编码是题目的唯一标识，建议用「维度前缀_序号」命名，如 SLEEP_01、HOBBY_02 等">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="form.questionCode" :placeholder="form.dimension ? dimCodeHint[form.dimension] || '如 SLEEP_01' : '如 SLEEP_01'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                排序
                <el-tooltip placement="top" effect="dark" content="数字越小越靠前，控制题目在该维度内的显示顺序">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="form.sortOrder" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属维度">
              <el-select v-model="form.dimension" style="width:100%">
                <el-option v-for="d in dimensions" :key="d" :label="dimLabelMap[d] || d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题目类型">
              <el-select v-model="form.questionType" style="width:100%">
                <el-option v-for="t in questionTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="题干">
          <el-input v-model="form.questionText" type="textarea" :rows="2" placeholder="请输入题目内容，如：您通常的起床时间是？" />
        </el-form-item>
        <el-form-item v-if="needsOptions">
          <template #label>
            选项内容
            <el-tooltip placement="top" effect="dark" :content="optionsHint">
              <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-input
            v-model="form.optionsText"
            type="textarea"
            :rows="Math.max(4, (form.optionsText || '').split('\n').length + 1)"
            :placeholder="optionsPlaceholder"
          />
          <div class="field-hint">{{ optionsHint }}</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item>
              <template #label>
                必答
                <el-tooltip placement="top" effect="dark" content="开启后学生必须回答此题才能提交">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="form.isRequired" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <template #label>
                测谎题
                <el-tooltip placement="top" effect="dark" content="用于检测学生是否认真作答，答错标记无效问卷">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="form.isAttentionCheck" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
.field-hint { margin-top: 4px; font-size: 12px; color: #a0aec0; }
</style>
