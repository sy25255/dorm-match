<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const activeTab = ref('login')
const schoolCode = computed(() => route.params.schoolCode as string)
const isAdminLogin = computed(() => route.query.admin === '1')
const isAdminActivation = computed(() => route.query.activate === 'admin')
const isTeacherEntry = computed(() => isAdminLogin.value || isAdminActivation.value)

const studentLoginForm = reactive({ studentNo: '', password: '' })
const activationForm = reactive({ studentNo: '', initialCode: '', password: '', confirmPassword: '' })
const teacherLoginForm = reactive({ email: '', password: '' })

const studentLoginRules = {
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const activationRules = {
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  initialCode: [{ required: true, message: '请输入学校发放的初始码', trigger: 'blur' }],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== activationForm.password) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

const teacherLoginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function landingPathForCurrentUser(fallbackSchool = schoolCode.value) {
  if (userStore.role === 'DEVELOPER') return '/dev'
  const targetSchool = userStore.schoolCode || fallbackSchool
  if (userStore.role === 'ADMIN') return `/${targetSchool}/admin`
  return `/${targetSchool}/`
}

function mapLoginError(message: string) {
  if (message.includes('Could not find the function') || message.includes('student_rosters') || message.includes('schema cache')) {
    return '名册制登录尚未完成数据库迁移，请学校管理员先执行 Supabase 名册制迁移'
  }
  if (message.includes('Invalid login credentials')) return '学号或密码错误'
  if (message.includes('STUDENT_ROSTER_NOT_FOUND')) return '学校名册中没有这个学号'
  if (message.includes('STUDENT_ROSTER_DISABLED')) return '该学生已被学校禁用'
  if (message.includes('STUDENT_ROSTER_ALREADY_CLAIMED')) return '该学号已经激活，请直接登录'
  if (message.includes('STUDENT_INITIAL_CODE_INVALID')) return '初始码错误'
  if (message.includes('Email not confirmed')) return '账号尚未完成邮箱验证'
  return message
}

onMounted(async () => {
  if (!userStore.token) {
    const restored = await userStore.restoreSession()
    if (restored) {
      router.push(isAdminActivation.value ? `/${userStore.schoolCode || schoolCode.value}/admin-activate` : landingPathForCurrentUser())
      return
    }
  }
  if (userStore.token) {
    router.push(isAdminActivation.value ? `/${userStore.schoolCode || schoolCode.value}/admin-activate` : landingPathForCurrentUser())
    return
  }

  activeTab.value = isTeacherEntry.value ? 'teacher' : 'login'
  if (!userStore.schoolName && schoolCode.value) {
    userStore.schoolName = localStorage.getItem('schoolName') || schoolCode.value
  }

  const rememberedStudentNo = userStore.getRememberedStudentNo()
  if (rememberedStudentNo) {
    studentLoginForm.studentNo = rememberedStudentNo
    activationForm.studentNo = rememberedStudentNo
  }
  const rememberedTeacher = userStore.getRememberedAccount()
  if (rememberedTeacher) teacherLoginForm.email = rememberedTeacher
})

async function handleStudentLogin() {
  loading.value = true
  try {
    await userStore.studentLogin(schoolCode.value, studentLoginForm.studentNo, studentLoginForm.password)
    ElMessage.success('登录成功')
    router.push(landingPathForCurrentUser(schoolCode.value))
  } catch (err: any) {
    ElMessage.error(mapLoginError(err?.message || '登录失败'))
  } finally {
    loading.value = false
  }
}

async function handleStudentActivation() {
  if (activationForm.password !== activationForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }

  loading.value = true
  try {
    await userStore.activateStudent(
      schoolCode.value,
      activationForm.studentNo,
      activationForm.initialCode,
      activationForm.password,
    )
    ElMessage.success('激活成功，请先完成偏好问卷')
    router.push(`/${schoolCode.value}/survey`)
  } catch (err: any) {
    ElMessage.error(mapLoginError(err?.message || '激活失败'))
  } finally {
    loading.value = false
  }
}

async function handleTeacherLogin() {
  loading.value = true
  try {
    await userStore.supabaseLogin(teacherLoginForm.email, teacherLoginForm.password)
    userStore.saveRememberedAccount(teacherLoginForm.email)
    const targetSchool = userStore.schoolCode || schoolCode.value
    if (targetSchool !== schoolCode.value) {
      ElMessage.warning(`账号属于 ${targetSchool}，已切换到对应学校`)
    } else {
      ElMessage.success('登录成功')
    }
    router.push(isAdminActivation.value ? `/${targetSchool}/admin-activate` : landingPathForCurrentUser(targetSchool))
  } catch (err: any) {
    ElMessage.error(mapLoginError(err?.message || '登录失败'))
  } finally {
    loading.value = false
  }
}

function backToSchoolEntry() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="school-brand">
          <el-icon :size="36" color="#2563eb"><School /></el-icon>
          <span class="school-name">{{ userStore.schoolName || '宿舍选择系统' }}</span>
          <span class="school-code-badge">{{ schoolCode }}</span>
          <span class="system-subtitle">新生宿舍舍友自主选择系统</span>
        </div>
        <p>学校名册认证后，完成问卷并选择合适舍友。</p>
      </div>

      <div v-if="isTeacherEntry" class="admin-login-note">
        <h2>{{ isAdminActivation ? '管理员激活' : '管理员/老师登录' }}</h2>
        <p>老师和管理员继续使用学校邮箱账号登录；学生请返回普通入口使用学号登录。</p>
      </div>

      <div v-else class="student-login-note">
        <h2>学生学号登录</h2>
        <p>学生信息来自学校导入的新生名册。姓名、学院、专业、班级不由学生自行填写。</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <template v-if="!isTeacherEntry">
          <el-tab-pane label="学号登录" name="login">
            <el-form :model="studentLoginForm" :rules="studentLoginRules" label-position="top" @submit.prevent="handleStudentLogin">
              <el-form-item label="学号" prop="studentNo">
                <el-input v-model="studentLoginForm.studentNo" placeholder="请输入学校名册中的学号" size="large" autocomplete="username" />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input v-model="studentLoginForm.password" type="password" placeholder="请输入激活时设置的密码" size="large" show-password autocomplete="current-password" />
              </el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="首次激活" name="activate">
            <el-form :model="activationForm" :rules="activationRules" label-position="top" @submit.prevent="handleStudentActivation">
              <el-form-item label="学号" prop="studentNo">
                <el-input v-model="activationForm.studentNo" placeholder="请输入学校名册中的学号" size="large" autocomplete="username" />
              </el-form-item>
              <el-form-item label="初始码" prop="initialCode">
                <el-input v-model="activationForm.initialCode" placeholder="请输入学校发放的初始码" size="large" />
              </el-form-item>
              <el-form-item label="新密码" prop="password">
                <el-input v-model="activationForm.password" type="password" placeholder="设置登录密码（至少6位）" size="large" show-password autocomplete="new-password" />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="activationForm.confirmPassword" type="password" placeholder="再次输入密码" size="large" show-password autocomplete="new-password" />
              </el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">激 活</el-button>
            </el-form>
          </el-tab-pane>
        </template>

        <el-tab-pane v-else label="邮箱登录" name="teacher">
          <el-form :model="teacherLoginForm" :rules="teacherLoginRules" label-position="top" @submit.prevent="handleTeacherLogin">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="teacherLoginForm.email" placeholder="请输入管理员/老师邮箱" size="large" autocomplete="username" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="teacherLoginForm.password" type="password" placeholder="请输入密码" size="large" show-password autocomplete="current-password" />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="admin-activation-entry">
        <template v-if="!isTeacherEntry">
          <el-button text type="primary" @click="router.push(`/${schoolCode}/login?admin=1`)">
            老师/管理员登录入口
          </el-button>
        </template>
        <template v-else>
          <el-button text type="primary" @click="router.push(`/${schoolCode}/login`)">
            返回学生学号登录
          </el-button>
        </template>
      </div>

      <div class="switch-school" @click="backToSchoolEntry">
        <el-icon :size="14"><ArrowLeft /></el-icon>
        <span>切换学校</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 34%),
    linear-gradient(135deg, #f6f8fb 0%, #e9eff7 52%, #edf7f1 100%);
  padding: 20px;
}
.login-card {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 10px;
  padding: 28px 32px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.14);
  max-height: 92vh;
  overflow-y: auto;
}
.login-header {
  text-align: center;
  margin-bottom: 16px;
}
.login-header p {
  font-size: 14px;
  color: #4e5969;
  margin-top: 6px;
}
.school-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.school-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-top: 6px;
}
.school-code-badge {
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f2f3f5;
  color: #4e5969;
  font-size: 12px;
  font-weight: 600;
}
.system-subtitle {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}
.student-login-note,
.admin-login-note {
  display: grid;
  gap: 4px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.student-login-note {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
}
.admin-login-note {
  border: 1px solid #fde68a;
  background: #fffbeb;
}
.student-login-note h2,
.admin-login-note h2 {
  margin: 0;
  font-size: 16px;
  color: #1e3a8a;
}
.student-login-note p,
.admin-login-note p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}
.login-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}
.login-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-size: 15px;
}
.login-tabs :deep(.el-form-item) {
  margin-bottom: 14px;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
}
.admin-activation-entry {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.switch-school {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 13px;
  color: #a0aec0;
  cursor: pointer;
}
.switch-school:hover {
  color: #2563eb;
}
@media (max-width: 640px) {
  .login-container {
    align-items: flex-start;
    padding: 12px;
  }
  .login-card {
    padding: 22px 18px;
    max-height: none;
  }
}
</style>
