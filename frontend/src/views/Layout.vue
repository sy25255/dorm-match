<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { computed, ref, onMounted } from 'vue'
import { notificationApi } from '@/api/notification'
import {
  Bell,
  ChatLineSquare,
  Connection,
  Edit,
  Expand,
  Fold,
  HomeFilled,
  Message,
  OfficeBuilding,
  School,
  Search,
  Setting,
  UserFilled,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const unreadCount = ref(0)
const menuOpen = ref(false)

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const basePath = computed(() => `/${schoolCode.value}`)
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || schoolCode.value || '当前学校')
const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title as string || '学生工作台')
const roleLabel = computed(() => {
  if (userStore.role === 'ADMIN') return '管理员'
  if (userStore.role === 'DEVELOPER') return '开发者'
  return '学生'
})

const menuItems = computed(() => [
  { path: `${basePath.value}/`, label: '首页', icon: HomeFilled },
  { path: `${basePath.value}/survey`, label: '偏好问卷', icon: Edit },
  { path: `${basePath.value}/matches`, label: '舍友推荐', icon: Connection },
  { path: `${basePath.value}/search`, label: '搜索舍友', icon: Search },
  { path: `${basePath.value}/invites`, label: '邀请管理', icon: Message },
  { path: `${basePath.value}/pairing`, label: '我的配对', icon: UserFilled },
  { path: `${basePath.value}/allocation`, label: '分配结果', icon: OfficeBuilding },
  { path: `${basePath.value}/profile`, label: '个人信息', icon: Setting },
  { path: `${basePath.value}/feedback`, label: '建议反馈', icon: ChatLineSquare },
])

async function loadUnread() {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data.data?.count || 0
  } catch {
    unreadCount.value = 0
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  if (window.innerWidth < 1024) menuOpen.value = false
}

onMounted(() => {
  menuOpen.value = window.innerWidth >= 1024
  loadUnread()
})
</script>

<template>
  <div class="student-shell">
    <div class="environment-banner">
      <span>测试阶段</span>
      <strong>{{ schoolName }}</strong>
      <span>当前所有数据会归属到学校代码 {{ schoolCode }}</span>
      <button class="banner-action" @click="router.push(`${basePath}/feedback`)">反馈问题</button>
    </div>

    <div class="workspace">
      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false" />

      <aside class="sidebar" :class="{ open: menuOpen }">
        <div class="brand">
          <div class="brand-mark"><el-icon><School /></el-icon></div>
          <div class="brand-text">
            <strong>{{ schoolName }}</strong>
            <span>新生舍友匹配</span>
          </div>
        </div>

        <el-menu :default-active="activeMenu" router class="side-menu" @select="closeMenu">
          <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">{{ (userStore.username || 'U').slice(0, 1) }}</div>
            <div class="user-meta">
              <strong>{{ userStore.username || '未命名用户' }}</strong>
              <span>{{ roleLabel }}</span>
            </div>
          </div>
          <el-button text type="danger" class="logout-btn" @click="handleLogout">退出登录</el-button>
        </div>
      </aside>

      <section class="main-area">
        <header class="top-bar">
          <div class="title-area">
            <el-button class="hamburger" text @click="toggleMenu">
              <el-icon :size="22"><Expand v-if="!menuOpen" /><Fold v-else /></el-icon>
            </el-button>
            <div>
              <h1>{{ pageTitle }}</h1>
              <p>{{ schoolName }} · {{ schoolCode }}</p>
            </div>
          </div>

          <div class="top-actions">
            <el-button class="feedback-entry" @click="router.push(`${basePath}/feedback`)">
              <el-icon><ChatLineSquare /></el-icon>
              <span>反馈</span>
            </el-button>
            <el-button
              v-if="userStore.role === 'ADMIN' || userStore.role === 'DEVELOPER'"
              class="admin-entry"
              type="primary"
              plain
              @click="router.push(`${basePath}/admin`)"
            >
              <el-icon><Setting /></el-icon>
              <span>后台</span>
            </el-button>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
              <el-button circle @click="router.push(`${basePath}/notifications`)">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>
          </div>
        </header>

        <main class="content-surface">
          <router-view />
        </main>
      </section>
    </div>
  </div>
</template>

<style scoped>
.student-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eef2f7;
  color: #172033;
}

.environment-banner {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 6px 16px;
  background: #fff7e6;
  border-bottom: 1px solid #ffd591;
  color: #8a4b00;
  font-size: 12px;
  flex-wrap: wrap;
}
.environment-banner strong { color: #5c3300; }
.banner-action {
  border: 1px solid #d48806;
  background: #fff;
  color: #8a4b00;
  border-radius: 6px;
  padding: 3px 9px;
  cursor: pointer;
  font-size: 12px;
}
.banner-action:hover { background: #fff1d6; }

.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
}

.sidebar {
  width: 0;
  flex-shrink: 0;
  overflow: hidden;
  background: #102033;
  color: #fff;
  transition: width 0.22s ease;
  display: flex;
  flex-direction: column;
}
.sidebar.open { width: 248px; }

.brand {
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2f80ed;
  flex-shrink: 0;
}
.brand-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.brand-text strong {
  font-size: 14px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-text span { font-size: 12px; color: rgba(255,255,255,0.58); }

.side-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 10px;
}
.side-menu :deep(.el-menu-item) {
  height: 42px;
  border-radius: 8px;
  color: rgba(255,255,255,0.72);
  margin-bottom: 4px;
}
.side-menu :deep(.el-menu-item:hover) {
  color: #fff;
  background: rgba(255,255,255,0.08);
}
.side-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: #2f80ed;
}

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e8f2ff;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.user-meta { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.user-meta strong {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-meta span { font-size: 12px; color: rgba(255,255,255,0.55); }
.logout-btn { width: 100%; margin-top: 10px; justify-content: flex-start; }

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.top-bar {
  height: 68px;
  padding: 0 22px;
  background: #fff;
  border-bottom: 1px solid #dfe5ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.title-area h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  color: #172033;
}
.title-area p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #667085;
}
.hamburger { width: 38px; height: 38px; }
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.feedback-entry,
.admin-entry {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.content-surface {
  flex: 1;
  min-height: 0;
  padding: 22px;
  overflow: auto;
}

.menu-overlay { display: none; }

@media (max-width: 768px) {
  .environment-banner {
    justify-content: flex-start;
    padding: 7px 12px;
  }
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 220;
  }
  .sidebar.open { width: min(82vw, 280px); }
  .menu-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.42);
    z-index: 210;
  }
  .top-bar {
    height: auto;
    min-height: 62px;
    padding: 10px 12px;
  }
  .title-area h1 { font-size: 16px; }
  .top-actions span { display: none; }
  .content-surface { padding: 12px; }
}
</style>
