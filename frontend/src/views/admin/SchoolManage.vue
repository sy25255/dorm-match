<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { schoolApi } from '@/api/school'
import { mockColleges, mockMajors, mockClasses } from '@/mock/data'
import { ElMessage } from 'element-plus'

const config = ref<any>({})
const colleges = ref<any[]>(mockColleges)
const majors = ref<any[]>([])
const classes = ref<any[]>([])

const collegeDialog = ref(false)
const majorDialog = ref(false)
const classDialog = ref(false)
const isEditCollege = ref(false)
const isEditMajor = ref(false)
const isEditClass = ref(false)

const collegeForm = ref({ id: null as number | null, name: '', code: '', description: '' })
const majorForm = ref({ id: null as number | null, collegeId: null as number | null, name: '', code: '' })
const classForm = ref({ id: null as number | null, majorId: null as number | null, name: '', grade: 2024 })

const selectedCollegeId = ref<number | null>(null)
const selectedMajorId = ref<number | null>(null)

const collegeMap = computed(() => {
  const m: Record<number, string> = {}
  colleges.value.forEach(c => m[c.id] = c.name)
  return m
})

function getMajorName(id: number) {
  for (const list of Object.values(mockMajors)) {
    const found = list.find(m => m.id === id)
    if (found) return found.name
  }
  return ''
}

async function loadConfig() {
  try { const res = await schoolApi.getConfig(); config.value = res.data.data || {} } catch { ElMessage.error('加载学校配置失败') }
}

async function saveConfig() { await schoolApi.updateConfig(config.value); ElMessage.success('学校配置已保存') }

function openCollegeEdit(row?: any) {
  if (row) { isEditCollege.value = true; collegeForm.value = { ...row } }
  else { isEditCollege.value = false; collegeForm.value = { id: null, name: '', code: '', description: '' } }
  collegeDialog.value = true
}
async function saveCollege() {
  if (isEditCollege.value && collegeForm.value.id) {
    await schoolApi.updateCollege(collegeForm.value.id, collegeForm.value)
  } else {
    await schoolApi.createCollege(collegeForm.value)
  }
  collegeDialog.value = false
}

function openMajorEdit(row?: any) {
  if (row) { isEditMajor.value = true; majorForm.value = { ...row } }
  else { isEditMajor.value = false; majorForm.value = { id: null, collegeId: selectedCollegeId.value, name: '', code: '' } }
  majorDialog.value = true
}
async function saveMajor() {
  if (isEditMajor.value && majorForm.value.id) {
    await schoolApi.updateMajor(majorForm.value.id, majorForm.value)
  } else {
    await schoolApi.createMajor(majorForm.value)
  }
  majorDialog.value = false
  if (selectedCollegeId.value) {
    const m = mockMajors[selectedCollegeId.value] || []
    majors.value = m.map((maj: any) => ({ ...maj, collegeName: collegeMap.value[selectedCollegeId.value!] }))
  }
}

function openClassEdit(row?: any) {
  if (row) { isEditClass.value = true; classForm.value = { ...row } }
  else { isEditClass.value = false; classForm.value = { id: null, majorId: selectedMajorId.value, name: '', grade: 2024 } }
  classDialog.value = true
}
async function saveClass() {
  if (isEditClass.value && classForm.value.id) {
    await schoolApi.updateClass(classForm.value.id, classForm.value)
  } else {
    await schoolApi.createClass(classForm.value)
  }
  classDialog.value = false
  if (selectedMajorId.value) classes.value = mockClasses.filter((c: any) => c.majorId === selectedMajorId.value)
}

function selectCollege(row: any) {
  selectedCollegeId.value = row.id
  selectedMajorId.value = null
  const m = mockMajors[row.id] || []
  majors.value = m.map((maj: any) => ({ ...maj, collegeName: row.name }))
  classes.value = []
}

function selectMajor(row: any) {
  selectedMajorId.value = row.id
  classes.value = mockClasses.filter((c: any) => c.majorId === row.id)
}

onMounted(() => {
  loadConfig()
  if (colleges.value.length > 0) selectCollege(colleges.value[0])
})
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>学校管理</h2></div>

    <el-card style="margin-bottom:16px">
      <template #header><span style="font-weight:600">学校基本信息</span></template>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="学校名称"><el-input v-model="config.schoolName" /></el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="学校代码"><el-input v-model="config.schoolCode" /></el-form-item>
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
</style>
