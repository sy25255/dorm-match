<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { surveyApi } from '@/api/survey'
import { matchApi } from '@/api/match'
import { inviteApi } from '@/api/invite'
import { onMounted, ref } from 'vue'

const userStore = useUserStore()
const surveyCompleted = ref(false)
const matchDone = ref(false)
const hasPairing = ref(false)

onMounted(async () => {
  try {
    const progress = await surveyApi.getProgress()
    surveyCompleted.value = progress.data.data?.percentage === 100
  } catch {}
  try {
    const pairing = await inviteApi.getPairing()
    hasPairing.value = !!pairing.data.data
  } catch {}
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>欢迎回来，{{ userStore.username }}</h1>
      <p>完成以下步骤，找到与你最合拍的舍友</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" class="step-card" :class="{ done: surveyCompleted }">
          <el-result icon="success" v-if="surveyCompleted" title="已完成" sub-title="偏好问卷已提交" />
          <template v-else>
            <div class="step-num">01</div>
            <h3>填写偏好问卷</h3>
            <p>告诉我们你的生活习惯、兴趣爱好和个性特征</p>
            <el-button type="primary" @click="$router.push(`/${$route.params.schoolCode}/survey`)">开始填写</el-button>
          </template>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="step-card">
          <div class="step-num">02</div>
          <h3>查看匹配推荐</h3>
          <p>系统基于问卷结果为你推荐最匹配的舍友</p>
          <el-button type="primary" :disabled="!surveyCompleted" @click="$router.push(`/${$route.params.schoolCode}/matches`)">查看推荐</el-button>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="step-card" :class="{ done: hasPairing }">
          <el-result icon="success" v-if="hasPairing" title="已配对" sub-title="您已成功匹配舍友" />
          <template v-else>
            <div class="step-num">03</div>
            <h3>邀请与配对</h3>
            <p>向心仪的舍友发送邀请，双方确认后完成配对</p>
            <el-button type="primary" :disabled="!surveyCompleted" @click="$router.push(`/${$route.params.schoolCode}/invites`)">管理邀请</el-button>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.step-card {
  text-align: center;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step-card.done {
  background: #f0f9eb;
  border-color: #b7eb8f;
}

.step-num {
  font-size: 48px;
  font-weight: 700;
  color: #e5e6eb;
  margin-bottom: 8px;
}

.step-card h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.step-card p {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 16px;
}
</style>
