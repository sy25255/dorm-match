<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { inviteApi } from '@/api/invite'
import { studentApi } from '@/api/student'
import { ElMessage } from 'element-plus'

interface InviteItem {
  id: number
  fromStudentId: number
  toStudentId: number
  message: string
  status: number
  processedAt: string
  expiresAt: string
  createdAt: string
}

const received = ref<InviteItem[]>([])
const sent = ref<InviteItem[]>([])
const quotas = ref({ maxSent: 5, usedSent: 0, remainingSent: 5, maxReceived: 10, usedReceived: 0, remainingReceived: 10 })
const activeTab = ref('received')
const loading = ref(false)
const studentNames = ref<Record<number, string>>({})
const processingId = ref<number | null>(null)

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [r, s, q] = await Promise.all([
      inviteApi.getReceived(),
      inviteApi.getSent(),
      inviteApi.getQuota(),
    ])
    received.value = r.data.data || []
    sent.value = s.data.data || []
    quotas.value = q.data.data

    const nameMap: Record<number, string> = {}
    const ids = new Set<number>()
    received.value.forEach(i => ids.add(i.fromStudentId))
    sent.value.forEach(i => ids.add(i.toStudentId))
    for (const id of ids) {
      try {
        const res = await studentApi.getStudent(id)
        nameMap[id] = res.data.data?.name || `学生${id}`
      } catch { nameMap[id] = `学生${id}` }
    }
    studentNames.value = nameMap
  } catch { ElMessage.error('加载邀请数据失败') } finally {
    loading.value = false
  }
}

function statusText(s: number): string {
  return ['待处理', '已接受', '已拒绝', '已过期', '已撤回'][s] || '未知'
}

function statusType(s: number): 'warning' | 'success' | 'danger' | 'info' | '' {
  return ['warning', 'success', 'danger', 'info', 'info'][s] as any || 'info'
}

async function accept(id: number) {
  processingId.value = id
  try {
    await inviteApi.accept(id)
    ElMessage.success('配对成功！')
    loadAll()
  } catch { ElMessage.error('接受邀请失败') } finally {
    processingId.value = null
  }
}

async function reject(id: number) {
  processingId.value = id
  try {
    await inviteApi.reject(id)
    ElMessage.success('已拒绝')
    loadAll()
  } catch { ElMessage.error('拒绝邀请失败') } finally {
    processingId.value = null
  }
}

async function withdraw(id: number) {
  processingId.value = id
  try {
    await inviteApi.withdraw(id)
    ElMessage.success('已撤回')
    loadAll()
  } catch { ElMessage.error('撤回邀请失败') } finally {
    processingId.value = null
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>邀请管理</h1>
      <p>
        发出 {{ quotas.usedSent }}/{{ quotas.maxSent }}
        · 收到 {{ quotas.usedReceived }}/{{ quotas.maxReceived }}
      </p>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="收到的邀请" name="received">
        <div v-loading="loading">
          <el-empty v-if="received.length === 0" description="暂无收到的邀请" />
          <div v-for="inv in received" :key="inv.id" class="invite-item">
            <div class="invite-info">
              <span class="invite-from">
                {{ studentNames[inv.fromStudentId] || `学生${inv.fromStudentId}` }}
              </span>
              <span class="invite-msg" v-if="inv.message">{{ inv.message }}</span>
              <span class="invite-meta">
                {{ inv.createdAt?.split('T')[0] }}
                · {{ inv.expiresAt ? (new Date(inv.expiresAt) > new Date() ? '有效' : '已过期') : '' }}
              </span>
            </div>
            <div class="invite-actions">
              <template v-if="inv.status === 0">
                <el-button type="success" size="small" :loading="processingId === inv.id" @click="accept(inv.id)">
                  接受
                </el-button>
                <el-button type="danger" size="small" :loading="processingId === inv.id" @click="reject(inv.id)">
                  拒绝
                </el-button>
              </template>
              <el-tag v-else size="small" :type="statusType(inv.status)">{{ statusText(inv.status) }}</el-tag>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="发出的邀请" name="sent">
        <div v-loading="loading">
          <el-empty v-if="sent.length === 0" description="暂无发出的邀请" />
          <div v-for="inv in sent" :key="inv.id" class="invite-item">
            <div class="invite-info">
              <span class="invite-from">
                发送给 {{ studentNames[inv.toStudentId] || `学生${inv.toStudentId}` }}
              </span>
              <span class="invite-msg" v-if="inv.message">{{ inv.message }}</span>
              <span class="invite-meta">{{ inv.createdAt?.split('T')[0] }}</span>
            </div>
            <div class="invite-actions">
              <el-button v-if="inv.status === 0" size="small" :loading="processingId === inv.id" @click="withdraw(inv.id)">
                撤回
              </el-button>
              <el-tag v-else size="small" :type="statusType(inv.status)">{{ statusText(inv.status) }}</el-tag>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.invite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}

.invite-item:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.invite-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invite-from {
  font-weight: 500;
  font-size: 15px;
  color: #1d2129;
}

.invite-msg {
  font-size: 13px;
  color: #4e5969;
  background: #f7f8fa;
  padding: 4px 10px;
  border-radius: 6px;
  max-width: 400px;
}

.invite-meta {
  font-size: 12px;
  color: #c9cdd4;
}

.invite-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
