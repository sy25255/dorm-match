<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { notificationApi } from '@/api/notification'
import { ElMessage } from 'element-plus'

const notifications = ref<any[]>([])
const loading = ref(false)

const typeMap: Record<string, { icon: string; color: string }> = {
  INVITE: { icon: 'Message', color: '#1890ff' },
  PAIRING: { icon: 'UserFilled', color: '#52c41a' },
  ALLOCATION: { icon: 'OfficeBuilding', color: '#722ed1' },
  SYSTEM: { icon: 'InfoFilled', color: '#faad14' },
}

async function loadNotifications() {
  loading.value = true
  try {
    const res = await notificationApi.getList()
    notifications.value = res.data.data || []
  } finally { loading.value = false }
}

async function markRead(id: number) {
  await notificationApi.markRead(id)
  const n = notifications.value.find((x: any) => x.id === id)
  if (n) n.isRead = 1
}

async function markAllRead() {
  await notificationApi.markAllRead()
  notifications.value.forEach((n: any) => n.isRead = 1)
  ElMessage.success('已全部标为已读')
}

onMounted(loadNotifications)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>消息中心</h1>
      <el-button v-if="notifications.some((n: any) => n.isRead === 0)" type="primary" text @click="markAllRead">全部标为已读</el-button>
    </div>

    <el-card v-for="n in notifications" :key="n.id" :class="['notify-item', { unread: n.isRead === 0 }]" shadow="hover" style="margin-bottom:8px">
      <div class="notify-row">
        <div class="notify-icon" :style="{ background: (typeMap[n.type] || typeMap.SYSTEM).color + '15', color: (typeMap[n.type] || typeMap.SYSTEM).color }">
          <el-icon :size="20"><component :is="(typeMap[n.type] || typeMap.SYSTEM).icon" /></el-icon>
        </div>
        <div class="notify-body">
          <div class="notify-title">{{ n.title }}</div>
          <div class="notify-content">{{ n.content }}</div>
          <div class="notify-time">{{ n.createdAt }}</div>
        </div>
        <el-button v-if="n.isRead === 0" type="primary" link size="small" @click="markRead(n.id)">标为已读</el-button>
        <el-icon v-else size="16" color="#52c41a"><CircleCheckFilled /></el-icon>
      </div>
    </el-card>

    <el-empty v-if="!loading && notifications.length === 0" description="暂无消息" />
  </div>
</template>

<style scoped>
.page-container { max-width: 700px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 20px; }
.notify-item { cursor: pointer; transition: all 0.2s; }
.notify-item.unread { border-left: 3px solid #1890ff; background: #f0f5ff; }
.notify-row { display: flex; align-items: center; gap: 12px; }
.notify-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.notify-body { flex: 1; }
.notify-title { font-weight: 600; font-size: 14px; }
.notify-content { color: #86909c; font-size: 13px; margin-top: 2px; }
.notify-time { color: #c9cdd4; font-size: 12px; margin-top: 4px; }
</style>
