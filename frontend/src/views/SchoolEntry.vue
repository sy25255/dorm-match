<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)
const schoolCode = ref('')
const validatedSchool = ref<{ code: string; name: string } | null>(null)
const validating = ref(false)
const codeTouched = ref(false)
const rememberAccount = ref(true)

const loginForm = reactive({ studentNo: '', password: '' })
const registerForm = reactive({ studentNo: '', realName: '', password: '', confirmPassword: '' })

const demoStudents = [
  { name: '张伟', studentNo: '20240001', school: 'DEMO-UNI', schoolName: '示范大学' },
  { name: '赵刚', studentNo: '20240004', school: 'DEMO-UNI', schoolName: '示范大学' },
  { name: '王芳', studentNo: '20240011', school: 'DEMO-UNI', schoolName: '示范大学' },
  { name: '李娜', studentNo: '20240012', school: 'DEMO-UNI', schoolName: '示范大学' },
  { name: '林思雨', studentNo: '20240019', school: 'DEMO-UNI', schoolName: '示范大学' },
]

const demoAdmins = [
  { label: '示范大学', school: 'DEMO-UNI', schoolName: '示范大学' },
  { label: '测试学院', school: 'TEST', schoolName: '测试学院' },
  { label: '北京大学', school: 'BJ-UNI', schoolName: '北京大学' },
  { label: '上海大学', school: 'SH-UNI', schoolName: '上海大学' },
]

onMounted(() => {
  const remembered = userStore.getRememberedAccount()
  if (remembered) {
    loginForm.studentNo = remembered
  }
})

async function validateSchoolCode() {
  const code = schoolCode.value.trim().toUpperCase()
  codeTouched.value = true
  if (!code) {
    validatedSchool.value = null
    return
  }
  validating.value = true
  try {
    const res = await request.post('/school/validate', { code })
    const data = res.data?.data || res.data
    if (data?.valid && data?.school) {
      validatedSchool.value = data.school
    } else {
      validatedSchool.value = null
    }
  } catch {
    validatedSchool.value = null
  } finally {
    validating.value = false
  }
}

async function ensureSchoolValidated(): Promise<boolean> {
  if (validatedSchool.value || validating.value) return true
  await validateSchoolCode()
  return !!validatedSchool.value
}

async function handleLogin() {
  const code = schoolCode.value.trim().toUpperCase()
  if (!code) { ElMessage.warning('请输入学校编码'); return }
  if (!loginForm.studentNo) { ElMessage.warning('请输入学号'); return }
  if (!loginForm.password) { ElMessage.warning('请输入密码'); return }

  loading.value = true
  try {
    if (!validatedSchool.value) {
      await validateSchoolCode()
    }
    if (!validatedSchool.value) {
      ElMessage.warning('学校编码无效，请检查后重试')
      return
    }
    await userStore.login(loginForm.studentNo, loginForm.password, code)
    userStore.setSchoolInfo(validatedSchool.value.code, validatedSchool.value.name)
    if (!rememberAccount.value) {
      userStore.clearRememberedAccount()
    }
    ElMessage.success(`欢迎来到${validatedSchool.value.name}！`)
    const target = userStore.role === 'ADMIN' ? `/${code}/admin` : `/${code}/`
    router.push(target)
  } catch (e: any) {
    const msg = e?.response?.data?.message || '登录失败，请检查学号和密码是否正确'
    ElMessage.error(msg)
  } finally { loading.value = false }
}

async function handleRegister() {
  const code = schoolCode.value.trim().toUpperCase()
  if (!code) { ElMessage.warning('请输入学校编码'); return }
  if (!registerForm.studentNo) { ElMessage.warning('请输入学号'); return }
  if (!registerForm.realName) { ElMessage.warning('请填写真实姓名'); return }
  if (!registerForm.password) { ElMessage.warning('请设置密码'); return }
  if (registerForm.password !== registerForm.confirmPassword) { ElMessage.warning('两次密码不一致'); return }

  loading.value = true
  try {
    if (!validatedSchool.value) {
      await validateSchoolCode()
    }
    if (!validatedSchool.value) {
      ElMessage.warning('学校编码无效，请检查后重试')
      return
    }
    await userStore.register(code, registerForm.studentNo, registerForm.realName, registerForm.password)
    userStore.setSchoolInfo(validatedSchool.value.code, validatedSchool.value.name)
    if (!rememberAccount.value) {
      userStore.clearRememberedAccount()
    }
    ElMessage.success('注册成功！请先完成偏好问卷')
    router.push(`/${code}/survey`)
  } catch (e: any) {
    const msg = e?.response?.data?.message || '注册失败，该学号可能已被注册'
    ElMessage.error(msg)
  } finally { loading.value = false }
}

function onSwitchTab(tab: string) {
  activeTab.value = tab
  if (tab === 'login') {
    const remembered = userStore.getRememberedAccount()
    if (remembered && !loginForm.studentNo) {
      loginForm.studentNo = remembered
    }
  }
}

function demoLogin(studentNo: string, name: string, school: string, schoolName: string) {
  schoolCode.value = school.toUpperCase()
  validatedSchool.value = { code: school.toUpperCase(), name: schoolName }
  loginForm.studentNo = studentNo
  userStore.demoLogin(studentNo, name)
  userStore.setSchoolInfo(school.toUpperCase(), schoolName)
  router.push(`/${school.toUpperCase()}/`)
}

function demoAdminLogin(school: string, schoolName: string) {
  userStore.logout()
  schoolCode.value = school.toUpperCase()
  validatedSchool.value = { code: school.toUpperCase(), name: schoolName }
  userStore.role = 'ADMIN'
  userStore.token = 'demo-admin-token'
  userStore.userId = 99
  userStore.username = '系统管理员'
  localStorage.setItem('token', 'demo-admin-token')
  localStorage.setItem('refreshToken', 'demo-admin-refresh')
  localStorage.setItem('userId', '99')
  localStorage.setItem('username', '系统管理员')
  localStorage.setItem('role', 'ADMIN')
  userStore.setSchoolInfo(school.toUpperCase(), schoolName)
  router.push(`/${school.toUpperCase()}/admin`)
}

function enterAsDeveloper() {
  userStore.demoDevLogin()
  localStorage.removeItem('schoolCode')
  localStorage.removeItem('schoolName')
  router.push('/dev')
}

function onKeyUpLogin(e: KeyboardEvent) {
  if (e.key === 'Enter') handleLogin()
}
function onKeyUpRegister(e: KeyboardEvent) {
  if (e.key === 'Enter') handleRegister()
}
</script>

<template>
  <div class="entry-container">
    <div class="entry-card">
      <div class="entry-header">
        <div class="entry-icon">
          <el-icon :size="44" color="#667eea"><School /></el-icon>
        </div>
        <h1 class="entry-title">新生宿舍舍友选择系统</h1>
        <p class="entry-subtitle">登录或注册，开启你的大学舍友之旅</p>
      </div>

      <el-tabs v-model="activeTab" class="entry-tabs" @tab-change="onSwitchTab">
        <el-tab-pane label="登录" name="login">
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
                  @keyup="onKeyUpLogin"
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

            <div class="form-item">
              <label class="form-label">学号</label>
              <el-input
                v-model="loginForm.studentNo"
                placeholder="请输入学号"
                size="large"
                @keyup="onKeyUpLogin"
              />
            </div>

            <div class="form-item">
              <label class="form-label">密码</label>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                @keyup="onKeyUpLogin"
              />
            </div>

            <div class="form-options">
              <el-checkbox v-model="rememberAccount" size="small">记住账号</el-checkbox>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <div class="form-section">
            <div class="form-item">
              <label class="form-label">学校编码 <span class="required">*</span></label>
              <div class="school-code-row">
                <el-input
                  v-model="schoolCode"
                  placeholder="例如：DEMO-UNI"
                  size="large"
                  :maxlength="20"
                  class="code-input"
                  @input="codeTouched = false; validatedSchool = null"
                  @blur="validateSchoolCode"
                  @keyup="onKeyUpRegister"
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
              <p v-if="schoolCode && !validatedSchool && !validating" class="form-hint" style="color:#f53f3f">
                学校编码无效，请检查后重试
              </p>
            </div>

            <div class="form-item">
              <label class="form-label">学号 <span class="required">*</span></label>
              <el-input
                v-model="registerForm.studentNo"
                placeholder="请输入录取通知书上的学号"
                size="large"
                @keyup="onKeyUpRegister"
              />
            </div>

            <div class="form-item">
              <label class="form-label">真实姓名 <span class="required">*</span></label>
              <el-input
                v-model="registerForm.realName"
                placeholder="请输入真实姓名"
                size="large"
                @keyup="onKeyUpRegister"
              />
            </div>

            <div class="form-item">
              <label class="form-label">登录密码 <span class="required">*</span></label>
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="设置登录密码（至少6位）"
                size="large"
                show-password
                @keyup="onKeyUpRegister"
              />
            </div>

            <div class="form-item">
              <label class="form-label">确认密码 <span class="required">*</span></label>
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                size="large"
                show-password
                @keyup="onKeyUpRegister"
              />

            </div>

            <div class="form-options">
              <el-checkbox v-model="rememberAccount" size="small">记住账号</el-checkbox>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleRegister"
            >
              注 册
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-divider style="margin: 16px 0 12px;">
        <span style="color:#c9cdd4;font-size:12px;">— 演示模式（无需注册）—</span>
      </el-divider>

      <div class="demo-section">
        <p class="demo-label">👨‍🎓 学生演示账号</p>
        <div class="demo-grid">
          <el-button
            v-for="s in demoStudents" :key="s.studentNo"
            size="small"
            class="demo-btn"
            @click="demoLogin(s.studentNo, s.name, s.school, s.schoolName)"
          >
            {{ s.name }}
            <span class="demo-no">{{ s.studentNo }}</span>
          </el-button>
        </div>

        <el-divider style="margin: 10px 0;" />

        <p class="demo-label">🔧 管理员演示（各学校后台）</p>
        <div class="demo-grid">
          <el-button
            v-for="a in demoAdmins" :key="a.school"
            size="small"
            class="demo-btn admin-demo-btn"
            @click="demoAdminLogin(a.school, a.schoolName)"
          >
            {{ a.label }}
          </el-button>
        </div>
      </div>

      <div class="dev-entry">
        <el-button
          class="dev-btn-main"
          @click="enterAsDeveloper"
        >
          <el-icon :size="16"><Monitor /></el-icon>
          <span>系统开发者后台</span>
        </el-button>
        <p class="dev-hint">查看全部学校数据 · 管理管理员账号 · 处理用户反馈</p>
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
  width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(255,255,255,0.97);
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.entry-header { text-align: center; margin-bottom: 10px; }
.entry-icon { margin-bottom: 8px; }
.entry-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.entry-subtitle { font-size: 13px; color: #86909c; margin: 0; }

.entry-tabs :deep(.el-tabs__nav) { width: 100%; display: flex; }
.entry-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; font-size: 15px; font-weight: 500; }
.entry-tabs :deep(.el-tabs__header) { margin-bottom: 12px; }

.form-section { padding: 0 4px; }
.form-item { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 500; color: #1d2129; margin-bottom: 6px; }
.required { color: #f53f3f; }

.school-code-row { position: relative; }
.code-input :deep(.el-input__inner) { font-size: 15px; letter-spacing: 2px; font-family: 'Courier New', monospace; }
.school-check {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #52c41a; margin-top: 6px;
}

.form-options { display: flex; align-items: center; margin-bottom: 16px; }
.form-hint { font-size: 12px; margin: 4px 0 0; }

.submit-btn { width: 100%; height: 46px; font-size: 16px; border-radius: 10px; }

.demo-section { margin-top: 4px; }
.demo-label { font-size: 12px; color: #86909c; margin: 0 0 8px; text-align: center; }
.demo-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.demo-btn {
  border-color: #e5e6eb; color: #4e5969;
  font-size: 12px; transition: all 0.2s;
}
.demo-btn:hover { border-color: #667eea; color: #667eea; background: #f5f3ff; }
.demo-no { color: #86909c; font-size: 10px; margin-left: 4px; }
.admin-demo-btn { border-color: #ffd666; color: #d48806; }
.admin-demo-btn:hover { border-color: #faad14; color: #d48806; background: #fffbe6; }

.dev-entry { text-align: center; padding: 10px 0 0; margin-top: 12px; border-top: 1px solid #f0f0f0; }
.dev-btn-main {
  width: 100%; height: 38px; font-size: 13px;
  border-radius: 8px; border: 1.5px dashed #b37feb;
  color: #722ed1; background: #f9f0ff;
}
.dev-btn-main:hover { background: #9254de; color: #fff; border-color: #9254de; }
.dev-hint { margin: 6px 0 0; font-size: 11px; color: #b0b8c0; }
</style>