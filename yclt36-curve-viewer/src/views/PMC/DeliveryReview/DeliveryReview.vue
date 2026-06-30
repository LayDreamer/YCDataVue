<template>
  <div class="page-container">
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="待评审总数" :value="unreviewedCount" :value-style="{ color: '#1890ff' }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="已完成评审" :value="reviewedCount" :value-style="{ color: '#3f9142' }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="本周需交付" :value="0" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="交期预警" :value="0" :value-style="{ color: '#cf1322' }" />
        </a-card>
      </a-col>
      
    </a-row>

    <a-card class="search-card" size="small">
      <a-form :layout="searchFormLayout" :model="searchForm" class="search-form">
        <div class="search-controls">
          <a-form-item label="合同号">
            <a-input v-model:value="searchForm.contractNo" placeholder="请输入" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="货号">
            <a-input v-model:value="searchForm.itemNo" placeholder="请输入" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="排产用户" v-if="viewMode === 'reviewed'">
            <a-select
              v-model:value="selectedProductionUser"
              placeholder="全部"
              allow-clear
              class="search-field search-select"
            >
              <a-select-option v-for="user in productionUserOptions" :key="user" :value="user">
                {{ user }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item class="search-actions">
            <!-- <a-button type="primary" @click="handleSearch">查询</a-button> -->
            <a-button class="btn-reset" @click="resetSearch">重置</a-button>
          </a-form-item>
        </div>
        <a-form-item label="数据范围" class="data-range-item">
          <a-radio-group v-model:value="viewMode" button-style="solid" class="view-mode-group">
            <a-radio-button value="unreviewed">待评审</a-radio-button>
            <a-radio-button value="reviewed">已评审</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card class="table-card">
      <div class="table-scroll">
        <a-table
          :columns="columns"
          :data-source="filteredData"
          :pagination="tablePagination"
          row-key="id"
          bordered
          :loading="loading"
          :scroll="{ x: 'max-content' }"
          :size="tableSize"
        >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === '状态'">           
            <a-tag :color="record.状态 === '评审通过' ? 'green' : record.状态 === '评审驳回' ? 'red' : 'orange'">
                 {{record.状态}}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button 
              v-if="viewMode === 'unreviewed'" 
              type="link" 
              @click="openReview(record)"
            >
              评审确认
            </a-button>
            <span v-else class="reviewed-tag">已评审</span>
          </template>
        </template>
        </a-table>
      </div>
    </a-card>

    <!-- 评审弹窗 -->
    <ReviewModal v-model:visible="modalVisible" :record="currentItem" @confirm="handleReviewConfirmed" @refresh="handleRefresh" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message, Grid } from 'ant-design-vue';
import ReviewModal from '../DeliveryReview/ReviewDetailModal.vue';
import type { PMCProductInfo } from '../DeliveryReview/types';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { RequestDto } from '../types';
import { PMCRequestDto,PMCDeliveryReview  } from '@/api-generated/api';

const columns = [
  { title: '合同号', dataIndex: '合同号', key: '合同号' },
  { title: '排产编号', dataIndex: '排产编号', key: '排产编号' },
  // { title: '分析单号', dataIndex: '分析单号', key: '分析单号' },
  { title: '货号', dataIndex: '货号', key: '货号' },
  { title: '中文品名', dataIndex: '中文品名', key: '中文品名' },
  { title: '线圈货号', dataIndex: '线圈货号', key: '线圈货号' },
  // { title: '来源编号', dataIndex: '来源编号', key: '来源编号' },
  { title: '数量', dataIndex: '数量', key: '数量' },
  { title: '来源', dataIndex: '来源', key: '来源' },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号' },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期' },
  { title: '排产用户', dataIndex: '排产用户', key: '排产用户' },
  { title: '电压', dataIndex: '电压', key: '电压', width: 100 },
  { title: '创建时间', dataIndex: '创建时间', key: '创建时间', width: 180 },
  { title: '状态', dataIndex: '状态', key: '状态', width: 100, fixed: 'right' },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

const searchForm = reactive({ contractNo: "", productionNo: '', itemNo: '', coilItemNo: '', analysisNo: '' });
const dataSource = ref<PMCDeliveryReview[]>([]);
const selectedProductionUser = ref<string | null>(null);
const modalVisible = ref(false);
const currentItem = ref<PMCDeliveryReview | null>(null);
const pagination = reactive({
  pageSize: 10,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
});

const screens = Grid.useBreakpoint();
const searchFormLayout = computed(() => (screens.value?.md ? 'inline' : 'vertical'));
const tableSize = computed(() => (screens.value?.md ? 'middle' : 'small'));
const tablePagination = computed(() => ({
  pageSize: pagination.pageSize,
  showSizeChanger: false,
  showQuickJumper: !!screens.value?.md,
  showTotal: pagination.showTotal,
  simple: !screens.value?.md,
}));
const loading = ref(false);
const loadingCount = ref(0);

// 设置加载状态（使用计数器处理并发请求）
const setLoading = (isLoading: boolean) => {
  if (isLoading) {
    loadingCount.value++;
    loading.value = true;
  } else {
    loadingCount.value--;
    if (loadingCount.value <= 0) {
      loadingCount.value = 0;
      loading.value = false;
    }
  }
};

// 模式切换：unreviewed（未评审）/ reviewed（已评审）
const viewMode = ref<'unreviewed' | 'reviewed'>('unreviewed');
// 缓存完整的数据（用于前端筛选）
const fullReviewedData = ref<PMCDeliveryReview[]>([]);
const fullUnreviewedData = ref<PMCDeliveryReview[]>([]);

// 统计数据
const unreviewedCount = ref(0);
const reviewedCount = ref(0);


// 计算属性：根据当前模式及筛选条件过滤数据
const filteredData = computed(() => {
  let result = [...dataSource.value];
  if (searchForm.contractNo) {
  
  // 两种模式都进行前端过滤合同号、分析单号
    result = result.filter(item => 
      item.合同号 && item.合同号.includes(searchForm.contractNo)
    );
  }
  if (searchForm.itemNo) {
    result = result.filter(item => 
      item.货号 && item.货号.includes(searchForm.itemNo)
    );
  }
  
  // 排产用户筛选（两种模式均适用）
  if (selectedProductionUser.value) {
    result = result.filter(item => item.排产用户 === selectedProductionUser.value);
  }  
  return result;
});

// 计算属性：动态生成排产用户选项（基于当前数据源，去重）
const productionUserOptions = computed(() => {
  const users = dataSource.value
    .map(item => item.排产用户)
    .filter(user => user && user.trim() !== '');
  return [...new Set(users)];
});

// 获取未评审数据（产品信息）
const  fetchProductData = async () => {
  setLoading(true);
  try {
    const requestDto = new PMCRequestDto({
      合同号: searchForm.contractNo,
      货号: searchForm.itemNo
    });
    const response = await deliveryReviewService.convertToPMCDeliveryReviewList(requestDto);
// 
    if (!response || response.length === 0) {
      dataSource.value = [];
      fullUnreviewedData.value = [];
      message.info('暂无数据');
      return;
    }
  const mappedData=response;
    mappedData.sort((a, b) => {
      const aVal = a.编号 || '';
      const bVal = b.编号 || '';
      return aVal.localeCompare(bVal, 'zh');
    });

    dataSource.value = mappedData;
    fullUnreviewedData.value = [...mappedData];
    unreviewedCount.value = mappedData.length;
  } catch (error) {
    console.error('获取产品数据失败:', error);
    message.error('加载数据失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};

// 获取已评审数据（评审记录）
const fetchReviewedData = async () => {
  setLoading(true);
  try {
    const response = await deliveryReviewService.getPMCDeliveryReviewList(new PMCRequestDto({
      合同号: searchForm.contractNo,
      货号: searchForm.itemNo
    }));
    
    if (!response || response.length === 0) {
      if (viewMode.value === 'reviewed') {
        dataSource.value = [];
      }
      fullReviewedData.value = [];
      reviewedCount.value = 0;
      if (viewMode.value === 'reviewed') {
        message.info('暂无已评审记录');
      }
      return;
    }
const mappedData: PMCDeliveryReview[]=response;
    mappedData.sort((a, b) => {
      const aVal = a.编号 || '';
      const bVal = b.编号 || '';
      return aVal.localeCompare(bVal, 'zh');
    });
     
    // 仅在当前模式为 'reviewed' 时更新 dataSource
    if (viewMode.value === 'reviewed') {
      dataSource.value = mappedData;
    }
    fullReviewedData.value = [...mappedData];
    reviewedCount.value = mappedData.length;
  } catch (error) {
    console.error('获取已评审数据失败:', error);
    message.error('加载已评审数据失败，请稍后重试');
  } finally {
    setLoading(false);
  }
};

// 监听模式切换，重置搜索条件并加载对应数据
watch(viewMode, (newMode, oldMode) => {
  if (newMode === oldMode) return;
  // 切换时清空所有筛选条件
  searchForm.contractNo = '';
  searchForm.itemNo = '';
  selectedProductionUser.value = null;
  
  if (newMode === 'unreviewed') {
    fetchProductData();
  } else {
    fetchReviewedData();
  }
});

// 查询按钮逻辑
const handleSearch = () => {
  if (viewMode.value === 'reviewed') {
    // 已评审模式：前端过滤依赖 filteredData 的 computed，只需确保 dataSource 为完整数据
    if (fullReviewedData.value.length) {
      dataSource.value = [...fullReviewedData.value];
    } else {
      fetchReviewedData();
    }
    // 未评审模式：前端过滤依赖 filteredData 的 computed，只需确保 dataSource 为完整数据
  } else {
    if (fullUnreviewedData.value.length) {
      dataSource.value = [...fullUnreviewedData.value];
    } else {
      fetchProductData();
    }
  }
};

// 重置按钮逻辑
const resetSearch = () => {
  searchForm.contractNo = '';
  searchForm.productionNo = '';
  searchForm.itemNo = '';
  searchForm.coilItemNo = '';
  selectedProductionUser.value = null;
  
  if (viewMode.value === 'reviewed') {
    if (fullReviewedData.value.length) {
    } else {
      dataSource.value = [...fullReviewedData.value];
      fetchReviewedData();
    }
  } else {
    if (fullUnreviewedData.value.length) {
      dataSource.value = [...fullUnreviewedData.value];
    } else {
      fetchProductData();
    }
  }
};
  
// 打开评审弹窗（仅未评审模式使用）
const openReview = (record: PMCDeliveryReview) => {
  currentItem.value = record;
  modalVisible.value = true;
};

// 评审确认后的回调
const handleReviewConfirmed = (payload: { id: string; status: string }) => {
  const index = dataSource.value.findIndex(item => item.编号 === payload.id);
  if (index !== -1) {
    dataSource.value[index].状态 = payload.status
    // === "confirm" ? "评审通过" : "待评审";
  }
};

// 处理刷新事件
const handleRefresh = () => {
  // 刷新待评审数据
  fetchProductData();
  // 刷新已评审数据（用于更新统计信息）
  fetchReviewedData();
};

onMounted(() => {
  fetchProductData();
  fetchReviewedData();
});
</script>

<style scoped>
.page-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: 16px;
  background-color: #f0f2f5;
  min-height: 0;
}
.stat-cards {
  margin-bottom: 16px;
}
.stat-cards :deep(.ant-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}
.stat-cards :deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.search-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.reviewed-tag {
  color: #8c8c8c;
  font-size: 14px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
}
.search-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}
.search-field {
  width: 100%;
  min-width: 200px;
  max-width: 280px;
}
.search-select {
  width: 100%;
  min-width: 200px;
  max-width: 280px;
}
.search-actions {
  margin-bottom: 0;
  display: flex;
  gap: 8px;
}
.btn-reset {
  margin-left: 0;
}
.data-range-item {
  margin-left: auto;
  margin-right: 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}
.view-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.view-mode-group :deep(.ant-radio-button-wrapper) {
  border-radius: 0;
  margin-right: 0;
  border-left: none !important;
}
.view-mode-group :deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 4px 0 0 4px;
  border-left: 1px solid #d9d9d9 !important;
}
.view-mode-group :deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 4px 4px 0;
}
.view-mode-group :deep(.ant-radio-button-wrapper:not(:first-child)) {
  border-left: none !important;
}

@media (max-width: 767px) {
  .page-container {
    padding: 12px;
  }
  .search-form {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }
  .search-field,
  .search-select {
    max-width: none;
  }
  .data-range-item {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
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
  .view-mode-group {
    width: 100%;
  }
  .view-mode-group :deep(.ant-radio-button-wrapper) {
    flex: 1;
    text-align: center;
    margin-right: 0;
    border-radius: 0;
    border-left: none !important;
  }
  .view-mode-group :deep(.ant-radio-button-wrapper:first-child) {
    border-radius: 4px 0 0 4px;
    border-left: 1px solid #d9d9d9 !important;
  }
  .view-mode-group :deep(.ant-radio-button-wrapper:last-child) {
    border-radius: 0 4px 4px 0;
  }
}
</style>