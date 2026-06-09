<template>
  <div class="work-order-tracking-container">
    <!-- 顶部标题栏 -->
    <!-- <div class="page-header">
      <div class="header-left">
        <ContainerOutlined class="header-icon" />
        <span class="header-title">工单销控表 - 物料齐套与生产跟踪</span>
      </div>
    </div> -->

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <!-- 第一行：快捷筛选 + tab -->
      <div class="filter-row">
        <div class="quick-filters">
          <a-checkbox-group v-model:value="quickFilters" :options="quickFilterOptions" />
          <a-button
            :type="showKittingAnalysis ? 'primary' : 'default'"
            size="small"
            class="analysis-btn"
            @click="showKittingAnalysis = !showKittingAnalysis"
          >
            齐套、配料分析
          </a-button>
        </div>
        <div class="tab-bar">
          <a-tabs v-model:activeKey="activeTab" size="small" @change="handleTabChange">
            <a-tab-pane key="salesControl" tab="成品销控表" />
            <a-tab-pane key="workOrderTracking" tab="工单销控表" />
          </a-tabs>
        </div>
      </div>

      <!-- 第二行：详细筛选条件 -->
      <div class="filter-row second-row">
        <div class="filter-controls">
          <a-select
            v-model:value="kittingStatus"
            placeholder="全部齐套状态"
            allow-clear
            class="filter-select"
            style="width: 140px"
          >
            <a-select-option v-for="opt in kittingStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>

          <a-select
            v-model:value="feedingStatus"
            placeholder="全部配料状态"
            allow-clear
            class="filter-select"
            style="width: 140px"
          >
            <a-select-option v-for="opt in feedingStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>

          <a-checkbox v-model:checked="hasProductionDate">在产日期</a-checkbox>
          <a-date-picker v-if="hasProductionDate" v-model:value="productionDate" size="small" />

          <a-select
            v-model:value="workshop"
            placeholder="全部车间"
            allow-clear
            class="filter-select"
            style="width: 150px"
          >
            <a-select-option v-for="opt in workshopOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>

          <a-input-search
            v-model:value="searchKeyword"
            placeholder="货号/品名/规格"
            allow-clear
            class="filter-search"
            style="width: 200px"
          />

          <a-range-picker
            v-model:value="dateRange"
            :format="dateFormat"
            :placeholder="['开始日期', '结束日期']"
            size="small"
          />

          <div class="filter-actions">
            <a-button :type="isFiltered ? 'primary' : 'default'" @click="handleSearch">
              <FilterOutlined />筛选
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />重置
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
      <a-table
        :columns="tableColumns"
        :data-source="tableData"
        :pagination="tablePagination"
        :scroll="{ x: tableScrollWidth, y: 480 }"
        :loading="loading"
        row-key="编号"
        size="small"
      >
        <template #headerCell="{ column }">
          <span class="header-cell">{{ column.title }}</span>
        </template>

        <template #bodyCell="{ column, record, text, index }">
          <template v-if="column.key === 'index'">
            <span class="index-cell">{{ index + 1 }}</span>
          </template>
          <template v-else-if="column.key === '齐套'">
            <span
              class="status-tag"
              :style="getKittingStyle(text)"
            >
              {{ text }}
            </span>
          </template>
          <template v-else-if="column.key === '配料'">
            <span
              class="status-tag"
              :style="getFeedingStyle(text)"
            >
              {{ text }}
            </span>
          </template>
          <template v-else-if="column.key === '生产完成率'">
            <div class="progress-cell">
              <span class="progress-text">{{ text }}%</span>
              <a-progress
                :percent="text"
                :show-info="false"
                :stroke-color="getProgressColor(text)"
                trail-color="#f0f0f0"
                size="small"
                class="progress-bar"
              />
            </div>
          </template>
          <template v-else-if="column.dataType === 'delivery'">
            <template v-if="record.deliveryMap[column.key]?.quantity">
              <span
                class="delivery-cell"
                :style="getDeliveryStyle(record.deliveryMap[column.key].status)"
              >
                {{ record.deliveryMap[column.key].quantity }}
              </span>
            </template>
            <template v-else>
              <span class="no-delivery">--</span>
            </template>
          </template>
          <template v-else-if="isLinkColumn(column.key)">
            <span class="link-cell">{{ text }}</span>
          </template>
          <template v-else-if="column.key === '工单总数'">
            <span class="number-cell link-number" @click="handleTotalClick(record)">{{ formatNumber(text) }}</span>
          </template>
          <template v-else-if="isNumberColumn(column.key)">
            <span class="number-cell">{{ formatNumber(text) }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <WorkOrderDetailModal
      v-model:visible="detailModalVisible"
      :product-no="currentProductNo"
      :product-name="currentProductName"
      :product-spec="currentProductSpec"
      :work-order-data="currentWorkOrderData"
      :material-data="currentMaterialData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import {
  ContainerOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import WorkOrderDetailModal from './WorkOrderDetailModal.vue'
import {
  statusLegendItems,
  kittingStatusOptions,
  feedingStatusOptions,
  generateDateRange
} from './data'
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService'
import { WorkOrderSalesControl } from '@/api-generated/api'

interface DeliveryPlan {
  交货日期: string
  交货数量: number
  状态: string
}

interface TableRowData extends WorkOrderSalesControl {
  deliveryMap: Record<string, { quantity: number; status: string } | null>
  _deliveryPlans: DeliveryPlan[]
}

// ==================== 常量配置 ====================
const dateFormat = 'YYYY-MM-DD'
const COLUMN_WIDTHS = {
  index: 50,
  workshop: 110,
  attribute: 100,
  productNo: 110,
  productName: 140,
  spec: 200,
  total: 90,
  stored: 90,
  inProd: 90,
  kitting: 80,
  feeding: 80,
  analysisDate: 140,
  progress: 120,
  delivery: 90,
}

const STATUS_STYLES: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
  full: { backgroundColor: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' },
  partial: { backgroundColor: '#fffbe6', borderColor: '#ffe58f', color: '#faad14' },
  none: { backgroundColor: '#fff2f0', borderColor: '#ffccc7', color: '#ff4d4f' },
  '满足': { backgroundColor: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' },
  '部分满足': { backgroundColor: '#fffbe6', borderColor: '#ffe58f', color: '#faad14' },
  '不满足': { backgroundColor: '#fff2f0', borderColor: '#ffccc7', color: '#ff4d4f' },
}

const LINK_COLUMNS = new Set(['货号', '品名', '规格'])
const NUMBER_COLUMNS = new Set(['工单总数', '已入库数', '在产数量'])

function isLinkColumn(key: string) {
  return LINK_COLUMNS.has(key)
}

function isNumberColumn(key: string) {
  return NUMBER_COLUMNS.has(key)
}

function formatNumber(v: unknown) {
  if (v === null || v === undefined || v === '') return '--'
  return typeof v === 'number' ? v.toLocaleString('zh-CN') : v
}

function toDateColumnKey(isoDate: string) {
  return isoDate.replace(/-/g, '')
}

function dateColumnKeyToIso(key: string) {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`
}

// ==================== 响应式状态 ====================
const router = useRouter()
const activeTab = ref('workOrderTracking')
const loading = ref(false)
const dataSource = ref<WorkOrderSalesControl[]>([])

// 弹窗状态
const detailModalVisible = ref(false)
const currentProductNo = ref('')
const currentProductName = ref('')
const currentProductSpec = ref('')
const currentWorkOrderData = ref<any[]>([])
const currentMaterialData = ref<any[]>([])

// 筛选条件
const quickFilters = ref<string[]>([])
const quickFilterOptions = [
  { label: '配齐/齐套', value: '配齐/齐套' },
  { label: '配料中/缺料', value: '配料中/缺料' },
  { label: '未分析', value: '未分析' }
]
const showKittingAnalysis = ref(false)
const kittingStatus = ref<string | undefined>(undefined)
const feedingStatus = ref<string | undefined>(undefined)
const hasProductionDate = ref(false)
const productionDate = ref<Dayjs | null>(null)
const workshop = ref<string | undefined>(undefined)
const searchKeyword = ref('')
const dateRange = ref<[Dayjs, Dayjs] | null>([dayjs('2026-01-01'), dayjs('2026-01-10')])

function handleTabChange(key: string) {
  if (key === 'salesControl') {
    router.push({ name: 'SalesControl' })
  }
}

// ==================== 计算属性 ====================
const workshopOptions = computed(() => {
  const set = new Set<string>()
  dataSource.value.forEach(item => {
    const name = item.车间名称?.trim()
    if (name && name !== '' && name !== '-') {
      set.add(name)
    }
  })
  return Array.from(set).map(name => ({ label: name, value: name }))
})

const isFiltered = computed(() => {
  const isDateRangeChanged = dateRange.value && (
    dateRange.value[0].format(dateFormat) !== dayjs('2026-01-01').format(dateFormat) ||
    dateRange.value[1].format(dateFormat) !== dayjs('2026-01-10').format(dateFormat)
  )
  return (
    quickFilters.value.length > 0 ||
    showKittingAnalysis.value ||
    kittingStatus.value !== undefined ||
    feedingStatus.value !== undefined ||
    hasProductionDate.value ||
    workshop.value !== undefined ||
    searchKeyword.value !== '' ||
    !!isDateRangeChanged
  )
})

const displayDates = computed(() => {
  if (!dateRange.value) return []
  const [start, end] = dateRange.value
  return generateDateRange(start.format(dateFormat), end.format(dateFormat))
})

const tableScrollWidth = computed(() => {
  const fixedWidth =
    COLUMN_WIDTHS.index +
    COLUMN_WIDTHS.workshop +
    COLUMN_WIDTHS.attribute +
    COLUMN_WIDTHS.productNo +
    COLUMN_WIDTHS.productName +
    COLUMN_WIDTHS.spec +
    COLUMN_WIDTHS.total +
    COLUMN_WIDTHS.stored +
    COLUMN_WIDTHS.inProd +
    COLUMN_WIDTHS.kitting +
    COLUMN_WIDTHS.feeding +
    COLUMN_WIDTHS.analysisDate +
    COLUMN_WIDTHS.progress
  const dateColumnWidth = COLUMN_WIDTHS.delivery * displayDates.value.length
  return Math.max(fixedWidth + dateColumnWidth, 1200)
})

const filteredData = computed(() => {
  // 只显示没有父级编号的顶层节点
  let result = dataSource.value;

  // 快捷筛选
  if (quickFilters.value.length > 0) {
    result = result.filter(item => {
      const filters = quickFilters.value
      const matchKitting = filters.includes('配齐/齐套') && item.齐套 === '齐套'
      const matchFeeding = filters.includes('配料中/缺料') && (item.配料 === '配料中' || item.齐套 === '缺料')
      const matchUnanalysis = filters.includes('未分析') && item.齐套 === '未分析'
      return matchKitting || matchFeeding || matchUnanalysis
    })
  }

  // 齐套状态筛选
  if (kittingStatus.value) {
    result = result.filter(item => item.齐套 === kittingStatus.value)
  }

  // 配料状态筛选
  if (feedingStatus.value) {
    result = result.filter(item => item.配料 === feedingStatus.value)
  }

  // 车间筛选
  if (workshop.value) {
    result = result.filter(item => item.车间名称 === workshop.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      item =>
        item.货号?.toLowerCase().includes(kw) ||
        item.品名?.toLowerCase().includes(kw) ||
        item.规格?.toLowerCase().includes(kw)
    )
  }

  return result
})

const tableColumns = computed(() => {
  const baseColumns = [
    { title: '序号', dataIndex: 'index', key: 'index', width: COLUMN_WIDTHS.index, fixed: 'left', align: 'center' },
    { title: '车间名称', dataIndex: '车间名称', key: '车间名称', width: COLUMN_WIDTHS.workshop, fixed: 'left' },
    { title: '商品属性', dataIndex: '商品属性', key: '商品属性', width: COLUMN_WIDTHS.attribute, fixed: 'left' },
    { title: '货号', dataIndex: '货号', key: '货号', width: COLUMN_WIDTHS.productNo, fixed: 'left' },
    { title: '品名', dataIndex: '品名', key: '品名', width: COLUMN_WIDTHS.productName, fixed: 'left' },
    { title: '规格', dataIndex: '规格', key: '规格', width: COLUMN_WIDTHS.spec, fixed: 'left' },
    { title: '工单总数', dataIndex: '工单总数', key: '工单总数', width: COLUMN_WIDTHS.total, fixed: 'left', align: 'center' },
    { title: '已入库数', dataIndex: '已入库数', key: '已入库数', width: COLUMN_WIDTHS.stored, fixed: 'left', align: 'center' },
    { title: '在产数量', dataIndex: '在产数量', key: '在产数量', width: COLUMN_WIDTHS.inProd, fixed: 'left', align: 'center' },
    { title: '齐套', dataIndex: '齐套', key: '齐套', width: COLUMN_WIDTHS.kitting, fixed: 'left', align: 'center' },
    { title: '配料', dataIndex: '配料', key: '配料', width: COLUMN_WIDTHS.feeding, fixed: 'left', align: 'center' },
    { title: '分析日期', dataIndex: '分析日期', key: '分析日期', width: COLUMN_WIDTHS.analysisDate, fixed: 'left', align: 'center' },
    { title: '生产完成率', dataIndex: '生产完成率', key: '生产完成率', width: COLUMN_WIDTHS.progress, fixed: 'left', align: 'center' },
  ]

  const dateColumns = displayDates.value.map(date => ({
    title: date,
    dataIndex: toDateColumnKey(date),
    key: toDateColumnKey(date),
    dataType: 'delivery' as const,
    width: COLUMN_WIDTHS.delivery,
    align: 'center' as const,
  }))

  return [...baseColumns, ...dateColumns]
})

const tableData = computed<TableRowData[]>(() => {
  return filteredData.value.map((item, index) => {
    const rawPlans = parseDeliveryPlans(item.交货计划)
    const deliveryMap: Record<string, { quantity: number; status: string } | null> = {}

    for (const date of displayDates.value) {
      const dateKey = toDateColumnKey(date)
      const plan = rawPlans.find(p => p.交货日期 === date)
      deliveryMap[dateKey] = plan
        ? { quantity: plan.交货数量, status: plan.状态 }
        : null
    }

    return {
      ...item,
      deliveryMap,
      _deliveryPlans: rawPlans,
    } as unknown as TableRowData
  })
})

const tablePagination = computed(() => ({
  total: filteredData.value.length,
  pageSize: 20,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

// ==================== 方法 ====================
function parseDeliveryPlans(deliveryPlanStr: string | undefined): DeliveryPlan[] {
  if (!deliveryPlanStr) return []
  try {
    const parsed = JSON.parse(deliveryPlanStr)
    const plans = Array.isArray(parsed) ? parsed : [parsed]
    return plans.filter(p => p && typeof p === 'object').map(p => ({
      交货日期: p.交货日期 || '',
      交货数量: Number(p.交货数量) || 0,
      状态: p.状态 || '不满足',
    }))
  } catch {
    return []
  }
}

function getKittingStyle(status: string) {
  if (status === '齐套') return STATUS_STYLES.full
  if (status === '缺料') return STATUS_STYLES.partial
  return STATUS_STYLES.none
}

function getFeedingStyle(status: string) {
  if (status === '配齐') return STATUS_STYLES.full
  if (status === '配料中') return STATUS_STYLES.partial
  return STATUS_STYLES.none
}

function getDeliveryStyle(status: string) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.partial
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    color: style.color,
  }
}

function getProgressColor(percent: number) {
  if (percent >= 80) return '#52c41a'
  if (percent >= 50) return '#faad14'
  return '#ff4d4f'
}

function handleProductClick(record: TableRowData) {
  message.info(`查看产品：${record.货号} ${record.品名}`)
}

async function handleTotalClick(record: TableRowData) {
  currentProductNo.value = record.货号 || ''
  currentProductName.value = record.品名 || ''
  currentProductSpec.value = record.规格 || ''
  currentWorkOrderData.value = generateWorkOrderDetail(record)
  currentMaterialData.value = await generateMaterialDetail(record)
  detailModalVisible.value = true
}

function generateWorkOrderDetail(record: TableRowData) {
  const stored = Number(record.已入库数) || 0
  const total = Number(record.工单总数) || 0
  const plans = record._deliveryPlans || []

  if (plans.length === 0) {
    return [{
      id: 1,
      工单单号: '-',
      完成日期: '-',
      生产数: total,
      入库数量: stored,
      待产数: total - stored,
    }]
  }

  return plans.map((plan: any, idx: number) => ({
    id: idx + 1,
    工单单号: `WO-${record.货号}-${idx + 1}`,
    完成日期: plan.交货日期 || '-',
    生产数: plan.交货数量 || 0,
    入库数量: 0,
    待产数: plan.交货数量 || 0,
  }))
}

async function generateMaterialDetail(record: TableRowData) {
  try {
    // 从工单销控表明细接口查询父级编号等于当前编号的数据
    const res = await workOrderSalesControlService.getWorkOrderSalesControlDetailList()
    const allDetails = res || []
    const children = allDetails.filter(
      (item: any) => item.父级编号 != null && String(item.父级编号) === String(record.编号)
    )

    if (children.length === 0) {
      return []
    }

    return children.map((child: any, idx: number) => ({
      id: idx + 1,
      货号: child.货号 || '-',
      品名: child.品名 || '-',
      规格: child.规格 || '-',
      用量: Number(child.用量) || 0,
      需求数: Number(child.需求数) || 0,
      已出库数: Number(child.已出库数) || 0,
      缺料数: Number(child.缺料数) || 0,
      仓库名称: child.仓库名称 || '-',
      仓库数: Number(child.仓库数) || 0,
      仓库缺料: Number(child.仓库缺料) || 0,
    }))
  } catch (error) {
    console.error('查询工单销控表明细失败:', error)
    message.error('查询物料明细失败')
    return []
  }
}

function handleDeliveryClick(record: TableRowData, dateKey: string) {
  const targetDate = dateColumnKeyToIso(dateKey)
  const planInfo = record.deliveryMap[dateKey]
  if (!planInfo) return
  message.info(`交货详情：${record.货号}，日期 ${targetDate}，数量 ${planInfo.quantity}`)
}

function mapApiItemToTableItem(item: any): WorkOrderSalesControl {
  const record = new WorkOrderSalesControl()
  record.编号 = item['编号'] || ''
  record.车间名称 = item['车间名称'] || ''
  record.商品属性 = item['商品属性'] || ''
  record.货号 = item['货号'] || ''
  record.品名 = item['品名'] || ''
  record.规格 = item['规格'] || ''
  record.工单总数 = item['工单总数'] || '0'
  record.已入库数 = item['已入库数'] || '0'
  record.在产数量 = item['在产数量'] || '0'
  record.齐套 = item['齐套'] || '未分析'
  record.配料 = item['配料'] || '未配料'
  record.分析日期 = item['分析日期'] || ''
  record.生产完成率 = item['生产完成率'] || '0'
  record.交货计划 = item['交货计划'] || ''
  // record.父级编号 = item['父级编号'] || ''
  return record
}

function autoSetDateRangeFromData() {
  const allDates: string[] = []
  dataSource.value.forEach(item => {
    const plans = parseDeliveryPlans(item.交货计划)
    plans.forEach(p => {
      if (p.交货日期) allDates.push(p.交货日期)
    })
  })
  if (allDates.length === 0) return
  allDates.sort()
  const minDate = allDates[0]
  const maxDate = allDates[allDates.length - 1]
  dateRange.value = [dayjs(minDate), dayjs(maxDate)]
}

async function fetchData() {
  loading.value = true
  try {
    const res = await workOrderSalesControlService.getWorkOrderSalesControlList()
    dataSource.value = (res || []).map((item: any) => mapApiItemToTableItem(item))
    autoSetDateRangeFromData()
  } catch (error: any) {
    message.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchData()
}

function handleReset() {
  quickFilters.value = []
  showKittingAnalysis.value = false
  kittingStatus.value = undefined
  feedingStatus.value = undefined
  hasProductionDate.value = false
  productionDate.value = null
  workshop.value = undefined
  searchKeyword.value = ''
  dateRange.value = [dayjs('2026-01-01'), dayjs('2026-01-10')]
  message.success('重置完成')
}

onActivated(() => {
  activeTab.value = 'workOrderTracking'
})

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.work-order-tracking-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px;
}

/* 页面标题 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
  color: #1e3a5f;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.header-link {
  color: #1e3a5f;
  font-weight: 500;
}

/* 筛选栏 */
.filter-bar {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-row.second-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.quick-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.analysis-btn {
  border-radius: 20px;
  font-weight: 500;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-select,
.filter-search {
  border-radius: 6px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

:deep(.ant-btn) {
  border-radius: 20px;
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
}

:deep(.ant-btn-primary) {
  background: #1e3a5f;
  border-color: #1e3a5f;
}

/* 表格区域 */
.table-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #1e3a5f !important;
  color: #ffffff;
  font-weight: 500;
  padding: 12px 8px;
  font-size: 13px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f9ff !important;
}

:deep(.ant-table-tbody > td) {
  padding: 10px 8px;
  font-size: 13px;
}

.index-cell {
  color: #595959;
  font-size: 13px;
}

.link-cell {
  color: #1e3a5f;
  font-weight: 500;
}

.number-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.link-number {
  color: #1e3a5f;
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: all 0.2s;
}

.link-number:hover {
  border-bottom-color: #2b4b78;
  color: #2b4b78;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 30px;
  border: 1px solid;
  font-weight: 600;
  font-size: 12px;
  min-width: 48px;
  text-align: center;
}

/* 进度条 */
.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-text {
  font-weight: 600;
  font-size: 13px;
  color: #262626;
}

.progress-bar {
  width: 80px;
}

/* 交付单元格 */
.delivery-cell {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 30px;
  border: 1px solid;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  min-width: 40px;
  text-align: center;
}

.delivery-cell:hover {
  transform: scale(1.02);
}

.no-delivery {
  color: #d0d5dd;
}

.tab-bar {
  margin-left: auto;
}

.tab-bar :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .work-order-tracking-container {
    padding: 16px;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    margin-left: 0;
    width: 100%;
  }

  .filter-actions :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
