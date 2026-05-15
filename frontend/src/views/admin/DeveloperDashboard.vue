<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { devApi } from '@/api/dev'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const router = useRouter()
const loading = ref(false)
const platformStats = ref<any>({ totals: {}, schoolStats: [] })

const barOption = ref({})
const pieOption = ref({})

async function loadStats() {
  loading.value = true
  try {
    const res = await devApi.getPlatformStats()
    platformStats.value = res.data.data || { totals: {}, schoolStats: [] }
    buildCharts()
  } finally { loading.value = false }
}

function buildCharts() {
  const schools = platformStats.value.schoolStats || []
  barOption.value = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: schools.map((s: any) => s.shortName || s.name) },
    yAxis: { type: 'value' },
    legend: { data: ['总人数', '已完成问卷', '已配对'] },
    series: [
      { name: '总人数', type: 'bar', data: schools.map((s: any) => s.totalStudents), itemStyle: { borderRadius: 4, color: '#667eea' } },
      { name: '已完成问卷', type: 'bar', data: schools.map((s: any) => s.completedSurvey), itemStyle: { borderRadius: 4, color: '#52c41a' } },
      { name: '已配对', type: 'bar', data: schools.map((s: any) => s.paired), itemStyle: { borderRadius: 4, color: '#fa8c16' } },
    ]
  }
  pieOption.value = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['50%', '75%'], center: ['50%', '50%'],
      data: schools.map((s: any) => ({ name: s.name, value: s.totalStudents })),
      label: { formatter: '{b}\n{d}%' }
    }]
  }
}

function enterSchool(code: string) {
  localStorage.setItem('schoolCode', code)
  const school = { 'DEMO-UNI': '示范大学', 'TEST': '测试学院', 'BJ-UNI': '北京大学', 'SH-UNI': '上海大学' } as Record<string, string>
  localStorage.setItem('schoolName', school[code] || code)
  router.push(`/${code}/admin`)
}

onMounted(loadStats)
</script>

<template>
  <div v-loading="loading">
    <div class="page-header">
      <h1>平台总览</h1>
      <p style="color:#6b7280;margin-top:4px">全平台 {{ platformStats.totals.schoolCount }} 所学校运行概况</p>
    </div>

    <el-row :gutter="16" style="margin-bottom:20px">
      <el-col :span="4" v-for="card in [
        { label: '学校总数', value: platformStats.totals.schoolCount, color: '#667eea' },
        { label: '学生总数', value: platformStats.totals.totalStudents, color: '#52c41a' },
        { label: '已完成问卷', value: platformStats.totals.completedSurvey, color: '#fa8c16' },
        { label: '已配对', value: platformStats.totals.paired, color: '#13c2c2' },
        { label: '已分配', value: platformStats.totals.allocated, color: '#eb2f96' },
        { label: '待处理异议', value: platformStats.totals.pendingObjections, color: '#f5222d' },
      ]" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom:20px">
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header><span style="font-weight:600">各校数据对比</span></template>
          <v-chart :option="barOption" style="height:300px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header><span style="font-weight:600">学生分布</span></template>
          <v-chart :option="pieOption" style="height:300px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover">
      <template #header><span style="font-weight:600">学校列表</span></template>
      <el-table :data="platformStats.schoolStats" stripe>
        <el-table-column label="学校" min-width="160">
          <template #default="{ row }">
            <span style="font-weight:600">{{ row.name }}</span>
            <el-tag size="small" style="margin-left:8px">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学生总数" prop="totalStudents" width="100" align="center" />
        <el-table-column label="已完成问卷" prop="completedSurvey" width="110" align="center" />
        <el-table-column label="已配对" prop="paired" width="80" align="center" />
        <el-table-column label="已分配" prop="allocated" width="80" align="center" />
        <el-table-column label="待处理异议" prop="pendingObjections" width="110" align="center" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="enterSchool(row.code)">进入后台</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0; font-size: 22px; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
</style>