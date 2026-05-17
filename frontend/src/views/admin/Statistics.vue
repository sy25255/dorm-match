<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart, RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, BarChart, LineChart, RadarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const stats = ref<any>({})
const loading = ref(false)

const pieOption = ref({})
const barOption = ref({})
const lineOption = ref({})
const radarOption = ref({})

async function loadStats() {
  loading.value = true
  try {
    const res = await adminApi.getStatistics()
    const data = res.data.data || {}
    // Merge with editable overrides from localStorage
    const editable = getEditableStats()
    stats.value = { ...data, ...editable }
    buildCharts()
  } finally { loading.value = false }
}

function getEditableStats() {
  try {
    const raw = localStorage.getItem('demo_editable_stats')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveEditableStat(key: string, value: number) {
  const current = getEditableStats()
  current[key] = value
  localStorage.setItem('demo_editable_stats', JSON.stringify(current))
  stats.value[key] = value
}

function buildCharts() {
  const s = stats.value

  pieOption.value = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: [
        { value: s.surveyStatus?.completed || 0, name: '已完成', itemStyle: { color: '#52c41a' } },
        { value: s.surveyStatus?.drafting || 0, name: '填写中', itemStyle: { color: '#faad14' } },
        { value: s.surveyStatus?.notStarted || 0, name: '未开始', itemStyle: { color: '#d9d9d9' } },
      ],
      label: { formatter: '{b}\n{d}%' }
    }]
  }

  barOption.value = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: (s.collegeDistribution || []).map((c: any) => c.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: (s.collegeDistribution || []).map((c: any) => c.count), itemStyle: { color: '#667eea', borderRadius: 4 } }]
  }

  lineOption.value = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: (s.dailyRegistrations || []).map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: (s.dailyRegistrations || []).map((d: any) => d.count), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#52c41a' } }]
  }

  const dims = s.dimensionAverages || {}
  radarOption.value = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '生活作息', max: 5 }, { name: '卫生习惯', max: 5 }, { name: '学习习惯', max: 5 },
        { name: '兴趣爱好', max: 5 }, { name: '社交偏好', max: 5 }, { name: '消费观念', max: 5 },
        { name: '性格特征', max: 5 }, { name: '价值观', max: 5 },
      ]
    },
    series: [{
      type: 'radar',
      data: [{ value: [dims.SLEEP, dims.HYGIENE, dims.STUDY, dims.HOBBY, dims.SOCIAL, dims.SPENDING, dims.PERSONALITY, dims.PSYCHOLOGY], name: '全校均值' }],
      areaStyle: { opacity: 0.2 }
    }]
  }
}

onMounted(loadStats)
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>数据统计</h2></div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6" v-for="item in [
        { label: '学生总数', key: 'totalStudents', color: '#667eea' },
        { label: '已完成问卷', key: 'completedSurvey', color: '#52c41a' },
        { label: '已配对', key: 'paired', color: '#fa8c16' },
        { label: '待处理异议', key: 'pendingObjections', color: '#f5222d' },
      ]" :key="item.label">
        <el-card shadow="hover">
          <div style="text-align:center">
            <el-input-number
              v-model="stats[item.key]"
              :min="0"
              :max="99999"
              :controls="false"
              style="width:100%"
              size="large"
              @change="saveEditableStat(item.key, $event)"
            />
            <div style="color:#86909c;font-size:13px;margin-top:4px">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="12">
        <el-card><template #header>问卷完成情况</template><VChart :option="pieOption" style="height:260px" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header>各学院人数分布</template><VChart :option="barOption" style="height:260px" /></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card><template #header>每日注册趋势</template><VChart :option="lineOption" style="height:260px" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header>各维度平均值（雷达图）</template><VChart :option="radarOption" style="height:260px" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
</style>
