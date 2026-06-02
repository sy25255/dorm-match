<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const schoolCode = localStorage.getItem('schoolCode') || ''

function goHome() {
  router.push(schoolCode ? `/${schoolCode}/` : '/')
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-card">
      <div class="not-found-icon">404</div>
      <h1>页面未找到</h1>
      <p>您访问的页面不存在或已被移除</p>
      <div class="not-found-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="router.back()">返回上页</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.not-found-card {
  text-align: center;
  padding: 60px 40px;
  max-width: 500px;
}
.not-found-icon {
  font-size: 120px;
  font-weight: 800;
  color: #e5e6eb;
  line-height: 1;
  margin-bottom: 16px;
}
.not-found-card h1 {
  font-size: 24px;
  color: #1d2129;
  margin-bottom: 8px;
}
.not-found-card p {
  font-size: 14px;
  color: #86909c;
  margin-bottom: 32px;
}
.not-found-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
