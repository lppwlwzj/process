<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import * as XLSX from "xlsx"
import { getYipanHistoryApi } from "@@/apis/yipan_history"
import { progressOptions } from "../constant"

interface ChairsideHistoryRecord {
  id: number
  customer_id: number
  customer_name: string
  progress: string | null
  chairside_doctor: string
  start_time: string
  end_time: string
  duration_minutes: number | null
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
const tableData = ref<ChairsideHistoryRecord[]>([])

const handleClose = () => {
  emit("update:visible", false)
}

const getProgressLabel = (key: string | null) => {
  if (!key) return "-"
  const option = progressOptions.find(item => item.key === key)
  return option ? option.label : key
}

const loadHistoryData = async () => {
  if (!props.customerId) return

  loading.value = true
  try {
    const res = await getYipanHistoryApi({ customer_id: props.customerId }) as ApiResponseData<ChairsideHistoryRecord[]>
    if (res.code === 0 && res.re) {
      tableData.value = res.re
    }
  } catch (error) {
    console.error("获取椅旁历史记录失败:", error)
    ElMessage.error("获取椅旁历史记录失败")
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
    const excelData = tableData.value.map((row, index) => ({
      序号: index + 1,
      椅旁医生技师: row.chairside_doctor || "-",
      进度: getProgressLabel(row.progress),
      开始时间: formatDateTime(row.start_time),
      结束时间: formatDateTime(row.end_time),
      操作时长: formatDuration(row.duration_minutes)
    }))

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    const colWidths = [
      { wch: 8 },   // 序号
      { wch: 15 },  // 椅旁医生/技师
      { wch: 12 },  // 进度
      { wch: 20 },  // 开始时间
      { wch: 20 },  // 结束时间
      { wch: 15 }   // 操作时长
    ]
    ws["!cols"] = colWidths

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "椅旁记录")

    // 生成文件名
    const fileName = `${props.customerName}_椅旁记录_${new Date().toISOString().split("T")[0]}.xlsx`

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
  <el-dialog :model-value="props.visible" :title="`${props.customerName} - 椅旁记录`" width="880px" @close="handleClose">
    <el-button type="primary" @click="handleExcelDownload">椅旁记录excel下载</el-button>
    <div v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="chairside_doctor" label="椅旁医生/技师" width="150" align="center" />
        <el-table-column prop="progress" label="进度" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.progress">{{ getProgressLabel(row.progress) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="操作时长" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.duration_minutes) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无椅旁记录" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-table) {
  margin-top: 10px;
}
</style>
