<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schoolApi } from '@/api/school'
import { ElMessage } from 'element-plus'

const config = ref<any>({})
const colleges = ref<any[]>([])
const majors = ref<any[]>([])
const classes = ref<any[]>([])
const inviteCodes = ref<any[]>([])

const collegeDialog = ref(false)
const majorDialog = ref(false)
const classDialog = ref(false)
const isEditCollege = ref(false)
const isEditMajor = ref(false)
const isEditClass = ref(false)

const collegeForm = ref({ id: null as number | null, name: '', code: '', description: '' })
const majorForm = ref({ id: null as number | null, collegeId: null as number | null, name: '', code: '' })
const classForm = ref({ id: null as number | null, majorId: null as number | null, name: '', grade: 2024 })
const inviteForm = ref({ name: '新生入学邀请码', code: '', maxUses: 200 })

const selectedCollegeId = ref<number | null>(null)
const selectedMajorId = ref<number | null>(null)

const collegeMap = computed(() => {
  const m: Record<number, string> = {}
  colleges.value.forEach(c => m[c.id] = c.name)
  return m
})

function getMajorName(id: number) {
  return majors.value.find(m => m.id === id)?.name || ''
}

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
        title="学生先在首页输入学校编码进入本校区域，再凭学生邀请码完成注册。学校编码用于定位学校，不等同于注册授权。"
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
      <template #header><span style="font-weight:600">学生入学邀请码</span></template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="正式流程：学校先生成邀请码，再发给本校新生。学生必须凭邀请码进入问卷和舍友选择流程。"
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
</style>
