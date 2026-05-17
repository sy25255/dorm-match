<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { computed } from 'vue'
import { Monitor, School, User, ChatLineSquare, Notification, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const devBase = '/dev'

function handleLogout() {
  userStore.logout()
  router.push('/')
}

function goToSchool(code: string) {
  localStorage.setItem('dev_referrer', 'true')
  localStorage.setItem('schoolCode', code)
  const school = { 'DEMO-UNI': '示范大学', 'TEST': '测试学院', 'BJ-UNI': '北京大学', 'SH-UNI': '上海大学' } as Record<string, string>
  localStorage.setItem('schoolName', school[code] || code)
  router.push(`/${code}/admin`)
}
</script>

<template>
  <div class="dev-root">
    <div class="test-banner">
      <span>🧪 测试环境 — 非最终交付版本，仅用于功能验证</span>
    </div>
    <el-container class="dev-container">
    <el-aside width="240px" class="dev-sidebar">
      <div class="dev-logo">
        <el-icon :size="24"><Monitor /></el-icon>
        <div>
          <span class="dev-title">DormMatch</span>
          <span class="dev-subtitle">系统开发者后台</span>
        </div>
      </div>

      <el-menu :default-active="activeMenu" router class="dev-menu">
        <el-menu-item :index="`${devBase}`">
          <el-icon><Monitor /></el-icon>
          <span>平台总览</span>
        </el-menu-item>
        <el-menu-item :index="`${devBase}/schools`">
          <el-icon><School /></el-icon>
          <span>学校管理</span>
        </el-menu-item>
        <el-menu-item :index="`${devBase}/admins`">
          <el-icon><User /></el-icon>
          <span>管理员账号</span>
        </el-menu-item>
        <el-menu-item :index="`${devBase}/feedbacks`">
          <el-icon><ChatLineSquare /></el-icon>
          <span>用户反馈</span>
        </el-menu-item>
        <el-menu-item :index="`${devBase}/notifications`">
          <el-icon><Notification /></el-icon>
          <span>系统公告</span>
        </el-menu-item>
      </el-menu>

      <div class="dev-schools-section">
        <div class="dev-section-title">学校管理后台</div>
        <div
          v-for="s in [
            { code: 'DEMO-UNI', name: '示范大学', color: '#667eea' },
            { code: 'TEST', name: '测试学院', color: '#13c2c2' },
            { code: 'BJ-UNI', name: '北京大学', color: '#fa8c16' },
            { code: 'SH-UNI', name: '上海大学', color: '#52c41a' },
          ]" :key="s.code"
          class="dev-school-item"
          @click="goToSchool(s.code)"
        >
          <span class="dev-school-dot" :style="{ background: s.color }"></span>
          <span>{{ s.name }}</span>
        </div>
      </div>

      <div class="dev-user-info">
        <div>
          <span class="dev-username">{{ userStore.username || '系统开发者' }}</span>
          <span class="dev-role">DEVELOPER</span>
        </div>
        <el-button type="danger" text size="small" :icon="SwitchButton" @click="handleLogout" />
      </div>
    </el-aside>

    <el-main class="dev-main">
      <router-view />
    </el-main>
  </el-container>
  </div>
</template>

<style scoped>
.dev-root { display: flex; flex-direction: column; min-height: 100vh; }
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
.dev-container { flex: 1; min-height: 0; }
.dev-sidebar { background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%); display: flex; flex-direction: column; border-right: 1px solid rgba(255,255,255,0.06); }
.dev-logo { height: 60px; display: flex; align-items: center; gap: 10px; padding: 0 18px; color: #818cf8; border-bottom: 1px solid rgba(255,255,255,0.06); }
.dev-title { font-size: 16px; font-weight: 700; display: block; color: #e2e8f0; }
.dev-subtitle { font-size: 10px; color: #64748b; display: block; }
.dev-menu { background: transparent; border-right: none; margin-top: 4px; }
.dev-menu .el-menu-item { color: #94a3b8; height: 44px; }
.dev-menu .el-menu-item:hover { background: rgba(99,102,241,0.1); color: #e2e8f0; }
.dev-menu .el-menu-item.is-active { background: rgba(99,102,241,0.18); color: #818cf8; border-right: 2px solid #818cf8; }
.dev-schools-section { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06); flex: 1; overflow: auto; }
.dev-section-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.dev-school-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #94a3b8; transition: all 0.15s; margin-bottom: 2px; }
.dev-school-item:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
.dev-school-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dev-user-info { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); }
.dev-username { display: block; color: #e2e8f0; font-size: 13px; }
.dev-role { display: block; color: #64748b; font-size: 10px; }
.dev-main { background: #f0f2f5; min-height: 100vh; padding: 24px; }
</style>