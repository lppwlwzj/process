<script lang="ts" setup>
import { ref, reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Search, Refresh, CirclePlus, Delete, Download, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@@/composables/usePagination"
import { getUserListApi, deleteUserApi, createUserApi } from "@@/apis/users"
import type { FormInstance, FormRules } from "element-plus"

interface UserData {
  id: number
  username: string
  usercount: string
  password?: string
}

interface UserFormData {
  username: string
  usercount: string
  password: string
}

const loading = ref(false)
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const tableData = ref<UserData[]>([])
const searchFormRef = ref()
const searchData = reactive({
  username: "",
  usercount: ""
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<UserFormData>({
  username: "",
  usercount: "",
  password: ""
})

const formRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "用户名长度在 2 到 20 个字符", trigger: "blur" }
  ],
  usercount: [
    { required: true, message: "请输入用户账号", trigger: "blur" },
    { min: 3, max: 20, message: "用户账号长度在 3 到 20 个字符", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" }
  ]
}

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getUserListApi()
    if (res.re) {
      tableData.value = res.re
      paginationData.total = res.re.length
    }
  } catch (error) {
    console.error("获取用户列表失败:", error)
    ElMessage.error("获取用户列表失败")
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

const handleDelete = async (row: UserData) => {
  ElMessageBox.confirm(`确认删除用户：${row.username}？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      loading.value = true
      await deleteUserApi(row.id)
      ElMessage.success("删除成功")
      getTableData()
    } catch (error) {
      console.error("删除用户失败:", error)
      ElMessage.error("删除用户失败")
    } finally {
      loading.value = false
    }
  })
}

const handleCreate = () => {
  dialogVisible.value = true
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        await createUserApi({
          username: formData.username,
          usercount: formData.usercount,
          password: formData.password
        })
        ElMessage.success("新增成功")
        dialogVisible.value = false
        resetForm()
        getTableData()
      } catch (error) {
        console.error("新增用户失败:", error)
        ElMessage.error("新增用户失败")
      } finally {
        loading.value = false
      }
    }
  })
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.username = ""
  formData.usercount = ""
  formData.password = ""
}

const handleUpdate = (row: UserData) => {
  ElMessage.info(`编辑用户：${row.username}`)
}

getTableData()
</script>

<template>
  <div class="app-container">
    <!-- <el-card shadow="never" class="search-wrapper">
      <el-form ref="searchFormRef" :inline="true" :model="searchData">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="searchData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item prop="usercount" label="用户账号">
          <el-input v-model="searchData.usercount" placeholder="请输入用户账号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card> -->
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">新增用户</el-button>
          <!-- <el-button type="danger" :icon="Delete">批量删除</el-button> -->
        </div>
        <!-- <div>
          <el-tooltip content="下载">
            <el-button type="primary" :icon="Download" circle />
          </el-tooltip>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div> -->
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading">
          <!-- <el-table-column type="selection" width="50" align="center" /> -->
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="username" label="用户名" align="center" />
          <el-table-column prop="usercount" label="用户账号" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="{ row }">
              <!-- <el-button type="primary" text size="small" @click="handleUpdate(row)">编辑</el-button> -->
              <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
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
          :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增用户" width="500px" @close="handleCloseDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="用户账号" prop="usercount">
          <el-input v-model="formData.usercount" placeholder="请输入用户账号" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading">确定</el-button>
      </template>
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
    display: flex;
    justify-content: space-between;
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

