<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { CirclePlus, Edit, Delete, VideoPlay } from "@element-plus/icons-vue"
import { usePagination } from "@@/composables/usePagination"
import { getCustomerListApi, createCustomerApi, updateCustomerApi, deleteCustomerApi, generateQrCodeApi } from "@@/apis/customers"
import type { FormInstance, FormRules } from "element-plus"
import dayjs from "dayjs"
import { materialOptions } from "../process/constant"
interface CustomerData {
  id: number
  customer_name: string
  technician: string
  wear_time: string
  preparation_time: string
  doctor: string
  material: string | string[]
  quantity?: string | number
  image?: string
  qr_code?: string
  technician_video?: string
  remark?: string
  created_at?: string
  updated_at?: string
}

const loading = ref(false)
const { paginationData, handleCurrentChange: baseHandleCurrentChange, handleSizeChange: baseHandleSizeChange } = usePagination()

const allTableData = ref<CustomerData[]>([])
const tableData = ref<CustomerData[]>([])
const searchFormRef = ref()
const searchData = reactive({
  customer_name: "",
  technician: "",
  doctor: ""
})

const dialogVisible = ref(false)
const dialogTitle = ref("")
const videoDialogVisible = ref(false)
const currentVideoUrl = ref("")
const formRef = ref<FormInstance>()
const formData = reactive<CustomerData>({
  id: 0,
  customer_name: "",
  technician: "",
  wear_time: "",
  preparation_time: "",
  doctor: "",
  material: [],
  quantity: "",
  image: "",
  qr_code: "",
  technician_video: "",
  remark: ""
})

const stageOptions = [
  { key: "not_started", label: "未开始" },
  { key: "guan_mo", label: "灌模" },
  { key: "xiu_mo", label: "修模" },
  { key: "cad_design", label: "CAD设计" },
  { key: "qie_xue", label: "切削" },
  { key: "che_jin", label: "车金" },
  { key: "shang_ci", label: "上瓷" },
  { key: "che_ci", label: "车瓷" },
  { key: "shang_you", label: "上釉" },
  { key: "completed", label: "已完成" }
]


const doctorOptions = ["宇医生", "秦医生", "蔡医生", "王医生"]

const formRules: FormRules = {
  customer_name: [
    { required: true, message: "请输入客户姓名", trigger: "blur" }
  ],
  technician: [
    { required: true, message: "请选择阶段进度", trigger: "change" }
  ]
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getCustomerListApi()
    if (res.re) {
      allTableData.value = res.re
      paginationData.total = res.re.length
      updateTableData()
    }
  } catch (error) {
    console.error("获取客户列表失败:", error)
    ElMessage.error("获取客户列表失败")
  } finally {
    loading.value = false
  }
}

const updateTableData = () => {
  const start = (paginationData.currentPage - 1) * paginationData.pageSize
  const end = start + paginationData.pageSize
  tableData.value = allTableData.value.slice(start, end)
}

const handleCurrentChange = (value: number) => {
  baseHandleCurrentChange(value)
  updateTableData()
}

const handleSizeChange = (value: number) => {
  baseHandleSizeChange(value)
  paginationData.currentPage = 1
  updateTableData()
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
  dialogTitle.value = "新增客户"
  dialogVisible.value = true
}

const handleUpdate = (row: CustomerData) => {
  dialogTitle.value = "编辑客户"
  const rowData = { ...row }
  // 将字符串转换为数组
  if (typeof rowData.material === 'string' && rowData.material) {
    rowData.material = rowData.material.split(',')
  } else if (!rowData.material) {
    rowData.material = []
  }
  Object.assign(formData, rowData)
  dialogVisible.value = true
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 创建提交数据副本，将数组转换为字符串
        const submitData = { ...formData }
        if (Array.isArray(submitData.material)) {
          submitData.material = submitData.material.join(',')
        }

        if (formData.id) {
          await updateCustomerApi(submitData)
          ElMessage.success("更新成功")
        } else {
          await createCustomerApi(submitData)
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

const handleDelete = async (row: CustomerData) => {
  ElMessageBox.confirm(`确认删除客户：${row.customer_name}？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      await deleteCustomerApi(row.id)
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除客户失败:", error)
      ElMessage.error("删除客户失败")
    } finally {
      loading.value = false
    }
  })
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.id = 0
  formData.customer_name = ""
  formData.technician = ""
  formData.wear_time = ""
  formData.preparation_time = ""
  formData.doctor = ""
  formData.material = []
  formData.quantity = ""
  formData.image = ""
  formData.qr_code = ""
  formData.technician_video = ""
  formData.remark = ""
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

const getStageType = (technician: string): "primary" | "success" | "warning" | "info" | "danger" | undefined => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "info" | "danger" | undefined> = {
    "未成": "info",
    "美成": "success",
    "车装": "warning",
    "石膏溜模": undefined,
    "切割": "warning",
    "CAD设计": "primary",
    "上架": "success"
  }
  return typeMap[technician] || undefined
}

const handleGenerateQrCode = async (row: CustomerData) => {
  try {
    loading.value = true
    const res = await generateQrCodeApi({ id: row.id, page: "pages/index/index" })
    if (res.code === 0 && res.re?.img) {
      const index = allTableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allTableData.value[index].qr_code = res.re.img
        updateTableData()
      }
      ElMessage.success("生成二维码成功")
    } else {
      ElMessage.error("生成二维码失败")
    }
  } catch (error) {
    console.error("生成二维码失败:", error)
    ElMessage.error("生成二维码失败")
  } finally {
    loading.value = false
  }
}

const handlePlayVideo = (row: CustomerData) => {
  if (!row.technician_video) {
    ElMessage.warning("暂无视频")
    return
  }
  currentVideoUrl.value = row.technician_video
  videoDialogVisible.value = true
}

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="customer_name" label="客户姓名">
          <el-input v-model="searchData.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item prop="technician" label="阶段进度">
          <el-select v-model="searchData.technician" placeholder="请选择阶段">
            <el-option label="全部" value="" />
            <el-option v-for="item in stageOptions" :key="item.key" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item prop="doctor" label="医生">
          <el-select v-model="searchData.doctor" placeholder="请选择医生">
            <el-option label="全部" value="" />
            <el-option v-for="item in doctorOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card> -->

    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <el-button type="primary" :icon="CirclePlus" @click="handleCreate">新增客户</el-button>
      </div>

      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="60" align="center" />
          <el-table-column prop="customer_name" label="客户姓名" width="100" align="center" />
          <el-table-column prop="technician" label="阶段进度" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.technician" :type="getStageType(row.technician) || undefined">{{ row.technician }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="wear_time" label="戴牙时间" width="110" align="center">
            <template #default="{ row }">
              {{ dayjs(row.wear_time).format('YYYY-MM-DD') }}
            </template>
          </el-table-column>
          <el-table-column prop="preparation_time" label="备牙时间" width="120" align="center">
            <template #default="{ row }">
              {{ row.preparation_time ? dayjs(row.preparation_time).format('YYYY-MM-DD') : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="doctor" label="医生" width="90" align="center" />
          <el-table-column prop="material" label="材料" width="200" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getMaterialLabel(row.material) }}
            </template>
          </el-table-column>
          <el-table-column prop="qr_code" label="二维码" width="120" align="center">
            <template #default="{ row }">
              <el-image v-if="row.qr_code" :src="row.qr_code" style="width: 50px; height: 50px;" />
              <el-button v-else type="primary" size="small" @click="handleGenerateQrCode(row)">生成</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="technician_video" label="视频" width="100" align="center">
            <template #default="{ row }">
              <el-button v-if="row.technician_video" type="primary" :icon="VideoPlay" circle size="small"
                @click="handlePlayVideo(row)" />
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" text size="small" :icon="Edit" @click="handleUpdate(row)">编辑</el-button>
              <el-button type="danger" text size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleCloseDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">

          <el-col :span="12">
            <el-form-item label="材料" prop="material">
              <el-select v-model="formData.material" placeholder="请选择材料" multiple collapse-tags collapse-tags-tooltip>
                <el-option v-for="item in materialOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input v-model="formData.quantity" placeholder="请输入数量" />
            </el-form-item>
          </el-col>
        </el-row>


        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备牙时间" prop="wear_time">
              <el-date-picker v-model="formData.preparation_time" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截牙时间" prop="wear_time">
              <el-date-picker v-model="formData.wear_time" type="date" placeholder="选择日期"
format="YYYY-MM-DD"
                value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医生" prop="doctor">
              <el-select v-model="formData.doctor" placeholder="请选择医生">
                <el-option v-for="item in doctorOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材料" prop="material">
              <el-input v-model="formData.material" placeholder="请输入材料" />
            </el-form-item>
          </el-col>
        </el-row> -->

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCloseDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="videoDialogVisible" title="视频播放" width="800px" @close="videoDialogVisible = false">
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <video v-if="currentVideoUrl" :src="currentVideoUrl" controls style="width: 100%; max-height: 600px;" />
      </div>
    </el-dialog>
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

