<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Search, Refresh } from "@element-plus/icons-vue"
import { getSurveyListApi, deleteSurveyApi } from "@@/apis/survey"
import type { SurveyRatingItem } from "@@/apis/survey/type"
import dayjs from "dayjs"

const ROLE_COLUMNS = [
  { key: "reception", label: "前台人员" },
  { key: "consultant", label: "咨询师" },
  { key: "photographer", label: "拍摄人员" },
  { key: "doctor", label: "医生" },
  { key: "nurse", label: "护士" },
  { key: "wax_designer", label: "蜡型设计师" }
]

const loading = ref(false)
const tableData = ref<SurveyRatingItem[]>([])
const total = ref(0)
const searchFormRef = ref()
const searchData = reactive({
  customer_id: "",
  dateRange: null as [string, string] | null,
  page: 1,
  pageSize: 20
})

const audioRef = ref<HTMLAudioElement | null>(null)
const playingId = ref<number | null>(null)

const getTableData = async () => {
  loading.value = true
  try {
    const [start_date, end_date] = searchData.dateRange || [undefined, undefined]
    const res = await getSurveyListApi({
      customer_id: searchData.customer_id || undefined,
      start_date,
      end_date,
      page: searchData.page,
      pageSize: searchData.pageSize
    })
    if (res.re) {
      tableData.value = res.re
      total.value = res.total ?? res.re.length
    }
  } catch (error) {
    console.error("获取问卷列表失败:", error)
    ElMessage.error("获取问卷列表失败")
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchData.page = 1
  getTableData()
}

const handleReset = () => {
  searchFormRef.value?.resetFields()
  searchData.page = 1
  getTableData()
}

const handleCurrentChange = (page: number) => {
  searchData.page = page
  getTableData()
}

const handleSizeChange = (size: number) => {
  searchData.pageSize = size
  searchData.page = 1
  getTableData()
}

const getScoreColor = (score: number) => {
  if (score > 0) return "color: #67c23a"
  if (score < 0) return "color: #f56c6c"
  return "color: #909399"
}

const getScore = (row: SurveyRatingItem, key: string): string | number => {
  const v = (row as unknown as Record<string, number>)[key]
  return v !== undefined && v !== null ? v : "-"
}

const handleDelete = (row: SurveyRatingItem) => {
  ElMessageBox.confirm(`确认删除该条问卷记录？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      await deleteSurveyApi(row.id)
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    } finally {
      loading.value = false
    }
  })
}

const handlePlayAudio = (row: SurveyRatingItem) => {
  if (!row.audio_url) {
    ElMessage.warning("暂无录音")
    return
  }
  if (playingId.value === row.id && audioRef.value && !audioRef.value.paused) {
    audioRef.value.pause()
    playingId.value = null
    return
  }
  playingId.value = row.id
  if (!audioRef.value) {
    audioRef.value = new Audio()
  }
  audioRef.value.src = row.audio_url
  audioRef.value.play()
  audioRef.value.onended = () => {
    playingId.value = null
  }
  audioRef.value.onerror = () => {
    ElMessage.error("播放失败")
    playingId.value = null
  }
}

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form ref="searchFormRef" :model="searchData" inline class="mb-4">
        <el-form-item label="客户ID" prop="customer_id">
          <el-input v-model="searchData.customer_id" placeholder="客户ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="评价时间" prop="dateRange">
          <el-date-picker
            v-model="searchData.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" stripe border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="customer_id" label="客户ID" width="120" />
        <el-table-column prop="customer_name" label="客户姓名" width="120">
          <template #default="{ row }">{{ row.customer_name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="170">
          <template #default="{ row }">
            {{ row.created_at ? dayjs(row.created_at).format("YYYY-MM-DD HH:mm") : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          v-for="col in ROLE_COLUMNS"
          :key="col.key"
          :prop="col.key"
          :label="col.label"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <span :style="getScoreColor(Number(getScore(row, col.key)) || 0)">
              {{ getScore(row, col.key) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="录音" width="100" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.audio_url"
              type="primary"
              link
              @click="handlePlayAudio(row)"
            >
              {{ playingId === row.id ? "停止" : "播放" }}
            </el-button>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="文字反馈" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || "-" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        :total="total"
        :page-size="searchData.pageSize"
        :current-page="searchData.page"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="mt-4"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>
