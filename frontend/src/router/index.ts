import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'SchoolEntry',
      component: () => import('@/views/SchoolEntry.vue'),
      meta: { guest: true },
    },
    {
      path: '/:schoolCode/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/:schoolCode',
      component: () => import('@/views/Layout.vue'),
      children: [
        { path: '', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
        { path: 'survey', name: 'Survey', component: () => import('@/views/Survey.vue'), meta: { title: '偏好问卷' } },
        { path: 'matches', name: 'Matches', component: () => import('@/views/Matches.vue'), meta: { title: '舍友匹配推荐' } },
        { path: 'matches/:targetId', name: 'MatchDetail', component: () => import('@/views/MatchDetail.vue'), meta: { title: '匹配详情' } },
        { path: 'search', name: 'Search', component: () => import('@/views/Search.vue'), meta: { title: '搜索舍友' } },
        { path: 'invites', name: 'Invites', component: () => import('@/views/Invites.vue'), meta: { title: '邀请管理' } },
        { path: 'pairing', name: 'Pairing', component: () => import('@/views/Pairing.vue'), meta: { title: '我的配对' } },
        { path: 'allocation', name: 'Allocation', component: () => import('@/views/Allocation.vue'), meta: { title: '宿舍分配结果' } },
        { path: 'admin-activate', name: 'AdminActivate', component: () => import('@/views/admin/AdminActivate.vue'), meta: { title: '管理员激活' } },
        { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人信息' } },
        { path: 'notifications', name: 'Notifications', component: () => import('@/views/Notifications.vue'), meta: { title: '消息中心' } },
        { path: 'feedback', name: 'Feedback', component: () => import('@/views/Feedback.vue'), meta: { title: '建议反馈' } },
      ],
    },
    {
      path: '/:schoolCode/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { admin: true },
      children: [
        { path: '', redirect: (to: any) => `/${to.params.schoolCode}/admin/statistics` },
        { path: 'statistics', name: 'AdminStatistics', component: () => import('@/views/admin/Statistics.vue'), meta: { title: '数据统计' } },
        { path: 'school', name: 'AdminSchool', component: () => import('@/views/admin/SchoolManage.vue'), meta: { title: '学校管理' } },
        { path: 'students', name: 'AdminStudents', component: () => import('@/views/admin/Students.vue'), meta: { title: '学生管理' } },
        { path: 'pair-groups', name: 'AdminPairGroups', component: () => import('@/views/admin/PairGroups.vue'), meta: { title: '队伍管理' } },
        { path: 'survey', name: 'AdminSurvey', component: () => import('@/views/admin/SurveyManage.vue'), meta: { title: '问卷管理' } },
        { path: 'dormitory', name: 'AdminDormitory', component: () => import('@/views/admin/Dormitory.vue'), meta: { title: '宿舍管理' } },
        { path: 'allocation', redirect: (to: any) => `/${to.params.schoolCode}/admin/dormitory` },
        { path: 'feedback', name: 'AdminFeedback', component: () => import('@/views/admin/FeedbackManage.vue'), meta: { title: '反馈与异议' } },
        { path: 'objections', redirect: (to: any) => `/${to.params.schoolCode}/admin/feedback?tab=objection` },
        { path: 'audit-logs', name: 'AdminAuditLogs', component: () => import('@/views/admin/AuditLogs.vue'), meta: { title: '审计日志' } },
      ],
    },
    {
      path: '/dev',
      component: () => import('@/views/admin/DeveloperLayout.vue'),
      meta: { dev: true },
      children: [
        { path: '', name: 'DevDashboard', component: () => import('@/views/admin/DeveloperDashboard.vue'), meta: { title: '平台总览' } },
        { path: 'schools', name: 'DevSchools', component: () => import('@/views/admin/DeveloperSchools.vue'), meta: { title: '学校管理' } },
        { path: 'admins', name: 'DevAdmins', component: () => import('@/views/admin/DeveloperAdmins.vue'), meta: { title: '管理员账号' } },
        { path: 'feedbacks', name: 'DevFeedbacks', component: () => import('@/views/admin/DeveloperFeedbacks.vue'), meta: { title: '用户反馈' } },
        { path: 'notifications', name: 'DevNotifications', component: () => import('@/views/admin/DeveloperNotifications.vue'), meta: { title: '系统公告' } },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

let sessionRestored = false

function landingPathForRole(schoolCode: string, role: string) {
  if (role === 'DEVELOPER') return '/dev'
  if (!schoolCode) return '/'
  if (role === 'ADMIN') return `/${schoolCode}/admin`
  return `/${schoolCode}/`
}

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const storedCode = localStorage.getItem('schoolCode')

  if (!sessionRestored) {
    sessionRestored = true
    const hasSession = await userStore.restoreSession().catch(() => false)
    if (hasSession && userStore.schoolCode) {
      if (to.path === '/' || to.name === 'SchoolEntry') {
        next(landingPathForRole(userStore.schoolCode, userStore.role))
        return
      }
    }
  }

  if (to.meta.dev) {
    if (!userStore.token) { next('/'); return }
    if (userStore.role !== 'DEVELOPER') {
      next(storedCode ? `/${storedCode}/` : '/')
      return
    }
    next()
    return
  }

  const scFromPath = to.params.schoolCode as string | undefined

  if (storedCode) {
    if (to.name === 'SchoolEntry' && (userStore.token || userStore.userId)) {
      next(landingPathForRole(storedCode, userStore.role))
      return
    }
    if (scFromPath && scFromPath !== storedCode) {
      localStorage.removeItem('schoolCode')
      localStorage.removeItem('schoolName')
      userStore.schoolCode = ''
      userStore.schoolName = ''
      next('/')
      return
    }
    if (!scFromPath && to.path !== '/') {
      next(`/${storedCode}${to.path}`)
      return
    }
  } else {
    if (scFromPath) {
      userStore.setSchoolInfo(scFromPath, localStorage.getItem('schoolName') || scFromPath)
      next()
      return
    }
    if (to.name !== 'SchoolEntry' && to.path !== '/') {
      next('/')
      return
    }
    next()
    return
  }

  if (to.meta.guest) {
    if (userStore.token || userStore.userId) {
      next(landingPathForRole(storedCode || userStore.schoolCode, userStore.role))
      return
    }
    next()
    return
  }

  if (to.meta.admin) {
    if (!userStore.token) {
      next('/')
      return
    }
    if (userStore.role !== 'ADMIN' && userStore.role !== 'DEVELOPER') {
      next(`/${storedCode}/`)
      return
    }
    next()
    return
  }

  if (!userStore.token && !userStore.userId) {
    next('/')
    return
  }

  next()
})

export default router
