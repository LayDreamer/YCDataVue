<template>
  <div class="work-order-page">
    <!-- 筛选区域 -->
    <a-card class="search-card" size="small">
      <a-form :layout="searchFormLayout" :model="searchForm" class="search-form">
        <div class="search-controls">
          <a-form-item label="工单单号">
            <a-input v-model:value="searchForm.workOrderNo" placeholder="请输入工单单号" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="成品编号">
            <a-input v-model:value="searchForm.productNo" placeholder="请输入成品编号" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="生产单位">
            <a-select
              v-model:value="selectedProductionUnit"
              placeholder="全部"
              allow-clear
              class="search-field search-select"
            >
              <a-select-option v-for="unit in productionUnitOptions" :key="unit" :value="unit">
                {{ unit }}
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
              <a-select-option value="正常">正常</a-select-option>
              <a-select-option value="延期">延期</a-select-option>
              <a-select-option value="异常">异常</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item class="search-actions">
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button class="btn-reset" @click="resetSearch">重置</a-button>
          </a-form-item>
        </div>
        <a-form-item label="数据范围" class="data-range-item">
          <a-radio-group v-model:value="viewMode" button-style="solid" class="view-mode-group">
            <a-radio-button value="all">全部</a-radio-button>
            <a-radio-button value="urgent">紧急</a-radio-button>
            <a-radio-button value="delayed">延期</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 统计卡片 -->
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="总工单数" :value="filteredData.length" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="正常工单" :value="stats.normal" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="延期工单" :value="stats.delayed" :value-style="{ color: '#cf1322' }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="异常工单" :value="stats.abnormal" :value-style="{ color: '#fa8c16' }" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 操作栏 -->
    <a-card class="table-card" :bordered="false">
      <template #title>
        <div class="table-header">
          <span class="page-title">工单跟踪清单</span>
          <div class="table-actions">
            <a-button type="primary" ghost @click="handleExport">导出</a-button>
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
        class="track-table"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.key === '状态'">
            <a-tag :color="statusTagColor(record.状态)">
              {{ record.状态 }}
            </a-tag>
          </template>
          <template v-else-if="column.key === '物料齐套'">
            <div class="material-cell">
              <span class="material-text">{{ text }}</span>
              <span v-if="record.物料齐套状态 === '缺料'" class="material-badge">缺料</span>
            </div>
          </template>
          <template v-else-if="column.key === '物料配料'">
            <div class="material-cell">
              <span class="material-text">{{ text }}</span>
              <span v-if="record.物料配料状态 === '配料中'" class="material-badge">进行中</span>
            </div>
          </template>
          <template v-else-if="column.key === '上线情况'">
            <span :class="lineStatusClass(record.上线情况)">
              {{ record.上线情况 }}
            </span>
          </template>
          <template v-else-if="isNumberColumn(column.key)">
            {{ formatNumber(text) }}
          </template>
          <template v-else>
            {{ text ?? '--' }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { TableProps } from 'ant-design-vue'
import type { WorkOrderTrackRow } from './types'
import { mockWorkOrderList } from './mockData'
import { Grid } from 'ant-design-vue'

// 响应式数据
const dataSource = ref<WorkOrderTrackRow[]>([...mockWorkOrderList])

// 筛选表单
const searchForm = reactive({
  workOrderNo: '',
  productNo: '',
  productionUnit: '',
  status: ''
})

// 筛选条件
const selectedProductionUnit = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const viewMode = ref<'all' | 'urgent' | 'delayed'>('all')

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

// 计算属性：生产单位选项
const productionUnitOptions = computed(() => {
  const units = dataSource.value
    .map(item => item.生产单位)
    .filter(unit => unit && unit.trim() !== '')
  return [...new Set(units)]
})

// 计算属性：筛选后的数据
const filteredData = computed(() => {
  let result = [...dataSource.value]

  // 工单单号筛选
  if (searchForm.workOrderNo) {
    result = result.filter(item => 
      item.工单单号 && item.工单单号.includes(searchForm.workOrderNo)
    )
  }

  // 成品编号筛选
  if (searchForm.productNo) {
    result = result.filter(item => 
      item.成品编号 && item.成品编号.includes(searchForm.productNo)
    )
  }

  // 生产单位筛选
  if (selectedProductionUnit.value) {
    result = result.filter(item => item.生产单位 === selectedProductionUnit.value)
  }

  // 状态筛选
  if (selectedStatus.value) {
    result = result.filter(item => item.状态 === selectedStatus.value)
  }

  // 数据范围筛选
  if (viewMode.value === 'urgent') {
    // 紧急：延期或未入库数量较多
    result = result.filter(item => 
      item.状态 === '延期' || (item.未入库数量 > item.需求数量 * 0.5)
    )
  } else if (viewMode.value === 'delayed') {
    // 延期：状态为延期
    result = result.filter(item => item.状态 === '延期')
  }

  return result
})

// 计算属性：统计信息
const stats = computed(() => {
  const total = filteredData.value.length
  const normal = filteredData.value.filter(item => item.状态 === '正常').length
  const delayed = filteredData.value.filter(item => item.状态 === '延期').length
  const abnormal = filteredData.value.filter(item => item.状态 === '异常').length
  
  return { total, normal, delayed, abnormal }
})

// 表格列配置
const columns = [
  { title: '计划开工日', dataIndex: '计划开工日', key: '计划开工日', width: 112, fixed: 'left' as const },
  { title: '计划完工日', dataIndex: '计划完工日', key: '计划完工日', width: 112, fixed: 'left' as const },
  { title: '状态', dataIndex: '状态', key: '状态', width: 88, fixed: 'left' as const },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号', width: 130, fixed: 'left' as const },
  { title: '物料齐套', dataIndex: '物料齐套', key: '物料齐套', width: 140 },
  { title: '物料配料', dataIndex: '物料配料', key: '物料配料', width: 100 },
  { title: '上线情况', dataIndex: '上线情况', key: '上线情况', width: 110 },
  { title: '生产单位', dataIndex: '生产单位', key: '生产单位', width: 140 },
  { title: '成品编号', dataIndex: '成品编号', key: '成品编号', width: 130 },
  { title: '成品品名', dataIndex: '成品品名', key: '成品品名', width: 220 },
  { title: '规格', dataIndex: '规格', key: '规格', width: 260 },
  { title: '需求数量', dataIndex: '需求数量', key: '需求数量', width: 100 },
  { title: '入库数量', dataIndex: '入库数量', key: '入库数量', width: 100 },
  { title: '未入库数量', dataIndex: '未入库数量', key: '未入库数量', width: 110 },
  { title: '报工工艺', dataIndex: '报工工艺', key: '报工工艺', width: 160 },
  { title: '报工数', dataIndex: '报工数', key: '报工数', width: 88 },
  { title: '报工日期', dataIndex: '报工日期', key: '报工日期', width: 110 },
  { title: '制单', dataIndex: '制单', key: '制单', width: 96 },
  { title: '订单编号', dataIndex: '订单编号', key: '订单编号', width: 130 },
]

// 数字列配置
const NUMBER_KEYS = new Set([
  '需求数量',
  '入库数量',
  '未入库数量',
  '报工数',
])

function isNumberColumn(key: string) {
  return NUMBER_KEYS.has(key)
}

// 工具函数
function formatNumber(v: unknown) {
  if (v === null || v === undefined || v === '') return '--'
  return typeof v === 'number' ? v.toLocaleString('zh-CN') : v
}

function statusTagColor(status: string) {
  if (status === '正常') return 'green'
  if (status === '延期') return 'red'
  if (status === '异常') return 'orange'
  return 'default'
}

function lineStatusClass(status: string) {
  if (status === '未上线') return 'line-status line-status-pending'
  if (status.includes('2026/')) return 'line-status line-status-active'
  return 'line-status line-status-default'
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
  searchForm.workOrderNo = ''
  searchForm.productNo = ''
  selectedProductionUnit.value = null
  selectedStatus.value = null
  viewMode.value = 'all'
  message.success('重置完成')
}

const handleExport = () => {
  message.success('导出功能开发中')
}

const handleRefresh = () => {
  // 模拟刷新数据
  dataSource.value = [...mockWorkOrderList]
  message.success('数据已刷新')
}

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.work-order-page {
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

.data-range-item {
  margin-left: auto;
  margin-right: 0;
  margin-bottom: 0;
}

.view-mode-group {
  display: flex;
  flex-wrap: wrap;
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
.track-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}

.track-table :deep(.ant-table-tbody > tr:nth-child(even) > td) {
  background: #fafafa;
}

.track-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}

.track-table :deep(.ant-table-cell) {
  white-space: nowrap;
}

/* 状态标签样式 */
.cell-status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 20px;
}

.cell-status-ok {
  background: #b7eb8f;
  color: #135200;
}

.cell-status-warn {
  background: #ffe58f;
  color: #ad6800;
}

.cell-status-default {
  background: #f5f5f5;
  color: #595959;
}

/* 物料单元格样式 */
.material-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.material-text {
  font-size: 12px;
  color: #ad6800;
}

.material-badge {
  display: inline-block;
  padding: 0 6px;
  border-radius: 2px;
  font-size: 10px;
  line-height: 18px;
  background: #ff4d4f;
  color: #fff;
}

/* 上线状态样式 */
.line-status {
  font-size: 12px;
}

.line-status-pending {
  color: #8c8c8c;
  font-style: italic;
}

.line-status-active {
  color: #52c41a;
  font-weight: 500;
}

.line-status-default {
  color: #595959;
}

/* 响应式适配 */
@media (max-width: 767px) {
  .work-order-page {
    padding: 12px;
  }
  
  .search-field,
  .search-select {
    max-width: none;
  }
  
  .data-range-item {
    margin-left: 0;
    width: 100%;
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
