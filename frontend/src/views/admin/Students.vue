<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const students = ref<any[]>([])
const rosters = ref<any[]>([])
const loading = ref(false)
const rosterLoading = ref(false)
const activeTab = ref('rosters')
const searchKeyword = ref('')
const rosterStatus = ref('')
const importDialogVisible = ref(false)
const resetDialogVisible = ref(false)
const importText = ref('')
const importErrors = ref<string[]>([])
const resetCode = ref('')
const resetTarget = ref<any>(null)

const importTemplate = [
  '学号,姓名,性别,学院,专业,班级,初始码',
  '20260001,张三,男,信息科学技术学院,计算机科学与技术,计科2601班,A12345',
  '20260002,李四,女,信息科学技术学院,软件工程,软件2601班,B12345',
].join('\n')

const filteredRosters = computed(() => {
  return (rosters.value || []).filter(row => {
    const keyword = searchKeyword.value.trim()
    if (keyword && !String(row.name || '').includes(keyword) && !String(row.studentNo || '').includes(keyword)) return false
    if (rosterStatus.value && row.activationStatus !== rosterStatus.value) return false
    return true
  })
})

const filteredStudents = computed(() => {
  return (students.value || []).filter(row => {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return true
    return String(row.name || '').includes(keyword) || String(row.studentNo || '').includes(keyword)
  })
})

const statusLabel: Record<string, string> = {
  PENDING: '未激活',
  ACTIVE: '已激活',
  DISABLED: '已禁用',
}

const surveyStatusMap: Record<number, string> = {
  0: '未填写',
  1: '填写中',
  2: '已完成',
  3: '需重填',
}

const matchStatusMap: Record<number, string> = {
  0: '待匹配',
  1: '邀请中',
  2: '已配对',
  3: '已分配',
}

function genderToNumber(value: string) {
  const text = String(value || '').trim()
  if (text === '女' || text === '0' || /^female$/i.test(text)) return 0
  return 1
}

function parseRosterText(text: string) {
  importErrors.value = []
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const rows: any[] = []
  for (const [index, line] of lines.entries()) {
    if (index === 0 && /学号|student/i.test(line)) continue
    const cols = line.split(',').map(col => col.trim())
    const lineNo = index + 1
    if (cols.length < 7 || cols.slice(0, 7).some(col => !col)) {
      importErrors.value.push(`第 ${lineNo} 行缺少必填字段`)
      continue
    }
    rows.push({
      studentNo: cols[0],
      name: cols[1],
      gender: genderToNumber(cols[2]),
      collegeName: cols[3],
      majorName: cols[4],
      className: cols[5],
      initialCode: cols[6],
    })
  }
  return rows
}

async function loadRosters() {
  rosterLoading.value = true
  try {
    const res = await adminApi.getStudentRosters()
    rosters.value = res.data.data || []
  } catch (error: any) {
    const raw = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
    if (raw.includes('student_rosters') || raw.includes('schema cache') || raw.includes('Could not find')) {
      ElMessage.error('学生名册数据库迁移尚未执行，请先在 Supabase SQL Editor 执行 20260603_student_roster_login.sql')
    } else {
      ElMessage.error(error?.message || '加载学生名册失败')
    }
  } finally {
    rosterLoading.value = false
  }
}

async function loadStudents() {
  loading.value = true
  try {
    const res = await adminApi.getStudents({ size: 1000 })
    const payload = res.data.data || {}
    students.value = Array.isArray(payload) ? payload : payload.items || []
  } catch (error: any) {
    ElMessage.error(error?.message || '加载已激活学生失败')
  } finally {
    loading.value = false
  }
}

function openImportDialog() {
  importText.value = importTemplate
  importDialogVisible.value = true
}

async function beforeRosterUpload(file: any) {
  const text = await file.text()
  importText.value = text
  return false
}

async function importRosters() {
  const rows = parseRosterText(importText.value)
  if (importErrors.value.length > 0) {
    ElMessage.warning(importErrors.value.slice(0, 3).join('；'))
    return
  }
  if (rows.length === 0) {
    ElMessage.warning('没有解析到有效名册行，请检查 CSV 内容')
    return
  }
  try {
    const res = await adminApi.importStudentRosters(rows)
    const imported = res.data.data?.imported ?? rows.length
    ElMessage.success(`已导入/更新 ${imported} 名学生`)
    importDialogVisible.value = false
    await loadRosters()
  } catch (error: any) {
    const raw = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
    if (raw.includes('admin_import_student_rosters') || raw.includes('schema cache') || raw.includes('Could not find')) {
      ElMessage.error('名册导入 RPC 尚未部署，请先执行 Supabase 名册制迁移')
    } else {
      ElMessage.error(error?.message || '导入学生名册失败')
    }
  }
}

function openResetDialog(row: any) {
  resetTarget.value = row
  resetCode.value = ''
  resetDialogVisible.value = true
}

async function resetInitialCode() {
  if (!resetTarget.value || !resetCode.value.trim()) {
    ElMessage.warning('请输入新的初始码')
    return
  }
  try {
    await adminApi.resetStudentInitialCode(resetTarget.value.id, resetCode.value.trim())
    ElMessage.success('初始码已重置，学生需要重新激活')
    resetDialogVisible.value = false
    await Promise.all([loadRosters(), loadStudents()])
  } catch (error: any) {
    ElMessage.error(error?.message || '重置初始码失败')
  }
}

async function setRosterStatus(row: any, status: 'PENDING' | 'ACTIVE' | 'DISABLED') {
  const label = status === 'DISABLED' ? '禁用' : status === 'ACTIVE' ? '启用' : '改为未激活'
  try {
    await ElMessageBox.confirm(`确认${label}学生“${row.name}”吗？`, '确认操作', { type: 'warning' })
    await adminApi.setStudentRosterStatus(row.id, status)
    ElMessage.success('名册状态已更新')
    await Promise.all([loadRosters(), loadStudents()])
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '更新状态失败')
  }
}

onMounted(() => {
  loadRosters()
  loadStudents()
})
</script>

<template>
  <div class="students-page">
    <div class="page-toolbar">
      <div>
        <h2>学生管理</h2>
        <p>正式流程以学校导入的新生名册为准。学生用学号和初始码首次激活，不再自填邮箱和学院班级。</p>
      </div>
      <div class="toolbar-right">
        <el-input v-model="searchKeyword" placeholder="搜索学号/姓名" clearable style="width:180px" />
        <el-select v-model="rosterStatus" placeholder="名册状态" clearable style="width:120px">
          <el-option label="未激活" value="PENDING" />
          <el-option label="已激活" value="ACTIVE" />
          <el-option label="已禁用" value="DISABLED" />
        </el-select>
        <el-button @click="loadRosters">刷新名册</el-button>
        <el-button type="primary" @click="openImportDialog">批量导入名册</el-button>
      </div>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="学生邀请码和学生邮箱注册已降级为旧入口，不再作为正式学校上线流程。"
      class="legacy-alert"
    />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="学校新生名册" name="rosters">
        <el-table :data="filteredRosters" v-loading="rosterLoading" stripe>
          <el-table-column prop="studentNo" label="学号" width="130" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70">
            <template #default="{ row }">{{ row.gender === 0 ? '女' : '男' }}</template>
          </el-table-column>
          <el-table-column prop="collegeName" label="学院" min-width="150" />
          <el-table-column prop="majorName" label="专业" min-width="150" />
          <el-table-column prop="className" label="班级" min-width="120" />
          <el-table-column prop="activationStatus" label="激活状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.activationStatus === 'ACTIVE' ? 'success' : row.activationStatus === 'DISABLED' ? 'danger' : 'info'" size="small">
                {{ statusLabel[row.activationStatus] || row.activationStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="activatedAt" label="激活时间" min-width="170" />
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openResetDialog(row)">重置初始码</el-button>
              <el-button v-if="row.activationStatus !== 'DISABLED'" type="danger" link size="small" @click="setRosterStatus(row, 'DISABLED')">禁用</el-button>
              <el-button v-else type="success" link size="small" @click="setRosterStatus(row, row.authUserId ? 'ACTIVE' : 'PENDING')">启用</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已激活学生档案" name="profiles">
        <el-table :data="filteredStudents" v-loading="loading" stripe>
          <el-table-column prop="studentNo" label="学号" width="130" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70">
            <template #default="{ row }">{{ row.gender === 0 ? '女' : '男' }}</template>
          </el-table-column>
          <el-table-column prop="collegeName" label="学院" min-width="150" />
          <el-table-column prop="majorName" label="专业" min-width="150" />
          <el-table-column prop="className" label="班级" min-width="120" />
          <el-table-column prop="surveyStatus" label="问卷" width="100">
            <template #default="{ row }">
              <el-tag :type="row.surveyStatus === 2 ? 'success' : row.surveyStatus === 3 ? 'danger' : row.surveyStatus === 1 ? 'warning' : 'info'" size="small">
                {{ surveyStatusMap[row.surveyStatus] || '需重填' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="matchStatus" label="匹配" width="90">
            <template #default="{ row }">
              <el-tag :type="row.matchStatus >= 2 ? 'success' : row.matchStatus === 1 ? 'warning' : 'info'" size="small">
                {{ matchStatusMap[row.matchStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="账号" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="importDialogVisible" title="批量导入学生名册" width="780px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="CSV 列顺序：学号、姓名、性别、学院、专业、班级、初始码。重复学号会更新原记录，不会创建重复学生。"
        style="margin-bottom:12px"
      />
      <div class="import-actions">
        <el-upload :auto-upload="false" :show-file-list="false" accept=".csv,.txt" :before-upload="beforeRosterUpload">
          <el-button>选择 CSV 文件</el-button>
        </el-upload>
        <el-button @click="importText = importTemplate">填入模板</el-button>
      </div>
      <el-alert
        v-if="importErrors.length"
        type="error"
        :closable="false"
        show-icon
        :title="importErrors.join('；')"
        style="margin-bottom:12px"
      />
      <el-input v-model="importText" type="textarea" :rows="14" spellcheck="false" />
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importRosters">导入名册</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetDialogVisible" title="重置学生初始码" width="420px">
      <p class="reset-copy">学生：{{ resetTarget?.studentNo }} {{ resetTarget?.name }}</p>
      <el-input v-model="resetCode" placeholder="请输入新的初始码" />
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="resetInitialCode">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.students-page {
  display: grid;
  gap: 14px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.page-toolbar h2 {
  margin: 0;
  font-size: 18px;
}
.page-toolbar p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}
.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.legacy-alert {
  margin-bottom: 4px;
}
.import-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.reset-copy {
  margin: 0 0 12px;
  color: #4e5969;
}
</style>
