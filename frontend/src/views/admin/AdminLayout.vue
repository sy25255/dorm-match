<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { computed, ref } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const basePath = computed(() => `/${schoolCode.value}`)
const adminBase = computed(() => `${basePath.value}/admin`)

function handleLogout() {
  userStore.logout()
  router.push('/')
}

function goToStudent() {
  router.push(`${basePath.value}/`)
}

const isFromDev = ref(localStorage.getItem('dev_referrer') === 'true')

function goToDev() {
  localStorage.removeItem('dev_referrer')
  router.push('/dev')
}
</script>

<template>
  <div class="admin-root">
    <div class="test-banner">
      <span>🧪 测试环境 — 非最终交付版本，仅用于功能验证</span>
    </div>
    <el-container class="admin-container">
    <el-aside width="220px" class="admin-sidebar">
      <div class="admin-logo" @click="goToStudent">
        <el-icon :size="22"><ArrowLeft /></el-icon>
        <span>返回学生端</span>
      </div>
      <div v-if="isFromDev" class="admin-logo dev-return" @click="goToDev">
        <el-icon :size="22"><ArrowLeft /></el-icon>
        <span>返回开发者后台</span>
      </div>
      <div class="admin-title">
        <span>{{ userStore.schoolName || '学校' }}</span>
        <span style="font-size:11px;color:#6b7280">管理后台</span>
      </div>

      <el-menu :default-active="activeMenu" router class="admin-menu">
        <el-menu-item :index="`${adminBase}/statistics`">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item :index="`${adminBase}/school`">
          <el-icon><School /></el-icon>
          <span>学校管理</span>
        </el-menu-item>
        <el-menu-item :index="`${adminBase}/students`">
          <el-icon><User /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        <el-menu-item :index="`${adminBase}/survey`">
          <el-icon><Document /></el-icon>
          <span>问卷管理</span>
        </el-menu-item>
        <el-menu-item :index="`${adminBase}/dormitory`">
          <el-icon><OfficeBuilding /></el-icon>
          <span>宿舍管理</span>
        </el-menu-item>

        <el-menu-item :index="`${adminBase}/feedback`">
          <el-icon><ChatLineSquare /></el-icon>
          <span>反馈与异议</span>
        </el-menu-item>
        <el-menu-item :index="`${adminBase}/audit-logs`">
          <el-icon><List /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
      </el-menu>

      <div class="admin-user-info">
        <span>{{ userStore.username }}</span>
        <el-button type="danger" text size="small" @click="handleLogout">退出</el-button>
      </div>
    </el-aside>

    <el-main class="admin-main">
      <router-view />
    </el-main>
  </el-container>
  </div>
</template>

<style scoped>
.admin-root { display: flex; flex-direction: column; min-height: 100vh; }
.test-banner {
  background: linear-gradient(90deg, #ffc069, #fa8c16);
  color: #fff;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.admin-container { flex: 1; min-height: 0; }
.admin-sidebar { background: #1a1a2e; display: flex; flex-direction: column; }
.admin-logo { height: 48px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #a0aec0; font-size: 13px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); }
.admin-logo:hover { color: #fff; }
.dev-return { background: rgba(102,126,234,0.15); color: #a0b8ff; }
.dev-return:hover { background: rgba(102,126,234,0.25); color: #fff; }
.admin-title { height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #e2e8f0; font-size: 14px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08); }
.admin-menu { flex: 1; border-right: none; background: transparent; }
.admin-menu .el-menu-item { color: #a0aec0; }
.admin-menu .el-menu-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.admin-menu .el-menu-item.is-active { background: rgba(99,102,241,0.2); color: #818cf8; }
.admin-user-info { padding: 16px; display: flex; justify-content: space-between; align-items: center; color: #a0aec0; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.06); }
.admin-main { background: #f0f2f5; min-height: 100vh; padding: 24px; }
</style>
