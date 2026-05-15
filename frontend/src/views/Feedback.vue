<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { feedbackApi } from '@/api/feedback'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/api/request'

interface College { id: number; name: string; code: string }
interface Major { id: number; name: string; code: string; collegeId?: number }
interface Clazz { id: number; majorId: number; name: string; grade: number }

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const showDialog = ref(false)
const viewDetail = ref<any>(null)
const detailVisible = computed({ get: () => !!viewDetail.value, set: (v) => { if (!v) viewDetail.value = null } })
const feedbacks = ref<any[]>([])
const activeTab = ref<'all' | 'DEVELOPER' | 'ADMIN'>('all')
const formRef = ref<FormInstance>()

const colleges = ref<College[]>([])
const majors = ref<Major[]>([])
const classes = ref<Clazz[]>([])

const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode || '')
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || '绀鸿寖澶у')
const currentRole = computed(() => userStore.role || localStorage.getItem('role') || 'STUDENT')

const form = ref({
  targetRole: 'DEVELOPER' as 'DEVELOPER' | 'ADMIN',
  title: '',
  content: '',
  problemType: '' as string,
  collegeId: null as number | null,
  majorId: null as number | null,
  classId: null as number | null,
})

const problemTypes = [
  { value: 'DORM', label: '瀹胯垗闂', desc: '浣忓鐜銆佸鍙嬬煕鐩俱€佽皟鎹㈠鑸嶇瓑' },
  { value: 'FACILITY', label: '璁炬柦缁翠慨', desc: '姘寸數銆侀棬绐椼€佺┖璋冦€佺綉缁滅瓑鎶ヤ慨' },
  { value: 'ALLOCATION', label: '鍒嗛厤闂', desc: '瀹胯垗鍒嗛厤缁撴灉銆佸簥浣嶈皟鏁寸瓑' },
  { value: 'HYGIENE', label: '鍗敓闂', desc: '鍏叡鍖哄煙鍗敓銆佸瀮鍦惧鐞嗙瓑' },
  { value: 'OTHER', label: '鍏朵粬闂', desc: '鍏朵粬闇€瑕佺鐞嗗憳澶勭悊鐨勪簨椤? },
]

const adminRules: FormRules = {
  targetRole: [{ required: true, message: '璇烽€夋嫨鍙嶉瀵硅薄', trigger: 'change' }],
  title: [
    { required: true, message: '璇疯緭鍏ユ爣棰?, trigger: 'blur' },
    { min: 2, max: 50, message: '鏍囬闀垮害鍦?2 鍒?50 涓瓧绗?, trigger: 'blur' },
  ],
  content: [
    { required: true, message: '璇疯緭鍏ヨ缁嗘弿杩?, trigger: 'blur' },
    { min: 10, max: 1000, message: '鍐呭闀垮害鍦?10 鍒?1000 涓瓧绗?, trigger: 'blur' },
  ],
  problemType: [{ required: true, message: '璇烽€夋嫨闂绫诲瀷', trigger: 'change' }],
  collegeId: [{ required: true, message: '璇烽€夋嫨瀛﹂櫌', trigger: 'change' }],
  majorId: [{ required: true, message: '璇烽€夋嫨涓撲笟', trigger: 'change' }],
  classId: [{ required: true, message: '璇烽€夋嫨鐝骇', trigger: 'change' }],
}

const devRules: FormRules = {
  targetRole: [{ required: true, message: '璇烽€夋嫨鍙嶉瀵硅薄', trigger: 'change' }],
  title: [
    { required: true, message: '璇疯緭鍏ユ爣棰?, trigger: 'blur' },
    { min: 2, max: 50, message: '鏍囬闀垮害鍦?2 鍒?50 涓瓧绗?, trigger: 'blur' },
  ],
  content: [
    { required: true, message: '璇疯緭鍏ヨ缁嗘弿杩?, trigger: 'blur' },
    { min: 10, max: 1000, message: '鍐呭闀垮害鍦?10 鍒?1000 涓瓧绗?, trigger: 'blur' },
  ],
}

const currentRules = computed(() => form.value.targetRole === 'ADMIN' ? adminRules : devRules)

const isAdminForm = computed(() => form.value.targetRole === 'ADMIN')

const filteredFeedbacks = computed(() => {
  if (activeTab.value === 'all') return feedbacks.value
  return feedbacks.value.filter((f: any) => f.targetRole === activeTab.value)
})

const statusMap: Record<string, { text: string; type: string }> = {
  PENDING: { text: '寰呭鐞?, type: 'warning' },
  REVIEWING: { text: '澶勭悊涓?, type: 'info' },
  ADOPTED: { text: '宸查噰绾?, type: 'success' },
  DECLINED: { text: '宸插洖缁?, type: 'danger' },
}

const problemTypeMap: Record<string, string> = {
  DORM: '瀹胯垗闂', FACILITY: '璁炬柦缁翠慨', ALLOCATION: '鍒嗛厤闂', HYGIENE: '鍗敓闂', OTHER: '鍏朵粬闂',
}

const targetMap: Record<string, { text: string; type: string; icon: string; desc: string }> = {
  DEVELOPER: { text: '缁欑郴缁熷紑鍙戣€?, type: '', icon: '馃憫', desc: '鍔熻兘寤鸿 路 Bug鍙嶉 路 绯荤粺浼樺寲' },
  ADMIN: { text: '缁欑鐞嗗憳', type: 'warning', icon: '馃敡', desc: '瀹胯垗绠＄悊 路 璁炬柦鎶ヤ慨 路 鍒嗛厤闂' },
}

async function loadFeedbacks() {
  loading.value = true
  try {
    const res = await feedbackApi.getList()
    feedbacks.value = res.data.data || []
  } catch {
    feedbacks.value = []
  } finally {
    loading.value = false
  }
}

async function loadColleges() {
  try { const res = await request.get('/school/colleges'); colleges.value = res.data.data || [] } catch {}
}

watch(() => form.value.collegeId, async (cid) => {
  form.value.majorId = null
  form.value.classId = null
  if (!cid) { majors.value = []; classes.value = []; return }
  try { const res = await request.get('/school/majors', { params: { collegeId: cid } }); majors.value = res.data.data || [] } catch {}
})

watch(() => form.value.majorId, async (mid) => {
  form.value.classId = null
  if (!mid) { classes.value = []; return }
  try { const res = await request.get('/school/classes', { params: { majorId: mid } }); classes.value = res.data.data || [] } catch {}
})

watch(() => form.value.targetRole, () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
})

function getCollegeNameById(id: number | null) {
  if (!id) return ''
  return colleges.value.find(c => c.id === id)?.name || String(id)
}

function getMajorNameById(id: number | null) {
  if (!id) return ''
  return majors.value.find(m => m.id === id)?.name || String(id)
}

function getClassNameById(id: number | null) {
  if (!id) return ''
  return classes.value.find(c => c.id === id)?.name || String(id)
}

function openDialog() {
  form.value = {
    targetRole: 'DEVELOPER',
    title: '',
    content: '',
    problemType: '',
    collegeId: null,
    majorId: null,
    classId: null,
  }
  showDialog.value = true
}

async function submitFeedback() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: any = {
        targetRole: form.value.targetRole,
        title: form.value.title,
        content: form.value.content,
      }
      if (form.value.targetRole === 'ADMIN') {
        payload.problemType = form.value.problemType
        payload.collegeName = getCollegeNameById(form.value.collegeId)
        payload.majorName = getMajorNameById(form.value.majorId)
        payload.className = getClassNameById(form.value.classId)
      }
      await feedbackApi.submit(payload)
      const targetName = form.value.targetRole === 'DEVELOPER' ? '绯荤粺寮€鍙戣€? : '绠＄悊鍛?
      ElMessage.success(`宸插悜${targetName}鎻愪氦锛屾劅璋㈡偍鐨勫弽棣堬紒`)
      showDialog.value = false
      await loadFeedbacks()
    } catch {
      ElMessage.error('鎻愪氦澶辫触锛岃閲嶈瘯')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => { loadFeedbacks(); loadColleges() })
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>寤鸿鍙嶉</h1>
      <p class="page-desc">閫夋嫨鍙嶉瀵硅薄锛屼綘鐨勬秷鎭皢鍑嗙‘浼犺揪缁欏搴旂殑浜哄鐞嗐€?/p>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="activeTab" size="default">
        <el-radio-button value="all">鍏ㄩ儴</el-radio-button>
        <el-radio-button value="DEVELOPER">
          <span style="display:flex;align-items:center;gap:4px">馃憫 缁欏紑鍙戣€?/span>
        </el-radio-button>
        <el-radio-button value="ADMIN">
          <span style="display:flex;align-items:center;gap:4px">馃敡 缁欑鐞嗗憳</span>
        </el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="openDialog">
        <el-icon><EditPen /></el-icon> 鎻愪氦鍙嶉
      </el-button>
    </div>

    <div v-loading="loading" class="feedback-list">
      <template v-if="filteredFeedbacks.length">
        <div v-for="item in filteredFeedbacks" :key="item.id" class="feedback-card" @click="viewDetail = item">
          <div class="card-header">
            <div class="card-meta">
              <el-tag
                :type="targetMap[item.targetRole]?.type as any || 'info'"
                size="small"
                effect="dark"
                class="target-tag"
              >
                {{ targetMap[item.targetRole]?.icon }} {{ targetMap[item.targetRole]?.text || item.targetRole }}
              </el-tag>
              <el-tag v-if="item.problemType" size="small" type="danger" effect="plain">
                {{ problemTypeMap[item.problemType] || item.problemType }}
              </el-tag>
              <el-tag
                :type="statusMap[item.status]?.type as any || 'info'"
                size="small"
                effect="plain"
              >
                {{ statusMap[item.status]?.text || item.status }}
              </el-tag>
            </div>
            <span class="card-time">{{ item.createdAt?.slice(0, 10) }}</span>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <div v-if="item.collegeName" class="card-location">
            <el-icon :size="14"><School /></el-icon>
            <span>{{ item.collegeName }}</span>
            <el-icon :size="12" style="margin:0 2px"><ArrowRight /></el-icon>
            <span>{{ item.majorName }}</span>
            <el-icon :size="12" style="margin:0 2px"><ArrowRight /></el-icon>
            <span>{{ item.className }}</span>
          </div>
          <p class="card-content">{{ item.content }}</p>
          <div class="card-footer">
            <div class="submitter-info">
              <el-tag size="small" type="info" effect="plain" class="role-tag">
                {{ item.submitterRole === 'DEVELOPER' ? '馃憫 寮€鍙戣€? : item.submitterRole === 'ADMIN' ? '馃敡 绠＄悊鍛? : '馃懁 瀛︾敓' }}
              </el-tag>
              <span>{{ item.submitterName }}</span>
              <el-tag size="small" type="info" effect="plain" class="school-tag">
                <el-icon :size="12"><School /></el-icon>
                {{ item.schoolName }}
              </el-tag>
            </div>
            <el-button type="primary" link size="small">
              鏌ョ湅璇︽儏 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div v-if="item.reply" class="reply-section">
            <div class="reply-header">
              <el-icon :size="14"><ChatLineSquare /></el-icon>
              <span class="reply-from">{{ item.replierRole === 'DEVELOPER' ? '绯荤粺寮€鍙戣€? : '绠＄悊鍛? }} 鍥炲锛?/span>
            </div>
            <p class="reply-content">{{ item.reply }}</p>
          </div>
        </div>
      </template>
      <el-empty v-else description="鏆傛棤鍙嶉锛屽揩鏉ユ彁浜ょ涓€鏉″惂锛? />
    </div>

    <!-- 鏌ョ湅鍙嶉璇︽儏寮圭獥 -->
    <el-dialog
      v-model="detailVisible"
      :title="viewDetail?.title || '鍙嶉璇︽儏'"
      width="600px"
      destroy-on-close
    >
      <template v-if="viewDetail">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="鍙嶉瀵硅薄">
            <el-tag :type="targetMap[viewDetail.targetRole]?.type as any || 'info'" size="small" effect="dark">
              {{ targetMap[viewDetail.targetRole]?.icon }} {{ targetMap[viewDetail.targetRole]?.text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="鐘舵€?>
            <el-tag :type="statusMap[viewDetail.status]?.type as any || 'info'" size="small">
              {{ statusMap[viewDetail.status]?.text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="viewDetail.problemType" label="闂绫诲瀷">
            <el-tag size="small" type="danger">{{ problemTypeMap[viewDetail.problemType] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="鎻愪氦鏃堕棿">{{ viewDetail.createdAt?.slice(0, 10) }}</el-descriptions-item>
          <el-descriptions-item v-if="viewDetail.collegeName" label="鎵€灞? :span="2">
            {{ viewDetail.collegeName }} / {{ viewDetail.majorName }} / {{ viewDetail.className }}
          </el-descriptions-item>
          <el-descriptions-item label="鎻愪氦鑰? :span="2">
            {{ viewDetail.submitterName }}锛坽{ viewDetail.schoolName }}锛?          </el-descriptions-item>
          <el-descriptions-item label="璇︾粏鍐呭" :span="2">
            <div style="white-space:pre-wrap;line-height:1.8;color:#303133">{{ viewDetail.content }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="viewDetail.reply" class="detail-reply">
          <div class="detail-reply-header">
            <el-icon :size="16" color="#67c23a"><CircleCheckFilled /></el-icon>
            <span>{{ viewDetail.replierRole === 'DEVELOPER' ? '绯荤粺寮€鍙戣€? : '绠＄悊鍛? }} 宸插洖澶?/span>
          </div>
          <p class="detail-reply-text">{{ viewDetail.reply }}</p>
        </div>
        <div v-else class="detail-no-reply">
          <el-icon :size="16" color="#909399"><Clock /></el-icon>
          <span>鏆傛湭鏀跺埌鍥炲锛岃鑰愬績绛夊緟</span>
        </div>
      </template>
    </el-dialog>

    <!-- 鎻愪氦寮圭獥 -->
    <el-dialog
      v-model="showDialog"
      title="鎻愪氦鍙嶉"
      width="620px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="currentRules" label-position="top">
        <el-form-item label="鍙嶉缁欒皝" prop="targetRole">
          <div class="target-select">
            <div
              class="target-card"
              :class="{ selected: form.targetRole === 'DEVELOPER' }"
              @click="form.targetRole = 'DEVELOPER'"
            >
              <div class="target-card-header">
                <span class="target-icon">馃憫</span>
                <span class="target-name">绯荤粺寮€鍙戣€?/span>
              </div>
              <p class="target-desc">鍔熻兘寤鸿 路 Bug鍙嶉 路 绯荤粺浼樺寲</p>
              <div class="target-check" v-if="form.targetRole === 'DEVELOPER'">
                <el-icon color="#722ed1"><CircleCheckFilled /></el-icon>
              </div>
            </div>
            <div
              class="target-card"
              :class="{ selected: form.targetRole === 'ADMIN' }"
              @click="form.targetRole = 'ADMIN'"
            >
              <div class="target-card-header">
                <span class="target-icon">馃敡</span>
                <span class="target-name">瀛︽牎绠＄悊鍛?/span>
              </div>
              <p class="target-desc">瀹胯垗绠＄悊 路 璁炬柦鎶ヤ慨 路 鍒嗛厤闂</p>
              <div class="target-check" v-if="form.targetRole === 'ADMIN'">
                <el-icon color="#d48806"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- ====== 缁欑鐞嗗憳鐨勮〃鍗曪紙缁撴瀯鍖栵級 ====== -->
        <template v-if="isAdminForm">
          <el-alert type="warning" :closable="false" style="margin-bottom:16px">
            <template #title>
              璇蜂粩缁嗗～鍐欎互涓嬩俊鎭紝浠ヤ究绠＄悊鍛樺揩閫熷畾浣嶅拰澶勭悊浣犵殑闂銆?            </template>
          </el-alert>

          <el-form-item label="闂绫诲瀷" prop="problemType">
            <el-select v-model="form.problemType" placeholder="璇烽€夋嫨闂绫诲瀷" style="width:100%">
              <el-option v-for="pt in problemTypes" :key="pt.value" :label="pt.label" :value="pt.value">
                <div class="problem-option">
                  <span>{{ pt.label }}</span>
                  <span class="problem-option-desc">{{ pt.desc }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="瀛﹂櫌" prop="collegeId">
                <el-select v-model="form.collegeId" placeholder="閫夋嫨瀛﹂櫌" style="width:100%">
                  <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="涓撲笟" prop="majorId">
                <el-select v-model="form.majorId" placeholder="閫夋嫨涓撲笟" style="width:100%" :disabled="!form.collegeId">
                  <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="鐝骇" prop="classId">
                <el-select v-model="form.classId" placeholder="閫夋嫨鐝骇" style="width:100%" :disabled="!form.majorId">
                  <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="鎵€灞炲鏍?>
            <el-input :model-value="schoolName" disabled>
              <template #prefix><el-icon><School /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item label="闂姒傝堪" prop="title">
            <el-input
              v-model="form.title"
              placeholder="涓€鍙ヨ瘽姒傛嫭浣犺鍙嶉鐨勯棶棰橈紝濡傦細M1鏍?妤肩儹姘翠緵搴斾笉瓒?
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="璇︾粏鎻忚堪" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              placeholder="璇疯缁嗘弿杩帮細闂鍙戠敓鐨勫叿浣撴椂闂淬€佸湴鐐广€佸奖鍝嶈寖鍥淬€佹湡鏈涚殑澶勭悊鏂瑰紡绛?.."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </template>

        <!-- ====== 缁欏紑鍙戣€呯殑琛ㄥ崟锛堢畝娲侊級 ====== -->
        <template v-else>
          <el-form-item label="鎵€灞炲鏍?>
            <el-input :model-value="schoolName" disabled>
              <template #prefix><el-icon><School /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item label="鏍囬" prop="title">
            <el-input
              v-model="form.title"
              placeholder="绠€瑕佹弿杩颁綘鐨勫姛鑳藉缓璁垨Bug"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="璇︾粏鍐呭" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              placeholder="璇︾粏鎻忚堪锛氭湡鏈涚殑鍔熻兘銆佸鐜版楠ゃ€佹敼杩涙柟妗堢瓑..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">鍙栨秷</el-button>
        <el-button type="primary" :loading="submitting" @click="submitFeedback">
          鎻愪氦鍙嶉
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 14px;
  color: #909399;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.15s;
  cursor: pointer;
}

.feedback-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.target-tag {
  font-weight: 600;
}

.card-time {
  font-size: 13px;
  color: #c0c4cc;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.card-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  margin-bottom: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.submitter-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.role-tag {
  flex-shrink: 0;
}

.school-tag {
  margin-left: 4px;
}

.reply-section {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #67c23a;
  font-weight: 600;
  margin-bottom: 6px;
}

.reply-content {
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
  margin: 0;
}

/* 鐩爣閫夋嫨鍗＄墖 */
.target-select {
  display: flex;
  gap: 16px;
  width: 100%;
}

.target-card {
  flex: 1;
  border: 2px solid #e5e6eb;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  text-align: center;
}

.target-card:hover {
  border-color: #c0c4cc;
}

.target-card.selected {
  border-color: #722ed1;
  background: #f9f0ff;
}

.target-card:last-child.selected {
  border-color: #d48806;
  background: #fffbe6;
}

.target-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.target-icon {
  font-size: 24px;
}

.target-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.target-desc {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.5;
}

.target-check {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
}

/* 闂绫诲瀷閫夐」 */
.problem-option {
  display: flex;
  flex-direction: column;
}

.problem-option-desc {
  font-size: 11px;
  color: #c0c4cc;
}

.form-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
  line-height: 1.5;
}

.detail-reply {
  margin-top: 16px;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.detail-reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 10px;
}

.detail-reply-text {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

.detail-no-reply {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}
</style>
