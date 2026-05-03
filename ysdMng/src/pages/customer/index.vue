<script lang="ts" setup>
import { Search, Refresh, Download } from "@element-plus/icons-vue"
import * as XLSX from "xlsx"
import { usePagination } from "@@/composables/usePagination"
import type { YsdPhoneRow } from "@@/apis/ysd_phone"
import { getYsdPhoneListApi, updateYsdPhoneApi, deleteYsdPhoneApi } from "@@/apis/ysd_phone"
import dayjs from "dayjs"
import type { FormInstance, FormRules } from "element-plus"

const loading = ref(false)
const { paginationData, handleCurrentChange: baseHandleCurrentChange, handleSizeChange: baseHandleSizeChange } = usePagination()

const searchFormRef = ref<FormInstance>()
const searchData = reactive({
  dateRange: null as [string, string] | null,
  phone: "",
  contact_status: "" as "" | 0 | 1
})

const tableData = ref<YsdPhoneRow[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref("编辑")
const formRef = ref<FormInstance>()
const formModel = reactive({
  id: 0,
  username: "",
  phone: "",
  remark: "",
  contact_status: 0 as 0 | 1
})

const formRules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  contact_status: [{ required: true, message: "请选择状态", trigger: "change" }]
}

const buildListQuery = () => {
  const [start, end] = searchData.dateRange || ["", ""]
  const cs = searchData.contact_status
  return {
    ...(start && end ? { start_date: start, end_date: end } : {}),
    ...(searchData.phone ? { phone: searchData.phone.trim() } : {}),
    ...(cs === "" || cs === undefined ? {} : { contact_status: cs })
  }
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getYsdPhoneListApi({
      ...buildListQuery(),
      currentPage: paginationData.currentPage,
      pageSize: paginationData.pageSize
    })
    if (res.code === 0 && res.re) {
      tableData.value = res.re.list
      paginationData.total = res.re.total
    } else {
      tableData.value = []
      paginationData.total = 0
    }
  } catch (e) {
    console.error(e)
    ElMessage.error("加载列表失败")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (v: number) => {
  baseHandleCurrentChange(v)
  getTableData()
}

const handleSizeChange = (v: number) => {
  baseHandleSizeChange(v)
  paginationData.currentPage = 1
  getTableData()
}

const handleSearch = () => {
  paginationData.currentPage = 1
  getTableData()
}

const resetSearch = () => {
  searchData.dateRange = null
  searchData.phone = ""
  searchData.contact_status = ""
  paginationData.currentPage = 1
  getTableData()
}

const formatCreated = (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-")

const statusLabel = (s: number) => (Number(s) === 1 ? "已联系" : "未联系")

const openEdit = (row: YsdPhoneRow) => {
  dialogTitle.value = "编辑"
  formModel.id = row.id
  formModel.username = row.username
  formModel.phone = row.phone
  formModel.remark = row.remark || ""
  formModel.contact_status = Number(row.contact_status) === 1 ? 1 : 0
  dialogVisible.value = true
}

const handleDelete = (row: YsdPhoneRow) => {
  ElMessageBox.confirm(`确定删除「${row.username}」${row.phone} 吗？`, "提示", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消"
  })
    .then(async () => {
      try {
        const res = await deleteYsdPhoneApi(row.id)
        if (res.code === 0) {
          ElMessage.success("已删除")
          getTableData()
        } else {
          ElMessage.error(res.message || "删除失败")
        }
      } catch {
        ElMessage.error("删除失败")
      }
    })
    .catch(() => {})
}

const exportData = async () => {
  const base = buildListQuery()
  const pageSize = 100
  let page = 1
  const all: YsdPhoneRow[] = []
  try {
    while (true) {
      const res = await getYsdPhoneListApi({
        ...base,
        currentPage: page,
        pageSize
      })
      if (res.code !== 0 || !res.re) break
      all.push(...res.re.list)
      if (all.length >= res.re.total || res.re.list.length < pageSize) break
      page++
    }
    if (all.length === 0) {
      ElMessage.warning("没有可导出的数据")
      return
    }
    const rows = all.map((row, index) => ({
      序号: index + 1,
      用户名: row.username || "-",
      手机号: row.phone || "-",
      状态: statusLabel(row.contact_status),
      备注: row.remark || "-",
      新建日期: row.created_at ? dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") : "-"
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    ws["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 32 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws, "客户电话")
    const [s, e] = searchData.dateRange || ["", ""]
    const tag = s && e ? `${s}_${e}` : dayjs().format("YYYY-MM-DD")
    XLSX.writeFile(wb, `ysd客户电话_${tag}.xlsx`)
    ElMessage.success("导出成功")
  } catch (err) {
    console.error(err)
    ElMessage.error("导出失败")
  }
}

const submitEdit = () => {
  formRef.value?.validate(async (ok) => {
    if (!ok) return
    try {
      const res = await updateYsdPhoneApi({
        id: formModel.id,
        username: formModel.username.trim(),
        phone: formModel.phone.trim(),
        remark: formModel.remark.trim() || null,
        contact_status: formModel.contact_status
      })
      if (res.code === 0) {
        ElMessage.success("保存成功")
        dialogVisible.value = false
        getTableData()
      } else {
        ElMessage.error(res.message || "保存失败")
      }
    } catch {
      ElMessage.error("保存失败")
    }
  })
}

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchData.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchData.phone" placeholder="模糊搜索" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="联系状态">
          <el-select v-model="searchData.contact_status" placeholder="全部" clearable style="width: 120px">
            <el-option label="未联系" :value="0" />
            <el-option label="已联系" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button :icon="Download" @click="exportData">导出</el-button>

        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="table-wrapper">
        <el-table v-loading="loading" :data="tableData" stripe border>
          <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="phone" label="手机号" width="130" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="Number(row.contact_status) === 1 ? 'success' : 'info'" size="small">
                {{ statusLabel(row.contact_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="新建日期" min-width="170" align="center">
            <template #default="{ row }">
              {{ formatCreated(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :current-page="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close @closed="formRef?.resetFields()">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="88px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formModel.username" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formModel.phone" maxlength="32" />
        </el-form-item>
        <el-form-item label="状态" prop="contact_status">
          <el-radio-group v-model="formModel.contact_status">
            <el-radio :label="0">未联系</el-radio>
            <el-radio :label="1">已联系</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formModel.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
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

  .table-wrapper {
    margin-bottom: 20px;
  }

  .pager-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
