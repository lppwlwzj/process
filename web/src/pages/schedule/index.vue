<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { CirclePlus, Edit, Delete, Search, Refresh } from "@element-plus/icons-vue"
import { getScheduleListApi, createScheduleApi, updateScheduleApi, deleteScheduleApi, getScheduleDetailApi } from "@@/apis/schedule"
import { getUserListApi } from "@@/apis/users"
import { getCustomerListApi } from "@@/apis/customers"
import type { FormInstance, FormRules } from "element-plus"
import type { ScheduleData } from "@@/apis/schedule/type"
import dayjs from "dayjs"
import * as XLSX from "xlsx"

interface UserData {
  id: number
  username: string
  usercount: string
  role?: string
}

interface CustomerData {
  id: number
  customer_name: string
}

const projectOptions = [
  { value: "依口", label: "依口" },
  { value: "固定修复", label: "固定修复" },
  { value: "活动修复", label: "活动修复" },
  { value: "其他", label: "其他" }
]

const roomOptions = [
  { value: "诊室1", label: "诊室1" },
  { value: "诊室2", label: "诊室2" },
  { value: "诊室3", label: "诊室3" },
  { value: "诊室4", label: "诊室4" }
]

const loading = ref(false)
const tableData = ref<ScheduleData[]>([])
const doctorList = ref<UserData[]>([])
const nurseList = ref<UserData[]>([])
const customerList = ref<CustomerData[]>([])
const searchFormRef = ref()
const searchData = reactive({
  dateRange: null as [string, string] | null,
  doctor_id: undefined as number | undefined
})

const dialogVisible = ref(false)
const dialogTitle = ref("")
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<ScheduleData>({
  id: 0,
  project: "",
  doctor_id: 0,
  nurse_id: undefined,
  customer_id: 0,
  room: "",
  start_time: "",
  duration: 0,
  end_time: "",
  remark: ""
})

const formRules: FormRules = {
  project: [
    { required: true, message: "请选择项目", trigger: "change" }
  ],
  doctor_id: [
    { required: true, message: "请选择医生", trigger: "change" }
  ],
  customer_id: [
    { required: true, message: "请选择客户", trigger: "change" }
  ],
  room: [
    { required: true, message: "请选择诊室", trigger: "change" }
  ],
  start_time: [
    { required: true, message: "请选择开始时间", trigger: "change" }
  ],
  duration: [
    { required: true, message: "请输入时长", trigger: "blur" },
    { type: "number", min: 1, message: "时长必须大于0", trigger: "blur" }
  ]
}

const groupedScheduleData = computed(() => {
  const grouped: Record<string, ScheduleData[]> = {}
  
  tableData.value.forEach(item => {
    const dateKey = dayjs(item.start_time).format("YYYY-MM-DD")
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(item)
  })
  
  return Object.keys(grouped)
    .sort()
    .map(date => ({
      date,
      schedules: grouped[date].sort((a, b) => 
        dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
      )
    }))
})

const filteredScheduleData = computed(() => {
  let filtered = groupedScheduleData.value
  
  if (searchData.dateRange && searchData.dateRange.length === 2) {
    const [startDate, endDate] = searchData.dateRange
    filtered = filtered.filter(item => {
      return item.date >= startDate && item.date <= endDate
    })
  }
  
  if (searchData.doctor_id) {
    filtered = filtered.map(item => ({
      ...item,
      schedules: item.schedules.filter(s => s.doctor_id === searchData.doctor_id)
    })).filter(item => item.schedules.length > 0)
  }
  
  return filtered
})

const endTimeDisplay = computed(() => {
  if (!formData.start_time || !formData.duration) {
    return ""
  }
  const start = dayjs(formData.start_time)
  const end = start.add(formData.duration, "minute")
  return end.format("YYYY-MM-DD HH:mm")
})

onMounted(() => {
  getTableData()
  loadUserList()
  loadCustomerList()
})

const getTableData = async () => {
  loading.value = true
  try {
    const res: any = await getScheduleListApi({
      dateRange: searchData.dateRange || undefined,
      doctor_id: searchData.doctor_id
    })
    if (res && res.re) {
      tableData.value = res.re
    }
  } catch (error) {
    console.error("获取排班列表失败:", error)
    ElMessage.error("获取排班列表失败")
  } finally {
    loading.value = false
  }
}

const loadUserList = async () => {
  try {
    const res = await getUserListApi()
    if (res.re) {
      doctorList.value = res.re.filter((user: UserData) => user.role === "医生椅旁技师")
      nurseList.value = res.re.filter((user: UserData) => user.role === "其他人员")
    }
  } catch (error) {
    console.error("获取用户列表失败:", error)
  }
}

const loadCustomerList = async () => {
  try {
    const res = await getCustomerListApi()
    if (res.re) {
      customerList.value = res.re
    }
  } catch (error) {
    console.error("获取客户列表失败:", error)
  }
}

const handleSearch = () => {
  getTableData()
}

const resetSearch = () => {
  searchData.dateRange = null
  searchData.doctor_id = undefined
  getTableData()
}

const handleExport = async () => {
  if (!searchData.dateRange || searchData.dateRange.length !== 2) {
    ElMessage.warning("请选择日期范围")
    return
  }

  try {
    loading.value = true
    const res: any = await getScheduleListApi({
      dateRange: searchData.dateRange,
      doctor_id: searchData.doctor_id
    })

    if (!res || !res.re || res.re.length === 0) {
      ElMessage.warning("所选日期范围内没有排班数据")
      return
    }

    const exportData = res.re
      .sort((a: ScheduleData, b: ScheduleData) => {
        return dayjs(b.start_time).valueOf() - dayjs(a.start_time).valueOf()
      })
      .map((item: ScheduleData) => {
        const { created_at, updated_at, ...rest } = item
        return {
          id: rest.id,
          project: rest.project,
          doctor_name: rest.doctor_name || "",
          nurse_name: rest.nurse_name || "",
          customer_name: rest.customer_name || "",
          room: rest.room || "",
          start_time: rest.start_time,
          duration: rest.duration,
          end_time: rest.end_time,
          remark: rest.remark || ""
        }
      })

    const excelData = exportData.map((row: any) => ({
      ID: row.id,
      项目: row.project,
      医生: row.doctor_name || "",
      护士: row.nurse_name || "",
      客户姓名: row.customer_name,
      诊室: row.room || "",
      开始时间: dayjs(row.start_time).format("YYYY-MM-DD HH:mm:ss"),
      时长分钟: row.duration,
      结束时间: dayjs(row.end_time).format("YYYY-MM-DD HH:mm:ss"),
      备注: row.remark || ""
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const colWidths = [
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 30 }
    ]
    ws["!cols"] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, "排班数据")

    const fileName = `排班数据_${searchData.dateRange[0]}_${searchData.dateRange[1]}_${dayjs().format("YYYYMMDDHHmmss")}.xlsx`
    XLSX.writeFile(wb, fileName)

    ElMessage.success("导出成功")
  } catch (error) {
    console.error("导出失败:", error)
    ElMessage.error("导出失败，请重试")
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = "新增排班"
  isEdit.value = false
  Object.assign(formData, {
    id: 0,
    project: "",
    doctor_id: 0,
    nurse_id: undefined,
    customer_id: 0,
    room: "",
    start_time: "",
    duration: 0,
    end_time: "",
    remark: ""
  })
  dialogVisible.value = true
}

const handleEdit = async (row: ScheduleData) => {
  dialogTitle.value = "编辑排班"
  isEdit.value = true
  try {
    const res: any = await getScheduleDetailApi(row.id)
    if (res.re) {
      Object.assign(formData, {
        ...res.re,
        start_time: dayjs(res.re.start_time).format("YYYY-MM-DDTHH:mm")
      })
      dialogVisible.value = true
    }
  } catch (error) {
    console.error("获取排班详情失败:", error)
    ElMessage.error("获取排班详情失败")
  }
}

const handleDelete = async (row: ScheduleData) => {
  ElMessageBox.confirm(`确认删除该排班记录？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      await deleteScheduleApi(row.id)
      ElMessage.success("删除成功")
      getTableData()
    } catch (error: any) {
      console.error("删除排班失败:", error)
      ElMessage.error(error?.message || "删除排班失败")
    } finally {
      loading.value = false
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      const submitData: any = {
        ...formData,
        start_time: dayjs(formData.start_time).format("YYYY-MM-DD HH:mm:ss")
      }
      
      if (isEdit.value) {
        await updateScheduleApi(submitData as any)
        ElMessage.success("更新成功")
      } else {
        await createScheduleApi(submitData as any)
        ElMessage.success("创建成功")
      }
      
      dialogVisible.value = false
      getTableData()
    } catch (error: any) {
      console.error("保存排班失败:", error)
      ElMessage.error(error?.message || "保存排班失败")
    } finally {
      loading.value = false
    }
  })
}

const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format("YYYY-MM-DD HH:mm")
}

const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD")
}
</script>

<template>
  <div class="schedule-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班管理</span>
          <!-- <el-button type="primary" :icon="CirclePlus" @click="handleAdd">新增排班</el-button> -->
        </div>
      </template>

      <el-form ref="searchFormRef" :model="searchData" inline class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchData.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 300px"
          />
        </el-form-item>
        <!-- <el-form-item label="医生">
          <el-select
            v-model="searchData.doctor_id"
            placeholder="选择医生"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="doctor in doctorList"
              :key="doctor.id"
              :label="doctor.username"
              :value="doctor.id"
            />
          </el-select>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleExport">导出</el-button>
          <!-- <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button> -->
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- <el-table
        :data="filteredScheduleData"
        v-loading="loading"
        row-key="date"
        :default-expand-all="false"
        border
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-table :data="row.schedules" border style="margin: 10px 0">
              <el-table-column prop="start_time" label="开始时间" width="180">
                <template #default="{ row: schedule }">
                  {{ formatDateTime(schedule.start_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="end_time" label="结束时间" width="180">
                <template #default="{ row: schedule }">
                  {{ formatDateTime(schedule.end_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="project" label="项目" width="120" />
              <el-table-column prop="doctor_name" label="医生" width="120" />
              <el-table-column prop="nurse_name" label="护士" width="120">
                <template #default="{ row: schedule }">
                  {{ schedule.nurse_name || "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="customer_name" label="客户" width="120" />
              <el-table-column prop="room" label="诊室" width="100" />
              <el-table-column prop="remark" label="备注" min-width="150">
                <template #default="{ row: schedule }">
                  {{ schedule.remark || "-" }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row: schedule }">
                  <el-button type="primary" text :icon="Edit" size="small" @click="handleEdit(schedule)">编辑</el-button>
                  <el-button type="danger" text :icon="Delete" size="small" @click="handleDelete(schedule)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="150">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column label="排班数量" width="120">
          <template #default="{ row }">
            {{ row.schedules.length }} 条
          </template>
        </el-table-column>
      </el-table> -->
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="formRef?.resetFields()">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="项目" prop="project">
          <el-select v-model="formData.project" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="item in projectOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="医生" prop="doctor_id">
          <el-select v-model="formData.doctor_id" placeholder="请选择医生" style="width: 100%">
            <el-option
              v-for="doctor in doctorList"
              :key="doctor.id"
              :label="doctor.username"
              :value="doctor.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="护士" prop="nurse_id">
          <el-select v-model="formData.nurse_id" placeholder="请选择护士（可选）" clearable style="width: 100%">
            <el-option
              v-for="nurse in nurseList"
              :key="nurse.id"
              :label="nurse.username"
              :value="nurse.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户" prop="customer_id">
          <el-select v-model="formData.customer_id" placeholder="请选择客户" style="width: 100%">
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.customer_name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="诊室" prop="room">
          <el-select v-model="formData.room" placeholder="请选择诊室" style="width: 100%">
            <el-option v-for="item in roomOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="formData.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时长（分钟）" prop="duration">
          <el-input-number v-model="formData.duration" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-input :value="endTimeDisplay" disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注（可选）" maxlength="1000"
            show-word-limit style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.schedule-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
