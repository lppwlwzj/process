<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import * as XLSX from "xlsx"
import { getProcessHistoryApi } from "@@/apis/process_history"
import { progressOptions } from "../constant"
import dayjs from "dayjs"

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
  userMap: Map<string, string>
}>()

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void
}>()

const loading = ref(false)
const tableData = ref<HistoryRecord[]>([])

const handleClose = () => {
  emit("update:visible", false)
}

// 通过 usercount 获取 username
const getTechnicianName = (usercount: string | null | undefined): string => {
  if (!usercount) return "-"
  return props.userMap.get(usercount) || usercount
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

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return "-"
  return dateTime.replace("T", " ").substring(0, 19)
}

const handleExcelDownload = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning("暂无数据可导出")
    return
  }

  try {
    // 准备 Excel 数据
    const excelData = tableData.value.map((row) => ({
      操作次数: row.operation_count || "-",
      当前进度: getProgressLabel(row.progress),
      开始时间: row.start_time ? dayjs(row.start_time).format('YYYY-MM-DD HH:mm:ss') : '-',
      技工师: getTechnicianName(row.technician),
      上次技工师: getTechnicianName(row.previous_technician),
      上次进度: row.previous_progress ? getProgressLabel(row.previous_progress) : "-",
      操作时长: formatDuration(row.duration_minutes)
    }))

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    const colWidths = [
      { wch: 10 },  // 操作次数
      { wch: 12 },  // 当前进度
      { wch: 20 },  // 开始时间
      { wch: 12 },  // 技工师
      { wch: 12 },  // 上次技工师
      { wch: 12 },  // 上次进度
      { wch: 15 }   // 操作时长
    ]
    ws["!cols"] = colWidths

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "进度记录")

    // 生成文件名
    const fileName = `${props.customerName}_进度记录_${new Date().toISOString().split("T")[0]}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, fileName)

    ElMessage.success("导出成功")
  } catch (error) {
    console.error("导出 Excel 失败:", error)
    ElMessage.error("导出失败，请重试")
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadHistoryData()
  }
})
</script>

<template>
  <el-dialog :model-value="props.visible" :title="`${props.customerName} - 进度记录`" width="900px" @close="handleClose">
    <el-button type="primary" @click="handleExcelDownload">进度记录excel下载</el-button>
    <div v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="operation_count" label="操作次数" width="100" align="center" />
        <el-table-column prop="progress" label="当前进度" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ getProgressLabel(row.progress) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.start_time ? dayjs(row.start_time).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="technician" label="技工师" width="120" align="center">
          <template #default="{ row }">
            {{ getTechnicianName(row.technician) }}
          </template>
        </el-table-column>

        <el-table-column prop="previous_technician" label="上次技工师" align="center">
          <template #default="{ row }">
            {{ getTechnicianName(row.previous_technician) }}
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

      <el-empty v-if="!loading && tableData.length === 0" description="暂无进度记录" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-table) {
  margin-top: 10px;
}
</style>
