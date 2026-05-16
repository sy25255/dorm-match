<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { SurveyQuestion } from '@/api/survey'

const questions = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const dimensions = ['SLEEP', 'HYGIENE', 'STUDY', 'HOBBY', 'SOCIAL', 'SPENDING', 'PERSONALITY', 'PSYCHOLOGY', 'LIFESTYLE', 'ATTENTION', 'TRAP', 'EXTENSION']

const form = ref({
  id: null as number | null,
  questionCode: '',
  dimension: '',
  questionText: '',
  questionType: 'SINGLE_CHOICE' as string,
  optionsText: '',
  sortOrder: 0,
  isRequired: 1,
  isAttentionCheck: 0,
  status: 1,
})

const questionTypes = [
  { value: 'SINGLE_CHOICE', label: '鍗曢€夐' },
  { value: 'MULTI_CHOICE', label: '澶氶€夐' },
  { value: 'LIKERT5', label: '璇勫垎棰?5绾? },
  { value: 'LIKERT7', label: '璇勫垎棰?7绾? },
  { value: 'TEXT', label: '鏂囨湰棰? },
  { value: 'LONG_TEXT', label: '闀挎枃鏈' },
  { value: 'DROPDOWN', label: '涓嬫媺棰? },
  { value: 'VALUE_JUDGE', label: '浠峰€艰鍒ゆ柇' },
]

const needsOptions = computed(() => form.value.questionType !== 'TEXT' && form.value.questionType !== 'LONG_TEXT')

const optionsPlaceholder = computed(() => {
  if (form.value.questionType === 'LIKERT5' || form.value.questionType === 'LIKERT7') {
    return '1. 闈炲父涓嶅悓鎰廫n2. 涓嶅悓鎰廫n3. 涓€鑸琝n4. 鍚屾剰\n5. 闈炲父鍚屾剰'
  }
  return 'A. 閫夐」A\nB. 閫夐」B\nC. 閫夐」C\nD. 閫夐」D'
})

const optionsHint = computed(() => {
  if (form.value.questionType === 'LIKERT5' || form.value.questionType === 'LIKERT7') {
    return '姣忚涓€涓€夐」锛屾牸寮忥細鏁板瓧. 鏂囧瓧璇存槑'
  }
  return '姣忚涓€涓€夐」锛屾牸寮忥細瀛楁瘝. 鏂囧瓧璇存槑'
})

function resetForm() {
  form.value = { id: null, questionCode: '', dimension: '', questionText: '', questionType: 'SINGLE_CHOICE', optionsText: '', sortOrder: 0, isRequired: 1, isAttentionCheck: 0, status: 1 }
}

function optionsJsonToText(optionsJson: string | null): string {
  if (!optionsJson) return ''
  try {
    const arr = JSON.parse(optionsJson) as Array<{ label: string; value: string; text: string }>
    return arr.map(item => `${item.label}. ${item.text}`).join('\n')
  } catch { return '' }
}

function optionsTextToJson(text: string): string | null {
  if (!text.trim()) return null
  const lines = text.trim().split('\n').filter(line => line.trim())
  const arr = lines.map(line => {
    const match = line.match(/^([A-Za-z0-9]+)\.\s*(.+)$/)
    if (match) {
      return { label: match[1], value: match[1], text: match[2].trim() }
    }
    return { label: String(lines.indexOf(line) + 1), value: String(lines.indexOf(line) + 1), text: line.trim() }
  })
  return JSON.stringify(arr)
}

async function loadQuestions() {
  loading.value = true
  try {
    const res = await adminApi.getSurveyQuestions()
    questions.value = res.data.data || []
  } finally { loading.value = false }
}

function openEdit(row?: any) {
  if (row) {
    isEdit.value = true
    form.value = {
      ...row,
      optionsText: row.optionsJson ? optionsJsonToText(typeof row.optionsJson === 'string' ? row.optionsJson : JSON.stringify(row.optionsJson)) : '',
      optionsJson: undefined as any,
    }
  } else {
    isEdit.value = false
    resetForm()
  }
  dialogVisible.value = true
}

async function saveQuestion() {
  try {
    const data: any = { ...form.value }
    data.optionsJson = needsOptions.value ? optionsTextToJson(form.value.optionsText) : null
    delete data.optionsText
    if (isEdit.value && data.id) {
      await adminApi.updateQuestion(data.id, data)
    } else {
      await adminApi.createQuestion(data)
    }
    dialogVisible.value = false
    loadQuestions()
  } catch {
    ElMessage.warning('淇濆瓨澶辫触锛岃妫€鏌ュ～鍐欏唴瀹?)
  }
}

async function toggleQuestion(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  const actionText = newStatus === 0 ? '鍋滅敤' : '鍚敤'
  try {
    await ElMessageBox.confirm(`纭${actionText}棰樼洰"${row.questionText.slice(0, 20)}..."鍚楋紵`, '鎻愮ず', { type: 'warning' })
    await adminApi.toggleQuestion(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(`棰樼洰宸?{actionText}`)
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('鎿嶄綔澶辫触')
  }
}

async function deleteQuestion(row: any) {
  try {
    await ElMessageBox.confirm(`纭鍒犻櫎棰樼洰"${row.questionText.slice(0, 20)}..."鍚楋紵`, '璀﹀憡', { type: 'warning' })
    await adminApi.deleteQuestion(row.id)
    loadQuestions()
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('鍒犻櫎澶辫触')
  }
}

const dimLabelMap: Record<string, string> = {
  SLEEP: '鐢熸椿浣滄伅', HYGIENE: '鍗敓涔犳儻', STUDY: '瀛︿範涔犳儻', HOBBY: '鍏磋叮鐖卞ソ',
  SOCIAL: '绀句氦鍋忓ソ', SPENDING: '娑堣垂瑙傚康', PERSONALITY: '鎬ф牸鐗瑰緛', PSYCHOLOGY: '浠峰€艰',
  LIFESTYLE: '鐢熸椿鏂瑰紡', ATTENTION: '娉ㄦ剰鍔涙娴?, TRAP: '楠岃瘉棰?, EXTENSION: '鎵╁睍淇℃伅'
}

const dimCodeHint: Record<string, string> = {
  SLEEP: '濡?SLEEP_01', HYGIENE: '濡?HYGIENE_01', STUDY: '濡?STUDY_01',
  HOBBY: '濡?HOBBY_01', SOCIAL: '濡?SOCIAL_01', SPENDING: '濡?SPEND_01',
  PERSONALITY: '濡?PERS_01', PSYCHOLOGY: '濡?VALUE_01', LIFESTYLE: '濡?LIFE_01',
  ATTENTION: '濡?ATTN_01', TRAP: '濡?TRAP_01', EXTENSION: '濡?EXT_01'
}

onMounted(loadQuestions)
</script>

<template>
  <div>
    <div class="page-toolbar">
      <h2>闂嵎绠＄悊</h2>
      <el-button type="primary" @click="openEdit()">鏂板棰樼洰</el-button>
    </div>

    <el-table :data="questions" v-loading="loading" stripe max-height="calc(100vh - 180px)">
      <el-table-column prop="sortOrder" label="搴忓彿" width="60" />
      <el-table-column prop="questionCode" label="缂栫爜" width="100" />
      <el-table-column label="缁村害" width="100">
        <template #default="{ row }">{{ dimLabelMap[row.dimension] || row.dimension }}</template>
      </el-table-column>
      <el-table-column prop="questionText" label="棰樺共" min-width="250" show-overflow-tooltip />
      <el-table-column label="棰樺瀷" width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ questionTypes.find(t => t.value === row.questionType)?.label || row.questionType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="蹇呯瓟" width="60">
        <template #default="{ row }">{{ row.isRequired ? '鏄? : '鍚? }}</template>
      </el-table-column>
      <el-table-column label="鐘舵€? width="70">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '鍚敤' : '鍋滅敤' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="鎿嶄綔" width="210" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">缂栬緫</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="toggleQuestion(row)">
            {{ row.status === 1 ? '鍋滅敤' : '鍚敤' }}
          </el-button>
          <el-button type="danger" link size="small" @click="deleteQuestion(row)">鍒犻櫎</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '缂栬緫棰樼洰' : '鏂板棰樼洰'" width="650px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item>
              <template #label>
                棰樼洰缂栫爜
                <el-tooltip placement="top" effect="dark" content="缂栫爜鏄鐩殑鍞竴鏍囪瘑锛屽缓璁敤銆岀淮搴﹀墠缂€_搴忓彿銆嶅懡鍚嶏紝濡?SLEEP_01銆丠OBBY_02 绛?>
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input v-model="form.questionCode" :placeholder="form.dimension ? dimCodeHint[form.dimension] || '濡?SLEEP_01' : '濡?SLEEP_01'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                鎺掑簭
                <el-tooltip placement="top" effect="dark" content="鏁板瓧瓒婂皬瓒婇潬鍓嶏紝鎺у埗棰樼洰鍦ㄨ缁村害鍐呯殑鏄剧ず椤哄簭">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-input-number v-model="form.sortOrder" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="鎵€灞炵淮搴?>
              <el-select v-model="form.dimension" style="width:100%">
                <el-option v-for="d in dimensions" :key="d" :label="dimLabelMap[d] || d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="棰樼洰绫诲瀷">
              <el-select v-model="form.questionType" style="width:100%">
                <el-option v-for="t in questionTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="棰樺共">
          <el-input v-model="form.questionText" type="textarea" :rows="2" placeholder="璇疯緭鍏ラ鐩唴瀹癸紝濡傦細鎮ㄩ€氬父鐨勮捣搴婃椂闂存槸锛? />
        </el-form-item>
        <el-form-item v-if="needsOptions">
          <template #label>
            閫夐」鍐呭
            <el-tooltip placement="top" effect="dark" :content="optionsHint">
              <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <el-input
            v-model="form.optionsText"
            type="textarea"
            :rows="Math.max(4, (form.optionsText || '').split('\n').length + 1)"
            :placeholder="optionsPlaceholder"
          />
          <div class="field-hint">{{ optionsHint }}</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item>
              <template #label>
                蹇呯瓟
                <el-tooltip placement="top" effect="dark" content="寮€鍚悗瀛︾敓蹇呴』鍥炵瓟姝ら鎵嶈兘鎻愪氦">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="form.isRequired" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <template #label>
                娴嬭皫棰?                <el-tooltip placement="top" effect="dark" content="鐢ㄤ簬妫€娴嬪鐢熸槸鍚﹁鐪熶綔绛旓紝绛旈敊鏍囪鏃犳晥闂嵎">
                  <el-icon style="margin-left:4px;color:#a0aec0;cursor:help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-switch v-model="form.isAttentionCheck" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="鍚敤">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">鍙栨秷</el-button>
        <el-button type="primary" @click="saveQuestion">淇濆瓨</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
.field-hint { margin-top: 4px; font-size: 12px; color: #a0aec0; }
</style>
