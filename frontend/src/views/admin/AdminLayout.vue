<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  ArrowLeft,
  ChatLineSquare,
  DataAnalysis,
  Document,
  Expand,
  Fold,
  List,
  OfficeBuilding,
  School,
  User,
  Warning,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const basePath = computed(() => `/${schoolCode.value}`)
const adminBase = computed(() => `${basePath.value}/admin`)
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || schoolCode.value || '当前学校')
const pageTitle = computed(() => route.meta.title as string || '管理后台')
const isFromDev = ref(localStorage.getItem('dev_referrer') === 'true')
const sidebarOpen = computed(() => mobileOpen.value || !isMobile.value)
const showMenuText = computed(() => !collapsed.value || isMobile.value)

const activeMenu = computed(() => {
  if (route.path === `${adminBase.value}/feedback` && route.query.tab === 'objection') {
    return `${adminBase.value}/objections`
  }
  return route.path
})

const menuItems = computed(() => [
  { path: `${adminBase.value}/statistics`, label: '数据统计', icon: DataAnalysis, desc: '报名、问卷、分配概览' },
  { path: `${adminBase.value}/school`, label: '学校管理', icon: School, desc: '学院、专业、班级' },
  { path: `${adminBase.value}/students`, label: '学生管理', icon: User, desc: '学生状态与邀请' },
  { path: `${adminBase.value}/pair-groups`, label: '队伍管理', icon: User, desc: '配对组与成员核查' },
  { path: `${adminBase.value}/survey`, label: '问卷管理', icon: Document, desc: '题库与启停' },
  { path: `${adminBase.value}/dormitory`, label: '宿舍管理', icon: OfficeBuilding, desc: '楼栋、房间、分配' },
  { path: `${adminBase.value}/feedback`, label: '反馈与异议', icon: ChatLineSquare, desc: '用户反馈处理' },
  { path: `${adminBase.value}/objections`, label: '异议处理', icon: Warning, desc: '分配异议复核' },
  { path: `${adminBase.value}/audit-logs`, label: '审计日志', icon: List, desc: '后台操作记录' },
])

function handleLogout() {
  userStore.logout()
  router.push('/')
}

function goToStudent() {
  router.push(`${basePath.value}/`)
}

function goToDev() {
  localStorage.removeItem('dev_referrer')
  router.push('/dev')
}

function closeMobile() {
  if (isMobile.value) mobileOpen.value = false
}

function syncViewport() {
  isMobile.value = window.innerWidth < 900
  if (isMobile.value) {
    collapsed.value = false
  } else {
    mobileOpen.value = false
  }
}

onMounted(() => {
  syncViewport()
  collapsed.value = !isMobile.value && window.innerWidth < 1180
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<template>
  <div class="admin-shell">
    <div class="environment-banner">
      <span>测试阶段</span>
      <strong>{{ schoolName }}</strong>
      <span>后台操作只作用于学校代码 {{ schoolCode }}</span>
    </div>

    <div class="admin-workspace">
      <div v-if="mobileOpen" class="mobile-mask" @click="mobileOpen = false" />

      <aside class="admin-sidebar" :class="{ collapsed, open: sidebarOpen }">
        <div class="admin-brand">
          <div class="brand-mark"><el-icon><School /></el-icon></div>
          <div class="brand-copy">
            <strong>{{ schoolName }}</strong>
            <span>{{ schoolCode }} 管理后台</span>
          </div>
        </div>

        <div class="quick-links">
          <button @click="goToStudent">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回学生端</span>
          </button>
          <button v-if="isFromDev" @click="goToDev">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回开发者后台</span>
          </button>
        </div>

        <el-menu :default-active="activeMenu" router class="admin-menu" @select="closeMobile">
          <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template v-if="showMenuText">
              <span>{{ item.label }}</span>
              <small>{{ item.desc }}</small>
            </template>
          </el-menu-item>
        </el-menu>

        <div class="admin-user">
          <div class="user-avatar">{{ (userStore.username || 'A').slice(0, 1) }}</div>
          <div v-if="!collapsed" class="user-copy">
            <strong>{{ userStore.username || '管理员' }}</strong>
            <span>{{ userStore.role === 'DEVELOPER' ? '开发者权限' : '管理员权限' }}</span>
          </div>
          <el-button text type="danger" @click="handleLogout">{{ collapsed ? '退' : '退出' }}</el-button>
        </div>
      </aside>

      <section class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-title">
            <el-button class="mobile-menu" text @click="mobileOpen = true">
              <el-icon><Expand /></el-icon>
            </el-button>
            <el-button class="collapse-toggle" text @click="collapsed = !collapsed">
              <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
            </el-button>
            <div>
              <h1>{{ pageTitle }}</h1>
              <p>{{ schoolName }} · {{ schoolCode }}</p>
            </div>
          </div>

          <div class="topbar-actions">
            <el-tag type="info" effect="plain">{{ userStore.role }}</el-tag>
            <el-button @click="goToStudent">学生端</el-button>
          </div>
        </header>

        <main class="admin-content">
          <router-view />
        </main>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eef2f7;
  color: #172033;
}

.environment-banner {
  min-height: 32px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  background: #fff7e6;
  border-bottom: 1px solid #ffd591;
  color: #8a4b00;
  font-size: 12px;
}
.environment-banner strong { color: #5c3300; }

.admin-workspace {
  flex: 1;
  min-height: 0;
  display: flex;
}

.admin-sidebar {
  width: 268px;
  flex-shrink: 0;
  background: #111827;
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.22s ease;
}
.admin-sidebar.collapsed { width: 82px; }

.admin-brand {
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.brand-copy strong {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-copy span { font-size: 12px; color: rgba(255,255,255,0.56); }
.collapsed .brand-copy { display: none; }

.quick-links {
  padding: 10px;
  display: grid;
  gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.quick-links button {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.78);
  min-height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
.quick-links button:hover {
  color: #fff;
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
}
.collapsed .quick-links span { display: none; }

.admin-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 10px;
  overflow-y: auto;
}
.admin-menu :deep(.el-menu-item) {
  height: 52px;
  border-radius: 8px;
  color: rgba(255,255,255,0.72);
  margin-bottom: 5px;
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  column-gap: 10px;
  line-height: 1.2;
}
.collapsed .admin-menu :deep(.el-menu-item) {
  display: flex;
  justify-content: center;
  padding: 0;
}
.admin-menu :deep(.el-menu-item:hover) {
  color: #fff;
  background: rgba(255,255,255,0.08);
}
.admin-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: #2563eb;
}
.admin-menu span { font-size: 14px; font-weight: 600; }
.admin-menu small {
  display: block;
  grid-column: 2;
  color: rgba(255,255,255,0.46);
  font-size: 11px;
  margin-top: -10px;
}

.admin-user {
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e8f2ff;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.user-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.user-copy strong {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-copy span { font-size: 12px; color: rgba(255,255,255,0.5); }

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.admin-topbar {
  min-height: 68px;
  background: #fff;
  border-bottom: 1px solid #dfe5ef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 22px;
  flex-shrink: 0;
}
.topbar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.topbar-title h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
}
.topbar-title p {
  margin: 3px 0 0;
  color: #667085;
  font-size: 12px;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.mobile-menu { display: none; }
.admin-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 22px;
}

.mobile-mask { display: none; }

@media (max-width: 900px) {
  .admin-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 230;
    width: min(86vw, 284px);
    transform: translateX(-100%);
  }
  .admin-sidebar.open { transform: translateX(0); }
  .admin-sidebar.collapsed { width: min(86vw, 284px); }
  .collapsed .brand-copy { display: flex; }
  .collapsed .quick-links span { display: inline; }
  .collapsed .user-copy { display: flex; }
  .collapsed .admin-menu :deep(.el-menu-item) {
    display: grid;
    grid-template-columns: 22px 1fr;
    justify-content: initial;
    padding: 0 20px;
  }
  .collapsed .admin-menu small {
    display: block;
  }
  .mobile-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,0.42);
    z-index: 220;
  }
  .mobile-menu { display: inline-flex; }
  .collapse-toggle { display: none; }
  .admin-topbar {
    min-height: 62px;
    padding: 10px 12px;
  }
  .topbar-title h1 { font-size: 16px; }
  .topbar-actions .el-tag { display: none; }
  .admin-content { padding: 12px; }
}
</style>
