<template>
  <div class="user-management-page">
    <!-- 筛选区域 -->
    <a-card class="search-card" size="small">
      <a-form :layout="searchFormLayout" :model="searchForm" class="search-form">
        <div class="search-controls">
          <a-form-item label="用户名">
            <a-input v-model:value="searchForm.username" placeholder="请输入用户名" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="邮箱">
            <a-input v-model:value="searchForm.email" placeholder="请输入邮箱" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="角色">
            <a-select
              v-model:value="selectedRole"
              placeholder="全部"
              allow-clear
              class="search-field search-select"
            >
              <a-select-option v-for="role in roleOptions" :key="role" :value="role">
                {{ role }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="状态">
            <a-select
              v-model:value="selectedStatus"
              placeholder="全部"
              allow-clear
              class="search-field search-select"
            >
              <a-select-option value="active">活跃</a-select-option>
              <a-select-option value="inactive">禁用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item class="search-actions">
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button class="btn-reset" @click="resetSearch">重置</a-button>
          </a-form-item>
        </div>
      </a-form>
    </a-card>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="总用户数" :value="filteredData.length" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="活跃用户" :value="stats.active" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="管理员" :value="stats.admins" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="普通用户" :value="stats.users" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 操作栏 -->
    <a-card class="table-card" :bordered="false">
      <template #title>
        <div class="table-header">
          <span class="page-title">用户管理</span>
          <div class="table-actions">
            <a-button type="primary" @click="handleAddUser">添加用户</a-button>
            <a-button @click="handleRefresh">刷新</a-button>
          </div>
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="filteredData"
        :row-selection="rowSelection"
        :pagination="tablePagination"
        :scroll="{ x: 'max-content' }"
        :size="tableSize"
        row-key="id"
        bordered
        class="user-table"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusTagColor(record.status)">
              {{ record.status === 'active' ? '活跃' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-tag :color="roleTagColor(record.role)">
              {{ record.role }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-buttons">
              <a-button size="small" type="primary" @click="handleEditUser(record)">
                编辑
              </a-button>
              <a-button size="small" danger @click="handleDeleteUser(record.id)">
                删除
              </a-button>
            </div>
          </template>
          <template v-else>
            {{ text ?? '--' }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑用户模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑用户' : '添加用户'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="userForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="邮箱" required>
          <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model:value="userForm.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">普通用户</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" required>
          <a-select v-model:value="userForm.status" placeholder="请选择状态">
            <a-select-option value="active">活跃</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { TableProps } from 'ant-design-vue'
import { Grid } from 'ant-design-vue'

// 用户数据类型
interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLogin: string
}

// 模拟用户数据
const mockUserList: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01',
    lastLogin: '2026-04-10'
  },
  {
    id: '2',
    username: 'user1',
    email: 'user1@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-02',
    lastLogin: '2026-04-09'
  },
  {
    id: '3',
    username: 'user2',
    email: 'user2@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2026-01-03',
    lastLogin: '2026-03-15'
  },
  {
    id: '4',
    username: 'user3',
    email: 'user3@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-04',
    lastLogin: '2026-04-08'
  },
  {
    id: '5',
    username: 'user4',
    email: 'user4@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-05',
    lastLogin: '2026-04-07'
  },
  {
    id: '6',
    username: 'user5',
    email: 'user5@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2026-01-06',
    lastLogin: '2026-03-10'
  },
  {
    id: '7',
    username: 'user6',
    email: 'user6@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-07',
    lastLogin: '2026-04-06'
  },
  {
    id: '8',
    username: 'user7',
    email: 'user7@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-08',
    lastLogin: '2026-04-05'
  },
  {
    id: '9',
    username: 'user8',
    email: 'user8@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-09',
    lastLogin: '2026-04-04'
  },
  {
    id: '10',
    username: 'user9',
    email: 'user9@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2026-01-10',
    lastLogin: '2026-03-01'
  }
]

// 响应式数据
const dataSource = ref<User[]>([...mockUserList])

// 筛选表单
const searchForm = reactive({
  username: '',
  email: ''
})

// 筛选条件
const selectedRole = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)

// 分页配置
const pagination = reactive({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// 表格配置
const selectedRowKeys = ref<string[]>([])

// 响应式布局
const screens = Grid.useBreakpoint()
const searchFormLayout = computed(() => (screens.value?.md ? 'inline' : 'vertical'))
const tableSize = computed(() => (screens.value?.md ? 'middle' : 'small'))
const tablePagination = computed(() => ({
  pageSize: pagination.pageSize,
  showSizeChanger: false,
  showQuickJumper: !!screens.value?.md,
  showTotal: pagination.showTotal,
  simple: !screens.value?.md,
}))

// 模态框配置
const modalVisible = ref(false)
const isEditing = ref(false)
const userForm = reactive({
  id: '',
  username: '',
  email: '',
  role: 'user',
  status: 'active'
})

// 计算属性：角色选项
const roleOptions = computed(() => {
  const roles = dataSource.value
    .map(item => item.role)
    .filter(role => role && role.trim() !== '')
  return [...new Set(roles)]
})

// 计算属性：筛选后的数据
const filteredData = computed(() => {
  let result = [...dataSource.value]

  // 用户名筛选
  if (searchForm.username) {
    result = result.filter(item => 
      item.username && item.username.includes(searchForm.username)
    )
  }

  // 邮箱筛选
  if (searchForm.email) {
    result = result.filter(item => 
      item.email && item.email.includes(searchForm.email)
    )
  }

  // 角色筛选
  if (selectedRole.value) {
    result = result.filter(item => item.role === selectedRole.value)
  }

  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(item => item.status === selectedStatus.value)
  }

  return result
})

// 计算属性：统计信息
const stats = computed(() => {
  const total = filteredData.value.length
  const active = filteredData.value.filter(item => item.status === 'active').length
  const admins = filteredData.value.filter(item => item.role === 'admin').length
  const users = filteredData.value.filter(item => item.role === 'user').length
  
  return { total, active, admins, users }
})

// 表格列配置
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120, fixed: 'left' as const },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
  { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 120 },
  { 
    title: '操作', 
    key: 'actions', 
    width: 120, 
    fixed: 'right' as const,
    slots: { customRender: 'actions' }
  }
]

// 工具函数
function statusTagColor(status: string) {
  return status === 'active' ? 'green' : 'red'
}

function roleTagColor(role: string) {
  return role === 'admin' ? 'blue' : 'default'
}

// 行选择配置
const rowSelection = computed<TableProps['rowSelection']>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: (string | number)[]) => {
    selectedRowKeys.value = keys as string[]
  },
}))

// 事件处理
const handleSearch = () => {
  // 筛选逻辑已在 computed 中处理
  message.success('查询完成')
}

const resetSearch = () => {
  searchForm.username = ''
  searchForm.email = ''
  selectedRole.value = null
  selectedStatus.value = null
  message.success('重置完成')
}

const handleRefresh = () => {
  // 模拟刷新数据
  dataSource.value = [...mockUserList]
  message.success('数据已刷新')
}

const handleAddUser = () => {
  isEditing.value = false
  Object.assign(userForm, {
    id: '',
    username: '',
    email: '',
    role: 'user',
    status: 'active'
  })
  modalVisible.value = true
}

const handleEditUser = (user: User) => {
  isEditing.value = true
  Object.assign(userForm, user)
  modalVisible.value = true
}

const handleDeleteUser = (id: string) => {
  // 模拟删除操作
  dataSource.value = dataSource.value.filter(user => user.id !== id)
  message.success('用户已删除')
}

const handleModalOk = () => {
  if (!userForm.username || !userForm.email) {
    message.error('请填写用户名和邮箱')
    return
  }

  if (isEditing.value) {
    // 模拟编辑操作
    const index = dataSource.value.findIndex(user => user.id === userForm.id)
    if (index !== -1) {
      dataSource.value[index] = { ...userForm as User }
    }
    message.success('用户已更新')
  } else {
    // 模拟添加操作
    const newUser: User = {
      id: (dataSource.value.length + 1).toString(),
      username: userForm.username,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0]
    }
    dataSource.value.push(newUser)
    message.success('用户已添加')
  }

  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.user-management-page {
  min-height: 100%;
  padding: 16px;
  background-color: #f0f2f5;
  box-sizing: border-box;
}

/* 筛选区域样式 */
.search-card {
  margin-bottom: 16px;
  border-radius: 4px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.search-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.search-field {
  width: 100%;
  min-width: 0;
  max-width: 280px;
}

.search-select {
  max-width: 280px;
}

.search-actions {
  margin-bottom: 0;
}

.btn-reset {
  margin-left: 8px;
}

/* 统计卡片样式 */
.stat-cards {
  margin-bottom: 16px;
}

/* 表格区域样式 */
.table-card {
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.table-actions {
  display: flex;
  gap: 8px;
}

/* 表格样式 */
.user-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}

.user-table :deep(.ant-table-tbody > tr:nth-child(even) > td) {
  background: #fafafa;
}

.user-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}

.user-table :deep(.ant-table-cell) {
  white-space: nowrap;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式适配 */
@media (max-width: 767px) {
  .user-management-page {
    padding: 12px;
  }
  
  .search-field,
  .search-select {
    max-width: none;
  }
  
  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-actions {
    display: flex;
    gap: 8px;
  }
  
  .search-actions :deep(.ant-btn) {
    flex: 1;
  }
  
  .btn-reset {
    margin-left: 0;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .table-actions {
    width: 100%;
  }
  
  .table-actions :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
