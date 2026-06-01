<template>
  <a-modal
    v-model:open="localVisible"
    :footer="null"
    width="1150px"
    class="work-order-detail-modal"
    @cancel="handleClose"
  >
    <!-- 自定义标题栏 -->
    <template #title>
      <div class="custom-modal-header">
        <span class="modal-title-text">工单总数明细 - {{ productNo }}</span>
        <span class="modal-product-info">{{ productInfo }}</span>
      </div>
    </template>

    <!-- 工单总需求表格 -->
    <div class="table-section">
      <div class="section-header">
        <span class="section-title">工单总需求</span>
        <span class="section-product-info">{{ productInfo }}</span>
      </div>
      <a-table
        :columns="workOrderColumns"
        :data-source="workOrderData"
        :pagination="false"
        size="small"
        bordered
        class="detail-table"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.key === '待产数'">
            <span :class="{ 'highlight-yellow': Number(text) > 0 }">{{ text }}</span>
          </template>
          <template v-else>{{ text }}</template>
        </template>
      </a-table>
    </div>

    <!-- 物料需求明细表格 -->
    <div class="table-section">
      <div class="section-header">
        <span class="section-title">物料需求明细</span>
        <span class="section-product-info">{{ productInfo }}</span>
      </div>
      <a-table
        :columns="materialColumns"
        :data-source="materialData"
        :pagination="false"
        size="small"
        bordered
        class="detail-table"
        :scroll="{ x: 950 }"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.key === '缺料数' || column.key === '仓库缺料'">
            <span :class="getShortageClass(text)">{{ text }}</span>
          </template>
          <template v-else>{{ text }}</template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface WorkOrderItem {
  id: number
  工单单号: string
  完成日期: string
  生产数: number
  入库数量: number
  待产数: number
}

interface MaterialItem {
  id: number
  货号: string
  品名: string
  规格: string
  用量: number
  需求数: number
  已出库数: number
  缺料数: number
  仓库名称: string
  仓库数: number
  仓库缺料: number
}

const props = defineProps<{
  visible: boolean
  productNo: string
  productName: string
  productSpec: string
  workOrderData: WorkOrderItem[]
  materialData: MaterialItem[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const productInfo = computed(() => `${props.productNo},${props.productName},${props.productSpec}`)

const workOrderColumns = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 60, align: 'center' },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号', width: 160 },
  { title: '完成日期', dataIndex: '完成日期', key: '完成日期', width: 120, align: 'center' },
  { title: '生产数', dataIndex: '生产数', key: '生产数', width: 100, align: 'center' },
  { title: '入库数量', dataIndex: '入库数量', key: '入库数量', width: 100, align: 'center' },
  { title: '待产数', dataIndex: '待产数', key: '待产数', width: 100, align: 'center' },
]

const materialColumns = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 50, align: 'center' },
  { title: '货号', dataIndex: '货号', key: '货号', width: 110 },
  { title: '品名', dataIndex: '品名', key: '品名', width: 100 },
  { title: '规格', dataIndex: '规格', key: '规格', width: 260 },
  { title: '用量', dataIndex: '用量', key: '用量', width: 60, align: 'center' },
  { title: '需求数', dataIndex: '需求数', key: '需求数', width: 80, align: 'center' },
  { title: '已出库数', dataIndex: '已出库数', key: '已出库数', width: 90, align: 'center' },
  { title: '缺料数', dataIndex: '缺料数', key: '缺料数', width: 80, align: 'center' },
  { title: '仓库名称', dataIndex: '仓库名称', key: '仓库名称', width: 110, align: 'center' },
  { title: '仓库数', dataIndex: '仓库数', key: '仓库数', width: 80, align: 'center' },
  { title: '仓库缺料', dataIndex: '仓库缺料', key: '仓库缺料', width: 90, align: 'center' },
]

function getShortageClass(value: number) {
  if (Number(value) > 1000) return 'highlight-red'
  if (Number(value) > 0) return 'highlight-yellow'
  return ''
}

function handleClose() {
  localVisible.value = false
}
</script>

<style scoped>
/* 自定义标题栏 */
.work-order-detail-modal :deep(.ant-modal-header) {
  background-color: #1e3a5f;
  padding: 12px 20px;
  border-bottom: none;
}

.custom-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 24px;
}

.modal-title-text {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.modal-product-info {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

/* body 区域 */
.work-order-detail-modal :deep(.ant-modal-body) {
  padding: 20px;
  max-height: 72vh;
  overflow-y: auto;
}

.work-order-detail-modal :deep(.ant-modal-content) {
  border-radius: 8px;
  overflow: hidden;
}

/* 关闭按钮 */
.work-order-detail-modal :deep(.ant-modal-close) {
  top: 14px;
  right: 14px;
}

.work-order-detail-modal :deep(.ant-modal-close-x) {
  color: rgba(255, 255, 255, 0.7);
  width: 28px;
  height: 28px;
  line-height: 28px;
}

.work-order-detail-modal :deep(.ant-modal-close-x:hover) {
  color: #ffffff;
}

/* 表格区域 */
.table-section {
  margin-bottom: 24px;
}

.table-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  position: relative;
  padding-left: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background-color: #1e3a5f;
  border-radius: 2px;
}

.section-product-info {
  font-size: 12px;
  color: #8c8c8c;
  background-color: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

/* 表格样式 */
.detail-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa !important;
  color: #262626;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 8px;
}

.detail-table :deep(.ant-table-tbody > tr > td) {
  font-size: 13px;
  padding: 8px;
}

.detail-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f9ff !important;
}

/* 高亮样式 */
.highlight-yellow {
  background-color: #fffbe6;
  color: #ad6800;
  font-weight: 600;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
}

.highlight-red {
  background-color: #fff2f0;
  color: #cf1322;
  font-weight: 600;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
