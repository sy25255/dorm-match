<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { supabase } from '@/lib/supabase'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const schoolCode = ref('')
const validating = ref(false)
const validatedSchool = ref<{ code: string; name: string } | null>(null)
const codeTouched = ref(false)

async function validateSchoolCode() {
  const code = schoolCode.value.trim().toUpperCase()
  codeTouched.value = true
  if (!code) {
    validatedSchool.value = null
    return
  }
  validating.value = true
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('code, name')
      .eq('code', code)
      .eq('status', 1)
      .single()

    if (error) {
      try {
        const mod = await import('@/mock/data')
        const school = mod.getSchoolByCode(code)
        validatedSchool.value = school || null
      } catch {
        validatedSchool.value = null
      }
    } else if (data) {
      validatedSchool.value = data
    } else {
      validatedSchool.value = null
    }
  } catch {
    validatedSchool.value = null
  } finally {
    validating.value = false
  }
}

async function enterSchool() {
  const code = schoolCode.value.trim().toUpperCase()
  if (!code) { ElMessage.warning('请输入学校编码'); return }

  if (!validatedSchool.value) {
    await validateSchoolCode()
  }

  if (!validatedSchool.value) {
    ElMessage.warning('学校编码无效，请检查后重试')
    return
  }

  userStore.setSchoolInfo(validatedSchool.value.code, validatedSchool.value.name)
  router.push(`/${validatedSchool.value.code}/login`)
}

function enterDemoSchool() {
  const demoSchool = { code: 'DEMO-UNI', name: '示范大学' }
  schoolCode.value = demoSchool.code
  validatedSchool.value = demoSchool
  userStore.setSchoolInfo(demoSchool.code, demoSchool.name)
  router.push(`/${demoSchool.code}/login?guest=1`)
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Enter') enterSchool()
}
</script>

<template>
  <div class="entry-root">
    <div class="entry-container">
    <div class="entry-card">
      <div class="entry-header">
        <div class="entry-icon">
          <el-icon :size="44" color="#667eea"><School /></el-icon>
        </div>
        <h1 class="entry-title">新生宿舍舍友选择系统</h1>
        <p class="entry-subtitle">输入学校编码，开启你的大学舍友之旅</p>
      </div>

      <div class="form-section">
        <div class="form-item">
          <label class="form-label">学校编码</label>
          <div class="school-code-row">
            <el-input
              v-model="schoolCode"
              placeholder="例如：DEMO-UNI"
              size="large"
              :maxlength="20"
              class="code-input"
              @input="codeTouched = false; validatedSchool = null"
              @blur="validateSchoolCode"
              @keyup="onKeyUp"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <span v-if="validatedSchool" class="school-check">
              <el-icon color="#52c41a"><CircleCheck /></el-icon>
              {{ validatedSchool.name }}
            </span>
          </div>
          <p v-if="codeTouched && schoolCode && !validatedSchool && !validating" class="form-hint" style="color:#f53f3f">
            学校编码无效，请检查后重试
          </p>
        </div>

        <el-button
          type="primary"
          size="large"
          :loading="validating"
          class="submit-btn"
          @click="enterSchool"
        >
          进入登录
        </el-button>
        <el-button
          size="large"
          class="demo-btn"
          @click="enterDemoSchool"
        >
          一键进入测试体验
        </el-button>
      </div>

      <div class="known-codes">
        <p class="codes-label">已知学校编码</p>
        <div class="codes-list">
          <span class="code-tag" @click="enterDemoSchool">DEMO-UNI 示范大学</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.entry-root { min-height: 100vh; display: flex; flex-direction: column; }
.entry-container {
  flex: 1;
  min-height: 0;
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
  width: 460px;
  background: rgba(255,255,255,0.97);
  border-radius: 20px;
  padding: 36px 36px 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.entry-header { text-align: center; margin-bottom: 28px; }
.entry-icon { margin-bottom: 8px; }
.entry-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.entry-subtitle { font-size: 13px; color: #86909c; margin: 0; }

.form-section { padding: 0 4px; }
.form-item { margin-bottom: 20px; }
.form-label { display: block; font-size: 13px; font-weight: 500; color: #1d2129; margin-bottom: 6px; }

.school-code-row { position: relative; }
.code-input :deep(.el-input__inner) { font-size: 15px; letter-spacing: 2px; font-family: 'Courier New', monospace; }
.school-check {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #52c41a; margin-top: 6px;
}

.form-hint { font-size: 12px; margin: 4px 0 0; }

.submit-btn { width: 100%; height: 46px; font-size: 16px; border-radius: 10px; }
.demo-btn {
  width: 100%;
  height: 44px;
  margin: 12px 0 0;
  border-radius: 10px;
  border: 1px solid #667eea;
  color: #667eea;
}

.known-codes { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; }
.codes-label { font-size: 12px; color: #86909c; margin: 0 0 10px; }
.codes-list { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.code-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 6px;
  background: #f5f3ff;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e8e0ff;
}
.code-tag:hover { background: #667eea; color: #fff; }
</style>
