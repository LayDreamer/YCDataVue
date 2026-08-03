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

    <!-- 生产类型 tab 切换：卡片下方、表格上方 -->
    <div class="dr-type-tab-bar">
      <a-tabs
        v-model:active-key="selectedProductionType"
        class="dr-type-tabs"
      >
        <a-tab-pane
          v-for="type in productionTypeOptions"
          :key="type"
          :tab="type"
        />
      </a-tabs>
    </div>

    <CommonTable
      class="table-card"
      title="交期评审列表"
      :columns="allColumns"
      :data-source="filteredData"
      storage-key="delivery-review-column-settings"
      :loading="loading"
      :pagination="tablePagination"
      row-key="id"
      :scroll="{ x: 'max-content' }"
      :size="tableSize"
      v-model:fullscreen="isFullscreen"
      @refresh="handleRefresh"
    >
      <template #top>
        <!-- 筛选过滤区：放在表格卡片内部，头部下方、数据栏上方 -->
        <div class="dr-filter-controls">
          <!-- 筛选输入行 -->
          <div class="dr-filter-row">
            <div class="dr-filter-item">
              <span class="dr-filter-label">合同号</span>
              <a-input
                v-model:value="searchForm.contractNo"
                placeholder="请输入"
                allow-clear
                class="dr-filter-field"
              />
            </div>
            <div class="dr-filter-item">
              <span class="dr-filter-label">货号</span>
              <a-input
                v-model:value="searchForm.itemNo"
                placeholder="请输入"
                allow-clear
                class="dr-filter-field"
              />
            </div>
            <div class="dr-filter-item">
              <span class="dr-filter-label">排产用户</span>
              <a-select
                v-model:value="selectedProductionUser"
                placeholder="全部"
                allow-clear
                class="dr-filter-field dr-filter-select"
              >
                <a-select-option v-for="user in productionUserOptions" :key="user" :value="user">
                  {{ user }}
                </a-select-option>
              </a-select>
            </div>
            <div class="dr-filter-actions">
              <a-button class="dr-btn-reset" @click="resetSearch">重置</a-button>
            </div>
            <div class="dr-filter-data-range">
              <span class="dr-filter-label">数据范围</span>
              <a-radio-group v-model:value="viewMode" button-style="solid" class="dr-view-mode-group">
                <a-radio-button value="unreviewed">待评审</a-radio-button>
                <a-radio-button value="reviewed">已评审</a-radio-button>
              </a-radio-group>
            </div>
          </div>
        </div>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === '状态'">
          <a-tag :color="record.状态 === '评审通过' ? 'green' : record.状态 === '评审驳回' ? 'red' : 'orange'">
            {{ record.状态 }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <template v-if="viewMode === 'unreviewed'">
            <a-button type="link" @click="openReview(record)">
              评审
            </a-button>
            <a-button type="link" @click="openEditProductionType(record)">
              编辑
            </a-button>
          </template>
          <a-button
            v-else-if="record.状态 === '评审通过'"
            type="link"
            danger
            :loading="returningReviewId === record.编号"
            :disabled="returningReviewId !== null && returningReviewId !== record.编号"
            @click="confirmReturnReview(record)"
          >
            退回待评审
          </a-button>
          <span v-else class="reviewed-tag">已评审</span>
        </template>
        <template v-if="column.key === '特殊要求'">
          <a-tooltip :title="record.特殊要求" placement="topLeft" :overlayStyle="{ maxWidth: '400px', wordBreak: 'break-all' }">
            {{ truncateText(record.特殊要求, 40) }}
          </a-tooltip>
        </template>
        <template v-if="column.key === '货号'">
          <a-tooltip :title="record.货号" placement="topLeft" :overlayStyle="{ maxWidth: '400px', wordBreak: 'break-all' }">
            {{ truncateText(record.货号, 40) }}
          </a-tooltip>
        </template>
        <template v-if="column.key === '中文品名'">
          <a-tooltip :title="record.中文品名" placement="topLeft" :overlayStyle="{ maxWidth: '400px', wordBreak: 'break-all' }">
            {{ truncateText(record.中文品名, 40) }}
          </a-tooltip>
        </template>
        <template v-if="column.key === '备注'">
          <a-tooltip :title="record.备注" placement="topLeft" :overlayStyle="{ maxWidth: '400px', wordBreak: 'break-all' }">
            {{ truncateText(record.备注, 40) }}
          </a-tooltip>
        </template>
      </template>
    </CommonTable>

    <!-- 评审弹窗 -->
    <ReviewModal v-model:visible="modalVisible" :record="currentItem" @confirm="handleReviewConfirmed" @refresh="handleRefresh" />

    <!-- 编辑生产类型弹窗 -->
    <a-modal
      v-model:open="editTypeVisible"
      title="编辑生产类型"
      :width="420"
      centered
      ok-text="确定"
      cancel-text="取消"
      :confirm-loading="editTypeSaving"
      @ok="handleEditProductionTypeOk"
    >
      <a-form class="edit-type-form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" label-align="left">
        <a-form-item label="排产编号">
          <span class="edit-type-text">{{ editTypeRecord?.排产编号 || '--' }}</span>
        </a-form-item>
        <a-form-item label="货号">
          <span class="edit-type-text">{{ editTypeRecord?.货号 || '--' }}</span>
        </a-form-item>
        <a-form-item label="修改类型">
          <a-radio-group v-model:value="editTypeValue" class="edit-type-radio">
            <a-radio v-for="type in availableProductionTypes" :key="type" :value="type">
              {{ type }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message, Grid, Modal } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import ReviewModal from '../DeliveryReview/ReviewDetailModal.vue';
import type { PMCProductInfo } from '../DeliveryReview/types';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { RequestDto } from '../types';
import { PMCRequestDto,PMCDeliveryReview, ProductionTypeOverride  } from '@/api-generated/api';
import { truncateText } from '@/utils';
import CommonTable from '@/components/CommonTable.vue';

const baseColumns: TableColumnsType = [
  { title: '合同号', dataIndex: '合同号', key: '合同号' },
  { title: '排产编号', dataIndex: '排产编号', key: '排产编号' },
  { title: '货号', dataIndex: '货号', key: '货号', ellipsis: true },
  { title: '中文品名', dataIndex: '中文品名', key: '中文品名', ellipsis: true },
  { title: '线圈货号', dataIndex: '线圈货号', key: '线圈货号' },
  { title: '数量', dataIndex: '数量', key: '数量' },
  { title: '来源', dataIndex: '来源', key: '来源' },
  { title: '生产类型', dataIndex: '生产类型', key: '生产类型' },
  { title: '排产用户', dataIndex: '排产用户', key: '排产用户' },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期' },
  { title: '电压', dataIndex: '电压', key: '电压', width: 100 },
  { title: '创建时间', dataIndex: '创建时间', key: '创建时间', width: 180, sorter: (a: PMCDeliveryReview, b: PMCDeliveryReview) => {
      const timeA = a.创建时间 ? new Date(a.创建时间).getTime() : 0;
      const timeB = b.创建时间 ? new Date(b.创建时间).getTime() : 0;
      return timeA - timeB;
    }, defaultSortOrder: 'descend' },
  { title: '特殊要求', dataIndex: '特殊要求', key: '特殊要求', width: 150, ellipsis: true },
  { title: '状态', dataIndex: '状态', key: '状态', width: 100, fixed: 'right' },
  { title: '操作', key: 'action', width: 180, align: 'center', fixed: 'right' },
];

/** 动态列：已评审模式追加备注列；待评审模式状态列不固定右侧 */
const allColumns = computed(() => {
  const cols = baseColumns.map((col) => {
    if ((col.key as string) === '状态' && viewMode.value === 'unreviewed') {
      const { fixed, ...rest } = col as any;
      return rest;
    }
    return col;
  });
  if (viewMode.value === 'reviewed') {
    const statusIndex = cols.findIndex((c) => (c.key as string) === '状态');
    cols.splice(statusIndex >= 0 ? statusIndex : cols.length, 0, {
      title: '备注',
      dataIndex: '备注',
      key: '备注',
      width: 200,
      ellipsis: true,
    });
  }
  return cols;
});

const searchForm = reactive({ contractNo: "", productionNo: '', itemNo: '', coilItemNo: '', analysisNo: '' });
const dataSource = ref<PMCDeliveryReview[]>([]);
const selectedProductionUser = ref<string | null>(null);
const selectedProductionType = ref<string>('普通订单');
const modalVisible = ref(false);
const currentItem = ref<PMCDeliveryReview | null>(null);
const returningReviewId = ref<string | null>(null);
// 编辑生产类型弹窗
const editTypeVisible = ref(false);
const editTypeRecord = ref<PMCDeliveryReview | null>(null);
const editTypeValue = ref<string>('');
const editTypeSaving = ref(false);
const pagination = reactive({
  pageSize: 10,
  showSizeChanger: false,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
});

const screens = Grid.useBreakpoint();
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
const isFullscreen = ref(false);

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


// 生产类型 tab 选项（后端已按这些类型过滤，此处仅用于定义 tab）
const ALLOWED_PRODUCTION_TYPES = ['普通订单', '样品'];

// 计算属性：根据当前模式及筛选条件过滤数据
const filteredData = computed(() => {
  // 后端已按生产类型过滤，前端不再做全局类型过滤
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
  // 生产类型筛选
  if (selectedProductionType.value) {
    result = result.filter(item => item.生产类型 === selectedProductionType.value);
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

// 生产类型 tab 选项（与 ALLOWED_PRODUCTION_TYPES 保持一致）
const productionTypeOptions = ALLOWED_PRODUCTION_TYPES;
// 编辑生产类型弹窗中，只显示与当前不同的类型
const availableProductionTypes = computed(() =>
  productionTypeOptions.filter((t) => t !== editTypeRecord.value?.生产类型)
);

// 获取未评审数据（产品信息）
const  fetchProductData = async () => {
  setLoading(true);
  try {
    const requestDto = new PMCRequestDto({
      合同号: searchForm.contractNo,
      货号: searchForm.itemNo
    });
    const response = await deliveryReviewService.convertToPMCDeliveryReviewList(requestDto);
    if (!response || response.length === 0) {
      if (viewMode.value === 'unreviewed') {
        dataSource.value = [];
      }
      fullUnreviewedData.value = [];
      unreviewedCount.value = 0;
      if (viewMode.value === 'unreviewed') {
        message.info('暂无数据');
      }
      return;
    }
  const mappedData=response;
    mappedData.sort((a, b) => {
      const aVal = a.编号 || '';
      const bVal = b.编号 || '';
      return aVal.localeCompare(bVal, 'zh');
    });

    if (viewMode.value === 'unreviewed') {
      dataSource.value = mappedData;
    }
    fullUnreviewedData.value = [...mappedData];
    // 后端已过滤生产类型，直接统计返回结果
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
    // 后端已过滤生产类型，直接统计返回结果
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
  // 切换时清空搜索条件，保留当前生产类型 tab
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
  selectedProductionType.value = productionTypeOptions[0];
  
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

// 打开编辑生产类型弹窗（仅未评审模式使用）
const openEditProductionType = (record: PMCDeliveryReview) => {
  editTypeRecord.value = record;
  // 默认选中“另一个”生产类型
  editTypeValue.value =
    availableProductionTypes.value.find((t) => t !== record.生产类型) ||
    productionTypeOptions[0];
  editTypeVisible.value = true;
};

// 确认修改生产类型（调用后端保存生产类型覆盖，按合同号+排产编号+货号匹配）
const handleEditProductionTypeOk = async () => {
  const record = editTypeRecord.value;
  if (!record) {
    editTypeVisible.value = false;
    return;
  }
  if (!editTypeValue.value) {
    message.warning('请选择生产类型');
    return;
  }
  if (editTypeValue.value === record.生产类型) {
    editTypeVisible.value = false;
    return;
  }

  const newType = editTypeValue.value;
  editTypeSaving.value = true;
  try {
    await deliveryReviewService.saveProductionTypeOverride(
      new ProductionTypeOverride({
        合同号: record.合同号,
        排产编号: record.排产编号,
        货号: record.货号,
        生产类型: newType,
      })
    );

    editTypeVisible.value = false;
    editTypeRecord.value = null;
    message.success(`生产类型已修改为「${newType}」`);
    // 重新拉取待评审数据，确保展示的是后端叠加覆盖后的结果
    await fetchProductData();
  } catch (error: any) {
    message.error(error?.message || '修改生产类型失败，请稍后重试');
  } finally {
    editTypeSaving.value = false;
  }
};

const confirmReturnReview = (record: PMCDeliveryReview) => {
  if (!record.编号) {
    message.error('评审编号为空，无法退回');
    return;
  }

  Modal.confirm({
    title: '确认退回待评审？',
    content: `排产编号：${record.排产编号 || '--'}，货号：${record.货号 || '--'} 的评审记录及本次保存的排产分析、BOM、工单明细和外产关联数据将被永久删除。`,
    okText: '确认退回',
    okType: 'danger',
    cancelText: '取消',
    centered: true,
    async onOk() {
      returningReviewId.value = record.编号!;
      try {
        await deliveryReviewService.returnDeliveryReview(record.编号!);
        message.success('已退回待评审');
        await Promise.all([fetchProductData(), fetchReviewedData()]);
      } catch (error: any) {
        message.error(error?.message || '退回待评审失败，请稍后重试');
        throw error;
      } finally {
        returningReviewId.value = null;
      }
    },
  });
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
.table-card.fullscreen {
  position: fixed;
  inset: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.table-card.fullscreen :deep(.ant-card-body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
.table-card.fullscreen .table-scroll {
  flex: 1;
  overflow: auto;
}
.edit-type-form {
  padding: 8px 8px 0;
}

.edit-type-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}

.edit-type-text {
  display: inline-block;
  padding-top: 4px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.85);
}

.edit-type-radio {
  padding-top: 4px;
}

.edit-type-radio :deep(.ant-radio-wrapper) {
  margin-right: 24px;
}

.table-card :deep(.ant-card-head) {
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  border-bottom: none;
}
.table-card :deep(.ant-table-thead > tr > th) {
  text-align: center !important;
}
.table-card :deep(.ant-card-head-title) {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.table-card :deep(.ant-card-extra) {
  padding: 12px 0;
}
.table-card :deep(.ant-card-extra .settings-trigger) {
  color: #fff;
}
.table-card :deep(.ant-card-extra .settings-trigger:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}
.reviewed-tag {
  color: #8c8c8c;
  font-size: 14px;
}

/* ========== 表格顶部筛选过滤区（参考排产分析详情 scheduling-controls 风格） ========== */
.dr-filter-controls {
  flex-shrink: 0;
  padding: 20px 4px 20px 4px;
}
/* 生产类型 tab 行：放在卡片下方、表格卡片上方 */
.dr-type-tab-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 20px 0;
  padding-left: 2px;
}
.dr-type-tabs {
  width: fit-content;
}
.dr-type-tabs :deep(.ant-tabs-nav) {
  margin: 0;
}
.dr-type-tabs :deep(.ant-tabs-tab) {
  padding: 10px 6px;
  margin: 0 20px 0 0;
  font-size: 16px;
}
.dr-type-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 0;
}
.dr-type-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
}
.dr-filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 20px;
}
.dr-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dr-filter-label {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}
.dr-filter-field {
  width: 200px;
}
.dr-filter-select {
  width: 200px;
}
.dr-filter-actions {
  display: flex;
  align-items: center;
}
.dr-btn-reset {
  margin-left: 0;
}
.dr-filter-data-range {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dr-view-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.dr-view-mode-group :deep(.ant-radio-button-wrapper) {
  border-radius: 0;
  margin-right: 0;
  border-left: none !important;
}
.dr-view-mode-group :deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 4px 0 0 4px;
  border-left: 1px solid #d9d9d9 !important;
}
.dr-view-mode-group :deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 4px 4px 0;
}
.dr-view-mode-group :deep(.ant-radio-button-wrapper:not(:first-child)) {
  border-left: none !important;
}

@media (max-width: 767px) {
  .page-container {
    padding: 12px;
  }
  .dr-filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .dr-filter-field,
  .dr-filter-select {
    width: 100%;
  }
  .dr-filter-data-range {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
  .dr-view-mode-group {
    width: 100%;
  }
  .dr-view-mode-group :deep(.ant-radio-button-wrapper) {
    flex: 1;
    text-align: center;
    margin-right: 0;
    border-radius: 0;
    border-left: none !important;
  }
  .dr-view-mode-group :deep(.ant-radio-button-wrapper:first-child) {
    border-radius: 4px 0 0 4px;
    border-left: 1px solid #d9d9d9 !important;
  }
  .dr-view-mode-group :deep(.ant-radio-button-wrapper:last-child) {
    border-radius: 0 4px 4px 0;
  }
}
</style>
