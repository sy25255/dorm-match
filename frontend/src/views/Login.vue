<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { ArrowLeft, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const guestDialogVisible = ref(false)
const guestForm = reactive({ name: '', major: '' })
const activeTab = ref('register')
const schoolCode = computed(() => route.params.schoolCode as string)

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

onMounted(() => {
  if (userStore.token) {
    router.push(`/${schoolCode.value}/`)
    return
  }
  if (!userStore.schoolName && schoolCode.value) {
    const name = localStorage.getItem('schoolName') || '未知学校'
    userStore.schoolName = name
  }
  const remembered = userStore.getRememberedAccount()
  if (remembered) loginForm.email = remembered
})

async function handleLogin() {
  loading.value = true
  try {
    await userStore.supabaseLogin(loginForm.email, loginForm.password)
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
  guestForm.name = ''
  guestForm.major = ''
  guestDialogVisible.value = true
}

async function confirmGuestLogin() {
  if (!guestForm.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  loading.value = true
  try {
    await userStore.guestLogin(
      userStore.schoolCode || schoolCode.value,
      guestForm.name.trim(),
      guestForm.major.trim(),
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
        <el-divider><span style="color:#a0aec0;font-size:12px">快速测试入口（多人可同时使用）</span></el-divider>
        <el-button size="large" class="guest-btn" @click="handleGuestLogin">
          <el-icon :size="16"><UserFilled /></el-icon>
          免登录测试进入
        </el-button>
      </div>

      <!-- 免登录弹窗 -->
      <el-dialog v-model="guestDialogVisible" title="测试信息填写" width="380px" :close-on-click-modal="false">
        <el-form label-position="top" @submit.prevent="confirmGuestLogin">
          <el-form-item label="姓名" required>
            <el-input v-model="guestForm.name" placeholder="请输入你的姓名（如：张三）" size="large" maxlength="20" />
          </el-form-item>
          <el-form-item label="专业">
            <el-input v-model="guestForm.major" placeholder="请输入你的专业（如：计算机科学）" size="large" maxlength="30" />
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
</style>