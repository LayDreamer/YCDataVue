<!-- views/Products.vue -->
<template>
  <a-card class="product-list-card" :loading="loading">
    <template #title>
      <div class="card-title">
        <ShoppingOutlined />
        <span>比例阀列表</span>
      </div>
    </template>
    <template #extra>
      <a-space>
        <a-button :icon="h(ReloadOutlined)" @click="loadProducts" :loading="loading">
          刷新
        </a-button>
      </a-space>
    </template>

    <!-- 搜索工具栏 -->
    <div class="table-toolbar">
      <a-input-search v-model:value="searchText" placeholder="搜索工单号或比例阀编号" style="width: 300px" allow-clear />
    </div>

    <!-- 产品表格 -->
    <a-table :data-source="filteredBLFParameters" :columns="blfParameterTableColumns" :loading="loading"
      :scroll="{ x: 'max-content' }" :pagination="{
        pageSize: 10,
        showQuickJumper: true,
        showTotal: (total: string) => `共 ${total} 条记录`
      }" row-key="id" bordered size="middle" style="min-height: 600px">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'currentFlowRateCurve' || column.dataIndex === 'pressureFlowRateCurve'">
          <a class="curve-link" @click="navigateToCurveDetail(record, column.dataIndex)">
            <LineChartOutlined />
            <span class="curve-text">查看</span>
          </a>
        </template>
        <template v-if="column.key === 'index'">
          {{ getRowIndex(record) }}
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ShoppingOutlined, LineChartOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { blfParameterService, type BLFParameter } from '../services/blfParameterService'
import { blfParameterTableColumns } from '../types/blfParameterTable'

const router = useRouter()

const blfParameters = ref<BLFParameter[]>([])
const loading = ref(false)
const searchText = ref('')

const filteredBLFParameters = computed(() => {
  const search = searchText.value.trim().toLowerCase()
  if (!search) return blfParameters.value
  return blfParameters.value.filter(item =>
    item.blfNumber?.toLowerCase().includes(search) ||
    item.workOrderNumber.toLowerCase().includes(search)
  )
})

const getRowIndex = (record: BLFParameter): number => {
  return filteredBLFParameters.value.findIndex(item => item.id === record.id) + 1
}

const navigateToCurveDetail = (record: BLFParameter, dataIndex: string): void => {
  router.push({
    name: 'CurveDetail',
    query: {
      id: record.blfNumber.toString(),
      index: dataIndex,
      tabTitle:dataIndex === 'currentFlowRateCurve' ? `电流流量曲线详情: ${record.blfNumber.toString()}` : `压力流量曲线详情: ${record.blfNumber.toString()}` 
    }
  })
}

const loadProducts = async (): Promise<void> => {
  loading.value = true
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 10000)
    })
    const dataPromise = blfParameterService.getAll()
    blfParameters.value = await Promise.race([dataPromise, timeoutPromise]) as BLFParameter[]
    if (blfParameters.value.length === 0) {
      message.info('暂无产品数据，请添加新产品')
    }
  } catch (error: any) {
    console.error('加载比例阀参数失败:', error)
    message.error('加载比例阀参数失败，API服务可能未启动')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>
<style scoped>
/* ==================== 产品列表卡片 ==================== */
.product-list-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  border: none;
}

.product-list-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, #f6ffed 0%, #f0f5ff 100%);
  border-bottom: none;
  padding: 16px 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title :deep(.anticon) {
  color: #52c41a;
  font-size: 20px;
}

.card-title span {
  font-size: 16px;
  font-weight: 600;
  color: #389e0d;
}

/* ==================== 表格工具栏 ==================== */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar :deep(.ant-input-search .ant-input) {
  border-radius: 8px;
}

.table-toolbar :deep(.ant-input-search .ant-input:focus),
.table-toolbar :deep(.ant-input-search .ant-input:hover) {
  border-color: #1890ff;
}

/* ==================== 表格样式 ==================== */
:deep(.ant-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  padding: 14px 16px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 14px 16px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f6ffed;
}

:deep(.ant-table-tbody > tr.ant-table-row-selected > td) {
  background: #e6f7ff;
}

/* ==================== 分页 ==================== */
:deep(.ant-pagination) {
  margin-top: 16px;
}

:deep(.ant-pagination-item-active) {
  border-color: #1890ff;
}

:deep(.ant-pagination-item-active a) {
  color: #1890ff;
}

/* ==================== 查看按钮 ==================== */
.curve-link {
  color: #1890ff;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  background: rgba(24, 144, 255, 0.1);
}

.curve-link:hover {
  background: rgba(24, 144, 255, 0.2);
  transform: translateY(-1px);
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .table-toolbar :deep(.ant-input-search) {
    width: 100% !important;
  }
  
  .product-list-card {
    border-radius: 8px;
  }
}
</style>