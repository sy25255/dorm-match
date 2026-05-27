<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { inviteApi } from '@/api/invite'
import { matchApi } from '@/api/match'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'

interface Member {
  studentId: string | number
  name: string
  avatarUrl: string
  isInitiator: number
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const roomCapacity = ref(8)
try {
  const stored = localStorage.getItem('demo_room_capacity')
  if (stored) roomCapacity.value = Number(stored)
} catch {}
console.log('[Pairing] Room capacity:', roomCapacity.value)

const surveyCompleted = ref(false)

async function checkSurveyCompletion() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('survey_status')
    .eq('id', userStore.userId)
    .single()
  surveyCompleted.value = profile?.survey_status === 'COMPLETED'
}

const pairing = ref<any>(null)
const members = ref<Member[]>([])
const loading = ref(false)
const showInviteDialog = ref(false)
const recommendations = ref<any[]>([])
const inviteMessage = ref('')

async function loadData() {
  if (!surveyCompleted.value) return
  loading.value = true
  try {
    const [p, m] = await Promise.all([
      inviteApi.getPairing(),
      inviteApi.getPairingMembers(),
    ])
    pairing.value = p.data.data
    members.value = m.data.data || []
  } catch { ElMessage.error('加载配对数据失败') } finally {
    loading.value = false
  }
}

async function openInviteDialog() {
  try {
    const res = await matchApi.getRecommendations()
    const recs = res.data.data || []
    const existingIds = members.value.map(m => m.studentId)
    recommendations.value = recs.filter((r: any) => !existingIds.includes(r.studentId))
    inviteMessage.value = ''
    showInviteDialog.value = true
  } catch { ElMessage.warning('获取推荐列表失败') }
}

async function sendGroupInvite(targetId: string | number, targetName: string) {
  try {
    await ElMessageBox.confirm(`向"${targetName}"发送组队邀请？`, '组队邀请', { type: 'info' })
    await inviteApi.send({ targetId, message: inviteMessage.value || '我们的配对组正在扩招，一起来组队吧！' })
    ElMessage.success('组队邀请已发送')
    showInviteDialog.value = false
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('发送组队邀请失败')
  }
}

const statusLabels: Record<number, string> = { 0: '组建中', 1: '已锁定', 2: '已分配' }

onMounted(async () => {
  await checkSurveyCompletion()
  if (surveyCompleted.value) loadData()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>我的配对</h1>
      <p>查看您当前的舍友配对情况</p>
    </div>

    <div v-loading="loading">
      <el-empty v-if="!surveyCompleted" description="请先完成偏好问卷，系统才能为你匹配舍友">
        <template #extra>
          <el-button type="primary" @click="router.push(`/${route.params.schoolCode}/survey`)">前往填写问卷</el-button>
        </template>
      </el-empty>

      <el-empty v-else-if="!pairing" description="您还没有完成配对">
        <el-button type="primary" @click="router.push(`/${route.params.schoolCode}/matches`)">去查看推荐</el-button>
        <el-button style="margin-left:8px" @click="router.push(`/${route.params.schoolCode}/invites`)">查看邀请</el-button>
      </el-empty>

      <template v-else>
        <el-alert :type="pairing.status === 1 ? 'success' : 'warning'" :closable="false" class="pairing-alert">
          <template #title>
            {{ pairing.status === 1 ? '配对已锁定！' : '配对组建中' }} · 配对编号: {{ pairing.pairingCode }}
          </template>
          <div>配对组共 {{ pairing.groupSize }} 人 · 状态：{{ statusLabels[pairing.status] || '未知' }}</div>
        </el-alert>

        <div class="card-grid" style="margin-top:20px">
          <el-card v-for="m in members" :key="m.studentId" shadow="hover" class="member-card">
            <el-avatar :size="64">{{ m.name?.charAt(0) }}</el-avatar>
            <h3>{{ m.name }}</h3>
            <el-tag v-if="m.isInitiator" type="warning" size="small">发起人</el-tag>
            <el-tag v-else type="success" size="small" style="margin-top:4px">成员</el-tag>
          </el-card>

          <el-card v-if="members.length < roomCapacity && pairing.status === 1" shadow="hover" class="member-card add-card" @click="openInviteDialog">
            <el-icon :size="48" color="#c9cdd4"><Plus /></el-icon>
            <h3 style="color:#c9cdd4;margin-top:8px">邀请新成员</h3>
            <el-tag size="small" type="info">当前 {{ roomCapacity }} 人间宿舍 | 还需 {{ roomCapacity - members.length }} 人</el-tag>
          </el-card>
        </div>

        <div style="margin-top:16px;display:flex;gap:8px">
          <el-button @click="router.push(`/${route.params.schoolCode}/matches`)">查看匹配推荐</el-button>
          <el-button type="primary" @click="router.push(`/${route.params.schoolCode}/allocation`)">查看分配结果</el-button>
        </div>
      </template>
    </div>

    <el-dialog v-model="showInviteDialog" title="邀请新成员加入配对组" width="550px">
      <p style="color:#86909c;font-size:13px;margin-bottom:12px">从你的匹配推荐中选择一位发送组队邀请</p>
      <el-input v-model="inviteMessage" placeholder="写一段邀请语（选填）" maxlength="100" show-word-limit style="margin-bottom:12px" />
      <el-table :data="recommendations" size="small" max-height="350">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="collegeName" label="学院" width="120" />
        <el-table-column prop="majorName" label="专业" width="150" />
        <el-table-column label="匹配度" width="90">
          <template #default="{ row }">
            <el-tag :type="(row.matchScore || 0) >= 75 ? 'success' : (row.matchScore || 0) >= 60 ? 'warning' : 'info'" size="small">{{ row.matchScore }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="sendGroupInvite(row.studentId, row.name)">邀请</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.pairing-alert { margin-bottom: 20px; }
.member-card { text-align: center; padding: 24px; }
.member-card h3 { margin-top: 12px; font-size: 16px; }
.add-card { cursor: pointer; border: 2px dashed #e5e6eb; background: #fafafa; min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-card:hover { border-color: #667eea; background: #f0f5ff; }
</style>
