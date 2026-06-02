<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const schoolCode = computed(() => route.params.schoolCode as string || userStore.schoolCode)
const form = reactive({ token: '' })

onMounted(async () => {
  if (!userStore.token) {
    await userStore.restoreSession().catch(() => false)
  }
})

async function activateAdmin() {
  if (!form.token.trim()) {
    ElMessage.warning('请输入管理员激活码')
    return
  }
  loading.value = true
  try {
    const result = await authApi.claimAdminInvite(schoolCode.value, form.token.trim())
    await userStore.restoreSession()
    const targetSchool = result?.schoolCode || userStore.schoolCode || schoolCode.value
    ElMessage.success('管理员账号已激活')
    router.push(`/${targetSchool}/admin`)
  } catch (error: any) {
    ElMessage.error(error?.message || '管理员激活失败')
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push(`/${schoolCode.value}/login?activate=admin`)
}
</script>

<template>
  <div class="activate-page">
    <section class="activate-panel">
      <h1>老师/管理员激活</h1>
      <p>使用平台方发放的激活码，将当前登录账号绑定为 {{ schoolCode }} 的学校管理员。</p>

      <el-alert
        v-if="!userStore.token"
        type="warning"
        :closable="false"
        show-icon
        title="请先用受邀邮箱登录或注册"
      />

      <el-form label-position="top" @submit.prevent="activateAdmin">
        <el-form-item label="学校代码">
          <el-input :model-value="schoolCode" disabled size="large" />
        </el-form-item>
        <el-form-item label="管理员激活码">
          <el-input v-model="form.token" size="large" placeholder="输入平台方发放的激活码" show-password />
        </el-form-item>
        <div class="actions">
          <el-button v-if="!userStore.token" @click="goLogin">去登录/注册</el-button>
          <el-button type="primary" :loading="loading" :disabled="!userStore.token" native-type="submit">
            激活管理员账号
          </el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.activate-page {
  min-height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  background: #f4f7fb;
}
.activate-panel {
  width: min(520px, 100%);
  background: #fff;
  border: 1px solid #e5eaf3;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}
.activate-panel h1 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #172033;
}
.activate-panel p {
  margin: 0 0 20px;
  color: #607089;
  line-height: 1.6;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
