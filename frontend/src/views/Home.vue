<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { surveyApi } from '@/api/survey'
import { inviteApi, allocationApi } from '@/api/invite'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const surveyProgress = ref(0)
const hasPairing = ref(false)
const hasAllocation = ref(false)
const loading = ref(true)

const schoolCode = computed(() => route.params.schoolCode as string)
const schoolName = computed(() => userStore.schoolName || localStorage.getItem('schoolName') || schoolCode.value)
const surveyCompleted = computed(() => surveyProgress.value >= 100)

const workflowSteps = computed(() => [
  {
    key: 'survey',
    label: '完成偏好问卷',
    desc: surveyCompleted.value ? '问卷已提交，可以查看推荐结果。' : '先完成问卷，系统才能计算匹配推荐。',
    done: surveyCompleted.value,
    action: surveyCompleted.value ? '查看问卷' : '继续填写',
    route: `/${schoolCode.value}/survey`,
  },
  {
    key: 'matches',
    label: '查看舍友推荐',
    desc: surveyCompleted.value ? '根据你的偏好查看候选舍友。' : '问卷完成后开放推荐列表。',
    done: hasPairing.value,
    disabled: !surveyCompleted.value,
    action: hasPairing.value ? '查看配对' : '查看推荐',
    route: hasPairing.value ? `/${schoolCode.value}/pairing` : `/${schoolCode.value}/matches`,
  },
  {
    key: 'invites',
    label: '邀请与确认',
    desc: hasPairing.value ? '你已经有配对状态，继续等待或查看分配。' : '向合适的同学发送邀请，双方确认后形成配对。',
    done: hasPairing.value,
    disabled: !surveyCompleted.value,
    action: '管理邀请',
    route: `/${schoolCode.value}/invites`,
  },
  {
    key: 'allocation',
    label: '查看宿舍分配',
    desc: hasAllocation.value ? '分配结果已发布，可以查看宿舍和床位。' : '管理员发布后会在这里显示分配结果。',
    done: hasAllocation.value,
    disabled: !hasPairing.value,
    action: '查看分配',
    route: `/${schoolCode.value}/allocation`,
  },
])

const nextStep = computed(() => workflowSteps.value.find(step => !step.done) || workflowSteps.value[workflowSteps.value.length - 1])
const completedCount = computed(() => workflowSteps.value.filter(step => step.done).length)

async function loadHomeState() {
  loading.value = true
  try {
    const progress = await surveyApi.getProgress()
    surveyProgress.value = progress.data.data?.percentage || 0
  } catch {
    surveyProgress.value = 0
  }

  try {
    const pairing = await inviteApi.getPairing()
    hasPairing.value = !!pairing.data.data
  } catch {
    hasPairing.value = false
  }

  try {
    const res = await allocationApi.getMyAllocation()
    hasAllocation.value = !!res.data.data
  } catch {
    hasAllocation.value = false
  } finally {
    loading.value = false
  }
}

function go(path: string, disabled?: boolean) {
  if (!disabled) router.push(path)
}

onMounted(loadHomeState)
</script>

<template>
  <div class="home-page" v-loading="loading">
    <section class="home-hero">
      <div>
        <p class="eyebrow">{{ schoolName }} · {{ schoolCode }}</p>
        <h2>欢迎回来，{{ userStore.username || '同学' }}</h2>
        <p>这里会告诉你当前最该做什么，以及宿舍匹配流程推进到了哪一步。</p>
      </div>
      <div class="hero-progress">
        <el-progress type="circle" :percentage="Math.round(completedCount / workflowSteps.length * 100)" :width="92" />
        <span>{{ completedCount }}/{{ workflowSteps.length }} 步已完成</span>
      </div>
    </section>

    <section class="next-action">
      <div>
        <span class="next-label">当前建议</span>
        <h3>{{ nextStep.label }}</h3>
        <p>{{ nextStep.desc }}</p>
      </div>
      <el-button type="primary" size="large" :disabled="nextStep.disabled" @click="go(nextStep.route, nextStep.disabled)">
        {{ nextStep.action }}
      </el-button>
    </section>

    <section class="flow-grid">
      <div
        v-for="(step, index) in workflowSteps"
        :key="step.key"
        class="flow-card"
        :class="{ done: step.done, disabled: step.disabled }"
        @click="go(step.route, step.disabled)"
      >
        <div class="step-index">{{ String(index + 1).padStart(2, '0') }}</div>
        <div class="step-main">
          <div class="step-head">
            <h3>{{ step.label }}</h3>
            <el-tag :type="step.done ? 'success' : step.disabled ? 'info' : 'warning'" size="small">
              {{ step.done ? '已完成' : step.disabled ? '未开放' : '待处理' }}
            </el-tag>
          </div>
          <p>{{ step.desc }}</p>
          <el-button link type="primary" :disabled="step.disabled">{{ step.action }}</el-button>
        </div>
      </div>
    </section>

    <section class="support-strip">
      <div>
        <h3>测试过程中发现问题或有建议？</h3>
        <p>直接提交反馈，管理员和开发者会根据你的使用情况继续改进。</p>
      </div>
      <el-button type="primary" plain @click="router.push(`/${schoolCode}/feedback`)">提交反馈</el-button>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 18px;
}
.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
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
.home-hero h2 {
  margin: 0;
  font-size: 24px;
  color: #172033;
}
.home-hero p,
.next-action p,
.flow-card p,
.support-strip p {
  color: #667085;
  line-height: 1.6;
}
.hero-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  color: #667085;
  font-size: 13px;
}
.next-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  background: #e8f2ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}
.next-label {
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}
.next-action h3 {
  margin: 6px 0;
  color: #172033;
}
.flow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.flow-card {
  min-height: 156px;
  display: flex;
  gap: 16px;
  padding: 18px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s;
}
.flow-card:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
}
.flow-card.disabled {
  cursor: not-allowed;
  opacity: 0.68;
}
.flow-card.done {
  border-color: #bbf7d0;
  background: #f0fdf4;
}
.step-index {
  font-size: 28px;
  font-weight: 800;
  color: #cbd5e1;
  min-width: 48px;
}
.step-main {
  flex: 1;
  min-width: 0;
}
.step-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.step-head h3 {
  margin: 0;
  font-size: 17px;
  color: #172033;
}
.support-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}
.support-strip h3 {
  margin: 0 0 4px;
}
@media (max-width: 820px) {
  .home-hero,
  .next-action,
  .support-strip {
    align-items: flex-start;
    flex-direction: column;
  }
  .flow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
