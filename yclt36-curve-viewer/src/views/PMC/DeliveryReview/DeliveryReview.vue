<template>
  <div class="page-container">
    <a-row :gutter="[16, 16]" class="stat-cards">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="待评审总数" :value="12" :value-style="{ color: '#1890ff' }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="本周需交付" :value="45" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="交期预警" :value="3" :value-style="{ color: '#cf1322' }" />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card shadow="never">
          <a-statistic title="已完成评审" :value="128" :value-style="{ color: '#3f9142' }" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="search-card" size="small">
      <a-form :layout="searchFormLayout" :model="searchForm" class="search-form">
        <div class="search-controls">
          <a-form-item label="合同号">
            <a-input v-model:value="searchForm.contractNo" placeholder="请输入" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="分析单号">
            <a-input v-model:value="searchForm.analysisNo" placeholder="请输入" allow-clear class="search-field" />
          </a-form-item>
          <a-form-item label="排产用户">
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
            <a-button type="primary" @click="handleSearch">查询</a-button>
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
    <ReviewModal v-model:visible="modalVisible" :record="currentItem" @confirm="handleReviewConfirmed" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message, Grid } from 'ant-design-vue';
import ReviewModal from '../DeliveryReview/ReviewDetailModal.vue';
import type { PMCDeliveryReview, PMCProductInfo } from '../DeliveryReview/types';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { RequestDto } from '../types';

const columns = [
  { title: '合同号', dataIndex: '合同号', key: '合同号' },
  { title: '排产编号', dataIndex: '排产编号', key: '排产编号' },
  { title: '层', dataIndex: '层', key: '层' },
  { title: '分析单号', dataIndex: '分析单号', key: '分析单号' },
  { title: '货号', dataIndex: '货号', key: '货号' },
  { title: '中文品名', dataIndex: '中文品名', key: '中文品名' },
  { title: '线圈货号', dataIndex: '线圈货号', key: '线圈货号' },
  { title: '来源编号', dataIndex: '来源编号', key: '来源编号' },
  { title: '来源', dataIndex: '来源', key: '来源' },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号' },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期' },
  { title: '排产用户', dataIndex: '排产用户', key: '排产用户' },
  { title: '电压', dataIndex: '电压', key: '电压', width: 100 },
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
  showTotal: (total: number) => `共 ${total} 条`,
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

// 模式切换：unreviewed（未评审）/ reviewed（已评审）
const viewMode = ref<'unreviewed' | 'reviewed'>('unreviewed');
// 缓存完整的已评审数据（用于前端筛选）
const fullReviewedData = ref<PMCDeliveryReview[]>([]);

// 计算属性：根据当前模式及筛选条件过滤数据
const filteredData = computed(() => {
  let result = [...dataSource.value];
  
  if (viewMode.value === 'reviewed') {
    // 已评审模式：前端过滤合同号、分析单号
    if (searchForm.contractNo) {
      result = result.filter(item => 
        item.合同号 && item.合同号.includes(searchForm.contractNo)
      );
    }
    if (searchForm.analysisNo) {
      result = result.filter(item => 
        item.分析单号 && item.分析单号.includes(searchForm.analysisNo)
      );
    }
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
const fetchProductData = async () => {
  loading.value = true;
  try {
    const requestDto: RequestDto = {
      合同号: searchForm.contractNo,
      分析单号: searchForm.analysisNo
    };
    const response = await deliveryReviewService.getPMCProductInfoList(requestDto);

    if (!response || response.length === 0) {
      dataSource.value = [];
      message.info('暂无数据');
      return;
    }

    const mappedData: PMCDeliveryReview[] = response.map((item: PMCProductInfo, index: number) => ({
      编号: item.编号 || String(index),
      用户编号: item.用户编号 || '',
      用户铭: item.用户铭 || '',
      修改状态: item.修改状态 || '',
      创建时间: item.创建时间 || '',
      锁定用户: item.锁定用户 || '',
      审核过程: item.审核过程 || '',
      打印: item.打印 || '',
      合同号: item.合同号 || '',
      排产编号: item.排产编号 || '',
      层: item.层 || '-',
      分析单号: item.分析单号 || '',
      货号: item.货号 || '',
      线圈货号: item.线圈 || '',
      中文品名: item.中文品名 || '',
      中文规格: item.中文规格 || '',
      来源编号: item.来源编号 || '',
      来源: item.来源 || '',
      工单单号: item.工单单号 || '',
      交货日期: item.交货日期 || '',
      排产用户: item.排产用户 || '',
      电压: item.电压 || '',
      状态: item.状态 || '待评审',
    }));

    mappedData.sort((a, b) => {
      const aVal = a.编号 || '';
      const bVal = b.编号 || '';
      return aVal.localeCompare(bVal, 'zh');
    });
    console.log(mappedData);

    dataSource.value = mappedData;
  } catch (error) {
    console.error('获取产品数据失败:', error);
    message.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 获取已评审数据（评审记录）
const fetchReviewedData = async () => {
  loading.value = true;
  try {
    const response = await deliveryReviewService.getPMCDeliveryReviewList();
    
  
    if (!response || response.length === 0) {
      dataSource.value = [];
      fullReviewedData.value = [];
      message.info('暂无已评审记录');
      return;
    }

    const mappedData: PMCDeliveryReview[] = response.map((item: any, index: number) => ({
      编号: item.编号 || item.id || String(index),
      用户编号: item.用户编号 || '',
      用户铭: item.用户铭 || '',
      修改状态: item.修改状态 || '',
      创建时间: item.创建时间 || '',
      锁定用户: item.锁定用户 || '',
      审核过程: item.审核过程 || '',
      打印: item.打印 || '',
      合同号: item.合同号 || '',
      排产编号: item.排产编号 || '',
      层: item.层 || '-',
      分析单号: item.分析单号 || '',
      货号: item.货号 || '',
      线圈货号: item.线圈货号 || item.线圈 || '',
      中文品名: item.中文品名 || '',
      中文规格: item.中文规格 || '',
      来源编号: item.来源编号 || '',
      来源: item.来源 || '',
      工单单号: item.工单单号 || '',
      交货日期: item.交货日期 || '',
      排产用户: item.排产用户 || '',
      电压: item.电压 || '',
      状态: item.状态 || '',
    }));

    mappedData.sort((a, b) => {
      const aVal = a.编号 || '';
      const bVal = b.编号 || '';
      return aVal.localeCompare(bVal, 'zh');
    });
     
    dataSource.value = mappedData;
    fullReviewedData.value = [...mappedData];
  } catch (error) {
    console.error('获取已评审数据失败:', error);
    message.error('加载已评审数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 监听模式切换，重置搜索条件并加载对应数据
watch(viewMode, (newMode, oldMode) => {
  if (newMode === oldMode) return;
  // 切换时清空所有筛选条件
  searchForm.contractNo = '';
  searchForm.analysisNo = '';
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
  } else {
    // 未评审模式：调用后端接口查询
    fetchProductData();
  }
};

// 重置按钮逻辑
const resetSearch = () => {
  searchForm.contractNo = '';
  searchForm.productionNo = '';
  searchForm.itemNo = '';
  searchForm.coilItemNo = '';
  searchForm.analysisNo = '';
  selectedProductionUser.value = null;
  
  if (viewMode.value === 'reviewed') {
    if (fullReviewedData.value.length) {
      dataSource.value = [...fullReviewedData.value];
    } else {
      fetchReviewedData();
    }
  } else {
    fetchProductData();
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

onMounted(() => {
  fetchProductData();
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
.search-card {
  margin-bottom: 16px;
}
.table-card {
  border-radius: 4px;
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

@media (max-width: 767px) {
  .page-container {
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
}
</style>