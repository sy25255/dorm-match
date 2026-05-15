<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { devApi } from '@/api/dev'
import { ElMessage, ElMessageBox } from 'element-plus'

const admins = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ id: null as number | null, username: '', role: 'ADMIN', schoolCode: '', schoolName: '', status: 1 })

function resetForm() {
  form.value = { id: null, username: '', role: 'ADMIN', schoolCode: '', schoolName: '', status: 1 }
}

async function loadAdmins() {
  loading.value = true
  try {
    const res = await devApi.getAdmins()
    admins.value = res.data.data || []
  } finally { loading.value = false }
}

function openEdit(row?: any) {
  if (row) { isEdit.value = true; form.value = { ...row } }
  else { isEdit.value = false; resetForm() }
  dialogVisible.value = true
}

async function saveAdmin() {
  if (isEdit.value && form.value.id) {
    await devApi.updateAdmin(form.value.id, form.value)
    ElMessage.success('管理员信息已更新')
  } else {
    await devApi.createAdmin(form.value)
  }
  dialogVisible.value = false
  loadAdmins()
}

async function deleteAdmin(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除管理员"${row.username}"？`, '确认删除', { type: 'warning' })
    await devApi.deleteAdmin(row.id)
    ElMessage.success('管理员已删除')
    loadAdmins()
  } catch {}
}

const statusMap: Record<number, { label: string; type: string }> = {
  1: { label: '正常', type: 'success' },
  0: { label: '已禁用', type: 'danger' },
}

const schoolNameMap: Record<string, string> = {
  'DEMO-UNI': '示范大学', 'TEST': '测试学院', 'BJ-UNI': '北京大学', 'SH-UNI': '上海大学',
}

onMounted(loadAdmins)
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>管理员账号</h1>
        <p style="color:#6b7280;margin-top:4px">管理各学校的管理员账号</p>
      </div>
    </div>

    <el-card>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="color:#6b7280;font-size:13px">共 {{ admins.length }} 个管理员账号</span>
        <el-button type="primary" @click="openEdit()">添加管理员</el-button>
      </div>

      <el-table :data="admins" v-loading="loading" stripe>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column label="所属学校" min-width="160">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ schoolNameMap[row.schoolCode] || row.schoolCode }}</el-tag>
            <span style="margin-left:8px;color:#6b7280;font-size:12px">{{ row.schoolCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteAdmin(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑管理员' : '添加管理员'" width="480px" destroy-on-close>
        <el-form :model="form" label-width="100px">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="管理员用户名" />
          </el-form-item>
          <el-form-item label="所属学校">
            <el-select v-model="form.schoolCode" placeholder="选择学校" style="width:100%">
              <el-option
                v-for="s in [
                  { code: 'DEMO-UNI', name: '示范大学' },
                  { code: 'TEST', name: '测试学院' },
                  { code: 'BJ-UNI', name: '北京大学' },
                  { code: 'SH-UNI', name: '上海大学' },
                ]" :key="s.code" :label="s.name" :value="s.code"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="正常" inactive-text="禁用" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAdmin">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 22px; }
</style>