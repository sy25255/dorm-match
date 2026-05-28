<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { allocationApi } from '@/api/invite'
import { chatApi } from '@/api/chat'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, User } from '@element-plus/icons-vue'

const userStore = useUserStore()

const router = useRouter()
const route = useRoute()

const surveyCompleted = ref(false)

async function checkSurveyCompletion() {
  const { supabase } = await import('@/lib/supabase')
  const { data: profile } = await supabase
    .from('profiles')
    .select('survey_status')
    .eq('id', userStore.userId)
    .single()
  surveyCompleted.value = profile?.survey_status === 'COMPLETED'
}

const allocation = ref<any>(null)
const loading = ref(false)

const chatMessages = ref<{ from: string; fromName: string; text: string; time: string }[]>([])
const newMessage = ref('')
const chatRef = ref<HTMLElement>()

const currentUserId = ref('')
const currentUserName = ref('')

function getStorageKey(roomNumber: string) {
  return `demo_chat_${roomNumber}`
}

async function loadChatMessages(roomNumber: string) {
  const remoteMessages = await chatApi.list(roomNumber).catch(() => null)
  if (remoteMessages) {
    chatMessages.value = remoteMessages.length > 0 ? remoteMessages : [
      { from: 'system', fromName: '系统', text: '宿舍群聊已创建，大家可以在这里交流。', time: new Date().toISOString() },
    ]
    return
  }
  const raw = localStorage.getItem(getStorageKey(roomNumber))
  if (raw) {
    try { chatMessages.value = JSON.parse(raw) } catch { chatMessages.value = [] }
  } else {
    chatMessages.value = [
      { from: 'system', fromName: '系统', text: '宿舍群聊已创建，大家可以在这里交流，互加微信～', time: new Date().toISOString() },
    ]
  }
}

function saveChatMessages(roomNumber: string) {
  localStorage.setItem(getStorageKey(roomNumber), JSON.stringify(chatMessages.value))
}

async function sendMessage() {
  const text = newMessage.value.trim()
  if (!text || !allocation.value) return
  const message = {
    from: currentUserId.value,
    fromName: currentUserName.value,
    text,
    time: new Date().toISOString(),
  }
  const savedRemote = await chatApi.send(allocation.value.roomNumber, text, currentUserName.value).catch(() => false)
  chatMessages.value.push(message)
  if (!savedRemote) saveChatMessages(allocation.value.roomNumber)
  newMessage.value = ''
  nextTick(() => {
    if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await checkSurveyCompletion()
  if (!surveyCompleted.value) return

  currentUserId.value = userStore.userId
  currentUserName.value = userStore.username

  loading.value = true
  try {
    const res = await allocationApi.getMyAllocation()
    allocation.value = res.data.data
    if (allocation.value?.roomNumber) {
      await loadChatMessages(allocation.value.roomNumber)
    }
  } catch {
    ElMessage.error('加载分配结果失败')
  } finally {
    loading.value = false
  }
})

watch(() => allocation.value?.roomNumber, (newRoom) => {
  if (newRoom) loadChatMessages(newRoom)
})

async function confirmAllocation() {
  try {
    await allocationApi.confirm()
    ElMessage.success('已确认分配结果')
    allocation.value.confirmedByStudent = 1
  } catch {
    ElMessage.error('确认失败，请重试')
  }
}

async function submitObjection() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入申诉理由', '提交异议', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请详细描述您的申诉理由...',
    })
    if (reason) {
      await allocationApi.submitObjection(reason)
      ElMessage.success('异议已提交，请等待处理')
    }
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>宿舍分配结果</h1>
      <p>查看您的宿舍分配情况及舍友信息</p>
    </div>

    <div v-loading="loading">
      <el-empty v-if="!surveyCompleted" description="请先完成偏好问卷，系统才能为你分配宿舍">
        <template #extra>
          <el-button type="primary" @click="router.push(`/${route.params.schoolCode}/survey`)">前往填写问卷</el-button>
        </template>
      </el-empty>

      <el-empty v-else-if="!allocation" description="暂无分配结果，请等待管理员分配" />

      <template v-else>
        <div class="allocation-layout">
          <div class="allocation-main">
            <el-card class="allocation-card">
              <el-descriptions title="分配详情" :column="2" border>
                <el-descriptions-item label="房间号">{{ allocation.roomNumber }}</el-descriptions-item>
                <el-descriptions-item label="床位号">{{ allocation.bedNo }}号床</el-descriptions-item>
                <el-descriptions-item label="分配方式">
                  <el-tag :type="allocation.allocationType === 'SELF_SELECT' ? 'success' : 'info'">
                    {{ allocation.allocationType === 'SELF_SELECT' ? '自主选择' : '系统分配' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="allocation.status === 'CONFIRMED' ? 'success' : 'warning'">
                    {{ allocation.status === 'CONFIRMED' ? '已确认' : '待确认' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="allocation.roommates?.length" class="roommate-section">
                <h3 class="section-title"><el-icon><User /></el-icon> 你的舍友</h3>
                <div class="roommate-cards">
                  <div v-for="r in allocation.roommates" :key="r.studentId" class="roommate-card">
                    <div class="rm-header">
                      <el-avatar :size="48">{{ r.name?.charAt(0) }}</el-avatar>
                      <div class="rm-name-info">
                        <span class="rm-name">{{ r.name }}</span>
                        <span class="rm-bio">{{ r.bio || '这个人很懒，什么都没写' }}</span>
                      </div>
                      <el-tag size="small" class="bed-tag">{{ r.bedNo }}号床</el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!allocation.confirmedByStudent" class="allocation-actions">
                <el-button type="primary" @click="confirmAllocation">确认无异议</el-button>
                <el-button type="warning" @click="submitObjection">提交异议</el-button>
              </div>
            </el-card>
          </div>

          <div class="allocation-chat">
            <el-card class="chat-card">
              <template #header>
                <div class="chat-header">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ allocation.roomNumber }} 宿舍群聊</span>
                </div>
              </template>
              <div ref="chatRef" class="chat-messages">
                <div
                  v-for="(msg, i) in chatMessages"
                  :key="i"
                  :class="['chat-msg', msg.from === currentUserId ? 'chat-msg-mine' : 'chat-msg-other']"
                >
                  <template v-if="msg.from === 'system'">
                    <div class="chat-msg-system">{{ msg.text }}</div>
                  </template>
                  <template v-else>
                    <div class="chat-msg-name">{{ msg.fromName }}</div>
                    <div class="chat-msg-bubble">{{ msg.text }}</div>
                    <div class="chat-msg-time">{{ formatTime(msg.time) }}</div>
                  </template>
                </div>
              </div>
              <div class="chat-input-area">
                <el-input
                  v-model="newMessage"
                  placeholder="输入消息，和舍友打个招呼吧..."
                  maxlength="500"
                  show-word-limit
                  @keyup.enter="sendMessage"
                >
                  <template #append>
                    <el-button type="primary" @click="sendMessage">发送</el-button>
                  </template>
                </el-input>
              </div>
            </el-card>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.allocation-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.allocation-main {
  flex: 1;
  min-width: 0;
}

.allocation-chat {
  width: 380px;
  flex-shrink: 0;
}

.allocation-card {
  max-width: none;
}

.section-title {
  font-size: 16px;
  margin: 20px 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #303133;
}

.roommate-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roommate-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  transition: box-shadow 0.2s;
}

.roommate-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.rm-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rm-name-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rm-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.rm-bio {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.bed-tag {
  flex-shrink: 0;
}

.allocation-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.chat-card {
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
}

.chat-messages {
  height: 360px;
  overflow-y: auto;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-msg-system {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding: 6px;
  background: #f5f7fa;
  border-radius: 6px;
}

.chat-msg-mine {
  align-self: flex-end;
  text-align: right;
}

.chat-msg-other {
  align-self: flex-start;
}

.chat-msg-name {
  font-size: 11px;
  color: #909399;
  margin-bottom: 2px;
}

.chat-msg-bubble {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 14px;
  max-width: 260px;
  word-break: break-word;
}

.chat-msg-mine .chat-msg-bubble {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-msg-other .chat-msg-bubble {
  background: #f0f0f0;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.chat-msg-time {
  font-size: 10px;
  color: #c0c4cc;
  margin-top: 2px;
}

.chat-input-area {
  margin-top: 10px;
}

@media (max-width: 900px) {
  .allocation-layout {
    flex-direction: column;
  }
  .allocation-chat {
    width: 100%;
  }
}
</style>
