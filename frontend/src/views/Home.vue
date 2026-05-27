<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { surveyApi } from '@/api/survey'
import { inviteApi, allocationApi } from '@/api/invite'
import { onMounted, ref } from 'vue'

const userStore = useUserStore()
const surveyCompleted = ref(false)
const hasPairing = ref(false)
const hasAllocation = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    const progress = await surveyApi.getProgress()
    surveyCompleted.value = progress.data.data?.percentage === 100
  } catch {
    console.error('加载问卷进度失败')
  }
  try {
    const pairing = await inviteApi.getPairing()
    hasPairing.value = !!pairing.data.data
  } catch {
    console.error('加载配对信息失败')
  }
  try {
    const res = await allocationApi.getMyAllocation()
    hasAllocation.value = !!res.data.data
  } catch {
    console.error('加载分配信息失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h1>欢迎回来，{{ userStore.username }}</h1>
      <p>完成以下步骤，找到与你最合拍的舍友</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
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

      <el-col :span="12">
        <el-card shadow="hover" class="step-card" :class="{ done: hasPairing }">
          <el-result icon="success" v-if="hasPairing" title="已配对" sub-title="您已成功匹配舍友" />
          <template v-else>
            <div class="step-num">02</div>
            <h3>邀请与配对</h3>
            <p>向心仪的舍友发送邀请，双方确认后完成配对</p>
            <el-button type="primary" :disabled="!surveyCompleted" @click="$router.push(`/${$route.params.schoolCode}/invites`)">管理邀请</el-button>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card shadow="hover" class="step-card">
          <div class="step-num">03</div>
          <h3>查看匹配推荐</h3>
          <p>系统基于问卷结果为你推荐最匹配的舍友</p>
          <el-button type="primary" :disabled="!surveyCompleted" @click="$router.push(`/${$route.params.schoolCode}/matches`)">查看推荐</el-button>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="step-card" :class="{ done: hasAllocation }">
          <el-result icon="success" v-if="hasAllocation" title="已分配" sub-title="宿舍分配结果已发布" />
          <template v-else>
            <div class="step-num">04</div>
            <h3>查看宿舍分配</h3>
            <p>配对完成后由管理员执行分配，查看你的宿舍和舍友</p>
            <el-button type="primary" :disabled="!hasPairing" @click="$router.push(`/${$route.params.schoolCode}/allocation`)">查看分配</el-button>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <div class="feedback-strip">
      <div>
        <h3>测试过程中发现问题或有改进建议？</h3>
        <p>请直接提交反馈，开发者会根据反馈继续调整系统体验。</p>
      </div>
      <el-button type="primary" plain @click="$router.push(`/${$route.params.schoolCode}/feedback`)">提交反馈</el-button>
    </div>
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

.feedback-strip {
  margin-top: 20px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.feedback-strip h3 {
  font-size: 16px;
  margin: 0 0 4px;
  color: #1d2129;
}

.feedback-strip p {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

@media (max-width: 768px) {
  .feedback-strip {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
