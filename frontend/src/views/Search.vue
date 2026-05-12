<script setup lang="ts">
import { ref, watch } from 'vue'
import { matchApi } from '@/api/match'
import { inviteApi } from '@/api/invite'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

interface College { id: number; name: string; code: string }
interface Major { id: number; name: string; code: string; collegeId?: number }
interface Clazz { id: number; majorId: number; name: string; grade: number }

const keyword = ref('')
const collegeId = ref<number | null>(null)
const majorId = ref<number | null>(null)
const classId = ref<number | null>(null)

const colleges = ref<College[]>([])
const majors = ref<Major[]>([])
const classes = ref<Clazz[]>([])

const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

async function loadColleges() {
  try { const res = await request.get('/school/colleges'); colleges.value = res.data.data || [] } catch {}
}
loadColleges()

watch(collegeId, async (cid) => {
  majorId.value = null
  classId.value = null
  if (!cid) { majors.value = []; classes.value = []; return }
  try { const res = await request.get('/school/majors', { params: { collegeId: cid } }); majors.value = res.data.data || [] } catch {}
})

watch(majorId, async (mid) => {
  classId.value = null
  if (!mid) { classes.value = []; return }
  try { const res = await request.get('/school/classes', { params: { majorId: mid } }); classes.value = res.data.data || [] } catch {}
})

async function handleSearch() {
  loading.value = true
  searched.value = true
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (collegeId.value) params.collegeId = collegeId.value
    if (majorId.value) params.majorId = majorId.value
    if (classId.value) params.classId = classId.value
    const res = await matchApi.search(params)
    results.value = res.data.data || []
  } catch {} finally { loading.value = false }
}

async function sendInvite(targetId: number) {
  try {
    await inviteApi.send({ targetId, message: '' })
    ElMessage.success('邀请已发送')
  } catch {}
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>搜索舍友</h1>
      <p>通过学院→专业→班级精确找到同班同学，或按关键词搜索</p>
    </div>

    <div class="search-bar">
      <div class="filter-row">
        <el-select v-model="collegeId" placeholder="全部学院" clearable style="width:180px">
          <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="majorId" placeholder="全部专业" clearable style="width:200px" :disabled="!collegeId">
          <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
        <el-select v-model="classId" placeholder="全部班级" clearable style="width:180px" :disabled="!majorId">
          <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>
      <div class="search-row">
        <el-input v-model="keyword" placeholder="输入姓名、生源地、兴趣爱好等关键词..." size="large" clearable @keyup.enter="handleSearch">
          <template #append>
            <el-button type="primary" :loading="loading" @click="handleSearch">搜索同学</el-button>
          </template>
        </el-input>
      </div>
      <div class="quick-btns">
        <el-button size="small" text @click="collegeId=1;majorId=1;setTimeout(handleSearch,100)">快速查找：计算机科学与技术</el-button>
        <el-button size="small" text @click="collegeId=2;majorId=4;setTimeout(handleSearch,100)">快速查找：通信工程</el-button>
        <el-button size="small" text @click="collegeId=4;majorId=8;setTimeout(handleSearch,100)">快速查找：英语</el-button>
      </div>
    </div>

    <el-empty v-if="searched && results.length === 0 && !loading" description="未找到匹配的同学">
      <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/matches`)">查看智能推荐</el-button>
    </el-empty>

    <div v-loading="loading" class="card-grid" style="margin-top:20px">
      <el-card v-for="item in results" :key="item.studentId" shadow="hover" class="result-card">
        <div class="card-header">
          <div><h3>{{ item.name }}</h3><span class="student-no">{{ item.studentNo || '' }}</span></div>
          <el-tag v-if="item.matchScore" size="small" effect="plain">匹配 {{ item.matchScore }}%</el-tag>
        </div>
        <p class="card-meta">{{ item.collegeName }} · {{ item.majorName }}{{ item.className ? ' · ' + item.className : '' }}</p>
        <p class="card-bio">{{ item.bio || '暂无简介' }}</p>
        <el-button type="primary" size="small" @click="sendInvite(item.studentId)">发送邀请</el-button>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.search-bar { margin-bottom: 20px; }
.filter-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.search-row { max-width: 600px; }
.quick-btns { margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap; }
.quick-btns .el-button { color: #86909c; font-size: 12px; }
.result-card { text-align: center; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.card-header h3 { font-size: 16px; margin-bottom: 2px; }
.student-no { font-size: 11px; color: #c9cdd4; }
.card-meta { font-size: 12px; color: #86909c; margin-bottom: 8px; }
.card-bio { font-size: 13px; color: #4e5969; margin-bottom: 12px; min-height: 20px; }
</style>
