<script setup lang="ts">
import { ref } from 'vue'
import { devApi } from '@/api/dev'
import { ElMessage } from 'element-plus'

const form = ref({
  title: '',
  content: '',
  targetSchools: [] as string[],
})
const loading = ref(false)

const schoolOptions = [
  { code: 'DEMO-UNI', name: '示范大学' },
  { code: 'TEST', name: '测试学院' },
  { code: 'BJ-UNI', name: '北京大学' },
  { code: 'SH-UNI', name: '上海大学' },
]

function selectAll() {
  form.value.targetSchools = schoolOptions.map(s => s.code)
}

function clearAll() {
  form.value.targetSchools = []
}

async function sendNotification() {
  if (!form.value.title.trim()) { ElMessage.warning('请输入公告标题'); return }
  if (!form.value.content.trim()) { ElMessage.warning('请输入公告内容'); return }
  loading.value = true
  try {
    await devApi.sendNotification({
      title: form.value.title,
      content: form.value.content,
      targetSchools: form.value.targetSchools,
    })
    form.value = { title: '', content: '', targetSchools: [] }
  } catch {
    ElMessage.error('发送失败')
  } finally {
    loading.value = false
  }
}

const recentNotices = [
  { id: 1, title: '系统升级通知', content: 'DormMatch将于本周六凌晨2:00-4:00进行升级维护，届时系统将暂停使用。', target: '全部学校', createdAt: '2024-08-27T14:00:00' },
  { id: 2, title: '新功能上线', content: '宿舍分配异议处理功能已上线，学生可在分配结果页面提交异议申诉。', target: '全部学校', createdAt: '2024-08-25T10:00:00' },
  { id: 3, title: '问卷截止提醒', content: '请各校管理员提醒新生尽快完成偏好问卷填写，截止日期为8月31日。', target: '全部学校', createdAt: '2024-08-24T08:00:00' },
]
</script>

<template>
  <div>
    <div class="page-header">
      <h1>系统公告</h1>
      <p style="color:#6b7280;margin-top:4px">向全部学校或指定学校推送系统公告</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header><span style="font-weight:600">发送新公告</span></template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="公告标题" required>
              <el-input v-model="form.title" placeholder="请输入公告标题" />
            </el-form-item>
            <el-form-item label="公告内容" required>
              <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容..." />
            </el-form-item>
            <el-form-item label="目标学校">
              <div style="margin-bottom:8px">
                <el-button size="small" @click="selectAll">全选</el-button>
                <el-button size="small" @click="clearAll">清空</el-button>
              </div>
              <el-checkbox-group v-model="form.targetSchools">
                <el-checkbox v-for="s in schoolOptions" :key="s.code" :value="s.code" :label="s.code">
                  {{ s.name }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="sendNotification">发送公告</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header><span style="font-weight:600">最近公告</span></template>
          <div v-for="notice in recentNotices" :key="notice.id" style="padding:12px 0;border-bottom:1px solid #f0f0f0">
            <div style="font-weight:600;font-size:14px">{{ notice.title }}</div>
            <div style="color:#6b7280;font-size:13px;margin-top:4px;line-height:1.5">{{ notice.content }}</div>
            <div style="color:#a0aec0;font-size:11px;margin-top:4px">
              <el-tag size="small" type="info">{{ notice.target }}</el-tag>
              <span style="margin-left:8px">{{ notice.createdAt }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 22px; }
</style>