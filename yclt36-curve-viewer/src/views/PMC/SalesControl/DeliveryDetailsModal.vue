<template>
  <a-modal
    v-model:open="localVisible"
    :title="modalTitle"
    :footer="null"
    width="800px"
    :body-style="{ minHeight: '50vh' }"
    class="detail-modal"
    @cancel="handleClose"
  >
    <!-- 产品信息 -->
    <template v-if="detailType === 'product' && product">
      <div class="product-header">
        <div class="header-item">
          <span class="header-label">货号：</span>
          <span class="header-value">{{ product.货号 }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">品名：</span>
          <span class="header-value">{{ product.中文品名 }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">规格：</span>
          <span class="header-value">{{ product.中文规格 }}</span>
        </div>
      </div>
      <a-divider style="margin: 12px 0;" />
      <a-table
        :columns="productTableColumns"
        :data-source="productTableData"
        :pagination="false"
        size="small"
        bordered
        class="detail-table"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.key === '状态'">
            <span :class="'status-badge status-' + text">{{ statusTextMap[text] || text || '-' }}</span>
          </template>
          <template v-else-if="column.dataType === 'number'">
            <span class="table-number">{{ text }}</span>
          </template>
        </template>
      </a-table>
    </template>

    <!-- 交付详情卡片 -->
    <a-card v-else-if="detailType === 'delivery' && delivery" :bordered="false" class="detail-card">
      <div class="card-item">
        <span class="label">货号：</span>
        <span class="value">{{ delivery.product.货号 }}</span>
      </div>
      <div class="card-item">
        <span class="label">品名：</span>
        <span class="value">{{ delivery.product.中文品名 }}</span>
      </div>
      <div class="card-item">
        <span class="label">规格：</span>
        <span class="value">{{ delivery.product.中文规格 }}</span>
      </div>
      <a-divider />
      <div class="card-item">
        <span class="label">交货日期：</span>
        <span class="value">{{ delivery.plan.交货日期 }}</span>
      </div>
      <div class="card-item">
        <span class="label">交货数量：</span>
        <span class="value number">{{ delivery.plan.交货数量 }}</span>
      </div>
      <div class="card-item">
        <span class="label">交付缺量：</span>
        <span class="value number">{{ deliveryShortage  }}</span>
      </div>
      <div class="card-item">
        <span class="label">状态：</span>
        <span class="value" :class="'status-' + delivery.plan.状态">
          {{ statusText }}
        </span>
      </div>
    </a-card>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product, DeliveryPlan } from '../types'

interface SalesControlDetail {
  编号: string
  父级编号: string
  合同号: string
  业务员: string
  交货日期: string
  订单数量: string
  已发数量: string
  待发数量: string
  状态: string
  货号: string
  品名: string
  规格: string
}

const props = defineProps<{
  visible: boolean
  detailType: 'product' | 'delivery'
  product: Product | null
  delivery: { product: Product; plan: DeliveryPlan ; cumulativeDelivered: number} | null
  details: SalesControlDetail[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

// 本地可见性双向绑定
const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 弹窗标题
const modalTitle = computed(() =>
  props.detailType === 'product' ? '产品信息' : '交付详情'
)

// 状态文字
const statusText = computed(() => {
  if (props.detailType !== 'delivery' || !props.delivery) return ''
  const status = props.delivery.plan.状态
  return status || '不满足'
})

const statusTextMap: Record<string, string> = {
  '满足': '满足',
  '部分满足': '部分满足',
  '不满足': '不满足',
}

// 从明细表获取产品交货计划
const productDeliveryPlans = computed(() => {
  if (!props.product) return []
  
  const productId = props.product.编号 || props.product.货号
  if (!productId) return []
  
  // 过滤属于当前产品的明细记录
  const productDetails = props.details.filter(
    detail => String(detail.父级编号) === String(productId) || 
              String(detail.货号) === String(props.product!.货号)
  )
  
  // 按交货日期分组并汇总数量
  const grouped = new Map<string, { quantity: number; status: string; 业务员: string; 合同号: string; 已发数量: number; 待发数量: number }>()
  for (const detail of productDetails) {
    const date = detail.交货日期
    if (!date) continue
    
    const qty = Number(detail.订单数量) || 0
    const status = detail.状态 || '不满足'
    const salesman = detail.业务员 || ''
    const contractNo = detail.合同号 || ''
    const sentQty = Number(detail.已发数量) || 0
    const pendingQty = Number(detail.待发数量) || 0
    
    const existing = grouped.get(date)
    if (existing) {
      existing.quantity += qty
      existing.已发数量 += sentQty
      existing.待发数量 += pendingQty
    } else {
      grouped.set(date, { quantity: qty, status, 业务员: salesman, 合同号: contractNo, 已发数量: sentQty, 待发数量: pendingQty })
    }
  }
  
  // 转换为交货计划数组并排序
  return Array.from(grouped.entries())
    .map(([date, info]) => ({
      交货日期: date,
      交货数量: info.quantity,
      状态: info.status as '满足' | '部分满足' | '不满足',
      排产用户: info.业务员,
      合同号: info.合同号,
      已发数量: info.已发数量,
      待发数量: info.待发数量,
    }))
    .sort((a, b) => a.交货日期.localeCompare(b.交货日期))
})

const productTableColumns = [
  { title: '合同号', dataIndex: '合同号', key: '合同号', align: 'center', width: 130 },
  { title: '业务员', dataIndex: '业务员', key: '业务员', align: 'center', width: 100 },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期', align: 'center', width: 120 },
  { title: '订单数', dataIndex: '订单数', key: '订单数', align: 'center', width: 90, dataType: 'number' },
  { title: '已发数量', dataIndex: '已发数量', key: '已发数量', align: 'center', width: 100, dataType: 'number' },
  { title: '待发数量', dataIndex: '待发数量', key: '待发数量', align: 'center', width: 100, dataType: 'number' },
  // { title: '状态', dataIndex: '状态', key: '状态', align: 'center', width: 100 },
]

const productTableData = computed(() => {
  if (!props.product) return []
  const plans = productDeliveryPlans.value
  if (plans.length === 0) {
    return [{ 
      key: '0', 
      交货日期: '-', 
      状态: '', 
      业务员: '-', 
      订单数: '-',
      合同号: props.product.合同号 || '-',
      已发数量: 0,
      待发数量: 0,
    }]
  }
  return plans.map((plan, idx) => ({
    key: String(idx),
    交货日期: plan.交货日期,
    状态: plan.状态,
    业务员: plan.排产用户 || '-',
    订单数: plan.交货数量,
    合同号: plan.合同号 || props.product.合同号 || '-',
    已发数量: plan.已发数量,
    待发数量: plan.待发数量,
  }))
})

// 计算交付缺量（初始可用量 - 累计交付量）
const deliveryShortage = computed(() => {
  if (props.detailType !== 'delivery' || !props.delivery) return ''
  const shortage = props.delivery.cumulativeDelivered
  // 若大于0表示还有剩余，显示0（不缺）；否则显示负数（缺量）
  return shortage 
})

// 关闭弹窗
const handleClose = () => {
  localVisible.value = false
}
</script>

<style scoped>
/* 弹窗整体样式 - 更精致的卡片感 */
.detail-modal :deep(.ant-modal-content) {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  background: #ffffff;
}

/* 头部 - 加入渐变背景和装饰 */
.detail-modal :deep(.ant-modal-header) {
  padding: 20px 24px;
  border-bottom: none;
  background: linear-gradient(135deg, #f9fafc 0%, #ffffff 100%);
  position: relative;
}

.detail-modal :deep(.ant-modal-header::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #1e3a5f, #3b5f8c);
  border-radius: 0 4px 4px 0;
}

.detail-modal :deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e3a5f;
  letter-spacing: 0.3px;
  padding-left: 12px;
}

/* 关闭按钮 - 柔和悬停 */
.detail-modal :deep(.ant-modal-close) {
  top: 20px;
  right: 24px;
}

.detail-modal :deep(.ant-modal-close-x) {
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  color: #8c8c8c;
  transition: all 0.2s;
}

.detail-modal :deep(.ant-modal-close-x:hover) {
  background-color: #f0f2f5;
  color: #1e3a5f;
  transform: rotate(90deg);
}

/* 卡片主体 - 增加微妙的纹理背景 */
.detail-card {
  background-color: #ffffff;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(30, 58, 95, 0.02) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(59, 95, 140, 0.02) 0%, transparent 20%);
  border-radius: 0 0 24px 24px;
  padding: 8px 0 16px;
}

.detail-card :deep(.ant-card-body) {
  padding: 0;
}

/* 每一项卡片行 */
.detail-card .card-item {
  display: flex;
  align-items: baseline;
  padding: 16px 24px;
  font-size: 15px;
  line-height: 1.6;
  border-bottom: 1px dashed #eaeef5;
  transition: all 0.2s ease;
  position: relative;
}

.detail-card .card-item:hover {
  background-color: #f8fbff;
  transform: translateX(4px);
  border-bottom-color: transparent;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.04);
}

/* 标签样式 */
.detail-card .label {
  width: 110px;
  color: #5f6c80;
  font-weight: 450;
  font-size: 14px;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 可以为特定字段添加图标，如果不需要可移除 */
.detail-card .label::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #1e3a5f;
  border-radius: 50%;
  opacity: 0.3;
}

/* 数值样式 */
.detail-card .value {
  flex: 1;
  color: #1e2a3a;
  font-weight: 500;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-card .value.number {
  font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace;
  font-weight: 600;
  color: #1e3a5f;
  font-size: 16px;
  background: #f2f6fc;
  padding: 2px 10px;
  border-radius: 30px;
  display: inline-block;
}

/* 状态标签 - 更丰富的色彩和阴影 */
.detail-card .value.status-full,
.detail-card .value.status-partial,
.detail-card .value.status-none {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 5px 16px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(2px);
}

.detail-card .value.status-full {
  background: linear-gradient(145deg, #e6f7e6, #d4f0d4);
  color: #1f7b1f;
  border: 1px solid #a5d6a5;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
}

.detail-card .value.status-partial {
  background: linear-gradient(145deg, #fff4e2, #ffebd2);
  color: #aa5f0e;
  border: 1px solid #ffcb91;
  box-shadow: 0 4px 12px rgba(183, 110, 27, 0.12);
}

.detail-card .value.status-none {
  background: linear-gradient(145deg, #ffe9e9, #ffe0e0);
  color: #a13b3b;
  border: 1px solid #fbb5b5;
  box-shadow: 0 4px 12px rgba(183, 28, 28, 0.12);
}

/* 分隔线 - 更柔和 */
.detail-card .ant-divider {
  margin: 8px 0 4px;
  background: linear-gradient(90deg, 
    transparent, 
    #d0d9e8 20%, 
    #d0d9e8 80%, 
    transparent);
  height: 1px;
}

/* 可选的装饰图标 */
.detail-card .card-item:last-child .value {
  position: relative;
}

.detail-card .card-item:last-child .value::after {
  display: none; /* 如果需要，可以改为某个装饰 */
}

/* 产品信息头部 */
.product-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  padding: 8px 4px;
}

.header-item {
  display: flex;
  align-items: baseline;
  font-size: 14px;
}

.header-label {
  color: #5f6c80;
  font-weight: 450;
  margin-right: 6px;
}

.header-value {
  color: #1e2a3a;
  font-weight: 500;
}

/* 表格样式 */
.detail-table :deep(.ant-table-thead > tr > th) {
  background-color: #1e3a5f !important;
  color: #ffffff;
  font-weight: 500;
  padding: 10px 8px;
}

.detail-table :deep(.ant-table-tbody > tr > td) {
  padding: 10px 8px;
}

.table-number {
  font-family: 'SF Mono', 'Fira Code', 'Roboto Mono', monospace;
  font-weight: 600;
  color: #1e3a5f;
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 3px 12px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.status-badge.status-full {
  background: linear-gradient(145deg, #e6f7e6, #d4f0d4);
  color: #1f7b1f;
  border: 1px solid #a5d6a5;
}

.status-badge.status-partial {
  background: linear-gradient(145deg, #fff4e2, #ffebd2);
  color: #aa5f0e;
  border: 1px solid #ffcb91;
}

.status-badge.status-none {
  background: linear-gradient(145deg, #ffe9e9, #ffe0e0);
  color: #a13b3b;
  border: 1px solid #fbb5b5;
}
</style>