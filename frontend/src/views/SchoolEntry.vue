<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const schoolCode = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function enterSchool() {
  const code = schoolCode.value.trim().toUpperCase()
  if (!code) {
    errorMsg.value = '请输入学校编码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await request.post('/school/validate', { code })
    const data = res.data?.data || res.data
    if (data?.valid && data?.school) {
      userStore.setSchoolInfo(data.school.code, data.school.name)
      ElMessage.success(`欢迎来到${data.school.name}！`)
      router.push(`/${data.school.code}/login`)
    } else {
      errorMsg.value = '学校编码无效，请检查后重试'
    }
  } catch {
    errorMsg.value = '学校编码无效，请检查后重试'
  } finally {
    loading.value = false
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Enter') enterSchool()
}
</script>

<template>
  <div class="entry-container">
    <div class="entry-card">
      <div class="entry-header">
        <div class="entry-icon">
          <el-icon :size="48" color="#667eea"><School /></el-icon>
        </div>
        <h1 class="entry-title">新生宿舍舍友选择系统</h1>
        <p class="entry-subtitle">请输入学校专属编码进入系统</p>
      </div>

      <div class="entry-form">
        <label class="entry-label">学校编码</label>
        <el-input
          v-model="schoolCode"
          placeholder="例如：DEMO-UNI"
          size="large"
          :maxlength="20"
          class="code-input"
          @keyup="onKeyUp"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="entry-btn"
          @click="enterSchool"
        >
          进入学校系统
        </el-button>
      </div>

      <el-divider style="margin: 20px 0 12px;">
        <span style="color: #c9cdd4; font-size: 12px;">— 演示学校编码 —</span>
      </el-divider>

      <div class="demo-schools">
        <el-button
          v-for="s in [{ code: 'DEMO-UNI', name: '示范大学' }, { code: 'TEST', name: '测试学院' }, { code: 'BJ-UNI', name: '北京大学' }, { code: 'SH-UNI', name: '上海大学' }]"
          :key="s.code"
          size="small"
          class="demo-school-btn"
          @click="schoolCode = s.code; enterSchool()"
        >
          {{ s.code }}
          <span style="color: #86909c; font-size: 11px; margin-left: 4px;">{{ s.name }}</span>
        </el-button>
      </div>

      <div class="entry-footer">
        <p>学校管理员请联系系统供应商获取专属编码</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c1929 0%, #1a2a4a 40%, #2d1b69 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.entry-container::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%);
  top: -200px;
  right: -200px;
}
.entry-container::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
}

.entry-card {
  width: 420px;
  background: rgba(255,255,255,0.97);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.entry-header { text-align: center; margin-bottom: 28px; }
.entry-icon { margin-bottom: 12px; }
.entry-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
.entry-subtitle { font-size: 14px; color: #86909c; margin: 0; }

.entry-form { margin-bottom: 8px; }
.entry-label { display: block; font-size: 14px; font-weight: 500; color: #1d2129; margin-bottom: 8px; }
.code-input :deep(.el-input__inner) { font-size: 16px; letter-spacing: 2px; font-family: 'Courier New', monospace; }
.error-msg { color: #f53f3f; font-size: 13px; margin: 8px 0 0; }
.entry-btn { width: 100%; margin-top: 16px; height: 48px; font-size: 16px; border-radius: 10px; }

.demo-schools { display: flex; flex-wrap: wrap; gap: 8px; }
.demo-school-btn { border-color: #e5e6eb; color: #4e5969; font-family: 'Courier New', monospace; font-weight: 500; }
.demo-school-btn:hover { border-color: #667eea; color: #667eea; background: #f5f3ff; }

.entry-footer { text-align: center; margin-top: 16px; }
.entry-footer p { font-size: 12px; color: #c9cdd4; margin: 0; }
</style>
