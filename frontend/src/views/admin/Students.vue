<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { adminApi } from '@/api/admin'
import { schoolApi } from '@/api/school'
import { ElMessage, ElMessageBox } from 'element-plus'

interface College { id: number; name: string }
interface Major { id: number; name: string; code: string; collegeId?: number }
interface Clazz { id: number; majorId: number; name: string; grade: number }

const students = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const filterCollegeId = ref<number | null>(null)
const filterMajorId = ref<number | null>(null)
const filterClassId = ref<number | null>(null)
const filterStatus = ref<number | null>(null)

const allColleges = ref<College[]>([])
const availableMajors = ref<Major[]>([])
const availableClasses = ref<Clazz[]>([])
const inviteCodeDialog = ref(false)
const inviteCodes = ref<any[]>([])
const editDialogVisible = ref(false)
const isEdit = ref(false)

const form = ref({
  id: null as string | number | null,
  studentNo: '', name: '', gender: 1,
  collegeId: null as number | null, collegeName: '',
  majorId: null as number | null, majorName: '',
  classId: null as number | null, className: '',
  hometown: '', status: 1,
})

function resetForm() {
  form.value = { id: null, studentNo: '', name: '', gender: 1, collegeId: null, collegeName: '', majorId: null, majorName: '', classId: null, className: '', hometown: '', status: 1 }
}

watch(filterCollegeId, async (cid) => {
  filterMajorId.value = null
  filterClassId.value = null
  if (!cid) { availableMajors.value = []; availableClasses.value = []; return }
  try { const res = await schoolApi.getMajors(cid); availableMajors.value = res.data.data || [] } catch { ElMessage.error('加载专业列表失败') }
})

watch(filterMajorId, async (mid) => {
  filterClassId.value = null
  if (!mid) { availableClasses.value = []; return }
  try { const res = await schoolApi.getClasses(mid); availableClasses.value = res.data.data || [] } catch { ElMessage.error('加载班级列表失败') }
})

watch(() => form.value.collegeId, async (cid) => {
  form.value.majorId = null; form.value.classId = null
  availableClasses.value = []
  if (cid) {
    form.value.collegeName = allColleges.value.find(c => c.id === cid)?.name || ''
    try { const res = await schoolApi.getMajors(cid); availableMajors.value = res.data.data || [] } catch { ElMessage.error('加载专业列表失败') }
  } else {
    availableMajors.value = []
  }
})

watch(() => form.value.majorId, async (mid) => {
  form.value.classId = null
  if (mid && form.value.collegeId) {
    try { const res = await schoolApi.getMajors(form.value.collegeId)
      const list = res.data.data || []
      form.value.majorName = list.find((m: any) => m.id === mid)?.name || ''
    } catch { ElMessage.error('加载院系列表失败') }
    try { const res = await schoolApi.getClasses(mid); availableClasses.value = res.data.data || [] } catch { ElMessage.error('加载班级列表失败') }
  } else {
    availableClasses.value = []
  }
})

watch(() => form.value.classId, (cid) => {
  if (cid) form.value.className = availableClasses.value.find(c => c.id === cid)?.name || ''
})

const filteredStudents = computed(() => {
  return (students.value || []).filter(s => {
    if (searchKeyword.value && !String(s.name || '').includes(searchKeyword.value) && !String(s.studentNo || '').includes(searchKeyword.value)) return false
    if (filterCollegeId.value && s.collegeName !== allColleges.value.find(c => c.id === filterCollegeId.value)?.name) return false
    if (filterClassId.value && s.className !== availableClasses.value.find(c => c.id === filterClassId.value)?.name) return false
    if (filterStatus.value !== null && filterStatus.value !== undefined && s.status !== filterStatus.value) return false
    return true
  })
})

const surveyStatusMap: Record<number, string> = { 0: '未填写', 1: '填写中', 2: '已完成' }
const matchStatusMap: Record<number, string> = { 0: '待匹配', 1: '邀请中', 2: '已配对', 3: '已分配' }

async function loadColleges() {
  try {
    const res = await schoolApi.getColleges()
    allColleges.value = res.data.data || []
  } catch { ElMessage.error('加载院系列表失败') }
}

async function loadStudents() {
  loading.value = true
  try {
    const res = await adminApi.getStudents({ size: 1000 })
    const payload = res.data.data || {}
    students.value = Array.isArray(payload) ? payload : payload.items || []
  } catch {
    ElMessage.error('加载学生列表失败')
  } finally { loading.value = false }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确认${newStatus === 0 ? '禁用' : '启用'}学生"${row.name}"吗？`, '提示', { type: 'warning' })
    await adminApi.toggleStudent(row.id, newStatus)
    row.status = newStatus
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('操作失败')
  }
}

function openEdit(row?: any) {
  if (row) {
    isEdit.value = true
    form.value = { ...row, collegeId: row.collegeId || 1, majorId: row.majorId || 1, classId: row.classId || null }
  } else {
    isEdit.value = false
    resetForm()
  }
  editDialogVisible.value = true
}

async function saveStudent() {
  try {
    const data = { ...form.value }
    if (isEdit.value && data.id) {
      await adminApi.updateStudent(data.id, data)
    } else {
      await adminApi.createStudent(data)
    }
    editDialogVisible.value = false
    loadStudents()
  } catch { ElMessage.error('保存学生信息失败，请重试') }
}

async function loadInviteCodes() {
  const res = await adminApi.getInviteCodes(); inviteCodes.value = res.data.data || []; inviteCodeDialog.value = true
}
async function generateCode() {
  const res = await adminApi.generateInviteCode()
  const row = res.data.data || {}
  inviteCodes.value.unshift({
    code: row.code,
    isUsed: row.is_used ?? row.isUsed ?? false,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  })
}

onMounted(() => { loadStudents(); loadColleges() })
</script>

<template>
  <div>
    <div class="page-toolbar">
      <h2>学生管理</h2>
      <div class="toolbar-right">
        <el-input v-model="searchKeyword" placeholder="搜索学号/姓名" clearable style="width:180px" />
        <el-select v-model="filterCollegeId" placeholder="学院" clearable style="width:140px">
          <el-option v-for="c in allColleges" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filterMajorId" placeholder="专业" clearable style="width:160px" :disabled="!filterCollegeId">
          <el-option v-for="m in availableMajors" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-select v-model="filterClassId" placeholder="班级" clearable style="width:160px" :disabled="!filterMajorId">
          <el-option v-for="c in availableClasses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width:100px">
          <el-option label="正常" :value="1" />
          <el-option label="已禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadInviteCodes">邀请学生</el-button>
      </div>
    </div>

    <el-table :data="filteredStudents" v-loading="loading" stripe>
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="name" label="姓名" width="90" />
      <el-table-column prop="gender" label="性别" width="60"><template #default="{ row }">{{ row.gender === 1 ? '男' : '女' }}</template></el-table-column>
      <el-table-column prop="collegeName" label="学院" width="120" />
      <el-table-column prop="majorName" label="专业" width="150" />
      <el-table-column prop="className" label="班级" width="120" />
      <el-table-column prop="hometown" label="生源地" width="80" />
      <el-table-column prop="surveyStatus" label="问卷" width="80">
        <template #default="{ row }"><el-tag :type="row.surveyStatus === 2 ? 'success' : row.surveyStatus === 1 ? 'warning' : 'info'" size="small">{{ surveyStatusMap[row.surveyStatus] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="matchStatus" label="匹配" width="80">
        <template #default="{ row }"><el-tag :type="row.matchStatus >= 2 ? 'success' : row.matchStatus === 1 ? 'warning' : 'info'" size="small">{{ matchStatusMap[row.matchStatus] }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="status" label="账号" width="70">
        <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'danger' : 'success'" link size="small" @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑学生' : '新增学生'" width="550px">
      <el-form :model="form" label-width="80px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="学号"><el-input v-model="form.studentNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="性别"><el-radio-group v-model="form.gender"><el-radio :value="1">男</el-radio><el-radio :value="0">女</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生源地"><el-input v-model="form.hometown" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="学院">
              <el-select v-model="form.collegeId" style="width:100%" placeholder="选择学院">
                <el-option v-for="c in allColleges" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="专业">
              <el-select v-model="form.majorId" style="width:100%" placeholder="选择专业" :disabled="!form.collegeId">
                <el-option v-for="m in availableMajors" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="班级">
              <el-select v-model="form.classId" style="width:100%" placeholder="选择班级" :disabled="!form.majorId">
                <el-option v-for="c in availableClasses" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="editDialogVisible = false">取消</el-button><el-button type="primary" @click="saveStudent">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="inviteCodeDialog" title="邀请码管理" width="500px">
      <div style="margin-bottom:12px"><el-button type="primary" @click="generateCode">生成新邀请码</el-button></div>
      <el-table :data="inviteCodes" size="small">
        <el-table-column prop="code" label="邀请码" width="200" />
        <el-table-column prop="isUsed" label="状态" width="100"><template #default="{ row }"><el-tag :type="row.isUsed ? 'info' : 'success'" size="small">{{ row.isUsed ? '已使用' : '未使用' }}</el-tag></template></el-table-column>
        <el-table-column prop="createdAt" label="生成时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
</style>
