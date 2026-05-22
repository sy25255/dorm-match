<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { schoolApi } from '@/api/school'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowDown, UserFilled, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const guestDialogVisible = ref(false)
const guestForm = reactive({ name: '', collegeId: null as number | null, majorId: null as number | null })
const activeTab = ref('register')
const schoolCode = computed(() => route.params.schoolCode as string)
const showTestAccounts = ref(false)

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

onMounted(async () => {
  if (!userStore.token) {
    const restored = await userStore.restoreSession()
    if (restored) {
      router.push(`/${schoolCode.value}/`)
      return
    }
  }
  if (userStore.token) {
    router.push(`/${schoolCode.value}/`)
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
    ElMessage.success('登录成功')
    router.push(`/${schoolCode.value}/`)
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
    ElMessage.success('注册成功！请先完成偏好问卷')
    router.push(`/${schoolCode.value}/survey`)
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
            <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">注 册</el-button>
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

      <div class="guest-section">
        <el-divider><span style="color:#a0aec0;font-size:12px">快速测试入口（免注册，自动记住账号）</span></el-divider>
        <el-button size="large" class="guest-btn" @click="handleGuestLogin">
          <el-icon :size="16"><UserFilled /></el-icon>
          免登录测试进入
        </el-button>
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

      <!-- 测试账号提示 -->
      <div class="test-accounts-section">
        <el-divider />
        <div class="test-accounts-toggle" @click="showTestAccounts = !showTestAccounts">
          <el-icon :size="14"><InfoFilled /></el-icon>
          <span>测试账号</span>
          <el-icon :size="12" style="transition: transform 0.2s" :style="{ transform: showTestAccounts ? 'rotate(180deg)' : '' }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="showTestAccounts" class="test-accounts-list">
          <div class="test-account-row">
            <el-tag type="danger" size="small">管理员</el-tag>
            <code>admin@demo.com</code>
            <span class="test-pwd">Admin123!</span>
          </div>
          <div class="test-account-row">
            <el-tag type="warning" size="small">开发者</el-tag>
            <code>dev@demo.com</code>
            <span class="test-pwd">Dev123!</span>
          </div>
          <p class="test-hint">提示：如需创建管理员/开发者账号，请联系系统运维人员</p>
        </div>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-card {
  width: 440px;
  background: #fff;
  border-radius: 16px;
  padding: 36px 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  max-height: 90vh;
  overflow-y: auto;
}
.login-header { text-align: center; margin-bottom: 24px; }
.school-brand { display: flex; flex-direction: column; align-items: center; }
.school-name { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
.login-tabs :deep(.el-tabs__nav) { width: 100%; display: flex; }
.login-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; font-size: 15px; }
.login-btn { width: 100%; margin-top: 4px; }
.switch-school { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px; font-size: 13px; color: #a0aec0; cursor: pointer; }
.switch-school:hover { color: #667eea; }
.guest-section { text-align: center; }
.guest-btn { width: 100%; border: 2px dashed #c0c4cc; color: #606266; background: #fafafa; }
.guest-btn:hover { border-color: #667eea; color: #667eea; background: #f0f0ff; }

.test-accounts-section { margin-top: 4px; }
.test-accounts-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #86909c;
  cursor: pointer;
  padding: 6px 0;
  user-select: none;
}
.test-accounts-toggle:hover { color: #667eea; }
.test-accounts-list {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 4px;
}
.test-account-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}
.test-account-row code {
  background: #e8eaed;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #4e5969;
}
.test-pwd {
  color: #86909c;
  font-size: 12px;
}
.test-hint {
  font-size: 11px;
  color: #c9cdd4;
  margin: 4px 0 0;
}
</style>