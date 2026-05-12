<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { computed, ref, onMounted } from 'vue'
import { notificationApi } from '@/api/notification'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const unreadCount = ref(0)
const menuOpen = ref(false)

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const basePath = computed(() => `/${schoolCode.value}`)

const asideWidth = computed(() => menuOpen.value ? '220px' : '0px')

async function loadUnread() {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data.data?.count || 0
  } catch { unreadCount.value = 0 }
}

function handleLogout() {
  userStore.logout()
  router.push(`/${schoolCode.value}/login`)
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

onMounted(loadUnread)
</script>

<template>
  <div class="app-shell">
    <div class="menu-overlay" v-if="menuOpen" @click="closeMenu" />

    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="sidebar-close" @click="closeMenu">
        <el-icon :size="20"><Close /></el-icon>
      </div>
      <div class="logo">
        <el-icon :size="28"><School /></el-icon>
        <div class="logo-text">
          <span class="logo-school">{{ userStore.schoolName || '宿舍选择' }}</span>
          <span class="logo-sub">舍友自主选择</span>
        </div>
      </div>

      <el-menu :default-active="activeMenu" router class="side-menu" @select="closeMenu">
        <el-menu-item :index="`${basePath}/`"><el-icon><HomeFilled /></el-icon><span>首页</span></el-menu-item>
        <el-menu-item :index="`${basePath}/survey`"><el-icon><Edit /></el-icon><span>偏好问卷</span></el-menu-item>
        <el-menu-item :index="`${basePath}/matches`"><el-icon><Connection /></el-icon><span>舍友推荐</span></el-menu-item>
        <el-menu-item :index="`${basePath}/search`"><el-icon><Search /></el-icon><span>搜索舍友</span></el-menu-item>
        <el-menu-item :index="`${basePath}/invites`"><el-icon><Message /></el-icon><span>邀请管理</span></el-menu-item>
        <el-menu-item :index="`${basePath}/pairing`"><el-icon><UserFilled /></el-icon><span>我的配对</span></el-menu-item>
        <el-menu-item :index="`${basePath}/allocation`"><el-icon><OfficeBuilding /></el-icon><span>分配结果</span></el-menu-item>
        <el-menu-item :index="`${basePath}/profile`"><el-icon><Setting /></el-icon><span>个人信息</span></el-menu-item>
      </el-menu>

      <div class="user-info">
        <span class="username">{{ userStore.username }}</span>
        <el-button type="danger" text size="small" @click="handleLogout">退出</el-button>
      </div>
    </aside>

    <div class="main-area">
      <header class="top-bar">
        <el-button class="hamburger" text @click="toggleMenu">
          <el-icon :size="22"><Expand v-if="!menuOpen" /><Fold v-else /></el-icon>
        </el-button>
        <div style="flex:1" />
        <el-button v-if="userStore.role === 'ADMIN'" class="admin-entry" size="small" @click="router.push(`${basePath}/admin`)">
          <el-icon :size="16"><Setting /></el-icon>
          <span style="margin-left:4px">后台管理</span>
        </el-button>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-bell">
          <el-button text circle @click="router.push(`${basePath}/notifications`)">
            <el-icon :size="22"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }

.menu-overlay {
  display: none;
}

.sidebar {
  width: 0;
  background: #001529;
  display: flex;
  flex-direction: column;
  transition: width 0.25s;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.sidebar.open { width: 220px; }

.sidebar-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}
.sidebar-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}
.logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.logo-school { font-size: 14px; font-weight: 600; }
.logo-sub { font-size: 11px; color: rgba(255,255,255,0.5); }

.side-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}
.side-menu .el-menu-item { color: rgba(255,255,255,0.65); }
.side-menu .el-menu-item:hover,
.side-menu .el-menu-item.is-active { color: #fff; background-color: #1890ff; }

.user-info {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.username { color: rgba(255,255,255,0.85); font-size: 14px; white-space: nowrap; }

.main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.top-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  padding: 0 16px;
  height: 56px;
  flex-shrink: 0;
}
.hamburger { display: flex; }
.admin-entry { border: 1px solid #d9d9d9; color: #666; margin-right: 8px; }
.admin-entry:hover { border-color: #667eea; color: #667eea; }
.notification-bell { margin-right: 8px; }

.main-content { background: #f5f7fa; flex: 1; padding: 20px; }

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
  }
  .sidebar.open { width: 220px; }

  .sidebar-close { display: flex; }

  .menu-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
  .main-content { padding: 12px; }
}
</style>
