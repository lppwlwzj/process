<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { VideoPlay, Search, Refresh, Delete, Upload } from "@element-plus/icons-vue"
import { usePagination } from "@@/composables/usePagination"
import { getProcessListApi, createProcessApi, updateProcessApi, deleteProcessApi, getProcessDetailApi, batchDeleteProcessApi, updateMiniImageApi, updateChairsideVideoApi, updateFactoryTechnicianVideoApi, updateFactoryWebVideoApi, updateFactoryImageApi, uploadFileApi, updateYipanApi } from "@@/apis/process"
import type { ProcessFormData } from "@@/apis/process/type"
import { getUserListApi } from "@@/apis/users"
import { updateCustomerWearTimeApi } from "@@/apis/customers"
import ProcessHistoryDialog from "../process/components/ProcessHistoryDialog.vue"
import ChairsideHistoryDialog from "../process/components/ChairsideHistoryDialog.vue"
import ProcessHistoryByDateDialog from "../process/components/ProcessHistoryByDateDialog.vue"
import ChairsideHistoryByDateDialog from "../process/components/ChairsideHistoryByDateDialog.vue"
import type { FormInstance, FormRules } from "element-plus"
import { progressOptions, materialOptions } from "../process/constant"
import ExcelJS from "exceljs"
import { loadImage, formatMaterials, formatEdgeSeating, formatOcclusionStatus, formatDailyWearStatus } from "../../utils"
interface UserData {
  id: number
  username: string
  usercount: string
  role?: string
}

interface MaterialItem {
  material: string
  quantity: number | string
}

interface ProcessData {
  id: number
  customer_id?: number
  customer_name: string
  wear_time: string
  progress: string
  progress_note?: string
  technician: string
  materials?: MaterialItem[]
  material?: string
  quantity?: string | number
  image?: string
  remark?: string
  type?: string
  customer_remark?: string
  customer_note?: string
  technician_audio?: string
  technician_video?: string
  chairside_audio?: string
  chairside_video?: string
  factory_image?: string
  factory_technician_audio?: string
  factory_technician_video?: string
  factory_web_video?: string
  web_video?: string
  start_chairside_time?: string
  complete_chairside_time?: string
  chairside_doctor?: string
  daily_wear_status?: number | string
  preparation_time?: string
  edge_seating?: string | number
  occlusion_status?: string | number
  created_at?: string
  updated_at?: string
  mini_image?: string
  factory_mini_image?: string
  yipan_image?: string
  chairside_note?: string
}

const loading = ref(false)
const { paginationData, handleCurrentChange: baseHandleCurrentChange, handleSizeChange: baseHandleSizeChange } = usePagination()

const tableData = ref<ProcessData[]>([])
const allTableData = ref<ProcessData[]>([])
const selectedRows = ref<ProcessData[]>([])
const searchFormRef = ref()
const searchData = reactive({
  customer_name: "",
  progress: "",
  wear_time: "",
  technician: "",
  remark: "",
  preparation_time: ""
})


const dialogVisible = ref(false)
const dialogTitle = ref("")
const isEdit = ref(false)
const videoDialogVisible = ref(false)
const currentVideoUrl = ref("")
const imageDialogVisible = ref(false)
const currentImageUrl = ref("")
const formRef = ref<FormInstance>()
const formData = reactive<ProcessData>({
  id: 0,
  type: "工厂",
  customer_name: "",
  wear_time: "",
  progress: "",
  technician: "",
  material: "",
  factory_image: "",
  factory_technician_audio: "",
  factory_technician_video: "",
  factory_web_video: "",
  chairside_audio: "",
  chairside_video: "",
  start_chairside_time: "",
  complete_chairside_time: "",
  chairside_doctor: "",
  daily_wear_status: undefined
})



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
    const base = {
      currentPage: paginationData.currentPage,
      pageSize: paginationData.pageSize,
      type: "工厂" as const
    }
    const res =
      await getProcessListApi({
        ...base,
        customer_name: searchData.customer_name,
        progress: searchData.progress,
        technician: searchData.technician,
        remark: searchData.remark,
        wear_time: searchData.wear_time,
        preparation_time: searchData.preparation_time
      })
    if (res.re) {
      tableData.value = res.re.list
      const allData = res.re.allList
      allTableData.value = allData
      paginationData.total = allData.length
    }
  } catch (error) {
    console.error("获取客户进度列表失败:", error)
    ElMessage.error("获取客户进度列表失败")
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (value: number) => {
  baseHandleCurrentChange(value)
  getTableData()
}

const handleSizeChange = (value: number) => {
  baseHandleSizeChange(value)
  getTableData()
}

const handleSearch = () => {
  paginationData.currentPage = 1
  getTableData()
}



const resetSearch = () => {
  searchData.customer_name = ""
  searchData.progress = ""
  searchData.wear_time = ""
  searchData.technician = ""
  searchData.remark = ""
  searchData.preparation_time = ""
  handleSearch()
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

const handleSelectionChange = (selection: ProcessData[]) => {
  selectedRows.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的记录")
    return
  }

  const customerNames = selectedRows.value.map(row => row.customer_name).join("、")
  ElMessageBox.confirm(`确认删除 ${selectedRows.value.length} 条客户进度记录：${customerNames}？`, "批量删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const ids = selectedRows.value.map(row => row.id)
      await batchDeleteProcessApi(ids)
      ElMessage.success(`成功删除 ${selectedRows.value.length} 条记录`)
      selectedRows.value = []
      getTableData()
    } catch (error) {
      console.error("批量删除客户进度失败:", error)
      ElMessage.error("批量删除客户进度失败")
    } finally {
      loading.value = false
    }
  })
}



const historyDialogVisible = ref(false)
const chairsideHistoryDialogVisible = ref(false)
const processHistoryByDateVisible = ref(false)
const chairsideHistoryByDateVisible = ref(false)
const selectedCustomer = ref<{ id: number; customer_id?: number; name: string }>({
  id: 0,
  name: ""
})

const userMap = ref<Map<string, string>>(new Map())

const loadUserList = async () => {
  try {
    const res = await getUserListApi() as ApiResponseData<UserData[]>
    if (res.code === 0 && res.re) {
      const map = new Map<string, string>()
      res.re.forEach(user => {
        map.set(user.usercount, user.username)
      })
      userMap.value = map
    }
  } catch (error) {
    console.error("获取用户列表失败:", error)
  }
}

const handleProgressRecord = (row: ProcessData) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }
  selectedCustomer.value = {
    id: row.id,
    customer_id: row.customer_id,
    name: row.customer_name
  }
  historyDialogVisible.value = true
}

const handleChairsideRecord = (row: ProcessData) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }
  selectedCustomer.value = {
    id: row.id,
    customer_id: row.customer_id,
    name: row.customer_name
  }
  chairsideHistoryDialogVisible.value = true
}

const openProcessHistoryByDate = () => {
  processHistoryByDateVisible.value = true
}

const openChairsideHistoryByDate = () => {
  chairsideHistoryByDateVisible.value = true
}


const getProgressLabel = (progressKey: string) => {
  const option = progressOptions.find(item => item.key === progressKey)
  return option ? option.label : progressKey
}

const savingProgressId = ref<number | null>(null)

const handleProgressChange = async (row: ProcessData, newProgress: string) => {
  const prev = row.progress
  if (newProgress === prev) return
  row.progress = newProgress
  savingProgressId.value = row.id
  try {
    await updateProcessApi({
      ...row,
      progress: newProgress
    } as unknown as ProcessFormData)
    ElMessage.success("进度已更新")
  } catch {
    row.progress = prev
  } finally {
    savingProgressId.value = null
  }
}

const savingWearTimeCustomerId = ref<number | null>(null)

const handleWearTimeChange = async (row: ProcessData, val: string | null) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }
  const prev = row.wear_time ?? ""
  const next = val ?? ""
  if (prev === next) return
  row.wear_time = next
  savingWearTimeCustomerId.value = row.customer_id
  try {
    await updateCustomerWearTimeApi({ id: row.customer_id, wear_time: next || null })
    ElMessage.success("戴牙时间已更新")
  } catch {
    row.wear_time = prev
  } finally {
    savingWearTimeCustomerId.value = null
  }
}

const getVideoList = (videoUrls: string): string[] => {
  if (!videoUrls) return []
  return videoUrls.split(',').map(url => url.trim()).filter(url => url)
}

const handlePlayVideo = (videoUrl: string) => {
  if (!videoUrl) {
    ElMessage.warning("暂无视频")
    return
  }
  currentVideoUrl.value = videoUrl
  videoDialogVisible.value = true
}

const handlePreviewImage = (imageUrl: string) => {
  if (!imageUrl) {
    ElMessage.warning("暂无图片")
    return
  }
  currentImageUrl.value = imageUrl
  imageDialogVisible.value = true
}

const appendVideoToUrlList = (currentVideos: string, newVideoUrl: string): string => {
  if (!currentVideos) return newVideoUrl
  const videoList = getVideoList(currentVideos)
  videoList.push(newVideoUrl)
  return videoList.join(',')
}

const appendImageToUrlList = (currentImages: string, newImageUrl: string): string => {
  if (!currentImages) return newImageUrl
  const imageList = getVideoList(currentImages)
  imageList.push(newImageUrl)
  return imageList.join(',')
}

const removeVideoFromUrlList = (currentVideos: string, videoUrlToRemove: string, index: number): string => {
  if (!currentVideos) return ""
  const videoList = getVideoList(currentVideos);
  videoList.splice(index, 1)
  return videoList.join(',')
}

const handleUploadTechnicianVideo = async (row: ProcessData, file: File) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  try {
    loading.value = true
    const uploadRes = await uploadFileApi(file, customerId, "factory_technician_video")
    if (uploadRes.code === 0 && uploadRes.re?.img_url) {
      const newVideoUrl = uploadRes.re.img_url
      const currentVideos = row.factory_technician_video || ""
      const updatedVideos = appendVideoToUrlList(currentVideos, newVideoUrl)

      await updateFactoryTechnicianVideoApi({
        customer_id: customerId,
        factory_technician_video: updatedVideos
      })

      ElMessage.success("上传成功")
      getTableData()
    } else {
      ElMessage.error(uploadRes.message || "上传失败")
    }
  } catch (error) {
    console.error("上传进度视频失败:", error)
    ElMessage.error("上传进度视频失败")
  } finally {
    loading.value = false
  }
}

const handleUploadWebVideo = async (row: ProcessData, file: File) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  try {
    loading.value = true
    const uploadRes = await uploadFileApi(file, customerId, "factory_web_video")
    if (uploadRes.code === 0 && uploadRes.re?.img_url) {
      const newVideoUrl = uploadRes.re.img_url
      const currentVideos = row.factory_web_video || ""
      const updatedVideos = appendVideoToUrlList(currentVideos, newVideoUrl)

      await updateFactoryWebVideoApi({
        customer_id: customerId,
        factory_web_video: updatedVideos
      })

      ElMessage.success("上传成功")
      getTableData()
    } else {
      ElMessage.error(uploadRes.message || "上传失败")
    }
  } catch (error) {
    console.error("上传视频失败:", error)
    ElMessage.error("上传视频失败")
  } finally {
    loading.value = false
  }
}

const handleUploadImage = async (row: ProcessData, file: File) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  try {
    loading.value = true
    const uploadRes = await uploadFileApi(file, customerId, "factory_image")
    if (uploadRes.code === 0 && uploadRes.re?.img_url) {
      const imageUrl = uploadRes.re.img_url
      const currentImages = row.factory_image || ""
      const updatedImages = appendImageToUrlList(currentImages, imageUrl)

      await updateFactoryImageApi({
        customer_id: customerId,
        factory_image: updatedImages
      })

      ElMessage.success("上传成功")
      getTableData()
    } else {
      ElMessage.error(uploadRes.message || "上传失败")
    }
  } catch (error) {
    console.error("上传图片失败:", error)
    ElMessage.error("上传图片失败")
  } finally {
    loading.value = false
  }
}

const handleDeleteImage = async (row: ProcessData, imageUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该图片？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentImages = row.factory_image || ""
      const updatedImages = removeVideoFromUrlList(currentImages, imageUrl, index)

      await updateFactoryImageApi({
        customer_id: customerId,
        factory_image: updatedImages
      })

      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除图片失败:", error)
      ElMessage.error("删除图片失败")
    } finally {
      loading.value = false
    }
  })
}
const handleDeleteFactoryMiniImage = async (row: ProcessData, imageUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该图片？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentImages = row.factory_mini_image || ""
      const updatedImages = removeVideoFromUrlList(currentImages, imageUrl, index)
      await updateMiniImageApi({
        customer_id: customerId,
        factory_mini_image: updatedImages
      })
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除图片失败:", error)
      ElMessage.error("删除图片失败")
    } finally {
      loading.value = false
    }
  })
}

const handleDeleteYipanImage = async (row: ProcessData, imageUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该图片？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentImages = row.yipan_image || ""
      const updatedImages = removeVideoFromUrlList(currentImages, imageUrl, index)
      await updateYipanApi({
        customer_id: customerId,
        yipan_image: updatedImages
      })
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除椅旁图片失败:", error)
      ElMessage.error("删除图片失败")
    } finally {
      loading.value = false
    }
  })
}

const handleDeleteTechnicianVideo = async (row: ProcessData, videoUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该视频？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentVideos = row.factory_technician_video || ""
      const updatedVideos = removeVideoFromUrlList(currentVideos, videoUrl, index);
      await updateFactoryTechnicianVideoApi({
        customer_id: customerId,
        factory_technician_video: updatedVideos
      })

      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除进度视频失败:", error)
      ElMessage.error("删除进度视频失败")
    } finally {
      loading.value = false
    }
  })
}

const handleDeleteWebVideo = async (row: ProcessData, videoUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该视频？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentVideos = row.factory_web_video || ""
      const updatedVideos = removeVideoFromUrlList(currentVideos, videoUrl, index)

      await updateFactoryWebVideoApi({
        customer_id: customerId,
        factory_web_video: updatedVideos
      })

      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除视频失败:", error)
      ElMessage.error("删除视频失败")
    } finally {
      loading.value = false
    }
  })
}

const handleDeleteChairsideVideo = async (row: ProcessData, videoUrl: string, index: number) => {
  if (!row.customer_id) {
    ElMessage.error("缺少客户ID")
    return
  }

  const customerId = row.customer_id
  ElMessageBox.confirm("确认删除该视频？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      const currentVideos = row.chairside_video || ""
      const updatedVideos = removeVideoFromUrlList(currentVideos, videoUrl, index)

      await updateChairsideVideoApi({
        customer_id: customerId,
        chairside_video: updatedVideos
      })

      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除椅旁视频失败:", error)
      ElMessage.error("删除椅旁视频失败")
    } finally {
      loading.value = false
    }
  })
}

// 将图片URL转换为base64
const imageToBase64 = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('图片转换失败:', error);
    return null;
  }
}

const handleMultipleImages = async (jsonString: string, worksheet: ExcelJS.Worksheet, row: number, col: number, workbook: ExcelJS.Workbook) => {
  if (!jsonString) return;
  try {
    // const images = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    const images = jsonString.split(',');
    // 过滤掉视频文件
    const imageUrls = images.filter((url: string) => {
      const lowerUrl = url.toLowerCase();
      return lowerUrl.endsWith('.jpg') ||
        lowerUrl.endsWith('.jpeg') ||
        lowerUrl.endsWith('.png') ||
        lowerUrl.endsWith('.gif');
    });
    console.log('imageUrls', imageUrls);

    if (imageUrls.length === 0) return;
    // worksheet.getColumn(col).width = imageUrls.length * 14.3; // 100px ≈ 14.3 width
    // worksheet.getRow(row).height = 100;
    worksheet.getColumn(col).width = 14.3; // 固定100px宽
    worksheet.getRow(row).height = 100 * imageUrls.length; // 高度为n*100px

    for (let i = 0; i < imageUrls.length; i++) {
      const base64 = await imageToBase64(imageUrls[i]) as string;
      if (base64) {
        console.log('base64', base64);
        const imageId = workbook.addImage({
          base64: base64.split(',')[1],
          extension: 'jpeg',
        });
        //  tl: { col: col + i, row: row - 1 },
        // br: { col: col + i + 1, row: row }
        worksheet.addImage(imageId, {
          tl: { col: col, row: row - 1 + i / imageUrls.length } as any,
          br: { col: col + 1, row: row - 1 + (i + 1) / imageUrls.length } as any
        });
      }
    }
  } catch (error) {
    console.error('处理多张图片失败:', error);
  }
}


const generateMockExcelData = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('客户信息');

    // 设置列宽
    worksheet.columns = [
      { header: '客户名称', key: 'customer_name', width: 15 },
      { header: '进度', key: 'progress', width: 15 },
      { header: '戴牙时间', key: 'wear_time', width: 15 },
      { header: '备牙时间', key: 'preparation_time', width: 15 },
      { header: '技工师', key: 'technician', width: 15 },
      { header: '椅旁医生', key: 'chairside_doctor', width: 15 },
      { header: '材料与数量', key: 'material', width: 15 },
      { header: '边缘就位', key: 'edge_seating', width: 15 },
      { header: '咬合状态', key: 'occlusion_status', width: 15 },
      { header: '颜色质地', key: 'color_status', width: 15 },
      { header: '当日戴牙', key: 'daily_wear_status', width: 15 },
      { header: '备注', key: 'remark', width: 15 },
      { header: '图片列表', key: 'images', width: 15 },
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCCCCC' }
    };
    for (let i = 0; i < allTableData.value.length; i++) {
      const row = allTableData.value[i] as any
      row["progress"] = getProgressLabel(row.progress);
      row["material"] = formatMaterials(row.materials);
      row["edge_seating"] = formatEdgeSeating(row.edge_seating);
      row["occlusion_status"] = formatOcclusionStatus(row.occlusion_status);
      row["daily_wear_status"] = formatDailyWearStatus(row.daily_wear_status);
      row["color_status"] = formatOcclusionStatus(row.color_status);
      row["images"] = "";
      console.log('row', row);
      const dataRow = worksheet.addRow(row);
      dataRow.height = 100;
      dataRow.alignment = { vertical: 'middle', horizontal: 'center' };
      const rowNum = dataRow.number;
      await handleMultipleImages(row.factory_image, worksheet, rowNum, 12, workbook);
    }
    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  } catch (error) {

  } finally {
  }
}

const handleExport = async () => {  // 生成Excel文件
  const blob = await generateMockExcelData();

  // 创建下载链接
  const url = window.URL.createObjectURL(blob as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `工厂客户进度_${new Date().toLocaleDateString()}.xlsx`;

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

}



onMounted(() => {
  loadUserList()
  getTableData()
})
</script>

<template>
  <div class="app-container">

    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div style="display: flex; align-items: center; gap: 12px;">
          <el-input v-model="searchData.customer_name" placeholder="请输入客户名称" clearable style="width: 200px;"
            @keyup.enter="handleSearch">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-select v-model="searchData.progress" placeholder="请选择进度" clearable style="width: 200px;">
            <el-option v-for="item in progressOptions" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
          <el-date-picker v-model="searchData.wear_time" type="date" format="MM-DD" value-format="MM-DD"
            placeholder="戴牙日期" clearable style="width: 140px" />
          <el-date-picker v-model="searchData.preparation_time" type="date" format="MM-DD" value-format="MM-DD"
            placeholder="备牙日期" clearable style="width: 140px" />
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>

        </div>
        <div>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
            批量删除 ({{ selectedRows.length }})
          </el-button>
          <el-button type="primary" @click="handleExport">导出</el-button>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <el-button type="primary" @click="openProcessHistoryByDate">进度记录</el-button>
        <el-button type="primary" @click="openChairsideHistoryByDate">椅旁记录</el-button>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" row-key="id" v-loading="loading" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="45" align="center" fixed="left" />
          <!-- <el-table-column prop="id" label="ID" width="60" align="center" fixed="left" /> -->
          <el-table-column prop="customer_name" label="客户名称" align="center" fixed="left" />
          <el-table-column prop="progress" label="进度" align="center" fixed="left" width="130">
            <template #default="{ row }">
              <el-select :model-value="row.progress" placeholder="进度" size="medium" style="width: 118px"
                :disabled="savingProgressId === row.id" @change="(v) => handleProgressChange(row, v)">
                <el-option v-for="item in progressOptions" :key="item.key" :label="item.label" :value="item.key" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="wear_time" label="戴牙时间" align="center" fixed="left" width="150">
            <template #default="{ row }">
              <el-date-picker v-if="row.customer_id" :model-value="row.wear_time || null" type="date" format="MM-DD"
                value-format="MM-DD" placeholder="日期" size="medium" clearable style="width: 100px"
                :disabled="savingWearTimeCustomerId === row.customer_id"
                @update:model-value="(v) => handleWearTimeChange(row, v)" />
              <span v-else>{{ row.wear_time ? row.wear_time : "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" align="left">
            <template #default="{ row }">
              <span v-if="row.remark" style="white-space: normal; word-break: break-word;">{{ row.remark }}</span>
              <span v-else-if="row.customer_remark" style="white-space: normal; word-break: break-word;">{{
                row.customer_remark }}</span>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>


          <el-table-column label="进度记录" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="handleProgressRecord(row)">进度记录</el-button>
            </template>
          </el-table-column>
          <el-table-column label="椅旁记录" width="100" align="center">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="handleChairsideRecord(row)">椅旁记录</el-button>
            </template>
          </el-table-column>
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
          <el-table-column prop="edge_seating" label="边缘就位" align="center" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.edge_seating === 1" type="success">已就位</el-tag>
              <el-tag v-else-if="row.edge_seating === 0" type="warning">未就位</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="color_status" label="颜色质地" align="center" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.color_status === 1" type="success">正常</el-tag>
              <el-tag v-else-if="row.color_status === 0" type="danger">不正常</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="occlusion_status" label="咬合状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.occlusion_status === 1" type="success">正常</el-tag>
              <el-tag v-else-if="row.occlusion_status === 0" type="danger">不正常</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="daily_wear_status" label="当日戴牙" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.daily_wear_status === 1" type="success">已戴牙</el-tag>
              <el-tag v-else-if="row.daily_wear_status === 0" type="warning">未戴牙</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="factory_web_video" label="视频" min-width="280" align="left">
            <template #default="{ row }">
              <div v-if="row.factory_web_video"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(videoUrl, index) in getVideoList(row.factory_web_video)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-button type="primary" size="small" @click="handlePlayVideo(videoUrl)" style="padding: 4px 8px;">
                    <el-icon style="margin-right: 0px;">
                      <VideoPlay />
                    </el-icon>
                    {{ index + 1 }}
                  </el-button>
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteWebVideo(row, videoUrl, index)" style="padding: 4px;" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="factory_technician_video" label="进度视频" min-width="280" align="left">
            <template #default="{ row }">
              <div v-if="row.factory_technician_video"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(videoUrl, index) in getVideoList(row.factory_technician_video)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-button type="primary" size="small" @click="handlePlayVideo(videoUrl)" style="padding: 4px 8px;">
                    <el-icon style="margin-right: 0px;">
                      <VideoPlay />
                    </el-icon>
                    {{ index + 1 }}
                  </el-button>
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteTechnicianVideo(row, videoUrl, index)" style="padding: 4px;" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="progress_note" label="进度问题描述" min-width="180" align="left" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.progress_note || '-' }}</span>
            </template>
          </el-table-column>



          <el-table-column prop="factory_mini_image" label="进度图片" min-width="280" align="left">
            <template #default="{ row }">
              <div v-if="row.factory_mini_image"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(imageUrl, index) in getVideoList(row.factory_mini_image)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-image :src="imageUrl" :preview-src-list="getVideoList(row.factory_mini_image)"
                    :initial-index="index" fit="cover"
                    style="width: 40px; height: 40px; cursor: pointer; border-radius: 4px;" preview-teleported />
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteFactoryMiniImage(row, imageUrl, index)" style="padding: 4px;" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="chairside_note" label="椅旁问题描述" min-width="180" align="left" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.chairside_note || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="yipan_image" label="椅旁图片" min-width="280" align="left">
            <template #default="{ row }">
              <div v-if="row.yipan_image"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(imageUrl, index) in getVideoList(row.yipan_image)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-image :src="imageUrl" :preview-src-list="getVideoList(row.yipan_image)"
                    :initial-index="index" fit="cover"
                    style="width: 40px; height: 40px; cursor: pointer; border-radius: 4px;" preview-teleported />
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteYipanImage(row, imageUrl, index)" style="padding: 4px;" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>








          <el-table-column prop="preparation_time" label="备牙时间" align="center">
            <template #default="{ row }">
              {{ row.preparation_time ? row.preparation_time : '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="technician" label="技工师" align="center" />
          <el-table-column prop="chairside_doctor" label="椅旁医生" align="center" />

          <el-table-column prop="factory_image" label="图片" min-width="260" align="left">
            <template #default="{ row }">
              <div v-if="row.factory_image"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(imageUrl, index) in getVideoList(row.factory_image)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-image :src="imageUrl" :preview-src-list="getVideoList(row.factory_image)" :initial-index="index"
                    fit="cover" style="width: 40px; height: 40px; cursor: pointer; border-radius: 4px;"
                    preview-teleported />
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteImage(row, imageUrl, index)" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>

          <el-table-column prop="chairside_video" label="椅旁视频" min-width="270" align="left">
            <template #default="{ row }">
              <div v-if="row.chairside_video"
                style="display: flex; gap: 6px; justify-content: flex-start; flex-wrap: wrap; align-items: flex-start;">
                <div v-for="(videoUrl, index) in getVideoList(row.chairside_video)" :key="index"
                  style="display: flex; align-items: center; gap: 4px;">
                  <el-button type="primary" size="small" @click="handlePlayVideo(videoUrl)" style="padding: 4px 8px;">
                    <el-icon style="margin-right: 0px;">
                      <VideoPlay />
                    </el-icon>
                    {{ index + 1 }}
                  </el-button>
                  <el-button type="danger" size="small" :icon="Delete" circle
                    @click="handleDeleteChairsideVideo(row, videoUrl, index)" style="padding: 4px;" />
                </div>
              </div>
              <span v-else style="color: #999;">-</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="400" align="center">
            <template #default="{ row }">
              <div style="display: flex; flex-direction: row; align-items: center;">
                <!-- <el-button type="primary" text size="small" @click="handleProgressRecord(row)">进度记录</el-button>
                <el-button type="primary" text size="small" @click="handleChairsideRecord(row)">椅旁记录</el-button> -->
                <el-upload :show-file-list="false"
                  :before-upload="(file) => { handleUploadTechnicianVideo(row, file); return false; }"
                  accept="video/mp4" style="display: inline-block;">
                  <el-button type="success" text size="small" :icon="Upload">上传进度视频</el-button>
                </el-upload>

                <el-upload :show-file-list="false"
                  :before-upload="(file) => { handleUploadWebVideo(row, file); return false; }" accept="video/mp4"
                  style="display: inline-block;">
                  <el-button type="success" text size="small" :icon="Upload">上传视频</el-button>
                </el-upload>

                <el-upload :show-file-list="false"
                  :before-upload="(file) => { handleUploadImage(row, file); return false; }" accept="image/*"
                  style="display: inline-block;">
                  <el-button type="success" text size="small" :icon="Upload">上传图片</el-button>
                </el-upload>
                <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
              </div>
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


    <ProcessHistoryDialog v-model:visible="historyDialogVisible" :customer-id="selectedCustomer.customer_id!"
      :customer-name="selectedCustomer.name" :user-map="userMap" />

    <ChairsideHistoryDialog v-model:visible="chairsideHistoryDialogVisible"
      :customer-id="selectedCustomer.customer_id!"
      :customer-name="selectedCustomer.name" :user-map="userMap" />

    <ProcessHistoryByDateDialog v-model:visible="processHistoryByDateVisible" :user-map="userMap" />
    <ChairsideHistoryByDateDialog v-model:visible="chairsideHistoryByDateVisible" :user-map="userMap" />

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
    display: flex;
    justify-content: space-between;
    align-items: center;
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
