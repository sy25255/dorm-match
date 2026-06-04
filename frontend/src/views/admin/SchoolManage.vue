<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schoolApi } from '@/api/school'
import { adminApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const config = ref<any>({})
const colleges = ref<any[]>([])
const majors = ref<any[]>([])
const classes = ref<any[]>([])
const inviteCodes = ref<any[]>([])
const rosterRows = ref<any[]>([])
const rosterSummary = ref<any>({})

const collegeDialog = ref(false)
const majorDialog = ref(false)
const classDialog = ref(false)
const rosterImportDialog = ref(false)
const isEditCollege = ref(false)
const isEditMajor = ref(false)
const isEditClass = ref(false)

const collegeForm = ref({ id: null as number | null, name: '', code: '', description: '' })
const majorForm = ref({ id: null as number | null, collegeId: null as number | null, name: '', code: '' })
const classForm = ref({ id: null as number | null, majorId: null as number | null, name: '', grade: 2024 })
const inviteForm = ref({ name: '新生入学邀请码', code: '', maxUses: 200 })
const expectedInput = ref(0)
const rosterImportText = ref('')
const rosterImportErrors = ref<string[]>([])
const rosterImportWarnings = ref<string[]>([])
const rosterPreviewRows = ref<any[]>([])

const selectedCollegeId = ref<number | null>(null)
const selectedMajorId = ref<number | null>(null)

const rosterTemplate = [
  '学号,姓名,性别,学院,专业,班级,初始码',
  '20269901,测试学生一,男,信息科学技术学院,计算机科学与技术,计科2601班,TST901A',
  '20269902,测试学生二,女,信息科学技术学院,软件工程,软件2601班,TST902B',
].join('\n')

const collegeMap = computed(() => {
  const m: Record<number, string> = {}
  colleges.value.forEach(c => m[c.id] = c.name)
  return m
})

function getMajorName(id: number) {
  return majors.value.find(m => m.id === id)?.name || ''
}

const existingRosterNos = computed(() => new Set((rosterRows.value || []).map(row => String(row.studentNo || '').toUpperCase())))

const rosterSummaryCards = computed(() => {
  const s = rosterSummary.value || {}
  const total = s.totalRosters ?? rosterRows.value.length
  const expected = s.expectedNewStudents ?? expectedInput.value ?? 0
  return [
    { label: '预计新生', value: expected },
    { label: '已导入名册', value: total },
    { label: '差额人数', value: Math.max(Number(expected || 0) - Number(total || 0), 0) },
    { label: '未激活', value: s.pendingActivation ?? rosterRows.value.filter(r => r.activationStatus === 'PENDING').length },
    { label: '已激活', value: s.activeStudents ?? rosterRows.value.filter(r => r.activationStatus === 'ACTIVE').length },
    { label: '已分配', value: s.allocatedStudents ?? 0 },
  ]
})

async function loadConfig() {
  try {
    const res = await schoolApi.getConfig()
    config.value = res.data.data || {}
  } catch (error: any) {
    ElMessage.error(error?.message || '加载学校配置失败')
  }
}

async function loadColleges() {
  try {
    const res = await schoolApi.getColleges()
    colleges.value = res.data.data || []
    if (!selectedCollegeId.value && colleges.value.length > 0) {
      await selectCollege(colleges.value[0])
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载学院失败')
  }
}

async function loadMajors(collegeId: number) {
  try {
    const res = await schoolApi.getMajors(collegeId)
    majors.value = (res.data.data || []).map((m: any) => ({ ...m, collegeName: collegeMap.value[collegeId] }))
  } catch (error: any) {
    ElMessage.error(error?.message || '加载专业失败')
  }
}

async function loadClasses(majorId: number) {
  try {
    const res = await schoolApi.getClasses(majorId)
    classes.value = res.data.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '加载班级失败')
  }
}

async function loadInviteCodes() {
  try {
    const res = await schoolApi.getStudentInviteCodes()
    inviteCodes.value = res.data.data || []
  } catch (error: any) {
    ElMessage.warning(error?.message || '加载学生邀请码失败')
  }
}

async function loadRosterImportData() {
  try {
    const [rosterRes, summaryRes] = await Promise.all([
      adminApi.getStudentRosters(),
      adminApi.getRosterImportSummary(),
    ])
    rosterRows.value = rosterRes.data.data || []
    rosterSummary.value = summaryRes.data.data || {}
    expectedInput.value = Number(rosterSummary.value.expectedNewStudents || 0)
  } catch (error: any) {
    const raw = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
    if (raw.includes('student_rosters') || raw.includes('admin_get_roster_import_summary') || raw.includes('schema cache') || raw.includes('Could not find')) {
      rosterRows.value = []
      rosterSummary.value = {}
    } else {
      ElMessage.warning(error?.message || '加载名册导入数据失败')
    }
  }
}

function genderToNumber(value: string) {
  const text = String(value || '').trim()
  if (text === '女' || text === '0' || /^female$/i.test(text)) return 0
  return 1
}

function splitCsvLine(line: string) {
  const cols: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cols.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cols.push(current.trim())
  return cols
}

function parseRosterImportText(text: string) {
  rosterImportErrors.value = []
  rosterImportWarnings.value = []
  const rows: any[] = []
  const seen = new Set<string>()
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  for (const [index, line] of lines.entries()) {
    if (index === 0 && /学号|student/i.test(line)) continue
    const cols = splitCsvLine(line)
    const lineNo = index + 1
    if (cols.length < 7 || cols.slice(0, 7).some(col => !col)) {
      rosterImportErrors.value.push(`第 ${lineNo} 行缺少必填字段`)
      continue
    }
    const studentNo = cols[0].toUpperCase()
    if (seen.has(studentNo)) {
      rosterImportErrors.value.push(`第 ${lineNo} 行学号 ${studentNo} 在本次文件中重复`)
      continue
    }
    if (existingRosterNos.value.has(studentNo)) {
      rosterImportWarnings.value.push(`学号 ${studentNo} 已在名册中，确认导入后会更新原记录`)
    }
    seen.add(studentNo)
    rows.push({
      studentNo,
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

function openRosterImportDialog() {
  rosterImportText.value = rosterTemplate
  rosterPreviewRows.value = []
  rosterImportErrors.value = []
  rosterImportWarnings.value = []
  rosterImportDialog.value = true
}

async function beforeRosterUpload(file: any) {
  rosterImportText.value = await file.text()
  rosterPreviewRows.value = []
  rosterImportErrors.value = []
  rosterImportWarnings.value = []
  return false
}

function parseRosterPreview() {
  rosterPreviewRows.value = parseRosterImportText(rosterImportText.value)
  if (rosterImportErrors.value.length > 0) {
    ElMessage.warning(rosterImportErrors.value.slice(0, 3).join('；'))
    return
  }
  if (rosterPreviewRows.value.length === 0) {
    ElMessage.warning('没有解析到有效名册行，请检查 CSV 内容')
    return
  }
  ElMessage.success(`已解析 ${rosterPreviewRows.value.length} 行，请确认预览后导入`)
}

async function importRosterRows() {
  const rows = rosterPreviewRows.value.length ? rosterPreviewRows.value : parseRosterImportText(rosterImportText.value)
  if (rosterImportErrors.value.length > 0) {
    ElMessage.warning(rosterImportErrors.value.slice(0, 3).join('；'))
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
    rosterImportDialog.value = false
    await loadRosterImportData()
  } catch (error: any) {
    ElMessage.error(error?.message || '导入学生名册失败')
  }
}

async function saveExpectedCount() {
  try {
    const res = await adminApi.setExpectedNewStudents(expectedInput.value)
    rosterSummary.value = res.data.data || {}
    expectedInput.value = Number(rosterSummary.value.expectedNewStudents || 0)
    ElMessage.success('预计新生人数已保存')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存预计新生人数失败')
  }
}

function generateInviteCode() {
  const sc = String(config.value.schoolCode || 'SCHOOL').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  inviteForm.value.code = `${sc}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function copySchoolCode() {
  const code = String(config.value.schoolCode || '').trim()
  if (!code) {
    ElMessage.warning('暂无可复制的学校编码')
    return
  }
  await navigator.clipboard.writeText(code)
  ElMessage.success('学校编码已复制')
}

async function createInviteCode() {
  try {
    if (!inviteForm.value.code.trim()) generateInviteCode()
    await schoolApi.createStudentInviteCode(inviteForm.value)
    ElMessage.success('学生邀请码已创建')
    generateInviteCode()
    await loadInviteCodes()
  } catch (error: any) {
    ElMessage.warning(error?.message || '学生邀请码创建失败')
  }
}

async function saveConfig() {
  try {
    if (!String(config.value.schoolName || '').trim()) {
      ElMessage.warning('请填写学校名称')
      return
    }
    await schoolApi.updateConfig(config.value)
    ElMessage.success('学校配置已保存')
  } catch (error: any) {
    ElMessage.warning(error?.message || '学校配置保存失败')
  }
}

function openCollegeEdit(row?: any) {
  if (row) { isEditCollege.value = true; collegeForm.value = { ...row } }
  else { isEditCollege.value = false; collegeForm.value = { id: null, name: '', code: '', description: '' } }
  collegeDialog.value = true
}
async function saveCollege() {
  try {
    if (!collegeForm.value.name.trim()) {
      ElMessage.warning('请填写学院名称')
      return
    }
    if (isEditCollege.value && collegeForm.value.id) {
      await schoolApi.updateCollege(collegeForm.value.id, collegeForm.value)
    } else {
      await schoolApi.createCollege(collegeForm.value)
    }
    collegeDialog.value = false
    await loadColleges()
    ElMessage.success('学院信息已保存')
  } catch (error: any) {
    ElMessage.warning(error?.message || '学院信息保存失败')
  }
}

function openMajorEdit(row?: any) {
  if (row) { isEditMajor.value = true; majorForm.value = { ...row } }
  else { isEditMajor.value = false; majorForm.value = { id: null, collegeId: selectedCollegeId.value, name: '', code: '' } }
  majorDialog.value = true
}
async function saveMajor() {
  try {
    if (!majorForm.value.collegeId || !majorForm.value.name.trim()) {
      ElMessage.warning('请先选择学院并填写专业名称')
      return
    }
    if (isEditMajor.value && majorForm.value.id) {
      await schoolApi.updateMajor(majorForm.value.id, majorForm.value)
    } else {
      await schoolApi.createMajor(majorForm.value)
    }
    majorDialog.value = false
    if (selectedCollegeId.value) {
      await loadMajors(selectedCollegeId.value)
    }
    ElMessage.success('专业信息已保存')
  } catch (error: any) {
    ElMessage.warning(error?.message || '专业信息保存失败')
  }
}

function openClassEdit(row?: any) {
  if (row) { isEditClass.value = true; classForm.value = { ...row } }
  else { isEditClass.value = false; classForm.value = { id: null, majorId: selectedMajorId.value, name: '', grade: 2024 } }
  classDialog.value = true
}
async function saveClass() {
  try {
    if (!classForm.value.majorId || !classForm.value.name.trim()) {
      ElMessage.warning('请先选择专业并填写班级名称')
      return
    }
    if (isEditClass.value && classForm.value.id) {
      await schoolApi.updateClass(classForm.value.id, classForm.value)
    } else {
      await schoolApi.createClass(classForm.value)
    }
    classDialog.value = false
    if (selectedMajorId.value) await loadClasses(selectedMajorId.value)
    ElMessage.success('班级信息已保存')
  } catch (error: any) {
    ElMessage.warning(error?.message || '班级信息保存失败')
  }
}

async function selectCollege(row: any) {
  selectedCollegeId.value = row.id
  selectedMajorId.value = null
  classes.value = []
  await loadMajors(row.id)
}

async function selectMajor(row: any) {
  selectedMajorId.value = row.id
  await loadClasses(row.id)
}

onMounted(async () => {
  await loadConfig()
  generateInviteCode()
  await loadRosterImportData()
  await loadInviteCodes()
  await loadColleges()
})
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>学校管理</h2></div>

    <el-card style="margin-bottom:16px">
      <template #header><span style="font-weight:600">学生进入学校区域</span></template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="学生先在首页输入学校编码进入本校区域。正式流程中，学生凭学号和初始码激活；学校编码只用于定位学校，不等同于权限凭证。"
        style="margin-bottom:12px"
      />
      <el-row :gutter="16" align="middle">
        <el-col :span="10">
          <el-form-item label="本校学校编码">
            <el-input :model-value="config.schoolCode" readonly>
              <template #append>
                <el-button @click="copySchoolCode">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="14">
          <div class="school-entry-preview">
            学生入口：dormmatch.cn/#/ → 输入 {{ config.schoolCode || '学校编码' }}
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-bottom:16px">
      <template #header><span style="font-weight:600">学校基本信息</span></template>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="学校名称"><el-input v-model="config.schoolName" /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="学校代码"><el-input v-model="config.schoolCode" disabled /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="学年"><el-input v-model="config.academicYear" /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话"><el-input v-model="config.contactPhone" /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系邮箱"><el-input v-model="config.contactEmail" /></el-form-item>
        </el-col>
        <el-col :span="8" style="display:flex;align-items:flex-end;padding-bottom:18px">
          <el-button type="primary" @click="saveConfig">保存学校信息</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-bottom:16px">
      <template #header><span style="font-weight:600">新生名册导入</span></template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="正式学号来自学校教务/招生系统。学校将 Excel 另存为 CSV 后导入，系统会按当前管理员所属学校写入名册。"
        style="margin-bottom:12px"
      />
      <div class="roster-import-head">
        <div class="expected-control">
          <span>预计新生人数</span>
          <el-input-number v-model="expectedInput" :min="0" :step="1" controls-position="right" />
          <el-button type="primary" @click="saveExpectedCount">保存</el-button>
        </div>
        <el-button type="primary" @click="openRosterImportDialog">导入新生名册</el-button>
      </div>
      <div class="roster-summary-grid">
        <div v-for="item in rosterSummaryCards" :key="item.label" class="roster-summary-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </el-card>

    <el-card style="margin-bottom:16px">
      <template #header><span style="font-weight:600">学生邀请码（旧入口/批次入口码）</span></template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="名册制上线后，正式流程改为导入学生名册并发放初始码。这里的邀请码只保留为旧入口或临时批次入口，不再作为正式注册主流程。"
        style="margin-bottom:12px"
      />
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="批次名称">
            <el-input v-model="inviteForm.name" placeholder="如：2026级本科新生" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="邀请码">
            <el-input v-model="inviteForm.code" placeholder="自动生成或手动填写">
              <template #append>
                <el-button @click="generateInviteCode">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="最多使用次数">
            <el-input-number v-model="inviteForm.maxUses" :min="1" :max="10000" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="3" style="display:flex;align-items:flex-end;padding-bottom:18px">
          <el-button type="primary" @click="createInviteCode">创建</el-button>
        </el-col>
      </el-row>
      <el-table :data="inviteCodes" size="small" border>
        <el-table-column prop="name" label="批次" min-width="160" />
        <el-table-column prop="code" label="邀请码" min-width="180" />
        <el-table-column label="使用情况" width="120">
          <template #default="{ row }">{{ row.used_count || 0 }} / {{ row.max_uses || '不限' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="created_at" label="创建时间" min-width="170" />
      </el-table>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="8">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">学院列表</h3>
          <el-button type="primary" size="small" @click="openCollegeEdit()">添加学院</el-button>
        </div>
        <el-table :data="colleges" size="small" highlight-current-row @row-click="selectCollege">
          <el-table-column prop="code" label="编码" width="70" />
          <el-table-column prop="name" label="学院名称" />
          <el-table-column label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="openCollegeEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-col :span="8">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">专业列表</h3>
          <el-button v-if="selectedCollegeId" type="primary" size="small" @click="openMajorEdit()">添加专业</el-button>
        </div>
        <el-table :data="majors" size="small" highlight-current-row @row-click="selectMajor" v-if="selectedCollegeId">
          <el-table-column prop="code" label="编码" width="80" />
          <el-table-column prop="name" label="专业名称" />
          <el-table-column label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="openMajorEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="请先选择学院" :image-size="60" />
      </el-col>

      <el-col :span="8">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">班级列表</h3>
          <el-button v-if="selectedMajorId" type="primary" size="small" @click="openClassEdit()">添加班级</el-button>
        </div>
        <el-table :data="classes" size="small" v-if="selectedMajorId">
          <el-table-column prop="name" label="班级名称" />
          <el-table-column prop="grade" label="年级" width="70" />
          <el-table-column label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="openClassEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="请先选择专业" :image-size="60" />
      </el-col>
    </el-row>

    <el-dialog v-model="collegeDialog" :title="isEditCollege ? '编辑学院' : '添加学院'" width="400px">
      <el-form :model="collegeForm" label-width="80px">
        <el-form-item label="编码"><el-input v-model="collegeForm.code" placeholder="如 CS" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="collegeForm.name" placeholder="如 计算机学院" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="collegeForm.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="collegeDialog = false">取消</el-button><el-button type="primary" @click="saveCollege">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="majorDialog" :title="isEditMajor ? '编辑专业' : '添加专业'" width="400px">
      <el-form :model="majorForm" label-width="80px">
        <el-form-item label="所属学院"><el-input :model-value="collegeMap[selectedCollegeId!]" disabled /></el-form-item>
        <el-form-item label="编码"><el-input v-model="majorForm.code" placeholder="如 CS001" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="majorForm.name" placeholder="如 计算机科学与技术" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="majorDialog = false">取消</el-button><el-button type="primary" @click="saveMajor">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="classDialog" :title="isEditClass ? '编辑班级' : '添加班级'" width="400px">
      <el-form :model="classForm" label-width="80px">
        <el-form-item label="所属专业"><el-input :model-value="getMajorName(selectedMajorId!)" disabled /></el-form-item>
        <el-form-item label="班级名称"><el-input v-model="classForm.name" placeholder="如 计科2401班" /></el-form-item>
        <el-form-item label="年级"><el-input-number v-model="classForm.grade" :min="2020" :max="2030" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="classDialog = false">取消</el-button><el-button type="primary" @click="saveClass">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="rosterImportDialog" title="学校新生名册导入向导" width="980px">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="CSV 列顺序固定为：学号、姓名、性别、学院、专业、班级、初始码。重复学号会更新原记录，不会创建重复学生。"
        style="margin-bottom:12px"
      />
      <div class="import-actions">
        <el-upload :auto-upload="false" :show-file-list="false" accept=".csv,.txt" :before-upload="beforeRosterUpload">
          <el-button>选择 CSV 文件</el-button>
        </el-upload>
        <el-button @click="rosterImportText = rosterTemplate">填入模板</el-button>
        <el-button type="primary" plain @click="parseRosterPreview">解析并预览</el-button>
      </div>
      <el-alert
        v-if="rosterImportErrors.length"
        type="error"
        :closable="false"
        show-icon
        :title="rosterImportErrors.join('；')"
        style="margin-bottom:12px"
      />
      <el-alert
        v-if="rosterImportWarnings.length"
        type="warning"
        :closable="false"
        show-icon
        :title="rosterImportWarnings.join('；')"
        style="margin-bottom:12px"
      />
      <el-input v-model="rosterImportText" type="textarea" :rows="12" spellcheck="false" />
      <div v-if="rosterPreviewRows.length" class="preview-block">
        <div class="preview-title">预览 {{ rosterPreviewRows.length }} 名学生</div>
        <el-table :data="rosterPreviewRows" height="260" stripe>
          <el-table-column prop="studentNo" label="学号" width="130" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="70">
            <template #default="{ row }">{{ row.gender === 0 ? '女' : '男' }}</template>
          </el-table-column>
          <el-table-column prop="collegeName" label="学院" min-width="150" />
          <el-table-column prop="majorName" label="专业" min-width="150" />
          <el-table-column prop="className" label="班级" min-width="120" />
          <el-table-column prop="initialCode" label="初始码" width="120" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="rosterImportDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!rosterPreviewRows.length || rosterImportErrors.length > 0" @click="importRosterRows">确认导入/更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
.school-entry-preview {
  color: #4e5969;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  padding: 10px 12px;
}
.roster-import-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.expected-control,
.import-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.roster-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.roster-summary-item {
  border: 1px solid #eef0f3;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fafafa;
}
.roster-summary-item span {
  display: block;
  color: #667085;
  font-size: 12px;
}
.roster-summary-item strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}
.import-actions {
  margin-bottom: 12px;
}
.preview-block {
  margin-top: 14px;
}
.preview-title {
  margin-bottom: 8px;
  font-weight: 600;
}
</style>
