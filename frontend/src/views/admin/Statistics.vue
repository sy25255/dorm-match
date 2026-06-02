<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart, RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, BarChart, LineChart, RadarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const userStore = useUserStore()
const stats = ref<any>({})
const loading = ref(false)
const cleanupLoading = ref(false)

const totalStudents = computed(() => Number(stats.value.totalStudents || 0))
const completedSurvey = computed(() => Number(stats.value.completedSurvey || 0))
const paired = computed(() => Number(stats.value.paired || 0))
const allocated = computed(() => Number(stats.value.allocated || 0))
const pendingObjections = computed(() => Number(stats.value.pendingObjections || 0))

const surveyRate = computed(() => totalStudents.value ? Math.round(completedSurvey.value / totalStudents.value * 100) : 0)
const pairingRate = computed(() => totalStudents.value ? Math.round(paired.value / totalStudents.value * 100) : 0)
const allocationRate = computed(() => totalStudents.value ? Math.round(allocated.value / totalStudents.value * 100) : 0)

const readinessItems = computed(() => [
  {
    label: '问卷完成率',
    value: surveyRate.value,
    desc: `${completedSurvey.value}/${totalStudents.value} 名学生已完成`,
    status: surveyRate.value >= 80 ? 'success' : surveyRate.value >= 40 ? 'warning' : 'exception',
  },
  {
    label: '配对覆盖率',
    value: pairingRate.value,
    desc: `${paired.value}/${totalStudents.value} 名学生已有配对状态`,
    status: pairingRate.value >= 70 ? 'success' : pairingRate.value >= 30 ? 'warning' : 'exception',
  },
  {
    label: '宿舍分配率',
    value: allocationRate.value,
    desc: `${allocated.value}/${totalStudents.value} 名学生已有分配记录`,
    status: allocationRate.value >= 70 ? 'success' : allocationRate.value >= 30 ? 'warning' : 'exception',
  },
])

const todoItems = computed(() => {
  const items = []
  if (totalStudents.value === 0) items.push({ level: 'warning', title: '还没有学生数据', desc: '先邀请学生注册或导入学生名单。' })
  if (completedSurvey.value < totalStudents.value) items.push({ level: 'info', title: '继续推进问卷填写', desc: `仍有 ${Math.max(0, totalStudents.value - completedSurvey.value)} 名学生未完成问卷。` })
  if (pendingObjections.value > 0) items.push({ level: 'danger', title: '处理分配异议', desc: `当前有 ${pendingObjections.value} 条异议等待处理。` })
  if (completedSurvey.value > 0 && allocated.value === 0) items.push({ level: 'warning', title: '准备执行宿舍分配', desc: '已有问卷数据，但还没有分配记录。' })
  if (items.length === 0) items.push({ level: 'success', title: '当前流程较完整', desc: '可以继续观察反馈与审计日志。' })
  return items
})

const pieOption = ref({})
const barOption = ref({})
const lineOption = ref({})
const radarOption = ref({})

async function loadStats() {
  loading.value = true
  try {
    const res = await adminApi.getStatistics()
    stats.value = res.data.data || {}
    buildCharts()
  } catch (error: any) {
    ElMessage.error(error?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

async function handleCleanup() {
  try {
    await ElMessageBox.confirm(
      '此操作会清理测试账号及其问卷、分配等测试数据，操作不可撤销。',
      '确认清理测试账号',
      { confirmButtonText: '确认清理', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  cleanupLoading.value = true
  try {
    const res = await adminApi.cleanupGuests()
    const result = res.data?.data || {}
    ElMessage.success(
      `已清理 ${result.deleted_users || 0} 个用户、${result.deleted_profiles || 0} 份档案、${result.deleted_answers || 0} 条答卷、${result.deleted_allocations || 0} 条分配`
    )
    await loadStats()
  } catch (err: any) {
    ElMessage.error(err?.message || '清理失败')
  } finally {
    cleanupLoading.value = false
  }
}

function buildCharts() {
  const s = stats.value
  pieOption.value = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '44%'],
      data: [
        { value: s.surveyStatus?.completed || 0, name: '已完成', itemStyle: { color: '#16a34a' } },
        { value: s.surveyStatus?.drafting || 0, name: '填写中', itemStyle: { color: '#f59e0b' } },
        { value: s.surveyStatus?.notStarted || 0, name: '未开始', itemStyle: { color: '#cbd5e1' } },
      ],
      label: { formatter: '{b}\n{d}%' },
    }],
  }

  barOption.value = {
    tooltip: { trigger: 'axis' },
    grid: { left: 42, right: 18, top: 24, bottom: 54 },
    xAxis: { type: 'category', data: (s.collegeDistribution || []).map((c: any) => c.name), axisLabel: { interval: 0, rotate: 20 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: (s.collegeDistribution || []).map((c: any) => c.count), itemStyle: { color: '#2563eb', borderRadius: 5 } }],
  }

  lineOption.value = {
    tooltip: { trigger: 'axis' },
    grid: { left: 42, right: 18, top: 24, bottom: 36 },
    xAxis: { type: 'category', data: (s.dailyRegistrations || []).map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: (s.dailyRegistrations || []).map((d: any) => d.count), smooth: true, areaStyle: { opacity: 0.14 }, itemStyle: { color: '#16a34a' } }],
  }

  const dims = s.dimensionAverages || {}
  radarOption.value = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '作息', max: 5 },
        { name: '卫生', max: 5 },
        { name: '学习', max: 5 },
        { name: '兴趣', max: 5 },
        { name: '社交', max: 5 },
        { name: '消费', max: 5 },
        { name: '性格', max: 5 },
        { name: '价值观', max: 5 },
      ],
    },
    series: [{
      type: 'radar',
      data: [{ value: [dims.SLEEP, dims.HYGIENE, dims.STUDY, dims.HOBBY, dims.SOCIAL, dims.SPENDING, dims.PERSONALITY, dims.PSYCHOLOGY], name: '全校均值' }],
      areaStyle: { opacity: 0.18 },
    }],
  }
}

onMounted(loadStats)
</script>

<template>
  <div class="statistics-page" v-loading="loading">
    <section class="page-hero">
      <div>
        <p class="eyebrow">{{ userStore.schoolName || '当前学校' }} · 管理工作台</p>
        <h2>宿舍匹配进度总览</h2>
        <p>先看学生是否足够、问卷是否完成、分配是否推进，再处理异常和反馈。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="loadStats">刷新数据</el-button>
        <el-button type="warning" plain :loading="cleanupLoading" :disabled="totalStudents === 0" @click="handleCleanup">
          清理测试账号
        </el-button>
      </div>
    </section>

    <section class="metric-grid">
      <div class="metric-card">
        <span>学生总数</span>
        <strong>{{ totalStudents }}</strong>
        <small>已进入当前学校</small>
      </div>
      <div class="metric-card">
        <span>完成问卷</span>
        <strong>{{ completedSurvey }}</strong>
        <small>{{ surveyRate }}% 完成率</small>
      </div>
      <div class="metric-card">
        <span>已配对</span>
        <strong>{{ paired }}</strong>
        <small>{{ pairingRate }}% 覆盖率</small>
      </div>
      <div class="metric-card urgent">
        <span>待处理异议</span>
        <strong>{{ pendingObjections }}</strong>
        <small>需要人工复核</small>
      </div>
    </section>

    <section class="readiness-grid">
      <el-card class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>上线准备度</span>
            <small>面向学校试用前的关键指标</small>
          </div>
        </template>
        <div class="readiness-list">
          <div v-for="item in readinessItems" :key="item.label" class="readiness-item">
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <el-progress type="circle" :percentage="item.value" :width="70" :status="item.status as any" />
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>下一步待办</span>
            <small>按风险优先处理</small>
          </div>
        </template>
        <div class="todo-list">
          <el-alert
            v-for="item in todoItems"
            :key="item.title"
            :title="item.title"
            :description="item.desc"
            :type="item.level as any"
            :closable="false"
            show-icon
          />
        </div>
      </el-card>
    </section>

    <section class="chart-grid">
      <el-card class="chart-card">
        <template #header>问卷完成情况</template>
        <VChart :option="pieOption" class="chart" />
      </el-card>
      <el-card class="chart-card">
        <template #header>各学院人数分布</template>
        <VChart :option="barOption" class="chart" />
      </el-card>
      <el-card class="chart-card">
        <template #header>每日注册趋势</template>
        <VChart :option="lineOption" class="chart" />
      </el-card>
      <el-card class="chart-card">
        <template #header>维度均值雷达图</template>
        <VChart :option="radarOption" class="chart" />
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.statistics-page {
  display: grid;
  gap: 18px;
}
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}
.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}
.page-hero h2 {
  margin: 0;
  font-size: 22px;
  color: #172033;
}
.page-hero p {
  margin: 8px 0 0;
  color: #667085;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.metric-card {
  min-height: 118px;
  padding: 18px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.metric-card span {
  color: #667085;
  font-size: 13px;
}
.metric-card strong {
  font-size: 34px;
  line-height: 1;
  color: #111827;
}
.metric-card small {
  color: #8a95a5;
}
.metric-card.urgent strong { color: #dc2626; }
.readiness-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 14px;
}
.panel-card,
.chart-card {
  border-radius: 8px;
}
.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.panel-title span {
  font-weight: 700;
}
.panel-title small {
  color: #8a95a5;
}
.readiness-list {
  display: grid;
  gap: 12px;
}
.readiness-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #eef2f7;
}
.readiness-item:last-child {
  border-bottom: 0;
}
.readiness-item strong {
  color: #172033;
}
.readiness-item p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}
.todo-list {
  display: grid;
  gap: 10px;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.chart {
  height: 280px;
}
@media (max-width: 960px) {
  .page-hero,
  .panel-title {
    align-items: flex-start;
    flex-direction: column;
  }
  .hero-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .metric-grid,
  .readiness-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
