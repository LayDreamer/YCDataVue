<template>
  <a-modal
    v-model:open="localVisible"
    :title="modalTitle"
    :footer="null"
    width="600px"
    class="detail-modal"
    @cancel="handleClose"
  >
    <!-- 产品信息卡片 -->
    <a-card v-if="detailType === 'product' && product" :bordered="false" class="detail-card">
      <div class="card-item">
        <span class="label">货号：</span>
        <span class="value">{{ product.货号 }}</span>
      </div>
      <div class="card-item">
        <span class="label">品名：</span>
        <span class="value">{{ product.中文品名 }}</span>
      </div>
      <div class="card-item">
        <span class="label">规格：</span>
        <span class="value">{{ product.中文规格 }}</span>
      </div>
      <a-divider />
      <div class="card-item">
        <span class="label">订单总需求：</span>
        <span class="value number">{{ product.订单总需求 }}</span>
      </div>
      <div class="card-item">
        <span class="label">仓库数：</span>
        <span class="value number">{{ product.仓库数 }}</span>
      </div>
      <div class="card-item">
        <span class="label">在产数：</span>
        <span class="value number">{{ product.在产数 }}</span>
      </div>
      <div class="card-item">
        <span class="label">初始可用量：</span>
        <span class="value number">{{ product.初始可用量 }}</span>
      </div>
    </a-card>

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

const props = defineProps<{
  visible: boolean
  detailType: 'product' | 'delivery'
  product: Product | null
  delivery: { product: Product; plan: DeliveryPlan ; cumulativeDelivered: number} | null
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
  return status === 'full' ? '满足' : status === 'partial' ? '部分满足' : '不满足'
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
</style>
