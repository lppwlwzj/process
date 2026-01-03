<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@@/composables/usePagination"
import { getProcessListApi, createProcessApi, updateProcessApi, deleteProcessApi, getProcessDetailApi } from "@@/apis/process"
import ProcessHistoryDialog from "./components/ProcessHistoryDialog.vue"
import ChairsideHistoryDialog from "./components/ChairsideHistoryDialog.vue"
import type { FormInstance, FormRules } from "element-plus"
import dayjs from 'dayjs'
import { progressOptions, materialOptions } from "./constant"

interface ProcessData {
  id: number
  customer_name: string
  wear_time: string
  progress: string
  technician: string
  material?: string
  image?: string
  remark?: string
  technician_audio?: string
  technician_video?: string
  chairside_audio?: string
  chairside_video?: string
  start_chairside_time?: string
  complete_chairside_time?: string
  chairside_doctor?: string
  daily_wear_status?: number
  created_at?: string
  updated_at?: string
}

const loading = ref(false)
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const tableData = ref<ProcessData[]>([])
const searchFormRef = ref()
const searchData = reactive({
  customer_name: "",
  progress: "",
  technician: ""
})

const dialogVisible = ref(false)
const dialogTitle = ref("")
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<ProcessData>({
  id: 0,
  customer_name: "",
  wear_time: "",
  progress: "",
  technician: "",
  material: "",
  image: "",
  remark: "",
  technician_audio: "",
  technician_video: "",
  chairside_audio: "",
  chairside_video: "",
  start_chairside_time: "",
  complete_chairside_time: "",
  chairside_doctor: "",
  daily_wear_status: undefined
})


const technicianOptions = ["李师傅", "王师傅", "赵师傅", "陈师傅"]
const chairsideDoctorOptions = ["宇医生", "秦医生", "蔡医生", "王医生"]

const formRules: FormRules = {
  customer_name: [
    { required: true, message: "请输入客户名称", trigger: "blur" }
  ],
  progress: [
    { required: true, message: "请选择进度", trigger: "change" }
  ]
}



const getMaterialLabel = (materialValue: string | string[]) => {
  if (!materialValue) return "-"

  const values = typeof materialValue === 'string' ? materialValue.split(',') : materialValue
  const labels = values.map(val => {
    const material = materialOptions.find(m => m.value === val)
    return material ? material.label : val
  })

  return labels.join(', ')
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getProcessListApi({
      currentPage: paginationData.currentPage,
      pageSize: paginationData.pageSize,
      customer_name: searchData.customer_name,
      progress: searchData.progress,
      technician: searchData.technician
    })
    if (res.re) {
      tableData.value = res.re.list
      paginationData.total = res.re.total
    }
  } catch (error) {
    console.error("获取客户进度列表失败:", error)
    ElMessage.error("获取客户进度列表失败")
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  paginationData.currentPage = 1
  getTableData()
}

const resetSearch = () => {
  searchFormRef.value?.resetFields()
  handleSearch()
}

const handleCreate = () => {
  dialogTitle.value = "新增客户进度"
  isEdit.value = false
  dialogVisible.value = true
}

const handleUpdate = async (row: ProcessData) => {
  dialogTitle.value = "编辑客户进度"
  isEdit.value = true
  dialogVisible.value = true
  try {
    const res = await getProcessDetailApi(row.id)
    if (res.re) {
      Object.assign(formData, res.re)
    }
  } catch (error) {
    console.error("获取客户进度详情失败:", error)
    ElMessage.error("获取客户进度详情失败")
  }
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          await updateProcessApi(formData)
          ElMessage.success("编辑成功")
        } else {
          await createProcessApi(formData)
          ElMessage.success("新增成功")
        }
        dialogVisible.value = false
        resetForm()
        getTableData()
      } catch (error) {
        console.error("操作失败:", error)
        ElMessage.error("操作失败")
      } finally {
        loading.value = false
      }
    }
  })
}

const handleDelete = async (row: ProcessData) => {
  ElMessageBox.confirm(`确认删除客户进度：${row.customer_name}？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      await deleteProcessApi(row.id)
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除客户进度失败:", error)
      ElMessage.error("删除客户进度失败")
    } finally {
      loading.value = false
    }
  })
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const historyDialogVisible = ref(false)
const chairsideHistoryDialogVisible = ref(false)
const selectedCustomer = ref({
  id: 0,
  name: ""
})

const handleProgressRecord = (row: ProcessData) => {
  selectedCustomer.value = {
    id: row.id,
    name: row.customer_name
  }
  historyDialogVisible.value = true
}

const handleChairsideRecord = (row: ProcessData) => {
  selectedCustomer.value = {
    id: row.id,
    name: row.customer_name
  }
  chairsideHistoryDialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.id = 0
  formData.customer_name = ""
  formData.wear_time = ""
  formData.progress = ""
  formData.technician = ""
  formData.material = ""
  formData.image = ""
  formData.remark = ""
  formData.technician_audio = ""
  formData.technician_video = ""
  formData.chairside_audio = ""
  formData.chairside_video = ""
  formData.start_chairside_time = ""
  formData.complete_chairside_time = ""
  formData.chairside_doctor = ""
  formData.daily_wear_status = undefined
}

const getProgressType = (progressKey: string) => {
  const typeMap: Record<string, string> = {
    "not_started": "info",
    "guan_mo": "warning",
    "xiu_mo": "warning",
    "cad_design": "warning",
    "qie_xue": "warning",
    "che_jin": "warning",
    "shang_ci": "warning",
    "che_ci": "warning",
    "shang_you": "warning",
    "completed": "success"
  }
  return typeMap[progressKey] || "info"
}

const getProgressLabel = (progressKey: string) => {
  const option = progressOptions.find(item => item.key === progressKey)
  return option ? option.label : progressKey
}

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="customer_name" label="客户名称">
          <el-input v-model="searchData.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item prop="progress" label="进度">
          <el-select v-model="searchData.progress" placeholder="请选择进度">
            <el-option label="全部" value="" />
            <el-option v-for="item in progressOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item prop="technician" label="技工师">
          <el-select v-model="searchData.technician" placeholder="请选择技工师">
            <el-option label="全部" value="" />
            <el-option v-for="item in technicianOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card> -->
    <el-card shadow="never">
      <!-- <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">新增客户进度</el-button>
        </div>
      </div> -->
      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="customer_name" label="客户名称" align="center" />
          <el-table-column prop="wear_time" label="戴牙时间" align="center">
            <template #default="{ row }">
              {{ row.wear_time ? dayjs(row.wear_time).format('YYYY-MM-DD') : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="preparation_time" label="备牙时间" align="center">
            <template #default="{ row }">
              {{ row.preparation_time ? dayjs(row.preparation_time).format('YYYY-MM-DD') : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" align="center">
            <template #default="{ row }">
              <el-tag :type="getProgressType(row.progress)">{{ getProgressLabel(row.progress) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="technician" label="技工师" align="center" />
          <el-table-column prop="chairside_doctor" label="椅旁医生" align="center" />
          <el-table-column prop="material" label="材料" width="200" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getMaterialLabel(row.material) }}
            </template>
          </el-table-column>
          <el-table-column prop="daily_wear_status" label="当日戴牙" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.daily_wear_status === 1" type="success">已戴牙</el-tag>
              <el-tag v-else-if="row.daily_wear_status === 0" type="warning">未戴牙</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="handleProgressRecord(row)">进度记录</el-button>
              <el-button type="primary" text size="small" @click="handleChairsideRecord(row)">椅旁记录</el-button>
              <!-- <el-button type="primary" text size="small" @click="handleUpdate(row)">编辑</el-button> -->
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination background :layout="paginationData.layout" :page-sizes="paginationData.pageSizes"
          :total="paginationData.total" :page-size="paginationData.pageSize" :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleCloseDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="戴牙时间" prop="wear_time">
              <el-date-picker v-model="formData.wear_time" type="date" placeholder="请选择戴牙时间" style="width: 100%"
                value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="进度" prop="progress">
              <el-select v-model="formData.progress" placeholder="请选择进度" style="width: 100%">
                <el-option v-for="item in progressOptions" :key="item.key" :label="item.label" :value="item.key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技工师" prop="technician">
              <el-select v-model="formData.technician" placeholder="请选择技工师" style="width: 100%">
                <el-option v-for="item in technicianOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="材料" prop="material">
              <el-input v-model="formData.material" placeholder="请输入材料" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="椅旁医生" prop="chairside_doctor">
              <el-select v-model="formData.chairside_doctor" placeholder="请选择椅旁医生" style="width: 100%">
                <el-option v-for="item in chairsideDoctorOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当日戴牙" prop="daily_wear_status">
              <el-select v-model="formData.daily_wear_status" placeholder="请选择" style="width: 100%">
                <el-option label="未戴牙" :value="0" />
                <el-option label="已戴牙" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始椅旁时间" prop="start_chairside_time">
              <el-date-picker v-model="formData.start_chairside_time" type="datetime" placeholder="请选择开始椅旁时间"
                style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="完成椅旁时间" prop="complete_chairside_time">
              <el-date-picker v-model="formData.complete_chairside_time" type="datetime" placeholder="请选择完成椅旁时间"
                style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="技工录音" prop="technician_audio">
              <el-input v-model="formData.technician_audio" placeholder="请输入技工录音URL" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技工视频" prop="technician_video">
              <el-input v-model="formData.technician_video" placeholder="请输入技工视频URL" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="椅旁录音" prop="chairside_audio">
              <el-input v-model="formData.chairside_audio" placeholder="请输入椅旁录音URL" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="椅旁视频" prop="chairside_video">
              <el-input v-model="formData.chairside_video" placeholder="请输入椅旁视频URL" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="图片URL" prop="image">
          <el-input v-model="formData.image" placeholder="请输入图片URL" clearable />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确定</el-button>
      </template>
    </el-dialog> -->

    <ProcessHistoryDialog v-model:visible="historyDialogVisible" :customer-id="selectedCustomer.id"
      :customer-name="selectedCustomer.name" />

    <ChairsideHistoryDialog v-model:visible="chairsideHistoryDialogVisible" :customer-id="selectedCustomer.id"
      :customer-name="selectedCustomer.name" />
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  .search-wrapper {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding-bottom: 2px;
    }
  }

  .toolbar-wrapper {
    margin-bottom: 20px;
  }

  .table-wrapper {
    margin-bottom: 20px;
  }

  .pager-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}
</style>

