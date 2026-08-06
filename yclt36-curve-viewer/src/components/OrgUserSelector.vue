<template>
  <div class="org-user-selector">
    <!-- 左侧：部门树 -->
    <div class="dept-sidebar">
      <div class="dept-sidebar-title">组织架构</div>
      <a-spin :spinning="deptLoading">
        <a-tree
          v-model:selectedKeys="currentDeptKeys"
          :tree-data="departments"
          :fieldNames="{ key: 'id', title: 'name', parentid: 'parentid' }"
          @select="handleDeptSelect"
          class="dept-tree"
        />
      </a-spin>
    </div>

    <!-- 右侧：人员列表 -->
    <div class="user-panel">
      <!-- 插槽：自定义头部区域（如已选标签） -->
      <slot name="header" :selectedUserInfos="selectedUserInfos" :clearAll="clearSelection">
        <div v-if="selectedUserInfos.length" class="selected-tags-bar">
          <span class="selected-label">已选：</span>
          <a-button type="link" size="small" @click="clearSelection">清空</a-button>
          <a-tag
            v-for="user in selectedUserInfos"
            :key="user.userid"
            :closable="true"
            @close="removeSelectedUser(user.userid)"
          >
            <a-avatar :size="16" :style="{ backgroundColor: getAvatarColor(user.name) }" style="margin-right: 4px">
              {{ user.name?.charAt(0) }}
            </a-avatar>
            {{ user.name }}
          </a-tag>
        </div>
      </slot>

      <div class="user-search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索姓名、账号Id"
          allow-clear
          style="width: 100%"
          @search="handleSearch"
          @change="handleSearchChange"
        />
      </div>
      <a-table
        :columns="columns"
        :data-source="filteredUserList"
        :row-selection="rowSelectionConfig"
        :pagination="paginationConfig"
        :loading="userLoading"
        row-key="userid"
        size="small"
        class="user-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <span class="user-name-cell">
              <a-avatar :size="24" :style="{ backgroundColor: getAvatarColor(record.name) }">
                {{ record.name?.charAt(0) }}
              </a-avatar>
              {{ record.name }}
            </span>
          </template>
          <template v-else-if="column.key === 'userid'">
            <span class="userid-cell">{{ record.userid }}</span>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { TableProps, TablePaginationConfig } from 'ant-design-vue';
import { weChatWorkService, WeChatDepartment, WeChatUser } from '@/services/wechatWorkService';

// ==================== Props ====================

const props = withDefaults(
  defineProps<{
    /** 已选中的用户 ID 列表（v-model:selectedUserIds） */
    selectedUserIds?: string[];
    /** 是否显示已选标签栏（默认显示） */
    showSelectedTags?: boolean;
    /** 人员表格最大高度 */
    maxTableHeight?: string;
    /** 是否允许多选（默认 true，false 为单选 radio） */
    multiple?: boolean;
  }>(),
  {
    selectedUserIds: () => [],
    showSelectedTags: true,
    maxTableHeight: 'calc(100vh - 480px)',
    multiple: true
  }
);

// ==================== Emits ====================

const emit = defineEmits<{
  'update:selectedUserIds': [ids: string[]];
  deptChange: [deptId: string];
  userSelect: [userIds: string[]];
  /** 部门列表加载失败（含空数据） */
  deptLoadFailed: [errorMessage: string];
  /** 部门列表加载成功 */
  deptLoadSuccess: [];
}>();

// ==================== 部门数据 ====================

const departments = ref<WeChatDepartment[]>([]);
const currentDeptKeys = ref<string[]>([]);
const deptLoading = ref(false);

async function loadDepartments() {
  deptLoading.value = true;
  try {
    const list = await weChatWorkService.getDepartmentList();
    departments.value = list;
    if (!list || list.length === 0) {
      // 后端可能返回空数据但未抛错，也视为加载失败
      emit('deptLoadFailed', '未获取到组织架构数据');
    } else {
      emit('deptLoadSuccess');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '加载部门列表失败';
    emit('deptLoadFailed', msg);
    message.error(msg);
  } finally {
    deptLoading.value = false;
  }
}

async function handleDeptSelect(selectedKeys: string[]) {
  if (!selectedKeys.length) {
    deptUsers.value = [];
    currentDeptKeys.value = [];
    return;
  }
  const deptId = selectedKeys[0];
  currentDeptKeys.value = [deptId];
  emit('deptChange', deptId);
  userLoading.value = true;
  try {
    deptUsers.value = await weChatWorkService.getUserList(Number(deptId));
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载人员列表失败');
  } finally {
    userLoading.value = false;
  }
}

// ==================== 用户数据 ====================

const deptUsers = ref<WeChatUser[]>([]);
const userLoading = ref(false);
const searchKeyword = ref('');

const filteredUserList = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim();
  if (!keyword) return deptUsers.value;
  return deptUsers.value.filter(
    (user) => user.name.toLowerCase().includes(keyword) || user.userid.toLowerCase().includes(keyword)
  );
});

// ==================== 所有用户（用于显示已选标签） ====================

const allUsers = ref<WeChatUser[]>([]);

async function loadAllUsers() {
  try {
    allUsers.value = await weChatWorkService.getUserList(1);
  } catch {
    // 静默失败
  }
}

const selectedUserInfos = computed(() => {
  if (!props.selectedUserIds.length) return [];
  return allUsers.value.filter((u) => props.selectedUserIds.includes(u.userid));
});

// ==================== 表格配置 ====================

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 180 },
  { title: '账号Id', dataIndex: 'userid', key: 'userid', width: 160 }
];

const rowSelectionConfig = computed<TableProps['rowSelection']>(() => ({
  type: props.multiple ? 'checkbox' : 'radio',
  selectedRowKeys: props.selectedUserIds,
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    // 单选模式下只保留最后一项
    const finalKeys = props.multiple ? (keys as string[]) : (keys as string[]).slice(-1);
    emit('update:selectedUserIds', finalKeys);
    emit('userSelect', finalKeys);
  }
}));

const paginationConfig = reactive({
  current: 1,
  pageSize: 5,
  showSizeChanger: true,
  pageSizeOptions: ['5', '10', '20'],
  showTotal: (total: number) => `共 ${total} 条`,
  size: 'small' as const
});

// ==================== 事件处理 ====================

function handleSearch() {
  paginationConfig.current = 1;
}

function handleSearchChange() {
  paginationConfig.current = 1;
}

function handleTableChange(pag: TablePaginationConfig) {
  paginationConfig.current = pag.current ?? paginationConfig.current;
  paginationConfig.pageSize = pag.pageSize ?? paginationConfig.pageSize;
}

function removeSelectedUser(userId: string) {
  const newIds = props.selectedUserIds.filter((id) => id !== userId);
  emit('update:selectedUserIds', newIds);
  emit('userSelect', newIds);
}

function clearSelection() {
  emit('update:selectedUserIds', []);
  emit('userSelect', []);
}

// ==================== 工具函数 ====================

function getAvatarColor(name: string): string {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ==================== 暴露方法 ====================

defineExpose({
  loadDepartments,
  loadAllUsers,
  clearSelection,
  deptUsers,
  searchKeyword
});

// 监听外部 selectedUserIds 变化，自动加载全量用户
watch(
  () => props.selectedUserIds,
  (ids) => {
    if (ids.length > 0 && allUsers.value.length === 0) {
      loadAllUsers();
    }
  }
);

onMounted(() => {
  loadDepartments();
  loadAllUsers();
});
</script>

<style scoped>
.org-user-selector {
  display: flex;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  min-height: 300px;
}

/* 左侧部门树 */
.dept-sidebar {
  flex: 3 1 0;
  min-width: 180px;
  padding: 8px;
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.dept-sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.dept-tree {
  flex: 1;
  overflow-y: auto;
}

.dept-tree :deep(.ant-tree-node-content-wrapper) {
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
}

.dept-tree :deep(.ant-tree-node-selected .ant-tree-node-content-wrapper) {
  background-color: #e6f7ff !important;
  color: #1890ff;
}

/* 右侧人员面板 */
.user-panel {
  flex: 7 1 0;
  min-width: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selected-tags-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.selected-label {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  white-space: nowrap;
}

.user-search-bar {
  margin-bottom: 8px;
  flex-shrink: 0;
}

.user-table {
  flex: 1;
  overflow: auto;
}

.user-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}

.user-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}

.user-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.userid-cell {
  word-break: break-all;
  line-height: 1.4;
}

/* 响应式：窄屏时上下布局 */
@media (max-width: 576px) {
  .org-user-selector {
    flex-direction: column;
  }
  .dept-sidebar {
    width: 100%;
    flex: 0 0 auto;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }
  .user-panel {
    flex: 1 1 auto;
    min-height: 350px;
  }
}
</style>
