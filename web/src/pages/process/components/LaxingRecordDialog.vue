<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import * as XLSX from "xlsx"
import { getLaxingRecordListApi } from "@@/apis/laxing_history"
import { getUserListApi } from "@@/apis/users"
import { progressOptions } from "../constant"
import dayjs from "dayjs"

interface UserRow {
  usercount: string
  username: string
  role?: string
}

interface LaxingRecord {
  id: number
  customer_id: number
  customer_name: string
  technician: string
  prev_technician: string | null
  progress: string | null
  laxing_technician: string | null
  created_at: string
}

const props = defineProps<{
  visible: boolean
  userMap: Map<string, string>
}>()

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void
}>()

const queryDateRange = ref<[string, string] | null>(null)
const technicianFilter = ref("")
const technicianOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)
const tableData = ref<LaxingRecord[]>([])

const handleClose = () => emit("update:visible", false)

const getTechnicianName = (usercount: string | null | undefined) => {
  if (!usercount) return "-"
  return props.userMap.get(usercount) || usercount
}

const getProgressLabel = (key: string | null) => {
  if (!key) return "-"
  return progressOptions.find(item => item.key === key)?.label ?? key
}

const loadTechnicianOptions = async () => {
  try {
    const res = (await getUserListApi()) as ApiResponseData<UserRow[]>
    if (res.code === 0 && res.re) {
      technicianOptions.value = res.re
        .filter(u => u.role === "技师")
        .map(u => ({ label: u.username, value: u.usercount }))
    }
  } catch (e) {
    console.error("获取技师列表失败:", e)
  }
}

const handleSearch = async () => {
  if (!queryDateRange.value || queryDateRange.value.length !== 2) {
    ElMessage.warning("请选择日期范围")
    return
  }
  const [start, end] = queryDateRange.value
  loading.value = true
  try {
    const res = (await getLaxingRecordListApi({
      start_date: start,
      end_date: end,
      ...(technicianFilter.value ? { technician: technicianFilter.value } : {})
    })) as ApiResponseData<LaxingRecord[]>
    tableData.value = res.code === 0 && res.re ? res.re : []
  } catch (e) {
    console.error("获取蜡型记录失败:", e)
    ElMessage.error("获取蜡型记录失败")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleExport = () => {
  if (!queryDateRange.value || queryDateRange.value.length !== 2) {
    ElMessage.warning("请选择日期范围")
    return
  }
  if (tableData.value.length === 0) {
    ElMessage.warning("暂无数据可导出，请先搜索")
    return
  }
  try {
    const excelData = tableData.value.map((row, index) => ({
      序号: index + 1,
      客户名称: row.customer_name || "-",
      技师: getTechnicianName(row.technician),
      上一技师: getTechnicianName(row.prev_technician),
      客户进度: getProgressLabel(row.progress),
      蜡型设计师: getTechnicianName(row.laxing_technician),
      切换时间: row.created_at ? dayjs(row.created_at).format("MM-DD HH:mm:ss") : "-"
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    ws["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, "蜡型记录")
    const [s, e] = queryDateRange.value
    XLSX.writeFile(wb, `蜡型记录_${s}_${e}.xlsx`)
    ElMessage.success("导出成功")
  } catch (e) {
    console.error("导出 Excel 失败:", e)
    ElMessage.error("导出失败，请重试")
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      const t = dayjs().format("YYYY-MM-DD")
      queryDateRange.value = [t, t]
      technicianFilter.value = ""
      tableData.value = []
      if (!technicianOptions.value.length) loadTechnicianOptions()
    }
  }
)
</script>

<template>
  <el-dialog :model-value="props.visible" title="蜡型记录" width="900px" @close="handleClose">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap">
      <span>日期范围</span>
      <el-date-picker
        v-model="queryDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
      />
      <span>技师</span>
      <el-select v-model="technicianFilter" clearable placeholder="全部" filterable style="width: 160px">
        <el-option v-for="opt in technicianOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" :disabled="tableData.length === 0" @click="handleExport">导出</el-button>
    </div>
    <div v-loading="loading">
      <el-table :data="tableData" border stripe max-height="520">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="customer_name" label="客户名称" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="technician" label="技师" width="130" align="center">
          <template #default="{ row }">
            {{ getTechnicianName(row.technician) }}
          </template>
        </el-table-column>
        <el-table-column prop="prev_technician" label="上一技师" width="130" align="center">
          <template #default="{ row }">
            {{ getTechnicianName(row.prev_technician) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="客户进度" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.progress">{{ getProgressLabel(row.progress) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="laxing_technician" label="蜡型设计师" width="130" align="center">
          <template #default="{ row }">
            {{ getTechnicianName(row.laxing_technician) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="切换时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.created_at ? dayjs(row.created_at).format("MM-DD HH:mm:ss") : "-" }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && tableData.length === 0" description="暂无数据，请选择条件后点击搜索" />
    </div>
  </el-dialog>
</template>
