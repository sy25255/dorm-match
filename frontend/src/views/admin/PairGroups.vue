<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/admin'

const loading = ref(false)
const groups = ref<any[]>([])
const brokenInvites = ref<any[]>([])
const unpairedStudents = ref<any[]>([])

const stats = computed(() => {
  const members = groups.value.reduce((sum, group) => sum + Number(group.groupSize || 0), 0)
  const incomplete = groups.value.filter(group => Number(group.capacity || 0) > Number(group.groupSize || 0)).length
  return [
    { label: '配对组', value: groups.value.length },
    { label: '已入组学生', value: members },
    { label: '未满队伍', value: incomplete },
    { label: '异常邀请', value: brokenInvites.value.length },
    { label: '待补全学生', value: unpairedStudents.value.length },
  ]
})

function statusText(status: number | string) {
  const value = Number(status)
  if (value === 2) return '已锁定'
  if (value === 0) return '已解散'
  return '组队中'
}

function statusType(status: number | string) {
  const value = Number(status)
  if (value === 2) return 'success'
  if (value === 0) return 'info'
  return 'warning'
}

async function loadData() {
  loading.value = true
  try {
    const [groupRes, brokenRes, unpairedRes] = await Promise.all([
      adminApi.getPairGroups(),
      adminApi.getAcceptedInvitesWithoutGroups(),
      adminApi.getUnpairedCompletedStudents(),
    ])
    groups.value = groupRes.data.data || []
    brokenInvites.value = brokenRes.data.data || []
    unpairedStudents.value = unpairedRes.data.data || []
  } catch (err: any) {
    ElMessage.error(err?.message || '加载队伍数据失败')
  } finally {
    loading.value = false
  }
}

async function autoCompleteGroups() {
  loading.value = true
  try {
    const res = await adminApi.autoCompletePairGroups()
    ElMessage.success(`已补全 ${res.data.data.assignedStudents} 名学生`)
    await loadData()
  } catch (err: any) {
    ElMessage.error(err?.message || '补全未组队学生失败')
  } finally {
    loading.value = false
  }
}

async function confirmGroups() {
  loading.value = true
  try {
    await adminApi.confirmPairGroups()
    ElMessage.success('现有队伍已确认')
    await loadData()
  } catch (err: any) {
    ElMessage.error(err?.message || '确认队伍失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="pair-groups-page" v-loading="loading">
    <section class="page-head">
      <div>
        <h2>队伍管理</h2>
        <p>核查当前学校的配对组、成员名单，以及已接受邀请但没有生成队伍的异常数据。</p>
      </div>
      <div class="head-actions">
        <el-button @click="loadData">刷新</el-button>
        <el-button type="primary" :disabled="!unpairedStudents.length" @click="autoCompleteGroups">
          补全未组队学生
        </el-button>
        <el-button type="success" :disabled="!groups.length" @click="confirmGroups">
          确认现有队伍
        </el-button>
      </div>
    </section>

    <section class="metric-grid">
      <div v-for="item in stats" :key="item.label" class="metric-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <el-alert
      v-if="brokenInvites.length"
      class="section-alert"
      type="warning"
      show-icon
      :closable="false"
      title="存在已接受邀请但未形成队伍的记录"
      description="这些记录通常来自旧版本接受邀请失败或数据库写入中断。学生端已提供自助修复入口；管理员可根据下表核查涉及学生。"
    />

    <section v-if="unpairedStudents.length" class="section-panel">
      <div class="section-title">
        <h3>待补全学生</h3>
        <span>{{ unpairedStudents.length }} 名已完成问卷但未组队</span>
      </div>
      <el-table :data="unpairedStudents" border>
        <el-table-column prop="name" label="学生" min-width="130" />
        <el-table-column prop="studentNo" label="学号" min-width="130" />
        <el-table-column prop="collegeName" label="学院" min-width="140" />
        <el-table-column prop="majorName" label="专业" min-width="140" />
      </el-table>
    </section>

    <section v-if="brokenInvites.length" class="section-panel">
      <div class="section-title">
        <h3>异常邀请</h3>
        <span>{{ brokenInvites.length }} 条</span>
      </div>
      <el-table :data="brokenInvites" border>
        <el-table-column label="邀请人" min-width="170">
          <template #default="{ row }">
            <strong>{{ row.fromName || '未命名学生' }}</strong>
            <small>{{ row.fromStudentNo || row.from_user_id }}</small>
          </template>
        </el-table-column>
        <el-table-column label="被邀请人" min-width="170">
          <template #default="{ row }">
            <strong>{{ row.toName || '未命名学生' }}</strong>
            <small>{{ row.toStudentNo || row.to_user_id }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发起时间" min-width="170" />
      </el-table>
    </section>

    <section class="section-panel">
      <div class="section-title">
        <h3>配对组列表</h3>
        <span>{{ groups.length }} 组</span>
      </div>

      <el-empty v-if="!groups.length" description="当前还没有配对组" />
      <el-table v-else :data="groups" border>
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-table :data="row.members || []" border>
              <el-table-column label="学生" min-width="160">
                <template #default="{ row: member }">
                  <strong>{{ member.name || '未命名学生' }}</strong>
                  <small>{{ member.studentNo || member.studentId }}</small>
                </template>
              </el-table-column>
              <el-table-column prop="collegeName" label="学院" min-width="140" />
              <el-table-column prop="majorName" label="专业" min-width="140" />
              <el-table-column prop="className" label="班级" min-width="120" />
              <el-table-column label="角色" width="100">
                <template #default="{ row: member }">
                  <el-tag :type="member.isInitiator ? 'success' : 'info'" effect="plain">
                    {{ member.isInitiator ? '发起人' : '成员' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="pairingCode" label="队伍编号" min-width="130" />
        <el-table-column label="人数" width="110">
          <template #default="{ row }">{{ row.groupSize }} / {{ row.capacity || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.pair-groups-page {
  display: grid;
  gap: 16px;
}

.page-head,
.section-panel {
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
}

.page-head {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.page-head h2,
.section-title h3 {
  margin: 0;
  color: #111827;
}

.page-head p {
  margin: 6px 0 0;
  color: #667085;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  background: #fff;
  border: 1px solid #dfe5ef;
  border-radius: 8px;
  padding: 16px;
  display: grid;
  gap: 8px;
}

.metric-item span {
  color: #667085;
  font-size: 13px;
}

.metric-item strong {
  color: #111827;
  font-size: 28px;
  line-height: 1;
}

.section-alert {
  border-radius: 8px;
}

.section-panel {
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title span,
small {
  display: block;
  color: #667085;
  font-size: 12px;
  margin-top: 3px;
}

@media (max-width: 900px) {
  .page-head {
    align-items: stretch;
    flex-direction: column;
  }

  .head-actions {
    justify-content: stretch;
  }

  .head-actions :deep(.el-button) {
    flex: 1;
    margin-left: 0;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
