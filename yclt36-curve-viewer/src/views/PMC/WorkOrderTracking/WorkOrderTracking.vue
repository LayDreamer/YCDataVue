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
            <span class="sort-label">行排序：</span>
            <a-button size="small" type="primary">交期升序</a-button>
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
        :scroll="{ x: tableScrollWidth, y: tableScrollY }"
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
      :loading="materialLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import {
  ContainerOutlined
} from '@ant-design/icons-vue'
import WorkOrderDetailModal from './WorkOrderDetailModal.vue'
import {
  statusLegendItems,
  kittingStatusOptions,
  feedingStatusOptions,
  generateDateRange
} from './data'
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService'
import { salesControlService } from '@/services/salesControlService'
import { externalProductionService } from '@/services/externalProductionService'
import { WorkOrderSalesControl, PMCRequestDto } from '@/api-generated/api'

interface TableRowData extends WorkOrderSalesControl {
  deliveryMap: Record<string, { quantity: number; status: string } | null>
}

// ==================== 常量配置 ====================
const dateFormat = 'YYYY-MM-DD'
const COLUMN_WIDTHS = {
  index: 50,
  workshop: 110,
  attribute: 100,
  productNo: 110,
  productName: 140,
  spec: 150,
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

// 表格高度：至少保证能显示 10 行（约 920px），并随窗口自适应
const tableScrollY = ref(920)
function updateTableHeight() {
  // 预留：页面 padding、筛选栏、分页、余量
  const reserved = 320
  const h = window.innerHeight - reserved
  tableScrollY.value = Math.max(920, h)
}
const activeTab = ref('workOrderTracking')
const loading = ref(false)
const dataSource = ref<WorkOrderSalesControl[]>([])

// 工单明细列表（用于交货日期列按明细交货日期分组展示，参考成品销控表）
const workOrderDetailList = ref<any[]>([])

// 行排序固定为交期升序

// 弹窗状态
const detailModalVisible = ref(false)
const currentProductNo = ref('')
const currentProductName = ref('')
const currentProductSpec = ref('')
const currentWorkOrderData = ref<any[]>([])
const currentMaterialData = ref<any[]>([])
const materialLoading = ref(false)

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

/** 获取某行在当前日期范围内最早的交货日期 */
function getEarliestDeliveryDate(item: WorkOrderSalesControl): string | null {
  const partNo = item.货号 || ''
  if (!partNo) return null
  const itemDetails = workOrderDetailList.value.filter(
    (d) => String(d.货号 || '') === String(partNo)
  )
  const rangeDates = new Set(displayDates.value)
  let earliest: string | null = null
  for (const d of itemDetails) {
    const date = (d.交货日期 || '').substring(0, 10)
    if (date && rangeDates.has(date)) {
      if (!earliest || date < earliest) earliest = date
    }
  }
  return earliest
}

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

/** 从工单明细表中获取指定货号的交货计划（参考成品销控表 getDeliveryPlansFromDetail） */
function getWorkOrderPlansFromDetail(item: WorkOrderSalesControl): Map<string, { quantity: number; status: string }> {
  const partNo = item.货号 || ''
  if (!partNo) return new Map()

  // 匹配属于当前货号的工单明细记录
  const itemDetails = workOrderDetailList.value.filter(
    (d) => String(d.货号 || '') === String(partNo)
  )

  // 按交货日期分组汇总待产数
  const grouped = new Map<string, { quantity: number; status: string }>()
  for (const detail of itemDetails) {
    const date = (detail.交货日期 || '').substring(0, 10)
    if (!date) continue

    const pendingQty = Number(detail.待产数) || 0
    const existing = grouped.get(date)
    if (existing) {
      existing.quantity += pendingQty
      // 任一有未完成则状态为不满足
      if (pendingQty > 0) existing.status = '不满足'
    } else {
      grouped.set(date, {
        quantity: pendingQty,
        status: pendingQty > 0 ? '不满足' : '满足',
      })
    }
  }
  return grouped
}

const tableData = computed<TableRowData[]>(() => {
  const rows = filteredData.value.map((item) => {
    const planMap = getWorkOrderPlansFromDetail(item)
    const deliveryMap: Record<string, { quantity: number; status: string } | null> = {}

    for (const date of displayDates.value) {
      const dateKey = toDateColumnKey(date)
      const planInfo = planMap.get(date)
      deliveryMap[dateKey] = planInfo
        ? { quantity: planInfo.quantity, status: planInfo.status }
        : null
    }

    return {
      ...item,
      deliveryMap,
      _earliestDate: getEarliestDeliveryDate(item),
    } as TableRowData & { _earliestDate: string | null }
  })

  // 固定按交期升序排序
  rows.sort((a, b) => {
    const dateA = a._earliestDate ?? '9999-99-99'
    const dateB = b._earliestDate ?? '9999-99-99'
    return dateA.localeCompare(dateB)
  })

  return rows as TableRowData[]
})

const tablePagination = computed(() => ({
  total: filteredData.value.length,
  pageSize: 20,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

// ==================== 方法 ====================
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
  currentMaterialData.value = []   // 先清空，避免显示上一次的数据
  detailModalVisible.value = true  // 先弹窗
  materialLoading.value = true
  try {
    currentMaterialData.value = await generateMaterialDetail(record)  // 再异步加载
  } finally {
    materialLoading.value = false
  }
}

// 工单总需求直接从已加载的工单明细列表中匹配（fetchData 时已并行加载全部明细）
function generateWorkOrderDetail(record: TableRowData) {
  const matched = workOrderDetailList.value.filter(
    (d) => String(d.货号 || '') === String(record.货号 || '')
  )
  if (matched.length === 0) return []
  return matched.map((d, idx) => ({
    id: idx + 1,
    工单单号: d.工单单号 || '-',
    交货日期: d.交货日期 || '-',
    生产数: Number(d.生产数) || 0,
    入库数: Number(d.入库数) || 0,
    待产数: Number(d.待产数) || 0,
  }))
}

// ========== 构建 BOM 树（与排产分析一致，用于实时计算物料需求） ==========
interface BomItem {
  key: string
  level: number
  name: string
  source: string
  produceQty: number
  purchaseQty: number
  loss: number
  spec?: string
  partNo?: string
  usage?: number
  unit?: string
  process?: string
  workshop?: string
  warehouse?: string
  stock?: number
  transit?: number
  wip?: number
  max?: number
  min?: number
  avail?: number
  attr?: string
  needQty?: number
  remark?: string
  children?: BomItem[]
}

let bomKeyCounter = 0
function bomGenerateKey(prefix: string): string {
  return `${prefix}-${++bomKeyCounter}`
}

function calculateDemandQty(qty: number, usage: number, loss: number): number {
  let demand = qty * usage * (1 + loss)
  demand = Math.max(0, demand)
  return Math.ceil(demand)
}

function buildBomTree(bomData: any[], qty: number): BomItem[] {
  const treeData: BomItem[] = []
  bomKeyCounter = 0

  const processBOMItem = (record: any, parentLevel: number = 0, parentUsage: number = 1): BomItem => {
    const level = Number(record.层) || parentLevel
    const key = bomGenerateKey('bom')
    const usage = Number(record.用量) || 1
    const cumulativeUsage = parentUsage * usage
    const loss = Number(record.损耗) || 0
    const demandQty = calculateDemandQty(qty, cumulativeUsage, loss)

    const _stock = record.仓库数 !== undefined && record.仓库数 !== '' ? Number(record.仓库数) : 0
    const _transit = record.在途数 !== undefined && record.在途数 !== '' ? Number(record.在途数) : 0
    const _wip = record.在产需求 !== undefined && record.在产需求 !== '' ? Number(record.在产需求) : 0
    const _min = record.库存下限 !== undefined && record.库存下限 !== '' ? Number(record.库存下限) : 0
    // 与排产分析默认 analysisType='normal' 保持一致
    const _avail = _stock + _transit - _wip - _min

    const item: BomItem = {
      key,
      level,
      name: record.品名 || '-',
      source: record.来源 || '-',
      produceQty: record.来源 === '自制' ? demandQty + _avail : 0,
      purchaseQty: record.来源 !== '自制' ? demandQty + _avail : 0,
      loss,
      spec: record.规格 || '-',
      partNo: record.货号 || '-',
      usage: cumulativeUsage,
      unit: record.单位 || '-',
      process: record.工序名称 || '-',
      workshop: record.工序车间 || '-',
      warehouse: record.仓库名称 || '-',
      stock: _stock,
      transit: _transit,
      wip: _wip,
      max: record.库存上限 !== undefined && record.库存上限 !== '' ? Number(record.库存上限) : 0,
      min: _min,
      avail: _avail,
      attr: record.产品属性 || '-',
      needQty: demandQty,
      remark: record.备注 || '-',
      children: [],
    }

    if (record.子集 && Array.isArray(record.子集) && record.子集.length > 0) {
      record.子集.forEach((childRecord: any) => {
        const childItem = processBOMItem(childRecord, level + 1, cumulativeUsage)
        item.children!.push(childItem)
      })
    }

    return item
  }

  bomData.forEach((record) => {
    treeData.push(processBOMItem(record, 0))
  })

  return treeData
}

function findBomNodeByPartNo(items: BomItem[], partNo: string | undefined): BomItem | null {
  for (const item of items) {
    if (item.partNo && String(item.partNo) === String(partNo)) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findBomNodeByPartNo(item.children, partNo)
      if (found) return found
    }
  }
  return null
}

async function generateMaterialDetail(record: TableRowData) {
  try {
    // 通过外产BOM列表获取，传入当前货号，返回该货号的子节点数据
    const bomList = await externalProductionService.getExternalProductionBOMList(
      new PMCRequestDto({ 货号: record.货号 } as any)
    )
    if (!bomList || bomList.length === 0) return []

    // 所有物料的需求数统一取工单总数
    const totalQty = Number(record.工单总数) || 0

    return bomList.map((item, idx) => {
      const 用量 = Number(item.用量) || 0
      const 已出库数 = Number(item.已出库数) || 0
      const 仓库数 = Number(item.仓库数) || 0
      // 需求数 = 工单总数 × 该物料用量
      const 需求数 = totalQty * 用量
      const 缺料数 = Math.max(0, 需求数 - 已出库数)
      // 仓库缺料：缺料数>0 且 缺料数-仓库数>0 时 = 缺料数-仓库数，否则为 0
      const 仓库缺料 = (缺料数 > 0 && 缺料数 - 仓库数 > 0) ? 缺料数 - 仓库数 : 0
      return {
        id: idx + 1,
        货号: item.货号 || '-',
        品名: item.品名 || '-',
        规格: item.规格 || '-',
        用量,
        需求数,
        已出库数,
        缺料数,
        仓库名称: item.仓库名称 || '',
        仓库数,
        仓库缺料,
      }
    })
  } catch (error) {
    console.error('加载物料明细失败:', error)
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
  record.工单单号 = item['工单单号'] || ''
  record.货号 = item['货号'] || ''
  record.品名 = item['品名'] || ''
  record.规格 = item['规格'] || ''
  record.工单总数 = item['工单总数'] || '0'
  record.已入库数 = item['已入库数'] || '0'
  record.在产数量 = item['在产数量'] || '0'
  record.齐套 = item['齐套'] || '未分析'
  record.配料 = item['配料'] || '未配料'
  record.交货日期 = item['交货日期'] || ''
  record.分析日期 = item['分析日期'] || ''
  record.生产完成率 = item['生产完成率'] || '0'
  return record
}

function autoSetDateRangeFromData() {
  const allDates: string[] = []
  // 从工单明细的交货日期中收集所有日期（参考成品销控表 getDeliveryDateRange）
  for (const detail of workOrderDetailList.value) {
    const date = (detail.交货日期 || '').substring(0, 10)
    if (date) allDates.push(date)
  }
  // 如果明细没有日期，回退到主记录的分析日期
  if (allDates.length === 0) {
    dataSource.value.forEach(item => {
      const analysisDate = (item.分析日期 || '').substring(0, 10)
      if (analysisDate) allDates.push(analysisDate)
    })
  }
  if (allDates.length === 0) return
  allDates.sort()
  const minDate = allDates[0]
  const maxDate = allDates[allDates.length - 1]
  dateRange.value = [dayjs(minDate), dayjs(maxDate)]
}

async function fetchData() {
  loading.value = true
  try {
    // 同时加载主表和工单明细表（参考成品销控表并行加载模式）
    const [mainData, detailData] = await Promise.all([
      workOrderSalesControlService.getWorkOrderSalesControlList(),
      workOrderSalesControlService.getWorkOrderSalesControlDetailList(new PMCRequestDto({ 货号: '' })),
    ])
    dataSource.value = (mainData || []).map((item: any) => mapApiItemToTableItem(item))
    workOrderDetailList.value = detailData || []
    autoSetDateRangeFromData()
  } catch (error: any) {
    message.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

onActivated(() => {
  activeTab.value = 'workOrderTracking'
})

onMounted(async () => {
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  await fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight)
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
  align-items: center;
}

.sort-label {
  font-size: 13px;
  color: #595959;
  white-space: nowrap;
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
