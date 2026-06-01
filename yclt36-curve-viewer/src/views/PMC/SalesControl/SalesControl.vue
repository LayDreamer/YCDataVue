<template>
  <div class="product-inventory-container">
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">验证依据：</span>
          <a-radio-group v-model:value="validationBasis" size="small">
            <a-radio-button value="warehouseOnly">仅仓库数</a-radio-button>
            <a-radio-button value="warehouseAndProduction">仓库数 + 在产数</a-radio-button>
          </a-radio-group>
        </div>

        <div class="status-legend">
          <span class="legend-label">状态图例：</span>
          <div class="legend-items">
            <div v-for="item in statusLegendItems" :key="item.status" class="legend-item">
              <span
                class="legend-color"
                :style="{ backgroundColor: item.backgroundColor, borderColor: item.borderColor }"
              />
              <span class="legend-text">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-row second-row">
        <!-- 左侧区域：日期选择 + 操作按钮 -->
        <div class="left-group">
          <div class="date-pickers">
            <div class="date-range-picker">
              <a-range-picker
                v-model:value="dateRange"
                :format="dateFormat"
                :placeholder="['开始日期', '结束日期']"
              />
            </div>
          </div>

          <div class="action-buttons">
            <a-button
              :type="filterDeliveryColumnsOnly ? 'primary' : 'default'"
              @click="handleFilterColumns"
            >
              筛选交付列
            </a-button>
            <a-button @click="handleReset">重置</a-button>
          </div>
        </div>

        <!-- 右侧区域：商品类型切换按钮 + 提示文字（垂直排列，切换按钮在上） -->
        <div class="right-group">
          <div class="product-type-switch">
            <span class="switch-label">商品类型：</span>
            <a-radio-group v-model:value="productType" size="small">
              <a-radio-button value="成品">成品</a-radio-button>
              <a-radio-button value="半成品">半成品</a-radio-button>
            </a-radio-group>
          </div>
          <div class="hint-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>点击任意数据弹出详情</span>
          </div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <a-table
        :columns="tableColumns"
        :data-source="tableData"
        :pagination="false"
        :scroll="{ x: tableScrollWidth, y: 400 }"
        :loading="loading"
        row-key="id"
      >
        <template #headerCell="{ column }">
          <span class="header-cell">{{ column.title }}</span>
        </template>

        <template #bodyCell="{ column, record, text }">
          <template v-if="column.key === 'index'">
            <span class="index-cell">{{ record.id }}</span>
          </template>
          <template v-else-if="isProductLinkColumn(column.key)">
            <span class="link-cell" @click="handleProductClick(record)">{{ text }}</span>
          </template>
          <template v-else-if="isSummaryNumberColumn(column.key)">
            <span class="number-cell" @click.stop="handleNumberClick(record, column)">{{ text }}</span>
          </template>
          <template v-else-if="column.dataType === 'delivery'">
            <template v-if="record.deliveryMap[column.key]">
              <span
                class="delivery-cell"
                :style="getStatusConfig(record.deliveryMap[column.key]?.status ?? '')"
                @click.stop="handleDeliveryClick(record, column.key)"
              >
                {{ record.deliveryMap[column.key].quantity }}
              </span>
            </template>
            <template v-else>
              <span class="no-delivery">--</span>
            </template>
          </template>
        </template>
      </a-table>
    </div>

    <div class="footer-bar">
      <div class="footer-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>点击货号/品名/规格查看产品信息；点击汇总字段或交付数量查看对应详情。</span>
      </div>
      <div class="footer-right">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span>切换验证依据、筛选实时生效。</span>
      </div>
    </div>

    <DeliveryDetailsModal
      v-model:visible="detailModalVisible"
      :detail-type="detailType"
      :product="currentProduct"
      :delivery="currentDelivery"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import DeliveryDetailsModal from './DeliveryDetailsModal.vue'
import { salesControlService } from '@/services/salesControlService'
import { statusLegendItems, generateDateRange } from './data.ts'
import { DeliveryPlan, DeliveryStatus, PMCSalesControl, RequestDto } from '../types.ts'
import { compile } from 'vue'

interface TableRowData extends PMCSalesControl {
  id: number
  deliveryMap: Record<string, { quantity: number; status: string; 排产用户: string } | null>
  _deliveryPlans: DeliveryPlan[]
  _plansByDate?: Map<string, DeliveryPlan[]>
}

interface ComputedDeliveryInfo {
  quantity: number
  status: string
  排产用户: string
}
// ==================== 常量配置 ====================
const dateFormat = 'YYYY-MM-DD'
const COLUMN_WIDTHS = {
  index: 60,
  productNo: 150,
  productName: 150,
  spec: 150,
  orderTotal: 100,
  warehouse: 80,
  production: 80,
  initial: 100,
  shortage: 100,
  delivery: 100,
}

const STATUS_STYLES: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
  full: { backgroundColor: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' },
  partial: { backgroundColor: '#fffbe6', borderColor: '#ffe58f', color: '#faad14' },
  none: { backgroundColor: '#fff2f0', borderColor: '#ffccc7', color: '#ff4d4f' },
}

const PRODUCT_LINK_KEYS = new Set(['货号', '中文品名', '中文规格'])
const SUMMARY_NUMBER_KEYS = new Set(['订单总需求', '仓库数', '在产数', '初始可用量', '缺量'])

function isProductLinkColumn(key: string) {
  return PRODUCT_LINK_KEYS.has(key)
}

function isSummaryNumberColumn(key: string) {
  return SUMMARY_NUMBER_KEYS.has(key)
}

/** 表头列 key：YYYY-MM-DD → YYYYMMDD */
function toDateColumnKey(isoDate: string) {
  return isoDate.replace(/-/g, '')
}

/** YYYYMMDD → YYYY-MM-DD */
function dateColumnKeyToIso(key: string) {
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`
}

function groupPlansByDate(plans: DeliveryPlan[]): Map<string, DeliveryPlan[]> {
  const map = new Map<string, DeliveryPlan[]>()
  for (const p of plans) {
    const d = p.交货日期
    if (!d) continue
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(p)
  }
  return map
}

/** 当前商品列表在交货计划中出现的日期（用于筛选交付列） */
function collectPlanDatesInRange(products: PMCSalesControl[], rangeDates: string[]): string[] {
  const withPlan = new Set<string>()
  for (const product of products) {
    for (const p of parseDeliveryPlans(product.交货计划)) {
      if (p.交货日期) withPlan.add(p.交货日期)
    }
  }
  return rangeDates.filter(d => withPlan.has(d))
}

function getProductTypeAttribute(item: PMCSalesControl): string {
  const row = item as PMCSalesControl & { 物料类型?: string }
  return row.商品属性 || row.物料类型 || ''
}

// ==================== 工具函数 ====================
function getCurrentMonthRange(): [Dayjs, Dayjs] {
  const now = dayjs()
  return [now.startOf('month'), now.endOf('month')]
}

function parseDeliveryPlans(deliveryPlanStr: string): DeliveryPlan[] {
  if (!deliveryPlanStr) return []
  try {
    const parsed = JSON.parse(deliveryPlanStr)
    const plans = Array.isArray(parsed) ? parsed : [parsed]
    return plans.filter(p => p && typeof p === 'object').map(p => ({
      交货日期: p.交货日期 || '',
      交货数量: Number(p.交货数量) || 0,
      状态: p.状态 || '',
      排产用户: p.排产用户 || '',
    }))
  } catch {
    console.error('解析交货计划失败')
    return []
  }
}

function getStatusConfig(status: string) {
  const effectiveStatus = status || 'partial'
  return STATUS_STYLES[effectiveStatus] || STATUS_STYLES.partial
}

// ==================== 响应式状态 ====================
const router = useRouter()
const validationBasis = ref<'warehouseOnly' | 'warehouseAndProduction'>('warehouseOnly')
const dateRange = ref<[Dayjs, Dayjs] | null>(getCurrentMonthRange())
const loading = ref(false)
const detailModalVisible = ref(false)
const detailType = ref<'product' | 'delivery'>('product')
const currentProduct = ref<PMCSalesControl | null>(null)
const currentDelivery = ref<{ product: PMCSalesControl; plan: DeliveryPlan; cumulativeDelivered: number } | null>(null)
const productList = ref<PMCSalesControl[]>([])

const productType = ref<'成品' | '半成品'>('成品')

// ==================== 计算属性 ====================
const displayDates = computed(() => {
  if (!dateRange.value) return []
  const [start, end] = dateRange.value
  return generateDateRange(start.format(dateFormat), end.format(dateFormat))
})

const filteredProductList = computed(() =>
  productList.value.filter(item => getProductTypeAttribute(item) === productType.value)
)

/** 开启「筛选交付列」时，仅保留当前范围内、至少有一条交货计划的日期 */
const filterDeliveryColumnsOnly = ref(false)

const activeDisplayDates = computed(() => {
  const rangeDates = displayDates.value
  if (!filterDeliveryColumnsOnly.value) return rangeDates
  return collectPlanDatesInRange(filteredProductList.value, rangeDates)
})

const tableScrollWidth = computed(() => {
  const fixedWidth =
    COLUMN_WIDTHS.index +
    COLUMN_WIDTHS.productNo +
    COLUMN_WIDTHS.productName +
    COLUMN_WIDTHS.spec +
    COLUMN_WIDTHS.orderTotal +
    COLUMN_WIDTHS.warehouse +
    COLUMN_WIDTHS.production +
    COLUMN_WIDTHS.initial +
    COLUMN_WIDTHS.shortage
  const dateColumnWidth = COLUMN_WIDTHS.delivery * activeDisplayDates.value.length
  return Math.max(fixedWidth + dateColumnWidth, 1200)
})

const tableColumns = computed(() => {
  const baseColumns = [
    { title: '序号', dataIndex: 'id', key: 'index', width: COLUMN_WIDTHS.index, fixed: 'left', align: 'center' },
    { title: '货号', dataIndex: '货号', key: '货号', width: COLUMN_WIDTHS.productNo, fixed: 'left' },
    { title: '中文品名', dataIndex: '中文品名', key: '中文品名', width: COLUMN_WIDTHS.productName, fixed: 'left' },
    { title: '中文规格', dataIndex: '中文规格', key: '中文规格', width: COLUMN_WIDTHS.spec, fixed: 'left' },
    { title: '订单总需求', dataIndex: '订单总需求', key: '订单总需求', width: COLUMN_WIDTHS.orderTotal, fixed: 'left', align: 'center' },
    { title: '仓库数', dataIndex: '仓库数', key: '仓库数', width: COLUMN_WIDTHS.warehouse, fixed: 'left', align: 'center' },
    { title: '在产数', dataIndex: '在产数', key: '在产数', width: COLUMN_WIDTHS.production, fixed: 'left', align: 'center' },
    { title: '初始可用量', dataIndex: '初始可用量', key: '初始可用量', width: COLUMN_WIDTHS.initial, fixed: 'left', align: 'center' },
    { title: '缺量', dataIndex: '缺量', key: '缺量', width: COLUMN_WIDTHS.shortage, fixed: 'left', align: 'center' },
  ]

  const dateColumns = activeDisplayDates.value.map(date => ({
    title: date.substring(5),
    dataIndex: toDateColumnKey(date),
    key: toDateColumnKey(date),
    dataType: 'delivery' as const,
    width: COLUMN_WIDTHS.delivery,
    align: 'center' as const,
  }))

  return [...baseColumns, ...dateColumns]
})

const tableData = computed<TableRowData[]>(() => {
  return filteredProductList.value.map((product, idx) => {
    const warehouseQty = Number(product.仓库数) || 0
    const productionQty = Number(product.在产数) || 0
    const orderTotal = Number(product.订单总需求) || 0

    const initialAvailable = validationBasis.value === 'warehouseOnly'
      ? warehouseQty
      : warehouseQty + productionQty

    const shortageRaw = initialAvailable - orderTotal
    const displayShortage = shortageRaw > 0 ? 0 : shortageRaw

    // 1. 解析所有交货计划（原始数据）
    const rawPlans = parseDeliveryPlans(product.交货计划)

    // 2. 基于初始可用量 + 全部计划，按日期顺序计算每个日期的状态和数量
    const statusMap = computeDeliveryStatuses(rawPlans, initialAvailable)
    // 3. 构建交付列映射（仅针对当前日期范围）
    const deliveryMap: Record<string, { quantity: number; status: string; 排产用户: string } | null> = {}
    for (const date of activeDisplayDates.value) {
      const dateKey = toDateColumnKey(date)
      const planInfo = statusMap.get(date)
      deliveryMap[dateKey] = planInfo
        ? { quantity: planInfo.quantity, status: planInfo.status, 排产用户: planInfo.排产用户 || '' }
        : null
    }

    return {
      ...product,
      id: idx + 1,
      订单总需求: orderTotal,
      仓库数: warehouseQty,
      在产数: productionQty,
      初始可用量: initialAvailable,
      缺量: displayShortage,
      deliveryMap,
      _deliveryPlans: rawPlans,
      _plansByDate: groupPlansByDate(rawPlans),
    } as unknown as TableRowData
  })
})

// ==================== 方法 ====================
async function fetchData() {
  if (!dateRange.value) {
    message.warning('请选择日期范围')
    return
  }
  loading.value = true
  try {
    const data = await salesControlService.addPMCSalesControlList()
    productList.value = data || []
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('加载数据失败，请稍后重试')
    productList.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  validationBasis.value = 'warehouseOnly'
  dateRange.value = getCurrentMonthRange()
  productType.value = '成品'      // 重置时恢复为成品显示
  filterDeliveryColumnsOnly.value = false
  fetchData()
}

function handleFilterColumns() {
  filterDeliveryColumnsOnly.value = !filterDeliveryColumnsOnly.value
  if (filterDeliveryColumnsOnly.value) {
    const n = activeDisplayDates.value.length
    if (n === 0) {
      message.warning('当前日期范围内暂无交货计划')
    } else {
      message.success(`已仅显示有交付信息的日期列（共 ${n} 天）`)
    }
  } else {
    message.info('已恢复显示全部日期列')
  }
}

function handleProductClick(record: TableRowData) {
  detailType.value = 'product'
  currentProduct.value = record
  detailModalVisible.value = true
}

function handleNumberClick(record: TableRowData, column: { key: string }) {
  console.log(record);
  if (column.key === '缺量' && Number(record.缺量) < 0) {
    router.push({
      name: 'PMCDetail',
      query: {
        id: record.货号,
        parentId: record.父级货号,
        productNo:record.排产编号,
        demand:record.订单总需求,
        index: column.key,
        tabTitle: `排产详情: ${record.货号}`,
      },
    })
    return
  }
  handleProductClick(record)
}

function handleDeliveryClick(record: TableRowData, dateKey: string) {
  const targetDate = dateColumnKeyToIso(dateKey)
  const planInfo = record.deliveryMap[dateKey]
  if (!planInfo) return

  // 当天总数量（后端已合并，直接使用）
  const totalQuantity = planInfo.quantity

  const initialAvailable = Number(record.初始可用量) || 0

  // 所有交货计划（后端已保证每个日期一条，且已排序）
  const allPlans = (record._deliveryPlans as DeliveryPlan[])
    .filter(p => p.交货日期)
    .sort((a, b) => a.交货日期.localeCompare(b.交货日期))

  // 累加所有日期 <= targetDate 的计划数量
  let cumulativePlanQty = 0
  for (const plan of allPlans) {
    if (plan.交货日期 > targetDate) break
    cumulativePlanQty += Number(plan.交货数量) || 0
  }

  let cumulativeShortage = initialAvailable - cumulativePlanQty
  if (cumulativeShortage > 0) cumulativeShortage = 0

  detailType.value = 'delivery'
  currentProduct.value = record
  currentDelivery.value = {
    product: record,
    plan: {
      交货日期: targetDate,
      交货数量: totalQuantity,
      状态: planInfo.status as DeliveryStatus,
      排产用户: planInfo.排产用户 || '',
    },
    cumulativeDelivered: cumulativeShortage,
  }
  detailModalVisible.value = true
}

/**
 * 根据初始可用量和所有交货计划，按日期顺序计算每个日期的交付状态
 * @param plans 原始交货计划数组（可能未排序、可能有重复日期）
 * @param initialAvailable 初始可用量（依赖验证依据）
 * @returns Map key: 日期字符串 YYYY-MM-DD, value: { quantity, status }
 */
function computeDeliveryStatuses(
  plans: DeliveryPlan[],
  initialAvailable: number
): Map<string, ComputedDeliveryInfo> {
  // 1. 按日期聚合数量（同一天可能有多个计划）
  const grouped = new Map<string, { quantity: number; 排产用户: string }>()
  for (const p of plans) {
    const date = p.交货日期
    if (!date) continue
    const qty = Number(p.交货数量) || 0
    const entry = grouped.get(date)
    if (entry) {
      entry.quantity += qty
    } else {
      grouped.set(date, { quantity: qty, 排产用户: p.排产用户 || '' })
    }
  }

  // 2. 转为数组并按日期升序排序
  const sortedDates = Array.from(grouped.keys()).sort()
  const result = new Map<string, ComputedDeliveryInfo>()

  let cumulativeBefore = 0 // 当前日期之前已经累计的交货总量

  for (const date of sortedDates) {
    const entry = grouped.get(date)!
    const qty = entry.quantity
    // 根据规则判定状态
    let status: string
    if (cumulativeBefore >= initialAvailable) {
      // 之前累计已耗尽库存，当前批次无法交付
      status = 'none'
    } else {
      const remaining = initialAvailable - cumulativeBefore // 剩余可用量
      if (remaining >= qty) {
        status = 'full' // 当前批次可全部交付
      } else {
        status = 'partial' // 当前批次只能部分交付
      }
    }
    result.set(date, { quantity: qty, status, 排产用户: entry.排产用户 })
    // 更新累计（包含当前批次）
    cumulativeBefore += qty
  }

  return result
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* 基础容器样式 */
.product-inventory-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px;
}

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
  gap: 24px;
  flex-wrap: wrap;
}

.filter-row.second-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  justify-content: space-between;  /* 左右分布 */
}

/* 左侧区域：日期选择器 + 操作按钮 */
.left-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

/* 右侧区域：垂直排列，右对齐 */
.right-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

/* 商品类型切换按钮样式，与现有 radio 风格统一 */
.product-type-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f8f9fc;
  padding: 6px 14px;
  border-radius: 30px;
}

.switch-label {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
}

:deep(.product-type-switch .ant-radio-group) {
  display: flex;
  gap: 8px;
}

:deep(.product-type-switch .ant-radio-button-wrapper) {
  height: 28px;
  line-height: 26px;
  padding: 0 16px;
  border: 1px solid #e6e9f0;
  border-radius: 20px !important;
  background: #ffffff;
  color: #595959;
  font-size: 12px;
  font-weight: 500;
  margin: 0 !important;
}

:deep(.product-type-switch .ant-radio-button-wrapper:not(:first-child))::before {
  display: none !important;
}

:deep(.product-type-switch .ant-radio-button-wrapper-checked) {
  border-color: #1e3a5f !important;
  background: #1e3a5f !important;
  color: #ffffff !important;
}

/* 其余原有样式保持 */
.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

:deep(.ant-radio-group) {
  display: flex;
  gap: 8px;
}

:deep(.ant-radio-button-wrapper) {
  height: 32px;
  line-height: 30px;
  padding: 0 16px;
  border: 1px solid #e6e9f0;
  border-radius: 20px !important;
  background: #ffffff;
  color: #595959;
  font-size: 13px;
  font-weight: 500;
  margin: 0 !important;
}

:deep(.ant-radio-button-wrapper:not(:first-child))::before {
  display: none !important;
}

:deep(.ant-radio-button-wrapper-checked) {
  border-color: #1e3a5f !important;
  background: #1e3a5f !important;
  color: #ffffff !important;
}

.status-legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-items {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid;
}

.date-range-picker {
  flex: 1;
  min-width: 260px;
}

.date-pickers {
  display: flex;
  gap: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

:deep(.ant-btn) {
  border-radius: 20px;
  height: 36px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 500;
}

:deep(.ant-btn-primary) {
  background: #1e3a5f;
  border-color: #1e3a5f;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
  font-size: 13px;
  background: #f8f9fc;
  padding: 6px 14px;
  border-radius: 30px;
  margin-left: 0;  /* 移除原有margin-left，由父级右对齐控制 */
}

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
  padding: 14px 8px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f9ff !important;
  cursor: pointer;
}

.link-cell {
  color: #1e3a5f;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 1px dashed transparent;
}

.link-cell:hover {
  border-bottom-color: #2b4b78;
}

.number-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.delivery-cell {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 30px;
  border: 1px solid;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  min-width: 48px;
  text-align: center;
}

.delivery-cell:hover {
  transform: scale(1.02);
}

.no-delivery {
  color: #d0d5dd;
}

.footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-radius: 12px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .product-inventory-container {
    padding: 16px;
  }

  .filter-row.second-row {
    flex-direction: column;
    align-items: stretch;
  }

  .left-group,
  .right-group {
    width: 100%;
  }

  .right-group {
    align-items: flex-start;
    margin-top: 12px;
  }

  .product-type-switch {
    align-self: flex-start;
  }

  .hint-text {
    align-self: flex-start;
  }

  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
