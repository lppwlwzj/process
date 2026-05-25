<script lang="ts" setup>
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import * as XLSX from "xlsx"
import { getYipanHistoryApi } from "@@/apis/yipan_history"
import { getUserListApi } from "@@/apis/users"
import { progressOptions, materialOptions } from "../constant"
import dayjs from "dayjs"

interface UserRow {
  usercount: string
  username: string
  role?: string
}

interface MaterialItem {
  material: string
  quantity: number | string
}

interface ChairsideHistoryRecord {
  id: number
  customer_id: number
  customer_name: string
  progress: string | null
  shape_quality_inspector?: string | null
  chairside_doctor: string
  start_time: string
  end_time: string
  duration_minutes: number | null
  created_at: string
  materials?: MaterialItem[]
}

const props = defineProps<{
  visible: boolean
  userMap: Map<string, string>
}>()

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void
}>()

const queryDateRange = ref<[string, string] | null>(null)
const chairsideFilter = ref("")
const shapeInspectorFilter = ref("")
const chairsideOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)
const tableData = ref<ChairsideHistoryRecord[]>([])

const handleClose = () => {
  emit("update:visible", false)
}

const getDoctorName = (usercount: string | null | undefined): string => {
  if (!usercount) return "-"
  return props.userMap.get(usercount) || usercount
}

const getProgressLabel = (key: string | null) => {
  if (!key) return "-"
  const option = progressOptions.find(item => item.key === key)
  return option ? option.label : key
}

const formatDuration = (minutes: number | null) => {
  if (!minutes) return "-"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

const getMaterialLabel = (materialValue: string | string[]) => {
  if (!materialValue) return "-"
  const values = typeof materialValue === "string" ? materialValue.split(",") : materialValue
  const labels = values.map((val) => {
    const material = materialOptions.find((m) => m.value === val)
    return material ? material.label : val
  })
  return labels.join(", ")
}

const formatMaterialsText = (materials: MaterialItem[] | undefined | null) => {
  if (!materials || materials.length === 0) return "-"
  return materials.map((item) => `${getMaterialLabel(item.material)}: ${item.quantity}颗`).join("；")
}

const loadChairsideOptions = async () => {
  try {
    const res = (await getUserListApi()) as ApiResponseData<UserRow[]>
    if (res.code === 0 && res.re) {
      chairsideOptions.value = res.re
        .filter((u) => u.role === "医生椅旁技师")
        .map((u) => ({ label: u.username, value: u.usercount }))
    }
  } catch (e) {
    console.error("获取椅旁人员列表失败:", e)
  }
}

const loadByDate = async () => {
  if (!queryDateRange.value || queryDateRange.value.length !== 2) {
    ElMessage.warning("请选择日期范围")
    return
  }
  const [start, end] = queryDateRange.value
  loading.value = true
  try {
    const res = (await getYipanHistoryApi({
      start_date: start,
      end_date: end,
      ...(chairsideFilter.value ? { chairside_doctor: chairsideFilter.value } : {}),
      ...(shapeInspectorFilter.value ? { shape_quality_inspector: shapeInspectorFilter.value } : {})
    })) as ApiResponseData<ChairsideHistoryRecord[]>
    if (res.code === 0 && res.re) {
      tableData.value = res.re
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error("获取椅旁记录失败:", error)
    ElMessage.error("获取椅旁记录失败")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleExcelDownload = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning("暂无数据可导出")
    return
  }

  try {
    const excelData = tableData.value.map((row, index) => ({
      客户名称: row.customer_name || "-",
      材料与数量: formatMaterialsText(row.materials),
      序号: index + 1,
      形态质检师: getDoctorName(row.shape_quality_inspector),
      椅旁医生技师: getDoctorName(row.chairside_doctor),
      进度: getProgressLabel(row.progress),
      开始时间: row.start_time ? dayjs(row.start_time).format("MM-DD HH:mm:ss") : "-",
      结束时间: row.end_time ? dayjs(row.end_time).format("MM-DD HH:mm:ss") : "-",
      操作时长: formatDuration(row.duration_minutes)
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    ws["!cols"] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 }
    ]
    XLSX.utils.book_append_sheet(wb, ws, "椅旁记录")
    const [s, e] = queryDateRange.value || ["", ""]
    const fileName = `椅旁记录_${s}_${e}.xlsx`
    XLSX.writeFile(wb, fileName)
    ElMessage.success("导出成功")
  } catch (error) {
    console.error("导出 Excel 失败:", error)
    ElMessage.error("导出失败，请重试")
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      const t = dayjs().format("YYYY-MM-DD")
      queryDateRange.value = [t, t]
      chairsideFilter.value = ""
      shapeInspectorFilter.value = ""
      tableData.value = []
      if (!chairsideOptions.value.length) {
        loadChairsideOptions()
      }
    }
  }
)
</script>

<template>
  <el-dialog :model-value="props.visible" title="按日期查询椅旁记录" width="1000px" @close="handleClose">
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
      <span>椅旁医生/技师</span>
      <el-select v-model="chairsideFilter" clearable placeholder="全部" filterable style="width: 160px">
        <el-option v-for="opt in chairsideOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <span>形态质检师</span>
      <el-select v-model="shapeInspectorFilter" clearable placeholder="全部" filterable style="width: 160px">
        <el-option v-for="opt in chairsideOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      
      <el-button type="primary" @click="loadByDate">确定</el-button>
      <el-button type="primary" :disabled="tableData.length === 0" @click="handleExcelDownload">椅旁记录excel下载</el-button>
    </div>
    <div v-loading="loading">
      <el-table :data="tableData" border stripe max-height="520">
        <el-table-column prop="customer_name" label="客户名称" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="materials" label="材料与数量" min-width="250" align="center">
          <template #default="{ row }">
            <div v-if="row.materials && row.materials.length > 0">
              <el-tag v-for="(item, index) in row.materials" :key="index" style="margin: 2px">
                {{ getMaterialLabel(item.material) }}: {{ item.quantity }}颗
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="shape_quality_inspector" label="形态质检师" width="150" align="center">
          <template #default="{ row }">
            {{ getDoctorName(row.shape_quality_inspector) }}
          </template>
        </el-table-column>
        <el-table-column prop="chairside_doctor" label="椅旁医生/技师" width="150" align="center">
          <template #default="{ row }">
            {{ getDoctorName(row.chairside_doctor) }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.progress">{{ getProgressLabel(row.progress) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.start_time ? dayjs(row.start_time).format("MM-DD HH:mm:ss") : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180" align="center">
          <template #default="{ row }">
            {{ row.end_time ? dayjs(row.end_time).format("MM-DD HH:mm:ss") : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="操作时长" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.duration_minutes) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && tableData.length === 0" description="暂无数据，请选择日期范围后点击确定" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-table) {
  margin-top: 4px;
}
</style>
