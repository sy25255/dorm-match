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

const loginForm = reactive({ studentNo: '', password: '' })
const registerForm = reactive({
  studentNo: '', realName: '', password: '', confirmPassword: '',
  inviteCode: '', collegeId: null as number | null, majorId: null as number | null, classId: null as number | null
})

const rules = {
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

onMounted(() => {
  if (!userStore.schoolName && schoolCode.value) {
    const name = localStorage.getItem('schoolName') || '未知学校'
    userStore.schoolName = name
  }
})

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(loginForm.studentNo, loginForm.password)
    ElMessage.success('登录成功')
    router.push(`/${schoolCode.value}${userStore.role === 'ADMIN' ? '/admin' : '/'}`)
  } catch {} finally { loading.value = false }
}

function demoLogin(name: string, studentNo?: string) {
  userStore.demoLogin(studentNo || loginForm.studentNo || '20240001', name)
  router.push(`/${schoolCode.value}/`)
}

function demoAdminLogin() {
  userStore.role = 'ADMIN'
  userStore.token = 'demo-admin-token'
  userStore.userId = 99
  userStore.username = '系统管理员'
  localStorage.setItem('token', 'demo-admin-token')
  localStorage.setItem('refreshToken', 'demo-admin-refresh')
  localStorage.setItem('userId', '99')
  localStorage.setItem('username', '系统管理员')
  localStorage.setItem('role', 'ADMIN')
  router.push(`/${schoolCode.value}/admin`)
}

function demoDevLogin() {
  userStore.demoDevLogin()
  router.push(`/${schoolCode.value}/`)
}

async function handleRegister() {
  if (!registerForm.inviteCode) { ElMessage.warning('请输入学校发放的邀请码'); return }
  if (registerForm.password !== registerForm.confirmPassword) { ElMessage.warning('两次密码不一致'); return }
  if (!registerForm.realName) { ElMessage.warning('请填写真实姓名'); return }
  loading.value = true
  try {
    await userStore.login(registerForm.studentNo, registerForm.password)
    ElMessage.success('注册成功！请先完成偏好问卷')
    router.push(`/${schoolCode.value}/survey`)
  } finally { loading.value = false }
}

function backToSchoolEntry() {
  localStorage.removeItem('schoolCode')
  localStorage.removeItem('schoolName')
  userStore.schoolCode = ''
  userStore.schoolName = ''
  router.push('/')
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
        <el-tab-pane label="学号登录" name="login">
          <el-form :model="loginForm" :rules="rules" label-position="top" @submit.prevent="handleLogin">
            <el-form-item label="学号" prop="studentNo">
              <el-input v-model="loginForm.studentNo" placeholder="请输入学号" size="large" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="新生注册" name="register">
          <el-alert type="info" :closable="false" style="margin-bottom:12px" title="新生需填写学校统一发放的邀请码完成注册" />
          <el-form :model="registerForm" label-position="top" @submit.prevent="handleRegister">
            <el-form-item label="邀请码" required>
              <el-input v-model="registerForm.inviteCode" placeholder="请输入学校发放的邀请码（如 INV-XXXX）" size="large" />
            </el-form-item>
            <el-form-item label="学号" required>
              <el-input v-model="registerForm.studentNo" placeholder="请输入录取通知书上的学号" size="large" />
            </el-form-item>
            <el-form-item label="真实姓名" required>
              <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" size="large" />
            </el-form-item>
            <el-form-item label="密码" required>
              <el-input v-model="registerForm.password" type="password" placeholder="设置登录密码（至少6位）" size="large" show-password />
            </el-form-item>
            <el-form-item label="确认密码" required>
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" size="large" show-password />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">注 册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-divider style="margin: 16px 0 12px;">
        <span style="color:#c9cdd4;font-size:12px;">— 演示模式（无需后端）—</span>
      </el-divider>

      <div class="demo-btns">
        <el-button size="default" class="demo-btn" @click="demoLogin('张伟', '20240001')">👨 张伟 - 计算机</el-button>
        <el-button size="default" class="demo-btn" @click="demoLogin('赵刚', '20240004')">👨 赵刚 - 通信</el-button>
      </div>
      <div class="demo-btns" style="margin-top:8px">
        <el-button size="default" class="demo-btn" @click="demoLogin('王芳', '20240011')">👩 王芳 - 计算机</el-button>
        <el-button size="default" class="demo-btn" @click="demoLogin('李娜', '20240012')">👩 李娜 - 软件</el-button>
      </div>
      <div class="demo-btns" style="margin-top:8px">
        <el-button size="default" class="demo-btn new-btn" @click="demoLogin('林思雨', '20240019')">🆕 林思雨 - 日语</el-button>
      </div>
      <div class="demo-btns" style="margin-top:8px">
        <el-button size="default" class="demo-btn admin-btn" @click="demoAdminLogin">🔧 管理员 - 后台管理</el-button>
      </div>
      <div class="demo-btns" style="margin-top:8px">
        <el-button size="default" class="demo-btn dev-btn" @click="demoDevLogin">👑 系统开发者</el-button>
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
}
.login-header { text-align: center; margin-bottom: 24px; }
.school-brand { display: flex; flex-direction: column; align-items: center; }
.school-name { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
.login-tabs :deep(.el-tabs__nav) { width: 100%; display: flex; }
.login-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; font-size: 15px; }
.login-btn { width: 100%; margin-top: 4px; }
.demo-btns { display: flex; gap: 10px; }
.demo-btn { flex: 1; border-color: #e5e6eb; color: #4e5969; transition: all 0.2s; }
.demo-btn:hover { border-color: #667eea; color: #667eea; background: #f5f3ff; }
.admin-btn { border-color: #ffd666; color: #d48806; }
.admin-btn:hover { border-color: #faad14; color: #d48806; background: #fffbe6; }
.dev-btn { border-color: #b37feb; color: #722ed1; }
.dev-btn:hover { border-color: #9254de; color: #531dab; background: #f9f0ff; }
.new-btn { border-color: #5cdbd3; color: #08979c; }
.new-btn:hover { border-color: #36cfc9; color: #006d75; background: #e6fffb; }
.switch-school { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px; font-size: 13px; color: #a0aec0; cursor: pointer; }
.switch-school:hover { color: #667eea; }
</style>
