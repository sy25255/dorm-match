<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { schoolApi } from '@/api/school'
import { ElMessage } from 'element-plus'
import { ArrowLeft, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const inviteChecking = ref(false)
const guestDialogVisible = ref(false)
const guestForm = reactive({ name: '', collegeId: null as number | null, majorId: null as number | null })
const studentInvite = reactive({ code: '', verified: false, name: '' })
const activeTab = ref('register')
const schoolCode = computed(() => route.params.schoolCode as string)
const isAdminActivation = computed(() => route.query.activate === 'admin')

// 学院/专业下拉数据
const colleges = ref<{ id: number; name: string }[]>([])
const majors = ref<{ id: number; name: string; collegeId: number }[]>([])

const filteredMajors = computed(() => {
  if (!guestForm.collegeId) return []
  return majors.value.filter(m => m.collegeId === guestForm.collegeId)
})

// 默认演示数据（数据库无数据时使用）
const DEMO_COLLEGES = [
  { id: 1, name: '计算机科学与技术学院' },
  { id: 2, name: '经济管理学院' },
]
const DEMO_MAJORS = [
  { id: 101, name: '计算机科学与技术', collegeId: 1 },
  { id: 102, name: '软件工程', collegeId: 1 },
  { id: 201, name: '工商管理', collegeId: 2 },
  { id: 202, name: '会计学', collegeId: 2 },
]

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({
  email: '', password: '', confirmPassword: '',
  realName: '', studentNo: '',
})

async function verifyStudentInvite() {
  if (!studentInvite.code.trim()) {
    ElMessage.warning('请输入学校发放的邀请码')
    return false
  }
  inviteChecking.value = true
  try {
    const res = await schoolApi.verifyStudentInviteCode(schoolCode.value, studentInvite.code)
    studentInvite.verified = true
    studentInvite.name = res.data.data?.name || '新生入学邀请码'
    ElMessage.success('邀请码验证通过')
    return true
  } catch (err: any) {
    studentInvite.verified = false
    ElMessage.error(err?.message || '邀请码无效或已过期')
    return false
  } finally {
    inviteChecking.value = false
  }
}

async function ensureStudentInvite() {
  if (studentInvite.verified) return true
  return verifyStudentInvite()
}

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码（至少6位）', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  realName: [{ required: true, message: '请填写真实姓名', trigger: 'blur' }],
}

function landingPathForCurrentUser(fallbackSchool = schoolCode.value) {
  if (userStore.role === 'DEVELOPER') return '/dev'
  const targetSchool = userStore.schoolCode || fallbackSchool
  if (userStore.role === 'ADMIN') return `/${targetSchool}/admin`
  return `/${targetSchool}/`
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
  if (!userStore.schoolName && schoolCode.value) {
    const name = localStorage.getItem('schoolName') || '未知学校'
    userStore.schoolName = name
  }
  const remembered = userStore.getRememberedAccount()
  if (remembered) {
    loginForm.email = remembered
    registerForm.email = remembered
    activeTab.value = 'login'
  }
})

// 加载学院/专业列表
async function loadCollegesAndMajors() {
  try {
    const colRes = await schoolApi.getColleges()
    colleges.value = (colRes.data.data || []).map((c: any) => ({ id: c.id, name: c.name }))
    const majRes = await schoolApi.getMajors()
    majors.value = (majRes.data.data || []).map((m: any) => ({ id: m.id, name: m.name, collegeId: m.college_id || m.collegeId }))
  } catch { /* ignore */ }
  // 数据库无数据时使用默认演示数据
  if (colleges.value.length === 0) {
    colleges.value = DEMO_COLLEGES
    majors.value = DEMO_MAJORS
  }
}

watch(colleges, () => {
  if (colleges.value.length > 0) {
    majors.value = colleges.value.length > 0 && majors.value.length === 0 ? DEMO_MAJORS : majors.value
  }
})

// 选择学院时清空专业
watch(() => guestForm.collegeId, () => {
  guestForm.majorId = null
})

async function handleLogin() {
  loading.value = true
  try {
    await userStore.supabaseLogin(loginForm.email, loginForm.password)
    userStore.saveRememberedAccount(loginForm.email)
    const targetSchool = userStore.schoolCode || schoolCode.value
    if (targetSchool !== schoolCode.value) {
      ElMessage.warning(`账号属于 ${targetSchool}，已切换到对应学校`)
    } else {
      ElMessage.success('登录成功')
    }
    router.push(isAdminActivation.value ? `/${targetSchool}/admin-activate` : landingPathForCurrentUser(targetSchool))
  } catch (err: any) {
    const msg = err?.message || '登录失败'
    if (msg.includes('Invalid login credentials')) {
      ElMessage.error('邮箱或密码错误')
    } else if (msg.includes('Email not confirmed')) {
      ElMessage.warning('邮箱尚未验证，请检查收件箱中的验证邮件')
    } else {
      ElMessage.error(msg)
    }
  } finally { loading.value = false }
}

async function handleRegister() {
  if (!(await ensureStudentInvite())) return
  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (!registerForm.realName.trim()) {
    ElMessage.warning('请填写真实姓名')
    return
  }
  loading.value = true
  try {
    await userStore.supabaseRegister(
      registerForm.email,
      registerForm.password,
      registerForm.realName.trim(),
      userStore.schoolCode || schoolCode.value,
      registerForm.studentNo || ''
    )
    userStore.saveRememberedAccount(registerForm.email)
    if (isAdminActivation.value) {
      ElMessage.success('注册成功，请继续输入管理员激活码')
      router.push(`/${schoolCode.value}/admin-activate`)
    } else {
      ElMessage.success('注册成功！请先完成偏好问卷')
      router.push(`/${schoolCode.value}/survey`)
    }
  } catch (err: any) {
    const msg = err?.message || '注册失败'
    if (msg.includes('already registered') || msg.includes('already exists')) {
      ElMessage.error('该邮箱已被注册，请直接登录')
    } else {
      ElMessage.error(msg)
    }
  } finally { loading.value = false }
}

function backToSchoolEntry() {
  userStore.logout()
  router.push('/')
}

async function handleGuestLogin() {
  if (!(await ensureStudentInvite())) return
  // 先加载学院/专业数据
  await loadCollegesAndMajors()

  // 检查是否有记住的免登录账号
  const savedGuest = userStore.getGuestAccount()
  if (savedGuest && savedGuest.schoolCode === (userStore.schoolCode || schoolCode.value)) {
    // 尝试用记住的邮箱 + 固定密码重新登录
    try {
      await userStore.guestReLogin(savedGuest.email)
      ElMessage.success(`欢迎回来，${savedGuest.name}！`)
      router.push(`/${schoolCode.value}/`)
      return
    } catch {
      // 账号可能已被清理，清除记录，重新创建
      userStore.clearGuestAccount()
    }
  }

  // 预填上次的姓名
  if (savedGuest) {
    guestForm.name = savedGuest.name
    // 尝试匹配上次的学院和专业
    const prevCollege = colleges.value.find(c => c.name === savedGuest.collegeName)
    if (prevCollege) {
      guestForm.collegeId = prevCollege.id
      const prevMajor = filteredMajors.value.find(m => m.name === savedGuest.majorName)
      if (prevMajor) guestForm.majorId = prevMajor.id
    }
  } else {
    guestForm.name = ''
  }
  guestForm.collegeId = guestForm.collegeId || null
  guestForm.majorId = guestForm.majorId || null
  guestDialogVisible.value = true
}

async function confirmGuestLogin() {
  if (!guestForm.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!guestForm.collegeId) {
    ElMessage.warning('请选择学院')
    return
  }
  if (!guestForm.majorId) {
    ElMessage.warning('请选择专业')
    return
  }
  const college = colleges.value.find(c => c.id === guestForm.collegeId)
  const major = majors.value.find(m => m.id === guestForm.majorId)
  loading.value = true
  try {
    await userStore.guestLogin(
      userStore.schoolCode || schoolCode.value,
      guestForm.name.trim(),
      college?.name || '',
      major?.name || '',
    )
    guestDialogVisible.value = false
    ElMessage.success(`欢迎 ${guestForm.name.trim()}！请先完成偏好问卷`)
    router.push(`/${schoolCode.value}/survey`)
  } catch (err: any) {
    ElMessage.error(err?.message || '免登录失败，请重试')
  } finally { loading.value = false }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="school-brand">
          <el-icon :size="36" color="#667eea"><School /></el-icon>
          <span class="school-name">{{ userStore.schoolName || '宿舍选择系统' }}</span>
          <span style="font-size:13px;color:#86909c;margin-top:4px">新生宿舍舍友自主选择系统</span>
        </div>
        <p style="font-size:14px;color:#4e5969;margin-top:4px">完成偏好问卷，智能匹配理想舍友</p>
      </div>

      <div class="invite-gate">
        <div>
          <h2>学生邀请码</h2>
          <p>请先输入学校发放的邀请码，系统会把你绑定到当前学校后再进入问卷和舍友选择流程。</p>
        </div>
        <div class="invite-row">
          <el-input
            v-model="studentInvite.code"
            placeholder="请输入学校邀请码"
            size="large"
            :disabled="studentInvite.verified"
            @keyup.enter="verifyStudentInvite"
          />
          <el-button type="primary" size="large" :loading="inviteChecking" :disabled="studentInvite.verified" @click="verifyStudentInvite">
            {{ studentInvite.verified ? '已验证' : '验证' }}
          </el-button>
        </div>
        <el-alert
          v-if="studentInvite.verified"
          type="success"
          :closable="false"
          show-icon
          :title="`已通过：${studentInvite.name}`"
        />
      </div>

      <div class="test-entry-panel">
        <div>
          <h2>测试体验</h2>
          <p>填写姓名、学院和专业后进入完整流程，不需要先注册正式账号。</p>
        </div>
        <el-button type="primary" size="large" class="test-entry-btn" :disabled="!studentInvite.verified" @click="handleGuestLogin">
          <el-icon :size="16"><UserFilled /></el-icon>
          填写测试信息进入
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="新生注册" name="register">
          <el-form :model="registerForm" :rules="registerRules" label-position="top" @submit.prevent="handleRegister">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email" placeholder="请输入邮箱（登录使用）" size="large" />
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" size="large" />
            </el-form-item>
            <el-form-item label="学号（选填）">
              <el-input v-model="registerForm.studentNo" placeholder="请输入录取通知书上的学号" size="large" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="设置登录密码（至少6位）" size="large" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" size="large" show-password />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loading" :disabled="!studentInvite.verified" native-type="submit" class="login-btn">注 册</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="已有账号" name="login">
          <el-form :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent="handleLogin">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="loginForm.email" placeholder="请输入注册时使用的邮箱" size="large" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="admin-activation-entry">
        <el-button text type="primary" @click="router.push(`/${schoolCode}/login?activate=admin`)">
          老师/管理员激活入口
        </el-button>
        <span>受邀老师请先登录或注册，再输入平台方发放的激活码。</span>
      </div>

      <!-- 免登录弹窗 -->
      <el-dialog v-model="guestDialogVisible" title="测试信息填写" width="420px" :close-on-click-modal="false" @opened="loadCollegesAndMajors">
        <el-form label-position="top" @submit.prevent="confirmGuestLogin">
          <el-form-item label="姓名" required>
            <el-input v-model="guestForm.name" placeholder="请输入你的姓名（如：张三）" size="large" maxlength="20" />
          </el-form-item>
          <el-form-item label="学院" required>
            <el-select v-model="guestForm.collegeId" placeholder="请选择学院" size="large" style="width:100%">
              <el-option
                v-for="c in colleges"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="专业" required>
            <el-select v-model="guestForm.majorId" placeholder="请先选择学院" size="large" style="width:100%" :disabled="!guestForm.collegeId">
              <el-option
                v-for="m in filteredMajors"
                :key="m.id"
                :label="m.name"
                :value="m.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="guestDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="loading" @click="confirmGuestLogin">进入系统</el-button>
        </template>
      </el-dialog>

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
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.12), transparent 34%),
    linear-gradient(135deg, #f6f8fb 0%, #e9eff7 52%, #edf7f1 100%);
  padding: 20px;
}
.login-card {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.14);
  max-height: 92vh;
  overflow-y: auto;
}
.login-header { text-align: center; margin-bottom: 16px; }
.school-brand { display: flex; flex-direction: column; align-items: center; }
.school-name { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
.invite-gate {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  background: #f8fafc;
  margin-bottom: 16px;
}
.test-entry-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #f8fbff;
  margin-bottom: 16px;
}
.invite-gate h2 { margin: 0 0 4px; font-size: 16px; color: #1d2129; }
.invite-gate p { margin: 0; font-size: 13px; line-height: 1.5; color: #5f6b7a; }
.invite-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.test-entry-panel h2 { margin: 0 0 4px; font-size: 16px; color: #1d2129; }
.test-entry-panel p { margin: 0; font-size: 13px; line-height: 1.5; color: #5f6b7a; }
.test-entry-btn { min-width: 150px; }
.login-tabs :deep(.el-tabs__nav) { width: 100%; display: flex; }
.login-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; font-size: 15px; }
.login-tabs :deep(.el-form-item) { margin-bottom: 14px; }
.login-btn { width: 100%; margin-top: 4px; }
.admin-activation-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #718096;
  text-align: center;
}
.switch-school { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px; font-size: 13px; color: #a0aec0; cursor: pointer; }
.switch-school:hover { color: #667eea; }
.guest-section { text-align: center; }
.guest-btn { width: 100%; margin-left: 0; border: 2px dashed #c0c4cc; color: #606266; background: #fafafa; }
.guest-btn:hover { border-color: #667eea; color: #667eea; background: #f0f0ff; }

@media (max-width: 640px) {
  .login-container { align-items: flex-start; padding: 12px; }
  .login-card { padding: 22px 18px; max-height: none; }
  .invite-row,
  .test-entry-panel { grid-template-columns: 1fr; }
  .test-entry-btn { width: 100%; }
}
</style>
