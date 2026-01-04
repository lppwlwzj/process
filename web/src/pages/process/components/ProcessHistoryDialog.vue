<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { getProcessHistoryApi } from "@@/apis/process_history"

import { progressOptions } from "../constant"
interface HistoryRecord {
  id: number
  customer_id: number
  customer_name: string
  progress: string
  technician: string
  operation_count: number
  start_time: string
  duration_minutes: number | null
  previous_progress: string | null
  previous_technician: string | null
  created_at: string
}

const props = defineProps<{
  visible: boolean
  customerId: number
  customerName: string
}>()

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void
}>()

const loading = ref(false)
const tableData = ref<HistoryRecord[]>([])

const handleClose = () => {
  emit("update:visible", false)
}

const getProgressLabel = (key: string) => {
  const option = progressOptions.find(item => item.key === key)
  return option ? option.label : key
}
const loadHistoryData = async () => {
  if (!props.customerId) return

  loading.value = true
  try {
    const res = await getProcessHistoryApi({ customer_id: props.customerId }) as ApiResponseData<HistoryRecord[]>
    if (res.code === 0 && res.re) {
      tableData.value = res.re
    }
  } catch (error) {
    console.error("获取操作历史失败:", error)
    ElMessage.error("获取操作历史失败")
  } finally {
    loading.value = false
  }
}

const formatDuration = (minutes: number | null) => {
  if (!minutes) return "-"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadHistoryData()
  }
})
</script>

<template>
  <el-dialog :model-value="visible" :title="`${customerName} - 操作记录`" width="900px" @close="handleClose">
    <div v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="operation_count" label="操作次数" width="100" align="center" />
        <el-table-column prop="progress" label="当前进度" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getProgressLabel(row.progress) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" align="center" />
        <el-table-column prop="technician" label="技工师" width="120" align="center" />

        <el-table-column prop="previous_technician" label="上次技工师" align="center">
          <template #default="{ row }">
            {{ row.previous_technician || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="previous_progress" label="上次进度" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.previous_progress" type="info">{{ getProgressLabel(row.previous_progress) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="操作时长" width="120" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.duration_minutes) }}
          </template>
        </el-table-column>

      </el-table>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无操作记录" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-table) {
  margin-top: 10px;
}
</style>
