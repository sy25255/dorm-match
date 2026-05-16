<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { devApi } from '@/api/dev'
import { ElMessage, ElMessageBox } from 'element-plus'

const schools = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ code: '', name: '', shortName: '', adminEmail: '', description: '', status: 1 })

function resetForm() {
  form.value = { code: '', name: '', shortName: '', adminEmail: '', description: '', status: 1 }
}

async function loadSchools() {
  loading.value = true
  try {
    const res = await devApi.getSchools()
    schools.value = res.data.data || []
  } finally { loading.value = false }
}

function openEdit(row?: any) {
  if (row) { isEdit.value = true; form.value = { ...row } }
  else { isEdit.value = false; resetForm() }
  dialogVisible.value = true
}

async function saveSchool() {
  if (isEdit.value) {
    await devApi.updateSchoolConfig(form.value.code, form.value)
    ElMessage.success('学校信息已更新')
  } else {
    ElMessage.success('学校创建功能开发中')
  }
  dialogVisible.value = false
  loadSchools()
}

async function toggleSchool(row: any) {
  try {
    const action = row.status === 1 ? '禁用' : '启用'
    await ElMessageBox.confirm(`确认${action}学校"${row.name}"？`, '确认操作', { type: 'warning' })
    await devApi.updateSchoolConfig(row.code, { ...row, status: row.status === 1 ? 0 : 1 })
    ElMessage.success(`学校已${action}`)
    loadSchools()
  } catch {}
}

const statusMap: Record<number, { label: string; type: string }> = {
  1: { label: '运营中', type: 'success' },
  0: { label: '已停用', type: 'danger' },
}

onMounted(loadSchools)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>学校管理</h1>
        <p style="color:#6b7280;margin-top:4px">管理平台中所有学校的配置信息</p>
      </div>
    </div>

    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="color:#6b7280;font-size:13px">共 {{ schools.length }} 所学校</span>
        <el-button type="primary" @click="openEdit()" disabled>添加学校（开发中）</el-button>
      </div>

      <el-table :data="schools" v-loading="loading" stripe>
        <el-table-column prop="code" label="学校编码" width="120" />
        <el-table-column label="学校" min-width="160">
          <template #default="{ row }">
            <span style="font-weight:600">{{ row.name }}</span>
            <el-tag size="small" style="margin-left:8px">{{ row.shortName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adminEmail" label="管理员邮箱" width="200" />
        <el-table-column prop="description" label="简介" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">{{ statusMap[row.status]?.label || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleSchool(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学校' : '添加学校'" width="500px" destroy-on-close>
        <el-form :model="form" label-width="100px">
          <el-form-item label="学校编码">
            <el-input v-model="form.code" :disabled="isEdit" placeholder="如 DEMO-UNI" />
          </el-form-item>
          <el-form-item label="学校名称">
            <el-input v-model="form.name" placeholder="如 示范大学" />
          </el-form-item>
          <el-form-item label="简称">
            <el-input v-model="form.shortName" placeholder="如 示范大" />
          </el-form-item>
          <el-form-item label="管理员邮箱">
            <el-input v-model="form.adminEmail" placeholder="admin@school.edu.cn" />
          </el-form-item>
          <el-form-item label="简介">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSchool">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 22px; }
</style>