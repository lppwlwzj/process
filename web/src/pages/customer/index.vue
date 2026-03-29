<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@@/composables/usePagination"
import { getCustomerListApi, createCustomerApi, updateCustomerApi, deleteCustomerApi, batchDeleteCustomerApi, generateQrCodeApi, generateSurveyQrCodeApi } from "@@/apis/customers"
import type { FormInstance, FormRules } from "element-plus"
import { materialOptions } from "../process/constant"

const Search: any = null
const Refresh: any = null
const CirclePlus: any = null
const Edit: any = null
const Delete: any = null
interface MaterialItem {
  material: string
  quantity: number | string
}

interface CustomerData {
  id: number
  customer_name: string
  technician: string
  wear_time: string
  preparation_time: string
  doctor: string
  materials: MaterialItem[]
  image?: string
  qr_code?: string
  survey_code?: string
  technician_video?: string
  remark?: string
  created_at?: string
  updated_at?: string;
  type?: string
}

const loading = ref(false)
const { paginationData, handleCurrentChange: baseHandleCurrentChange, handleSizeChange: baseHandleSizeChange } = usePagination()

const allTableData = ref<CustomerData[]>([])
const tableData = ref<CustomerData[]>([])
const selectedRows = ref<CustomerData[]>([])
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
const imageDialogVisible = ref(false)
const currentImageUrl = ref("")
const formRef = ref<FormInstance>()
const formData = reactive<CustomerData>({
  id: 0,
  customer_name: "",
  technician: "",
  wear_time: "",
  preparation_time: "",
  doctor: "",
  materials: [{ material: "", quantity: "" }],
  image: "",
  qr_code: "",
  technician_video: "",
  remark: "",
  type: ""
})

const stageOptions = [
  { key: "not_started", label: "未开始" },
  { key: "guan_mo", label: "灌模完成" },
  { key: "xiu_mo", label: "修模完成" },
  { key: "cad_design", label: "CAD设计完成" },
  { key: "qie_xue", label: "切削完成" },
  { key: "che_jin", label: "车金完成" },
  { key: "shang_ci", label: "上瓷完成" },
  { key: "che_ci", label: "车瓷完成" },
  { key: "shang_you", label: "上釉完成" },
  { key: "completed", label: "戴牙结束" }
]



const formRules: FormRules = {
  customer_name: [
    { required: true, message: "请输入客户姓名", trigger: "blur" }
  ],
  technician: [
    { required: true, message: "请选择阶段进度", trigger: "change" }
  ],
  type: [
    { required: true, message: "请选择类型", trigger: "change" }
  ]
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getCustomerListApi({ customer_name: searchData.customer_name })
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
  // 确保 materials 是数组格式
  if (!rowData.materials || rowData.materials.length === 0) {
    rowData.materials = [{ material: "", quantity: "" }]
  }
  Object.assign(formData, rowData)
  dialogVisible.value = true
}

// 添加材料行
const addMaterialRow = () => {
  formData.materials.push({ material: "", quantity: "" })
}

// 删除材料行
const removeMaterialRow = (index: number) => {
  if (formData.materials.length > 1) {
    formData.materials.splice(index, 1)
  } else {
    ElMessage.warning("至少保留一个材料")
  }
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 过滤掉空的材料行
        const validMaterials = formData.materials.filter(m => m.material && m.quantity)
        if (validMaterials.length === 0) {
          ElMessage.warning("请至少添加一个有效的材料和数量")
          loading.value = false
          return
        }
        // 创建提交数据副本
        const submitData = {
          ...formData,
          materials: validMaterials
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

const handleSelectionChange = (selection: CustomerData[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的记录")
    return
  }

  const customerNames = selectedRows.value.map(row => row.customer_name).join("、")
  ElMessageBox.confirm(`确认删除 ${selectedRows.value.length} 条客户记录：${customerNames}？`, "批量删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const ids = selectedRows.value.map(row => row.id)
      await batchDeleteCustomerApi(ids)
      ElMessage.success(`成功删除 ${selectedRows.value.length} 条记录`)
      selectedRows.value = []
      getTableData()
    } catch (error) {
      console.error("批量删除客户失败:", error)
      ElMessage.error("批量删除客户失败")
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
  formData.materials = [{ material: "", quantity: "" }]
  formData.image = ""
  formData.qr_code = ""
  formData.technician_video = ""
  formData.remark = ""
}

const getMaterialLabel = (materialValue: string) => {
  if (!materialValue) return "-"

  const material = materialOptions.find(m => m.value === materialValue)
  return material ? material.label : materialValue
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
    const res = await generateQrCodeApi({ id: row.id })
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

const handleGenerateSurveyCode = async (row: CustomerData) => {
  try {
    loading.value = true
    const res = await generateSurveyQrCodeApi({ id: row.id })
    if (res.code === 0 && res.re?.img) {
      const index = allTableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        allTableData.value[index].survey_code = res.re.img
        updateTableData()
      }
      ElMessage.success("生成问卷二维码成功")
    } else {
      ElMessage.error("生成问卷二维码失败")
    }
  } catch (error) {
    console.error("生成问卷二维码失败:", error)
    ElMessage.error("生成问卷二维码失败")
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

const handleViewImage = (imageUrl: string) => {
  if (!imageUrl) {
    ElMessage.warning("暂无图片")
    return
  }
  currentImageUrl.value = imageUrl
  imageDialogVisible.value = true
}

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="customer_name" label="客户姓名">
          <el-input v-model="searchData.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">新增客户</el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete"
            style="margin-left: 10px;">
            批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column prop="id" label="ID" width="60" align="center" />
          <el-table-column prop="customer_name" label="客户姓名" width="100" align="center" />
          <el-table-column prop="type" label="类型" width="100" align="center" />

          <!-- <el-table-column prop="technician" label="阶段进度" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.technician" :type="getStageType(row.technician) || undefined">{{ row.technician }}</el-tag>
            </template>
</el-table-column> -->
          <el-table-column prop="wear_time" label="戴牙时间" width="110" align="center">
            <template #default="{ row }">
              {{ row.wear_time ? row.wear_time : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="preparation_time" label="备牙时间" width="120" align="center">
            <template #default="{ row }">
              {{ row.preparation_time ? row.preparation_time : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="doctor" label="医生" width="90" align="center" />
          <el-table-column prop="materials" label="材料与数量" min-width="250" align="center">
            <template #default="{ row }">
              <div v-if="row.materials && row.materials.length > 0">
                <el-tag v-for="(item, index) in row.materials" :key="index" style="margin: 2px;">
                  {{ getMaterialLabel(item.material) }}: {{ item.quantity }}颗
                </el-tag>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="qr_code" label="二维码" width="120" align="center">
            <template #default="{ row }">
              <el-image v-if="row.qr_code" :src="row.qr_code" style="width: 50px; height: 50px; cursor: pointer;"
                @click="handleViewImage(row.qr_code)" />
              <el-button v-else type="primary" size="small" @click="handleGenerateQrCode(row)">生成</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="survey_code" label="问卷二维码" width="120" align="center">
            <template #default="{ row }">
              <el-image v-if="row.survey_code" :src="row.survey_code"
                style="width: 50px; height: 50px; cursor: pointer;" @click="handleViewImage(row.survey_code)" />
              <el-button v-else type="primary" size="small" @click="handleGenerateSurveyCode(row)">生成</el-button>
            </template>
          </el-table-column>
          <!-- <el-table-column prop="technician_video" label="视频" width="100" align="center">
            <template #default="{ row }">
              <el-button v-if="row.technician_video" type="primary" :icon="VideoPlay" circle size="small"
                @click="handlePlayVideo(row)" />
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column> -->
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleCloseDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type" required>
              <el-select v-model="formData.type" placeholder="请选择类型" style="flex: 2;">
                <el-option label="依口" value="依口" />
                <el-option label="工厂" value="工厂" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 材料与数量动态表单 -->
        <el-form-item label="材料与数量">
          <div style="width: 100%;">
            <div v-for="(item, index) in formData.materials" :key="index"
              style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
              <el-select v-model="item.material" placeholder="请选择材料" style="flex: 2;">
                <el-option v-for="option in materialOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>
              <el-input-number v-model="item.quantity" :min="1" placeholder="数量" style="flex: 1;" />
              <el-button type="danger" :icon="Delete" circle @click="removeMaterialRow(index)"
                :disabled="formData.materials.length === 1" />
            </div>
            <el-button type="primary" :icon="CirclePlus" @click="addMaterialRow" style="width: 100%;">
              新增材料
            </el-button>
          </div>
        </el-form-item>


        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备牙时间" prop="wear_time">
              <el-date-picker v-model="formData.preparation_time" type="date" placeholder="选择日期" format="MM-DD"
                value-format="MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截牙时间" prop="wear_time">
              <el-date-picker v-model="formData.wear_time" type="date" placeholder="选择日期" format="MM-DD"
                value-format="MM-DD" style="width: 100%" />
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
    <el-dialog v-model="imageDialogVisible" title="图片预览" width="800px" @close="imageDialogVisible = false">
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <img v-if="currentImageUrl" :src="currentImageUrl"
          style="max-width: 100%; max-height: 600px; object-fit: contain;" />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  .search-wrapper {
    margin-bottom: 10px;

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

