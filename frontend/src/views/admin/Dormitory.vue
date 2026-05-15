<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessageBox } from 'element-plus'

const buildings = ref<any[]>([])
const rooms = ref<any[]>([])
const loading = ref(false)
const activeBuilding = ref<number | null>(null)
const buildingDialog = ref(false)
const roomDialog = ref(false)
const isEditBuilding = ref(false)
const isEditRoom = ref(false)

const buildingForm = ref({ id: null as number | null, buildingName: '', buildingCode: '', gender: 1, floors: 6, status: 1 })
const roomForm = ref({ id: null as number | null, buildingId: null as number | null, roomNumber: '', floor: 1, capacity: 4, roomType: 'NORMAL' })

async function loadBuildings() {
  loading.value = true
  try {
    const res = await adminApi.getBuildings()
    buildings.value = res.data.data || []
  } finally { loading.value = false }
}

async function loadRooms(buildingId: number) {
  activeBuilding.value = buildingId
  try {
    const res = await adminApi.getRooms(buildingId)
    rooms.value = res.data.data || []
  } catch {
    ElMessageBox.alert('加载房间列表失败', '错误')
  }
}

function openBuildingEdit(row?: any) {
  if (row) { isEditBuilding.value = true; buildingForm.value = { ...row } }
  else { isEditBuilding.value = false; buildingForm.value = { id: null, buildingName: '', buildingCode: '', gender: 1, floors: 6, status: 1 } }
  buildingDialog.value = true
}

async function saveBuilding() {
  try {
    if (isEditBuilding.value && buildingForm.value.id) {
      await adminApi.updateBuilding(buildingForm.value.id, buildingForm.value)
    } else {
      await adminApi.createBuilding(buildingForm.value)
    }
    buildingDialog.value = false
    loadBuildings()
  } catch {
    ElMessageBox.alert('保存宿舍楼失败', '错误')
  }
}

function openRoomEdit(row?: any) {
  if (row) { isEditRoom.value = true; roomForm.value = { ...row } }
  else { isEditRoom.value = false; roomForm.value = { id: null, buildingId: activeBuilding.value, roomNumber: '', floor: 1, capacity: 4, roomType: 'NORMAL' } }
  roomDialog.value = true
}

async function saveRoom() {
  try {
    if (isEditRoom.value && roomForm.value.id) {
      await adminApi.updateRoom(roomForm.value.id, roomForm.value)
    } else {
      await adminApi.createRoom(roomForm.value)
    }
    roomDialog.value = false
    if (activeBuilding.value) loadRooms(activeBuilding.value)
  } catch {
    ElMessageBox.alert('保存房间失败', '错误')
  }
}

const statusMap: Record<number, string> = { 0: '空闲', 1: '部分占用', 2: '已满', 3: '维修中' }

onMounted(loadBuildings)
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>宿舍管理</h2></div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">宿舍楼</h3>
          <el-button type="primary" size="small" @click="openBuildingEdit()">添加楼栋</el-button>
        </div>
        <el-table :data="buildings" size="small" highlight-current-row @row-click="(row: any) => loadRooms(row.id)">
          <el-table-column prop="buildingName" label="名称" />
          <el-table-column prop="buildingCode" label="编码" width="70" />
          <el-table-column label="性别" width="60">
            <template #default="{ row }">{{ row.gender === 1 ? '男' : '女' }}</template>
          </el-table-column>
          <el-table-column prop="floors" label="楼层" width="60" />
          <el-table-column label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click.stop="openBuildingEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-col :span="16">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">{{ activeBuilding ? buildings.find(b => b.id === activeBuilding)?.buildingName + ' - 房间列表' : '请选择楼栋' }}</h3>
          <el-button v-if="activeBuilding" type="primary" size="small" @click="openRoomEdit()">添加房间</el-button>
        </div>
        <el-table :data="rooms" size="small" v-if="activeBuilding">
          <el-table-column prop="roomNumber" label="房间号" width="120" />
          <el-table-column prop="floor" label="楼层" width="60" />
          <el-table-column label="容量/已占" width="100">
            <template #default="{ row }">{{ row.occupied }} / {{ row.capacity }}</template>
          </el-table-column>
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.roomType === 'ACCESSIBLE' ? 'warning' : 'info'">{{ row.roomType === 'ACCESSIBLE' ? '无障碍' : '普通' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">{{ statusMap[row.status] }}</template>
          </el-table-column>
          <el-table-column label="操作" width="60">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRoomEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>

    <el-dialog v-model="buildingDialog" :title="isEditBuilding ? '编辑楼栋' : '添加楼栋'" width="400px">
      <el-form :model="buildingForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="buildingForm.buildingName" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="buildingForm.buildingCode" /></el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="buildingForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="楼层数"><el-input-number v-model="buildingForm.floors" :min="1" :max="20" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="buildingDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBuilding">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roomDialog" :title="isEditRoom ? '编辑房间' : '添加房间'" width="400px">
      <el-form :model="roomForm" label-width="80px">
        <el-form-item label="房间号"><el-input v-model="roomForm.roomNumber" /></el-form-item>
        <el-form-item label="楼层"><el-input-number v-model="roomForm.floor" :min="1" :max="20" /></el-form-item>
        <el-form-item label="容量"><el-input-number v-model="roomForm.capacity" :min="1" :max="8" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="roomForm.roomType" style="width:100%">
            <el-option label="普通房间" value="NORMAL" />
            <el-option label="无障碍房间" value="ACCESSIBLE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roomDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRoom">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
</style>
