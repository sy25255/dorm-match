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
        { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人信息' } },
        { path: 'notifications', name: 'Notifications', component: () => import('@/views/Notifications.vue'), meta: { title: '消息中心' } },
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
        { path: 'survey', name: 'AdminSurvey', component: () => import('@/views/admin/SurveyManage.vue'), meta: { title: '问卷管理' } },
        { path: 'dormitory', name: 'AdminDormitory', component: () => import('@/views/admin/Dormitory.vue'), meta: { title: '宿舍管理' } },
        { path: 'allocation', name: 'AdminAllocation', component: () => import('@/views/admin/AllocationManage.vue'), meta: { title: '宿舍分配' } },
        { path: 'objections', name: 'AdminObjections', component: () => import('@/views/admin/Objections.vue'), meta: { title: '异议处理' } },
        { path: 'audit-logs', name: 'AdminAuditLogs', component: () => import('@/views/admin/AuditLogs.vue'), meta: { title: '审计日志' } },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const storedCode = localStorage.getItem('schoolCode')
  const scFromPath = to.params.schoolCode as string | undefined

  // If school code is stored, enforce it in the URL path
  if (storedCode) {
    if (to.name === 'SchoolEntry') {
      next(`/${storedCode}/login`)
      return
    }
    if (scFromPath && scFromPath !== storedCode) {
      localStorage.clear()
      userStore.logout()
      next('/')
      return
    }
    if (!scFromPath) {
      next(`/${storedCode}${to.path}`)
      return
    }
  } else {
    // No school code stored
    if (to.name !== 'SchoolEntry') {
      next('/')
      return
    }
    next()
    return
  }

  // Auth checks
  if (to.meta.guest) {
    if (userStore.token) {
      next(`/${storedCode}/`)
      return
    }
    next()
    return
  }

  if (to.meta.admin) {
    if (!userStore.token) {
      next(`/${storedCode}/login`)
      return
    }
    if (userStore.role !== 'ADMIN') {
      next(`/${storedCode}/`)
      return
    }
    next()
    return
  }

  if (!userStore.token) {
    next(`/${storedCode}/login`)
    return
  }

  next()
})

export default router
