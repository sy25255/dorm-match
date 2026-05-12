<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const userStore = useUserStore()

const form = reactive({
  bio: '',
  hometown: '',
  className: '',
})

const visibilitySettings = reactive({
  hometown: true,
  className: true,
  bio: true,
  hobbies: true,
  smoking: true,
  snoring: true,
})

const saving = ref(false)
const loading = ref(true)

async function loadProfile() {
  loading.value = true
  try {
    const res = await request.get(`/student/${userStore.userId}`)
    const data = res.data.data
    if (data) {
      form.bio = data.bio || ''
      form.hometown = data.hometown || ''
      form.className = data.className || ''
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await request.put('/student/profile', {
      bio: form.bio,
      hometown: form.hometown,
      className: form.className,
      visibilitySettings,
    })
    ElMessage.success('个人信息已更新')
  } catch {} finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>个人信息</h1>
      <p>管理您的个人资料和账户设置</p>
    </div>

    <div v-loading="loading">
      <el-card class="profile-card" style="margin-bottom:16px">
        <div class="profile-avatar">
          <el-avatar :size="80">{{ userStore.username?.charAt(0) }}</el-avatar>
        </div>

        <el-form :model="form" label-position="top">
          <el-form-item label="姓名">
            <el-input :model-value="userStore.username" disabled />
          </el-form-item>
          <el-form-item label="角色">
            <el-tag>{{ userStore.role === 'STUDENT' ? '学生' : userStore.role }}</el-tag>
          </el-form-item>
          <el-form-item label="班级">
            <el-input v-model="form.className" placeholder="请输入班级" />
          </el-form-item>
          <el-form-item label="生源地">
            <el-input v-model="form.hometown" placeholder="请输入生源地" />
          </el-form-item>
          <el-form-item label="个人简介">
            <el-input v-model="form.bio" type="textarea" :rows="3" maxlength="150" show-word-limit
              placeholder="写一段话介绍自己，让未来的舍友更好地了解你..." />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="profile-card">
        <template #header><span style="font-weight:600">信息可见性设置</span></template>
        <p style="color:#86909c;font-size:13px;margin-bottom:12px">控制哪些信息对匹配推荐中的其他学生可见</p>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="生源地可见">
            <el-switch v-model="visibilitySettings.hometown" />
          </el-form-item>
          <el-form-item label="班级可见">
            <el-switch v-model="visibilitySettings.className" />
          </el-form-item>
          <el-form-item label="个人简介可见">
            <el-switch v-model="visibilitySettings.bio" />
          </el-form-item>
          <el-form-item label="兴趣爱好可见">
            <el-switch v-model="visibilitySettings.hobbies" />
          </el-form-item>
          <el-form-item label="是否抽烟可见">
            <el-switch v-model="visibilitySettings.smoking" />
          </el-form-item>
          <el-form-item label="是否打呼噜可见">
            <el-switch v-model="visibilitySettings.snoring" />
          </el-form-item>
        </el-form>
      </el-card>

      <div style="margin-top:16px">
        <el-button type="primary" :loading="saving" @click="saveProfile">保存所有更改</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-card { max-width: 600px; }
.profile-avatar { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f2f3f5; }
</style>
