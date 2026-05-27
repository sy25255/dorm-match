<template>
  <div class="dormitory-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>宿舍楼</span>
              <el-button type="primary" size="small" @click="openBuildingEdit()">添加楼栋</el-button>
            </div>
          </template>
          <el-table :data="buildings" highlight-current-row @row-click="loadRooms" size="small" max-height="400">
            <el-table-column prop="name" label="名称" min-width="80" />
            <el-table-column prop="code" label="编码" width="80" />
            <el-table-column label="性别" width="60">
              <template #default="{ row }">
                <el-tag :type="row.gender === 1 ? 'primary' : 'danger'" size="small">{{ row.gender === 1 ? '男' : '女' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="floors" label="楼层" width="50" />
            <el-table-column label="操作" width="60">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="openBuildingEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header" v-if="activeBuilding">
              <span>{{ activeBuilding.name }} - 房间列表</span>
              <el-button type="primary" size="small" @click="openRoomEdit()">添加房间</el-button>
            </div>
            <div class="card-header" v-else>
              <span>请选择宿舍楼</span>
            </div>
          </template>
          <el-table :data="rooms" size="small" max-height="400" v-if="activeBuilding">
            <el-table-column prop="roomNumber" label="房间号" width="100" />
            <el-table-column prop="floor" label="楼层" width="60" />
            <el-table-column label="容量/已占" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.capacity > 0 ? Math.round((row.occupied || 0) / row.capacity * 100) : 0" :format="() => `${row.occupied || 0}/${row.capacity}`" :status="(row.occupied >= row.capacity) ? 'success' : undefined" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="row.roomType === 'ACCESSIBLE' ? 'warning' : 'info'" size="small">{{ row.roomType === 'ACCESSIBLE' ? '无障碍' : '标准' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'AVAILABLE' ? 'success' : row.status === 'PARTIAL' ? 'warning' : row.status === 'FULL' ? 'danger' : 'info'" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openRoomEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 宿舍容量设置 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>默认房间容量</span>
          <span style="font-size: 12px; color: #909399;">当前默认：{{ roomCapacity }} 人/间 | 新增房间时自动带入，实际分配以每个房间容量为准</span>
        </div>
      </template>
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input-number v-model="roomCapacityInput" :min="2" :max="12" :step="1" size="small" style="width: 100%" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" size="small" @click="saveRoomCapacity">保存配置</el-button>
        </el-col>
        <el-col :span="14">
          <span style="font-size: 12px; color: #909399;">修改历史：最后一次修改 {{ capacityHistory.length > 0 ? capacityHistory[capacityHistory.length - 1] : '未修改' }}</span>
        </el-col>
      </el-row>
    </el-card>

    <!-- 宿舍分配流程（原 AllocationManage） -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>宿舍分配流程</span>
        </div>
      </template>

      <el-steps :active="currentStep" finish-status="success" simple style="margin-bottom: 24px">
        <el-step title="执行分配" />
        <el-step title="查看结果" />
        <el-step title="发布公示" />
        <el-step title="正式确认" />
      </el-steps>

      <div class="alloc-actions">
        <el-input v-model="batchCode" placeholder="批次编号" style="width: 200px; margin-right: 10px" size="small" />
        <el-button type="primary" size="small" @click="executeAlloc" :disabled="currentStep >= 1">
          <el-icon style="margin-right: 4px"><Cpu /></el-icon>执行分配
        </el-button>
        <el-button type="primary" size="small" @click="openManualAlloc" v-if="currentStep >= 1">
          <el-icon style="margin-right: 4px"><Edit /></el-icon>手动分配
        </el-button>
        <el-button type="success" size="small" @click="publishResults" :disabled="currentStep < 1 || currentStep >= 2">
          <el-icon style="margin-right: 4px"><Present /></el-icon>发布公示
        </el-button>
        <el-button type="warning" size="small" @click="finalizeResults" :disabled="currentStep < 2 || currentStep >= 3">
          <el-icon style="margin-right: 4px"><Lock /></el-icon>正式确认
        </el-button>
        <el-button size="small" @click="resetAlloc" :disabled="currentStep === 0">重置流程</el-button>
      </div>

      <!-- 分配结果表格 -->
      <div v-if="allocations.length > 0" style="margin-top: 16px">
        <el-table :data="allocations" size="small" border max-height="400">
          <el-table-column prop="roomNumber" label="房间号" width="100" />
          <el-table-column prop="buildingName" label="宿舍楼" width="100" />
          <el-table-column prop="studentName" label="学生" width="80" />
          <el-table-column prop="studentId" label="学号" width="100" />
          <el-table-column label="分配方式" width="100">
            <template #default="{ row }">
              <el-tag :type="allocTypeTag(row.allocationType) as any" size="small">{{ allocTypeMap[row.allocationType] || row.allocationType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="allocStatusTag(row.status) as any" size="small">{{ allocStatusMap[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 剩余学生处理 -->
    <el-card shadow="hover" style="margin-top: 20px" v-if="remainingStudents.length > 0">
      <template #header>
        <div class="card-header">
          <span>剩余学生处理</span>
          <el-tag type="danger" size="small">{{ remainingStudents.length }} 名学生尚未达到 {{ roomCapacity }} 人标准</el-tag>
        </div>
      </template>
      <el-table :data="remainingStudents" size="small" border max-height="300">
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column prop="collegeName" label="学院" min-width="120" />
        <el-table-column prop="currentGroupSize" label="当前组人数" width="100" />
        <el-table-column prop="neededMore" label="还需人数" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.neededMore }} 人</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 12px">
        <el-alert type="info" show-icon :closable="false" title="剩余床位请通过上方“手动分配”进行人工调整，避免系统自动移动已确认学生。" />
      </div>
    </el-card>

    <el-empty v-else-if="currentStep >= 1" description="所有学生均已分配完毕" />

    <!-- 楼栋对话框 -->
    <el-dialog v-model="buildingDialogVisible" :title="editingBuilding ? '编辑楼栋' : '添加楼栋'" width="450px">
      <el-form :model="buildingForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="buildingForm.name" placeholder="如：梅园1号" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="buildingForm.code" placeholder="如：M1" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="buildingForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="楼层数">
          <el-input-number v-model="buildingForm.floors" :min="1" :max="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="buildingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBuilding">保存</el-button>
      </template>
    </el-dialog>

    <!-- 房间对话框 -->
    <el-dialog v-model="roomDialogVisible" :title="editingRoom ? '编辑房间' : '添加房间'" width="400px">
      <el-form :model="roomForm" label-width="80px">
        <el-form-item label="房间号">
          <el-input v-model="roomForm.roomNumber" placeholder="如：101" />
        </el-form-item>
        <el-form-item label="楼层">
          <el-input-number v-model="roomForm.floor" :min="1" :max="activeBuilding?.floors || 20" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="roomForm.capacity" :min="1" :max="12" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="roomForm.roomType" style="width: 100%">
            <el-option label="标准间" value="NORMAL" />
            <el-option label="无障碍" value="ACCESSIBLE" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="roomForm.status" style="width: 100%">
            <el-option label="空闲" value="AVAILABLE" />
            <el-option label="部分占用" value="PARTIAL" />
            <el-option label="已满" value="FULL" />
            <el-option label="维修中" value="MAINTENANCE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roomDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoom">保存</el-button>
      </template>
    </el-dialog>

    <!-- 手动分配对话框 -->
    <el-dialog v-model="manualAllocVisible" title="手动分配宿舍" width="550px">
      <el-form :model="manualAllocForm" label-width="80px">
        <el-form-item label="选择学生">
          <el-select v-model="manualAllocForm.studentId" placeholder="搜索并选择学生" filterable style="width: 100%">
            <el-option v-for="s in unallocatedStudents" :key="s.id" :label="`${s.name} (${s.studentNo}) - ${s.collegeName || ''}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择楼栋">
          <el-select v-model="manualAllocForm.buildingId" placeholder="选择宿舍楼" @change="onManualBuildingChange" style="width: 100%">
            <el-option v-for="b in buildings" :key="b.id" :label="`${b.name} (${b.code})`" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择房间">
          <el-select v-model="manualAllocForm.roomId" placeholder="选择房间" @change="onManualRoomChange" style="width: 100%">
            <el-option v-for="r in manualAllocRooms" :key="r.id" :label="`${r.roomNumber} (${r.occupied}/${r.capacity}人)`" :value="r.id">
              <span>{{ r.roomNumber }}</span>
              <span style="float:right; color:#909399; font-size:12px">{{ r.occupied }}/{{ r.capacity }}人</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="床位号">
          <el-input-number v-model="manualAllocForm.bedNo" :min="1" :max="12" size="small" />
          <span style="margin-left: 8px; font-size: 12px; color: #909399;">（当前房间已占 {{ manualRoomOccupied }} 人）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAllocVisible = false">取消</el-button>
        <el-button type="primary" @click="saveManualAlloc">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Cpu, Present, Lock, Edit } from '@element-plus/icons-vue'
import { adminApi } from '@/api/admin'

interface Building {
  id: number
  name: string
  code: string
  gender: number
  floors: number
}

interface Room {
  id: number
  buildingId: number
  roomNumber: string
  floor: number
  capacity: number
  occupied: number
  roomType: string
  status: string
}

interface Allocation {
  id: number
  studentId: string
  studentName: string
  studentNo?: string
  roomId: number
  roomNumber: string
  buildingName?: string
  bedNo: number
  allocationType: string
  status: string
  batchCode: string
}

interface RemainingStudent {
  name: string
  studentNo: string
  collegeName: string
  studentId: string
  currentGroupSize: number
  neededMore: number
}

const buildings = ref<Building[]>([])
const rooms = ref<Room[]>([])
const activeBuilding = ref<Building | null>(null)
const buildingDialogVisible = ref(false)
const roomDialogVisible = ref(false)
const editingBuilding = ref<Building | null>(null)
const editingRoom = ref<Room | null>(null)

const buildingForm = reactive<Partial<Building>>({ name: '', code: '', gender: 1, floors: 6 })
const roomForm = reactive<Partial<Room>>({ roomNumber: '', floor: 1, capacity: 8, roomType: 'NORMAL', status: 'AVAILABLE' })

const statusMap: Record<string, string> = { AVAILABLE: '空闲', PARTIAL: '部分占用', FULL: '已满', MAINTENANCE: '维修中' }
const allocTypeMap: Record<string, string> = { SELF_SELECT: '自选配对', ALGORITHM: '算法匹配', RANDOM: '随机分配', MANUAL: '手动调整' }
const allocStatusMap: Record<string, string> = { PENDING: '待确认', PUBLISHED: '已公示', FINALIZED: '已确认', CONFIRMED: '已确认', OBJECTION: '异议中', RESOLVED: '已处理' }

// ========== 容量配置 ==========
const roomCapacity = ref(8)
const roomCapacityInput = ref(8)
const capacityHistory = ref<string[]>([])

function loadCapacityConfig() {
  try {
    const stored = localStorage.getItem('demo_room_capacity')
    if (stored) {
      roomCapacity.value = Number(stored)
      roomCapacityInput.value = Number(stored)
    }
    const history = localStorage.getItem('demo_capacity_history')
    if (history) capacityHistory.value = JSON.parse(history)
  } catch {}
}

function saveRoomCapacity() {
  const val = roomCapacityInput.value
  localStorage.setItem('demo_room_capacity', String(val))
  roomCapacity.value = val
  const now = new Date().toLocaleString('zh-CN')
  capacityHistory.value.push(`${now}: 设为 ${val} 人/间`)
  localStorage.setItem('demo_capacity_history', JSON.stringify(capacityHistory.value.slice(-10)))
  ElMessage.success(`新增房间默认容量已设为 ${val} 人/间`)
  console.log('[Admin] Room capacity updated:', val)
}

// ========== 楼栋管理 ==========
async function loadBuildings() {
  const res = await adminApi.getBuildings()
  buildings.value = (res.data?.data ?? res.data ?? []) as Building[]
  console.log('[Admin] Buildings loaded:', buildings.value.length)
}

async function loadRooms(row: Building) {
  activeBuilding.value = row
  const res = await adminApi.getRooms(row.id)
  const all = (res.data?.data ?? res.data ?? []) as Room[]
  rooms.value = all.filter((r: Room) => r.buildingId === row.id)
  console.log('[Admin] Rooms loaded for building', row.id, ':', rooms.value.length)
}

function openBuildingEdit(row?: Building) {
  editingBuilding.value = row || null
  if (row) {
    buildingForm.name = row.name
    buildingForm.code = row.code
    buildingForm.gender = row.gender
    buildingForm.floors = row.floors
  } else {
    buildingForm.name = ''
    buildingForm.code = ''
    buildingForm.gender = 1
    buildingForm.floors = 6
  }
  buildingDialogVisible.value = true
}

async function saveBuilding() {
  if (!buildingForm.name || !buildingForm.code) { ElMessage.warning('请填写名称和编码'); return }
  if (editingBuilding.value) await adminApi.updateBuilding(editingBuilding.value.id, buildingForm)
  else await adminApi.createBuilding(buildingForm)
  buildingDialogVisible.value = false
  await loadBuildings()
  ElMessage.success(editingBuilding.value ? '楼栋已更新' : '楼栋已添加')
}

// ========== 房间管理 ==========
function openRoomEdit(row?: Room) {
  editingRoom.value = row || null
  if (row) {
    roomForm.roomNumber = row.roomNumber
    roomForm.floor = row.floor
    roomForm.capacity = row.capacity
    roomForm.roomType = row.roomType as 'NORMAL' | 'ACCESSIBLE'
    roomForm.status = row.status as string
  } else {
    roomForm.roomNumber = ''
    roomForm.floor = 1
    roomForm.capacity = roomCapacity.value
    roomForm.roomType = 'NORMAL'
    roomForm.status = 'AVAILABLE'
  }
  roomDialogVisible.value = true
}

async function saveRoom() {
  if (!roomForm.roomNumber) { ElMessage.warning('请填写房间号'); return }
  const payload = { ...roomForm, buildingId: activeBuilding.value?.id }
  if (editingRoom.value) await adminApi.updateRoom(editingRoom.value.id, payload)
  else await adminApi.createRoom(payload)
  roomDialogVisible.value = false
  if (activeBuilding.value) await loadRooms(activeBuilding.value)
  ElMessage.success(editingRoom.value ? '房间已更新' : '房间已添加')
}

// ========== 分配流程 ==========
const currentStep = ref(0)
const batchCode = ref('BATCH-001')
const allocations = ref<Allocation[]>([])

async function loadAllocState() {
  const res = await adminApi.getAllocationResults(batchCode.value)
  allocations.value = res.data.data || []
  const statuses = new Set(allocations.value.map(a => a.status))
  if (statuses.has('FINALIZED')) currentStep.value = 3
  else if (statuses.has('PUBLISHED')) currentStep.value = 2
  else if (allocations.value.length > 0) currentStep.value = 1
  else currentStep.value = 0
}

async function executeAlloc() {
  await ElMessageBox.confirm(`确认执行宿舍分配？系统将根据配对组和 ${roomCapacity.value} 人标准进行智能分配。`, '确认', { type: 'warning' })
  const res = await adminApi.executeAllocation({ type: 'ALGORITHM' })
  const result = res.data.data || {}
  if (result.batchCode) batchCode.value = result.batchCode
  await loadAllocState()
  if (activeBuilding.value) await loadRooms(activeBuilding.value)
  ElMessage.success(`分配完成，共分配 ${result.allocated || allocations.value.length} 名学生`)
}

async function publishResults() {
  await ElMessageBox.confirm('确认发布分配结果？学生将看到自己的宿舍分配信息。', '确认发布', { type: 'warning' })
  await adminApi.publishResults(batchCode.value)
  await loadAllocState()
  ElMessage.success('分配结果已发布')
}

async function finalizeResults() {
  await ElMessageBox.confirm('确认最终确定？确定后不可修改。', '确认', { type: 'warning' })
  await adminApi.finalizeResults(batchCode.value)
  await loadAllocState()
  ElMessage.success('分配结果已确认')
}

async function resetAlloc() {
  await ElMessageBox.confirm('确认清空当前批次分配结果？此操作会释放相关宿舍床位。', '确认重置', { type: 'warning' })
  await adminApi.clearAllocations(batchCode.value)
  currentStep.value = 0
  allocations.value = []
  remainingStudents.value = []
  if (activeBuilding.value) await loadRooms(activeBuilding.value)
  ElMessage.success('分配流程已重置')
}

// ========== 剩余学生 ==========
const remainingStudents = ref<RemainingStudent[]>([])

async function computeRemaining() {
  const roomRes = await adminApi.getRooms()
  const allRooms = (roomRes.data.data || []) as Room[]
  const capacityByRoom = new Map(allRooms.map(r => [r.id, r.capacity || roomCapacity.value]))
  const result: RemainingStudent[] = []

  // Group allocations by room
  const roomMap = new Map<number, Allocation[]>()
  for (const a of allocations.value) {
    if (!roomMap.has(a.roomId)) roomMap.set(a.roomId, [])
    roomMap.get(a.roomId)!.push(a)
  }

  // Find under-filled rooms
  for (const [roomId, students] of roomMap) {
    const cap = capacityByRoom.get(roomId) || roomCapacity.value
    const occupancy = students.length
    if (occupancy < cap) {
      const needed = cap - occupancy
      for (const s of students) {
        result.push({
          name: s.studentName,
          studentNo: s.studentNo || '',
          collegeName: '',
          studentId: s.studentId,
          currentGroupSize: occupancy,
          neededMore: needed,
        })
      }
    }
  }
  remainingStudents.value = result
  console.log('[Admin] Under-filled rooms:', roomMap.size, 'rooms,', result.length, 'students in under-filled rooms')
}

// ========== 手动分配 ==========
const manualAllocVisible = ref(false)
const manualAllocRooms = ref<Room[]>([])
const manualRoomOccupied = ref(0)
const manualAllocForm = reactive({
  studentId: null as string | null,
  buildingId: null as number | null,
  roomId: null as number | null,
  bedNo: 1,
})

interface UnallocStudent {
  id: string
  name: string
  studentNo: string
  collegeName?: string
}

const unallocatedStudents = ref<UnallocStudent[]>([])

async function loadUnallocatedStudents() {
  const allocatedIds = new Set(allocations.value.map(a => a.studentId))
  const res = await adminApi.getStudents({ size: 1000 })
  const payload = res.data.data || {}
  const allStudents = Array.isArray(payload) ? payload : payload.items || []
  unallocatedStudents.value = allStudents
    .filter((s: any) => !allocatedIds.has(String(s.id)))
    .map((s: any) => ({ id: String(s.id), name: s.name, studentNo: s.studentNo, collegeName: s.collegeName }))
}

async function openManualAlloc() {
  await loadUnallocatedStudents()
  manualAllocForm.studentId = null
  manualAllocForm.buildingId = null
  manualAllocForm.roomId = null
  manualAllocForm.bedNo = 1
  manualAllocRooms.value = []
  manualRoomOccupied.value = 0
  manualAllocVisible.value = true
}

async function onManualBuildingChange() {
  manualAllocForm.roomId = null
  manualRoomOccupied.value = 0
  if (!manualAllocForm.buildingId) {
    manualAllocRooms.value = []
    return
  }
  const res = await adminApi.getRooms(manualAllocForm.buildingId)
  manualAllocRooms.value = ((res.data.data || []) as Room[]).filter(r => r.status !== 'FULL' && r.status !== 'MAINTENANCE')
}

function onManualRoomChange() {
  const room = manualAllocRooms.value.find(r => r.id === manualAllocForm.roomId)
  if (room) {
    manualRoomOccupied.value = room.occupied || 0
    manualAllocForm.bedNo = (room.occupied || 0) + 1
  }
}

async function saveManualAlloc() {
  if (!manualAllocForm.studentId) { ElMessage.warning('请选择学生'); return }
  if (!manualAllocForm.roomId) { ElMessage.warning('请选择房间'); return }

  const student = unallocatedStudents.value.find(s => s.id === manualAllocForm.studentId)
  const room = manualAllocRooms.value.find(r => r.id === manualAllocForm.roomId)
  if (!student || !room) return

  await adminApi.manualAllocate(student.id, room.id, manualAllocForm.bedNo)
  await loadAllocState()
  await computeRemaining()
  if (activeBuilding.value) await loadRooms(activeBuilding.value)
  ElMessage.success(`${student.name} 已手动分配到 ${room.roomNumber} ${manualAllocForm.bedNo}号床`)
  manualAllocVisible.value = false
}

// ========== 辅助 ==========
function allocTypeTag(type: string) {
  const map: Record<string, string> = { SELF_SELECT: 'success', ALGORITHM: 'primary', RANDOM: 'warning', MANUAL: 'info' }
  return map[type] || 'info'
}

function allocStatusTag(status: string) {
  const map: Record<string, string> = { PENDING: 'warning', PUBLISHED: 'primary', FINALIZED: 'success', CONFIRMED: 'success', OBJECTION: 'danger', RESOLVED: 'info' }
  return map[status] || 'info'
}

onMounted(() => {
  loadBuildings()
  loadCapacityConfig()
  loadAllocState()
})

watch(currentStep, () => {
  if (currentStep.value >= 1) computeRemaining()
})
</script>

<style scoped>
.dormitory-page { padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.alloc-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
</style>
