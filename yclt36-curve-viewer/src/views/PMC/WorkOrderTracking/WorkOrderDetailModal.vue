<template>
  <a-modal
    v-model:open="localVisible"
    :footer="null"
    :mask-closable="false"
    width="1400px"
    class="work-order-detail-modal"
    :body-style="{ minHeight: '550px' }"
    @cancel="handleClose"
  >
    <!-- 自定义标题栏 -->
    <template #title>
      <div class="custom-modal-header">
        <span class="modal-title-text">工单详情</span>
      </div>
    </template>

    <!-- 产品信息卡片 -->
    <div class="product-info-card">
      <div class="info-block">
        <span class="info-label">产品编号：</span>
        <span class="info-value">{{ productNo || '-' }}</span>
      </div>
      <div class="info-block">
        <span class="info-label">产品名称：</span>
        <span class="info-value">{{ productName || '-' }}</span>
      </div>
      <div class="info-block">
        <span class="info-label">规格：</span>
        <span class="info-value">{{ productSpec || '-' }}</span>
      </div>
    </div>

    <!-- 工单总需求表格 -->
    <div class="table-section">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-title">工单总需求</span>
            <span class="section-count">{{ workOrderData.length }} 条</span>
          </div>
          <a-button
            type="primary"
            size="small"
            class="print-btn"
            :disabled="selectedRowKeys.length === 0"
            @click="handlePrint"
          >
            <PrinterOutlined />
            <span>打印</span>
          </a-button>
        </div>
        <div class="table-scroll">
          <a-table
            :columns="workOrderColumns"
            :data-source="workOrderData"
            :pagination="false"
            size="small"
            class="detail-table"
            :row-selection="{ type: 'radio', selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            :row-key="(record: WorkOrderItem) => record.id"
          >
            <template #bodyCell="{ column, text }">
              <template v-if="column.key === '待产数'">
                <StatusBadge v-if="Number(text) > 0" type="warning" :text="text" />
                <span v-else class="num-muted">{{ text }}</span>
              </template>
              <template v-else-if="column.key === '生产数' || column.key === '入库数'">
                <span class="num-cell">{{ text }}</span>
              </template>
              <template v-else>{{ text }}</template>
            </template>
          </a-table>
        </div>
      </div>
    </div>

    <!-- 物料需求明细表格 -->
    <div v-if="showMaterial !== false" class="table-section">
      <div class="section-card">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-title">物料需求明细</span>
            <span class="section-count">{{ materialData.length }} 条</span>
          </div>
          <div class="shortage-tags">
            <a-tag v-if="materialShortage > 0" color="error" class="shortage-tag">
              缺料 {{ materialShortage }} 项
            </a-tag>
            <a-tag v-if="warehouseShortage > 0" color="error" class="shortage-tag">
              仓库缺料 {{ warehouseShortage }} 项
            </a-tag>
          </div>
        </div>
        <div class="table-scroll">
          <a-table
            :columns="materialColumns"
            :data-source="materialData"
            :pagination="false"
            size="small"
            class="detail-table"
            :loading="loading"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="{ column, text }">
              <template v-if="column.key === '缺料数' || column.key === '仓库缺料'">
                <StatusBadge v-if="Number(text) > 0" type="danger" :text="text" />
                <span v-else class="num-muted">{{ text }}</span>
              </template>
              <template v-else-if="column.key === '用量' || column.key === '需求数' || column.key === '已出库数' || column.key === '仓库数'">
                <span class="num-cell">{{ text }}</span>
              </template>
              <template v-else>{{ text }}</template>
            </template>
          </a-table>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { PrinterOutlined } from '@ant-design/icons-vue'
import { printWorkOrder, type WorkOrderPrintData } from '@/utils/workOrderPrint'
import { externalProductionService } from '@/services/externalProductionService'
import { ExternalProduction } from '@/api-generated/api'

const StatusBadge = {
  props: {
    type: { type: String, default: 'warning' },
    text: { type: [String, Number], required: true }
  },
  setup(props: { type: string; text: string | number }) {
    const cls = props.type === 'danger' ? 'alert-pill alert-danger' : 'alert-pill alert-warning'
    return () => h('span', { class: cls }, String(props.text))
  }
}

interface WorkOrderItem {
  id: number
  编号: string
  工单单号: string
  排产编号: string
  排产用户: string
  交货日期: string
  生产数: number
  入库数: number
  待产数: number
}

interface MaterialItem {
  id: number
  货号: string
  品名: string
  规格: string
  产品属性?: string
  来源?: string
  单位?: string
  用量: number
  需求数: number
  已出库数: number
  缺料数: number
  仓库名称: string
  仓库数: number
  仓库缺料: number
  备注?: string
}

const props = defineProps<{
  visible: boolean
  productNo: string
  productName: string
  productSpec: string
  workOrderData: WorkOrderItem[]
  materialData: MaterialItem[]
  loading?: boolean
  showMaterial?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const materialShortage = computed(
  () => props.materialData.filter((m) => Number(m.缺料数) > 0 || Number(m.仓库缺料) > 0).length
)

const warehouseShortage = computed(
  () => props.materialData.filter((m) => Number(m.仓库缺料) > 0).length
)

const selectedRowKeys = ref<number[]>([])

function onSelectChange(keys: number[]) {
  selectedRowKeys.value = keys
}

async function handlePrint() {
  const rows = props.workOrderData.filter((item) => selectedRowKeys.value.includes(item.id))
  if (rows.length === 0) return

  // 选中工单总需求行后，按编号查询对应的外产生产数据并回填到打印工单中
  const workOrders = await Promise.all(
    rows.map(async (item) => {
      const ext = await externalProductionService.getExternalProductionByNo(item.编号)
      return {
        ...item,
        来源: ext?.来源 || '',
        工序车间: ext?.工序车间 || '',
        工序: ext?.工序 || '',
        工单层级: ext?.工单层级 || '',
        电压: ext?.电压 || '',
        线圈: ext?.线圈 || '',
        订单数: ext?.订单数 || '',
        单位: ext?.单位 || '',
        仓库名称: ext?.仓库名称 || '',
        备注: ext?.备注 || '',
        用量: ext?.用量 || '',
      }
    }),
  )

  const printData: WorkOrderPrintData = {
    productNo: props.productNo,
    productName: props.productName,
    productSpec: props.productSpec,
    workOrders,
    materials: props.materialData.map((m) => ({
      ...m,
      产品属性: m.产品属性 ?? '',
      来源: m.来源 ?? '',
      单位: m.单位 ?? '',
      备注: m.备注 ?? '',
    })),
  }

  await printWorkOrder(printData)

  // 打印触发后，回写外产生产数据的打印时间字段（值设为"更新"），根据当前选中行查询到的外产生产记录传入
  const extUpdates = rows
    .map((item) => externalProductionService.getExternalProductionByNo(item.编号))
    .map((p) =>
      p.then((ext) => {
        if (!ext) return null
        const ep = new ExternalProduction(ext)
        ep.打印时间 = '更新'
        return ep
      }),
    )

  const updatedList = (await Promise.all(extUpdates)).filter(
    (ep): ep is ExternalProduction => ep !== null,
  )
  if (updatedList.length > 0) {
    await externalProductionService.addOrUpdateExternalProductionList(updatedList)
  }
}

const workOrderColumns = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 60, align: 'center' },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号', width: 120 },
  { title: '排产编号', dataIndex: '排产编号', key: '排产编号', width: 120, align: 'center' },
  { title: '排产用户', dataIndex: '排产用户', key: '排产用户', width: 120, align: 'center' },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期', width: 120, align: 'center' },
  { title: '生产数', dataIndex: '生产数', key: '生产数', width: 100, align: 'center' },
  { title: '入库数', dataIndex: '入库数', key: '入库数', width: 100, align: 'center' },
  { title: '待产数', dataIndex: '待产数', key: '待产数', width: 100, align: 'center' },
]

const materialColumns = [
  { title: '序号', dataIndex: 'id', key: 'id', width: 50, align: 'center' },
  { title: '货号', dataIndex: '货号', key: '货号', width: 110 },
  { title: '品名', dataIndex: '品名', key: '品名', width: 100 },
  { title: '规格', dataIndex: '规格', key: '规格', width: 140 },
  { title: '用量', dataIndex: '用量', key: '用量', width: 80, align: 'center' },
  { title: '需求数', dataIndex: '需求数', key: '需求数', width: 100, align: 'center' },
  { title: '已出库数', dataIndex: '已出库数', key: '已出库数', width: 110, align: 'center' },
  { title: '缺料数', dataIndex: '缺料数', key: '缺料数', width: 100, align: 'center' },
  { title: '仓库名称', dataIndex: '仓库名称', key: '仓库名称', width: 100, align: 'center' },
  { title: '仓库数', dataIndex: '仓库数', key: '仓库数', width: 100, align: 'center' },
  { title: '仓库缺料', dataIndex: '仓库缺料', key: '仓库缺料', width: 110, align: 'center' },
]

function handleClose() {
  selectedRowKeys.value = []
  localVisible.value = false
}

// 打开弹窗时确保清空上次勾选；关闭时同样清空
watch(
  () => props.visible,
  (val) => {
    if (!val) {
      selectedRowKeys.value = []
    }
  }
)
</script>

<style scoped>
/* 自定义标题栏 - 与父页面深蓝表头统一 */
.work-order-detail-modal :deep(.ant-modal-header) {
  background-color: #1e3a5f;
  padding: 14px 20px;
  border-bottom: none;
}

.custom-modal-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 56px;
  box-sizing: border-box;
}

.modal-title-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* body 区域 - 纯白背景，与遮罩形成明确层次 */
.work-order-detail-modal :deep(.ant-modal-content) {
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 550px;
  max-height: 80vh;
}

.work-order-detail-modal :deep(.ant-modal-body) {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #ffffff;
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

.product-info-card {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  background-color: #fafafa;
  border: 1px solid #e8e8e8;
  border-left: 3px solid #1e3a5f;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 18px;
}

.info-block {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  width: fit-content;
  padding: 6px 10px;
}

.info-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  line-height: 20px;
  text-align: left;
  white-space: nowrap;
}

.info-value {
  flex: 0 1 auto;
  font-size: 13px;
  color: #262626;
  font-weight: 500;
  line-height: 20px;
  word-break: break-all;
  overflow-wrap: break-word;
}

/* 表格区域 */
.table-section {
  margin-bottom: 18px;
}

.table-section:last-child {
  margin-bottom: 0;
}

.section-card {
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a5f;
}

.section-count {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  background-color: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.shortage-tags {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortage-tag {
  margin: 0;
  font-weight: 500;
}

.print-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 4px;
  font-weight: 500;
}

.print-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 表格横向滚动包裹，防止窄屏溢出 */
.table-scroll {
  width: 100%;
  overflow-x: auto;
}

/* 表格样式 - 与父页面深蓝表头统一 */
.detail-table :deep(.ant-table) {
  border-radius: 4px;
  overflow: hidden;
}

.detail-table :deep(.ant-table-thead > tr > th) {
  background-color: #1e3a5f !important;
  color: #ffffff;
  font-weight: 500;
  font-size: 13px;
  padding: 11px 10px;
  border-bottom: none;
}

.detail-table :deep(.ant-table-tbody > tr > td) {
  font-size: 13px;
  color: #595959;
  padding: 10px;
}

/* 柔和斑马纹 */
.detail-table :deep(.ant-table-tbody > tr:nth-child(even) > td) {
  background-color: #fafafa;
}

.detail-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f0f5ff !important;
}

/* 数字列居中 + 等宽数字 */
.num-cell {
  display: inline-block;
  width: 100%;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.num-muted {
  display: inline-block;
  color: #bfbfbf;
}

/* 醒目的缺料/待产胶囊标签 */
.alert-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
}

.alert-danger {
  background-color: #ff4d4f;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.25);
}

.alert-warning {
  background-color: #faad14;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(250, 173, 20, 0.25);
}

/* 兼容旧高亮类 */
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
