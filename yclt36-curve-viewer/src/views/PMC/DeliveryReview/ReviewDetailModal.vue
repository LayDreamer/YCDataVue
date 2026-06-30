<template>
  <a-drawer
    :visible="visible"
    @update:visible="handleVisibleUpdate"
    placement="right"
    :width="drawerWidth"
    :body-style="{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }"
    :mask="true"
    :mask-closable="false"
    :destroy-on-close="false"
    class="review-detail-drawer"
  >
    <template #title>
      <div class="drawer-title">
        <span class="title-text">交期评审详情</span>
        <a-tag v-if="record?.货号" color="blue">{{ record.货号 }}</a-tag>
      </div>
    </template>

    <!-- 主体内容区：上下布局 -->
    <div class="drawer-body">
      <!-- 上半部分：基础资料 + 校验 + 结论（横向排列） -->
      <div class="top-section">
        <a-row :gutter="[16, 16]" class="top-row-equal-height">
          <!-- 基础资料 -->
          <a-col :xs="24" :lg="8">
            <a-card title="基础资料" :bordered="false" class="info-card left-info-card">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">排产编号</span>
                  <span class="info-value copyable">{{ record?.排产编号 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">货号</span>
                  <span class="info-value">{{ record?.货号 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">线圈货号</span>
                  <span class="info-value">{{ record?.线圈货号 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">中文品名</span>
                  <span class="info-value">{{ record?.中文品名 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">电压</span>
                  <span class="info-value">{{ record?.电压 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">交货日期</span>
                  <span class="info-value">{{ record?.交货日期 || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">数量</span>
                  <span class="info-value">{{ record?.数量 ?? '--' }}</span>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">特殊要求</span>
                  <a-textarea
                    v-model:value="reviewForm.specialRequirement"
                    placeholder="请输入特殊要求..."
                    :rows="2"
                  />
                </div>
              </div>
            </a-card>
          </a-col>

          <!-- 选择排产用户 -->
          <a-col :xs="24" :lg="10">
            <a-card :bordered="false" class="info-card user-selector-card left-info-card">
              <template #title>
                <span>选择排产用户</span>
                <span class="required-mark">*</span>
              </template>
              <div class="user-selector-wrap">
                <!-- 左侧：部门树 -->
                <div class="dept-sidebar">
                  <a-spin :spinning="deptLoading">
                    <a-tree
                      v-model:selectedKeys="schedulingSelectedDeptKeys"
                      :tree-data="schedulingDepartments"
                      :fieldNames="{ key: 'id', title: 'name', parentid: 'parentid' }"
                      @select="handleSchedulingDeptSelect"
                      class="dept-compact-tree"
                    />
                  </a-spin>
                </div>
                <!-- 右侧：人员选择 -->
                <div class="user-side">
                  <!-- 已选用户标签 -->
                  <div v-if="schedulingSelectedUsers.length" class="selected-scheduling-users">
                    <a-tag
                      v-for="user in schedulingSelectedUsers"
                      :key="user.userid"
                      :closable="true"
                      size="small"
                      @close="removeSchedulingUser(user.userid)"
                    >
                      {{ user.name }}
                    </a-tag>
                  </div>
                  <!-- 搜索 + 人员表格 -->
                  <div v-if="schedulingDeptUsers.length" class="user-table-area" ref="userTableAreaRef">
                    <a-input
                      v-model:value="schedulingUserSearchText"
                      placeholder="搜索姓名、账号..."
                      allow-clear
                      size="small"
                      class="user-search-input"
                      @change="handleSchedulingUserSearch"
                    />
                    <a-table
                      :row-selection="{
                        type: 'radio',
                        selectedRowKeys: schedulingUserSelectedKeys,
                        onChange: handleSchedulingUserSelect,
                      }"
                      :columns="schedulingUserColumns"
                      :data-source="schedulingFilteredUsers"
                      :loading="schedulingUserLoading"
                      :pagination="schedulingUserPagination"
                      :scroll="{ y: userTableScrollY }"
                      size="small"
                      row-key="userid"
                    />
                  </div>
                  <div v-if="!schedulingDeptUsers.length && !deptLoading" class="empty-wrap">
                    <a-empty description="请选择部门查看人员" :image-style="{ height: '40px' }" />
                  </div>
                </div>
              </div>
            </a-card>
          </a-col>

          <!-- 核心校验 + 评审结论 -->
          <a-col :xs="24" :lg="6" class="right-col">
            <div class="right-col-inner">
              <a-card title="核心要素校验" :bordered="false" class="info-card verify-card-compact">
                <a-input-search
                  v-model:value="reviewForm.coilItemNo"
                  placeholder="线圈货号进行系统反查"
                  enter-button="校验"
                  :loading="validatingCoil"
                  size="small"
                  @search="validateCoil"
                />
                <div v-if="verifyStatus !== 'none'" class="verify-result">
                  <a-alert
                    v-if="verifyStatus === 'success'"
                    message="校验通过"
                    type="success"
                    show-icon
                    size="small"
                  />
                  <a-alert
                    v-if="verifyStatus === 'error'"
                    message="匹配失败"
                    type="error"
                    show-icon
                    size="small"
                  />
                </div>
              </a-card>
              <a-card title="评审结论" :bordered="false" class="info-card review-conclusion-card">
                <a-form layout="vertical" class="review-form-compact review-form-fill">
                  <a-row :gutter="16">
                    <a-col :xs="24" :sm="12">
                      <a-form-item label="最终生产交期" required>
                        <a-date-picker v-model:value="reviewForm.finalDate" style="width: 100%" />
                      </a-form-item>
                    </a-col>
                    <a-col :xs="24" :sm="12">
                      <a-form-item label="评审结果">
                        <a-radio-group v-model:value="reviewForm.resultStatus" button-style="solid" class="w-full">
                          <a-radio-button value="pass" class="half-width pass-radio">通过</a-radio-button>
                          <a-radio-button value="reject" class="half-width reject-radio">驳回</a-radio-button>
                        </a-radio-group>
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-form-item label="评审备注" class="remark-item">
                    <a-textarea
                      v-model:value="reviewForm.remark"
                      placeholder="请输入评审意见或异常说明..."
                      :auto-size="{ minRows: 3, maxRows: 8 }"
                    />
                  </a-form-item>
                </a-form>
              </a-card>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 下半部分：排产分析单详情（占满剩余空间） -->
      <div class="bottom-section">
        <a-card title="排产分析单详情" :bordered="false" class="scheduling-card">
          <a-spin :spinning="schedulingLoading" tip="加载排产分析数据...">
            <!-- 排产分析控制区 -->
            <div class="scheduling-controls">
              <!-- 第一行：基础信息 -->
              <div class="sch-row sch-input-row">
                <div class="sch-info-item">
                  <span class="sch-label">货号</span>
                  <span class="sch-value w-220">{{ schedulingProduct.partNo || '--' }}</span>
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">品名</span>
                  <span class="sch-value w-300">{{ schedulingProduct.productName || '--' }}</span>
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">规格</span>
                  <span class="sch-value w-200">{{ schedulingProduct.spec || '--' }}</span>
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">成品数量</span>
                  <a-input-number
                    v-model:value="schedulingProduct.qty"
                    :min="0"
                    :precision="0"
                    style="width: 120px"
                    @change="onSchQtyChange"
                  />
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">生产交期</span>
                  <a-date-picker
                    v-model:value="schedulingForm.deliveryDate"
                    placeholder="选择交期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 170px"
                  />
                </div>
              </div>
              <!-- 第二行：分析模式与操作按钮 -->
              <div class="sch-row sch-action-row">
                <div class="sch-analysis-modes">
                  <a-radio-group v-model:value="schedulingForm.analysisType">
                    <a-radio value="normal">
                      <span class="sch-radio-content"><BarChartOutlined /> 普通分析</span>
                    </a-radio>
                    <a-radio value="limit">
                      <span class="sch-radio-content"><LineChartOutlined /> 库存上限分析 (减下限)</span>
                    </a-radio>
                  </a-radio-group>
                </div>
                <div class="sch-btn-group">
                  <a-button type="primary" @click="handleSchSave" :loading="schSaveLoading">
                    <template #icon><SaveOutlined /></template>
                    保存分析
                  </a-button>
                  <a-button type="primary" @click="handleSchSaveBOM" :loading="schSaveBomLoading">
                    <template #icon><ClusterOutlined /></template>
                    保存BOM
                  </a-button>
                  <a-button type="primary" @click="handleSchExpandAll">
                    <template #icon><FolderOpenOutlined /></template>
                    全部展开
                  </a-button>
                  <a-button type="primary" @click="handleSchCollapseAll">
                    <template #icon><FolderOutlined /></template>
                    全部收缩
                  </a-button>
                </div>
                <FixedColumnControl
                  v-model="fixedColumnKeys"
                  :columns="rawColumns"
                  style="margin-left: auto;"
                />
              </div>
            </div>

            <!-- 排产分析表格 -->
            <div ref="tableWrapRef" class="scheduling-table-wrap">
              <a-table
                :columns="displayColumns"
                :data-source="schDataSource"
                :pagination="false"
                :scroll="schTableScroll"
                bordered
                row-key="key"
                :expand-icon-column-index="1"
                :indent-size="20"
                :expanded-row-keys="schExpandedKeys"
                @expand="(expanded: boolean, record: any) => handleSchExpand(expanded, record)"
                size="middle"
              >
                <template #expandIcon="{ expanded, onExpand, record }">
                  <div class="product-symbol-wrapper">
                    <template v-if="record.children && record.children.length">
                      <span class="tree-icon-box" @click="e => onExpand(record, e)">
                        <FolderOpenOutlined v-if="expanded" />
                        <FolderOutlined v-else />
                      </span>
                    </template>
                    <template v-else>
                      <FileTextOutlined class="tree-leaf-icon" />
                    </template>
                  </div>
                </template>

                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'index'">
                    {{ record.rowNum || index + 1 }}
                  </template>
                  <template v-if="column.key === 'level'">
                    <span class="level-badge">{{ record.level }}</span>
                  </template>
                  <template v-if="column.key === 'partNo'">
                    <span class="partno-text">{{ record.partNo || '-' }}</span>
                  </template>
                  <template v-if="column.key === 'name'">
                    <span class="product-text">{{ record.name }}</span>
                  </template>
                  <template v-if="column.key === 'spec'">
                    <span class="spec-text">{{ record.spec || record.unit || '-' }}</span>
                  </template>
                  <template v-if="column.key === 'source'">
                    <a-tag :color="getSchSourceColor(record.source)" class="m-0">{{ record.source }}</a-tag>
                  </template>
                  <template v-if="['produceQty', 'purchaseQty', 'loss'].includes(column.key as string)">
                    <a-input-number
                      v-model:value="record[column.key]"
                      class="cell-input-small"
                      :controls="false"
                      @change="(val: any) => handleSchLossChange(record, column.key as string, val)"
                    />
                  </template>
                </template>
              </a-table>
              <a-empty v-if="!schedulingLoading && schDataSource.length === 0" description="暂无排产分析数据" />
            </div>

            <!-- 公式提示 -->
            <div class="scheduling-formula-bar">
              <SettingOutlined />
              <span>需求量 = 成品数量 × 累计用量 × (1+损耗)</span>
            </div>
          </a-spin>
        </a-card>

        <!-- 底部操作栏 -->
        <div class="footer-bar">
          <div class="footer-left">
            <span>展开查看物料BOM结构，编辑损耗和数量会自动计算需求量</span>
          </div>
          <div class="footer-actions">
            <a-button @click="handleVisibleUpdate(false)">取消</a-button>
            <a-button type="primary" :loading="confirmLoading" @click="submitReview">
              提交评审结果
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { message, Grid } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  FolderOpenOutlined,
  FolderOutlined,
  FileTextOutlined,
  SettingOutlined,
  SaveOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ClusterOutlined,
} from '@ant-design/icons-vue';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { weChatWorkService, type WeChatUser, type WeChatDepartment } from '@/services/wechatWorkService';
import { PMCRequestDto, PMCDeliveryReview, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail } from '@/api-generated/api';
import { columns as rawColumns } from '../SchedulingAnalysis/types';
import FixedColumnControl from '@/components/FixedColumnControl.vue';

// ========== 类型定义 ==========
interface ProductionItem {
  key: string;
  level: number;
  name: string;
  source: string;
  produceQty: number;
  purchaseQty: number;
  loss: number;
  rowNum?: number;
  children?: ProductionItem[];
  spec?: string;
  partNo?: string;
  usage?: number;
  unit?: string;
  process?: string;
  workshop?: string;
  warehouse?: string;
  stock?: number;
  transit?: number;
  wip?: number;
  max?: number;
  min?: number;
  avail?: number;
  attr?: string;
  needQty?: number;
  remark?: string;
}

interface DeliveryPlan {
  交货日期: string;
  交货数量: number;
  状态: string;
}

const props = defineProps<{
  visible: boolean;
  record: PMCDeliveryReview | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', payload: { id: string; status: string }): void;
  (e: 'refresh'): void;
}>();

// ========== 响应式尺寸 ==========
const screens = Grid.useBreakpoint();
const drawerWidth = computed(() => (screens.value?.md ? '76vw' : '100%'));

// ========== 评审表单数据 ==========
const reviewForm = reactive({
  coilItemNo: '',
  finalDate: null as Dayjs | null,
  resultStatus: 'pass',
  remark: '',
  specialRequirement: '',
});

const validatingCoil = ref(false);
const verifyStatus = ref<'none' | 'success' | 'error'>('none');
const confirmLoading = ref(false);

// ========== 排产用户选择（企业微信） ==========
const schedulingDepartments = ref<WeChatDepartment[]>([]);
const schedulingSelectedDeptKeys = ref<string[]>([]);
const schedulingDeptUsers = ref<WeChatUser[]>([]);
const schedulingUserSelectedKeys = ref<string[]>([]);
const schedulingSelectedUsers = ref<WeChatUser[]>([]);
const deptLoading = ref(false);
const schedulingUserLoading = ref(false);
const schedulingUserSearchText = ref('');
const userTableAreaRef = ref<HTMLElement | null>(null);
const userTableScrollY = ref(220);

const schedulingUserPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 人`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '15', '20'],
  size: 'small' as const,
  onChange(page: number, size: number) {
    schedulingUserPagination.current = page;
    schedulingUserPagination.pageSize = size;
  },
  onShowSizeChange(_: number, size: number) {
    schedulingUserPagination.current = 1;
    schedulingUserPagination.pageSize = size;
  },
});

const schedulingUserColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 60, ellipsis: true },
  { title: '账号', dataIndex: 'userid', key: 'userid', ellipsis: true },
];

const schedulingFilteredUsers = computed(() => {
  const keyword = schedulingUserSearchText.value.toLowerCase().trim();
  if (!keyword) return schedulingDeptUsers.value;
  return schedulingDeptUsers.value.filter(user =>
    (user.name || '').toLowerCase().includes(keyword) ||
    (user.userid || '').toLowerCase().includes(keyword)
  );
});

const loadSchedulingDepartments = async () => {
  deptLoading.value = true;
  try {
    schedulingDepartments.value = await weChatWorkService.getDepartmentList();
  } catch {
    message.error('加载部门列表失败');
  } finally {
    deptLoading.value = false;
  }
};

const handleSchedulingDeptSelect = async (selectedKeys: any[]) => {
  if (!selectedKeys.length) return;
  const deptId = selectedKeys[0];
  schedulingSelectedDeptKeys.value = [deptId];
  schedulingUserLoading.value = true;
  try {
    schedulingDeptUsers.value = await weChatWorkService.getUserList(Number(deptId));
  } catch {
    message.error('加载人员失败');
  } finally {
    schedulingUserLoading.value = false;
    nextTick(() => updateUserTableScrollY());
  }
};

// 动态计算人员表格滚动区域高度，使其对齐左侧部门树高度
const updateUserTableScrollY = () => {
  if (!userTableAreaRef.value) return;
  // 容器总高度（user-table-area 占满 user-side 减去搜索框约32px + margin 4px + padding 等估计 约44px）
  const containerHeight = userTableAreaRef.value.clientHeight;
  // 扣除搜索框高度 + 表格 header + 分页 + 一些 margin
  // 搜索框 ~32px, table header ~38px, pagination ~40px, 各种 margins ~16px
  const reservedHeight = 32 + 38 + 40 + 16;
  const scrollY = Math.max(120, containerHeight - reservedHeight);
  userTableScrollY.value = scrollY;
};

const handleSchedulingUserSelect = (selectedRowKeys: string[]) => {
  schedulingUserSelectedKeys.value = selectedRowKeys;
  // 同步已选用户信息
  schedulingSelectedUsers.value = schedulingDeptUsers.value.filter(u =>
    selectedRowKeys.includes(u.userid)
  );
};

const handleSchedulingUserSearch = () => {
  schedulingUserPagination.current = 1;
  // 搜索由 computed 自动处理
};

// 搜索/部门切换时更新 total 并重置页码
watch(schedulingFilteredUsers, () => {
  schedulingUserPagination.total = schedulingFilteredUsers.value.length;
  schedulingUserPagination.current = 1;
});

const removeSchedulingUser = (userId: string) => {
  schedulingUserSelectedKeys.value = schedulingUserSelectedKeys.value.filter(id => id !== userId);
  schedulingSelectedUsers.value = schedulingSelectedUsers.value.filter(u => u.userid !== userId);
};

// ========== 线圈货号校验 ==========
const validateCoil = async () => {
  if (!reviewForm.coilItemNo) {
    message.warning('请输入线圈货号');
    return;
  }
  validatingCoil.value = true;
  verifyStatus.value = 'none';
  try {
    const result = await deliveryReviewService.checkIsExistInAssemblyList(
      new PMCRequestDto({ 线圈货号: reviewForm.coilItemNo })
    );
    if (result) {
      verifyStatus.value = 'success';
    } else {
      verifyStatus.value = 'error';
    }
  } catch {
    verifyStatus.value = 'error';
  } finally {
    validatingCoil.value = false;
  }
};

// ========== 提交评审 ==========
const submitReview = async () => {
  if (verifyStatus.value !== 'success') {
    message.error('线圈货号未经验证或验证不通过，无法提交评审！');
    return;
  }
  if (schedulingSelectedUsers.value.length === 0) {
    message.warning('请选择排产用户');
    return;
  }
  const mappedStatus = reviewForm.resultStatus === 'pass' ? '评审通过' : '评审驳回';
  const { 编号, 用户编号, 合同号, 排产编号, 货号, 中文品名, 中文规格, 分析单号, 来源编号, 来源, 工单单号, 电压, 数量 } = props.record!;
  const 排产用户 = schedulingSelectedUsers.value.map(u => u.name).join(',');

  const reviewData = new PMCDeliveryReview({
    编号,
    用户编号,
    合同号,
    排产编号,
    数量,
    货号,
    中文品名,
    中文规格,
    分析单号,
    来源编号,
    来源,
    工单单号,
    排产用户,
    电压,
    物料货号: '',
    状态: mappedStatus,
    线圈货号: reviewForm.coilItemNo,
    交货日期: reviewForm.finalDate ? dayjs(reviewForm.finalDate).format('YYYY-MM-DD') : '',
    备注: reviewForm.remark,
    特殊要求: reviewForm.specialRequirement,
  });

  confirmLoading.value = true;
  try {
    await deliveryReviewService.addPMCDeliveryReview(reviewData);
    emit('update:visible', false);
    emit('confirm', { id: props.record!.编号 || '', status: mappedStatus });
    emit('refresh');
    message.success('评审结果提交成功!');
  } catch (error) {
    console.error('提交评审失败:', error);
    message.error('提交评审失败，请稍后重试');
  } finally {
    confirmLoading.value = false;
  }
};

// ========== 排产分析数据 ==========
const schedulingLoading = ref(false);

const schedulingProduct = reactive({
  partNo: '',
  productName: '',
  spec: '',
  qty: 1,
  orderNo: '',
});

const schedulingForm = reactive({
  analysisType: 'normal' as 'normal' | 'limit',
  deliveryDate: undefined as string | undefined,
});

const schDataSource = ref<ProductionItem[]>([]);
const schExpandedKeys = ref<string[]>([]);

// 保存状态
const schSaveLoading = ref(false);
const schSaveBomLoading = ref(false);

// 固定列
const fixedColumnKeys = ref<string[]>(['index', 'partNo']);

const displayColumns = computed(() => {
  return rawColumns.map(col => {
    const colKey = (col.key || (col as any).dataIndex) as string;
    return {
      ...col,
      fixed: fixedColumnKeys.value.includes(colKey) ? ('left' as const) : undefined,
    };
  });
});

// 表格滚动高度 - 动态获取容器高度
const tableWrapRef = ref<HTMLElement | null>(null);
const schTableScrollY = ref(300);

const schTableScroll = computed(() => ({
  x: 2200 as const,
  y: schTableScrollY.value,
}));

function updateTableScrollY() {
  if (tableWrapRef.value) {
    schTableScrollY.value = tableWrapRef.value.clientHeight;
  }
}

onMounted(() => {
  nextTick(() => {
    updateTableScrollY();
    window.addEventListener('resize', updateTableScrollY);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTableScrollY);
});

// ========== 来源颜色 ==========
function getSchSourceColor(src: string) {
  if (src === '外购') return 'green';
  if (src === '自制') return 'blue';
  if (src === '外协') return 'orange';
  return 'default';
}

// ========== 展开/收缩 ==========
function handleSchExpand(expanded: boolean, record: any) {
  if (expanded) {
    schExpandedKeys.value.push(record.key);
  } else {
    schExpandedKeys.value = schExpandedKeys.value.filter(k => k !== record.key);
  }
}

function getAllParentKeys(items: ProductionItem[]): string[] {
  const keys: string[] = [];
  items.forEach(item => {
    if (item.children && item.children.length) {
      keys.push(item.key);
      keys.push(...getAllParentKeys(item.children));
    }
  });
  return keys;
}

function handleSchExpandAll() {
  const allKeys = getAllParentKeys(schDataSource.value);
  if (allKeys.length === schExpandedKeys.value.length && allKeys.every(k => schExpandedKeys.value.includes(k))) {
    message.info('当前已是全部展开状态');
    return;
  }
  schExpandedKeys.value = allKeys;
}

function handleSchCollapseAll() {
  if (schExpandedKeys.value.length === 0) {
    message.info('当前已是全部收缩状态');
    return;
  }
  schExpandedKeys.value = [];
}

// ========== 生成唯一 key ==========
let keyCounter = 0;
function generateKey(prefix: string, index: number) {
  return `${prefix}-${index}-${++keyCounter}`;
}

// ========== 计算需求量 ==========
function calculateDemandQty(qty: number, usage: number, loss: number) {
  let demand = qty * usage * (1 + loss);
  demand = Math.max(0, demand);
  return Math.ceil(demand);
}

// ========== 递归更新仓库可用量 ==========
function updateAvailInTree(items: ProductionItem[]) {
  items.forEach(item => {
    const stock = item.stock || 0;
    const transit = item.transit || 0;
    const wip = item.wip || 0;
    const min = item.min || 0;
    item.avail = schedulingForm.analysisType === 'limit' ? stock + transit - wip - min : stock + transit - wip;
    if (item.source !== '自制') {
      item.purchaseQty = (item.needQty || 0) + (item.avail || 0);
      item.produceQty = 0;
    } else {
      item.produceQty = (item.needQty || 0) + (item.avail || 0);
      item.purchaseQty = 0;
    }
    if (item.children && item.children.length > 0) {
      updateAvailInTree(item.children);
    }
  });
}

// ========== 监听分析类型变化 ==========
watch(() => schedulingForm.analysisType, () => {
  if (schDataSource.value.length > 0) {
    updateAvailInTree(schDataSource.value);
  }
});

// ========== 处理损耗变化 ==========
function handleSchLossChange(record: ProductionItem, field: string, value: number | null) {
  if (field === 'loss' && record) {
    const lossValue = value || 0;
    const updateItemAndChildren = (item: ProductionItem, loss: number) => {
      item.loss = loss;
      if (schedulingProduct.qty > 0 && (item.usage || 1)) {
        const demandQty = calculateDemandQty(schedulingProduct.qty, item.usage || 1, loss);
        item.needQty = demandQty;
        if (item.source !== '自制') {
          item.purchaseQty = demandQty + (item.avail || 0);
        } else {
          item.produceQty = demandQty + (item.avail || 0);
        }
      }
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => updateItemAndChildren(child, child.loss || 0));
      }
    };
    updateItemAndChildren(record, lossValue);
  }
}

// ========== 构建树形数据 ==========
function buildTreeFromData(bomData: any[], qty: number): ProductionItem[] {
  const treeData: ProductionItem[] = [];
  let rowCounter = 0;

  const processBOMItem = (record: any, parentLevel: number = 0, parentUsage: number = 1): ProductionItem => {
    const level = Number(record.层) || parentLevel;
    const key = generateKey('item', rowCounter++);
    const usage = Number(record.用量) || 1;
    const cumulativeUsage = parentUsage * usage;
    const loss = Number(record.损耗) || 0;
    const demandQty = calculateDemandQty(qty, cumulativeUsage, loss);

    const _stock = record.仓库数 !== undefined && record.仓库数 !== '' ? Number(record.仓库数) : 0;
    const _transit = record.在途数 !== undefined && record.在途数 !== '' ? Number(record.在途数) : 0;
    const _wip = record.在产需求 !== undefined && record.在产需求 !== '' ? Number(record.在产需求) : 0;
    const _min = record.库存下限 !== undefined && record.库存下限 !== '' ? Number(record.库存下限) : 0;
    const _avail = schedulingForm.analysisType === 'limit' ? _stock + _transit - _wip - _min : _stock + _transit - _wip;

    const item: ProductionItem = {
      key,
      level,
      name: record.品名 || '-',
      source: record.来源 || '-',
      produceQty: record.来源 === '自制' ? demandQty + _avail : 0,
      purchaseQty: record.来源 !== '自制' ? demandQty + _avail : 0,
      loss,
      rowNum: rowCounter,
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
    };

    if (record.子集 && Array.isArray(record.子集) && record.子集.length > 0) {
      record.子集.forEach((childRecord: any) => {
        const childItem = processBOMItem(childRecord, level + 1, cumulativeUsage);
        item.children!.push(childItem);
      });
    }

    return item;
  };

  const sortLevel1Items = (items: ProductionItem[]) => {
    if (!items || items.length <= 1) return items;
    const nonCoil: ProductionItem[] = [];
    const coilItems: ProductionItem[] = [];
    items.forEach(item => {
      if (item.level === 1 && item.attr === '线圈') {
        coilItems.push(item);
      } else {
        nonCoil.push(item);
      }
    });
    return [...nonCoil, ...coilItems];
  };

  bomData.forEach((record) => {
    treeData.push(processBOMItem(record, 0));
  });

  treeData.forEach(item => {
    if (item.children && item.children.length > 0) {
      item.children = sortLevel1Items(item.children);
    }
  });

  let reRowCounter = 0;
  const reassignRowNum = (items: ProductionItem[]) => {
    items.forEach(item => {
      reRowCounter++;
      item.rowNum = reRowCounter;
      if (item.children && item.children.length > 0) {
        reassignRowNum(item.children);
      }
    });
  };
  reassignRowNum(treeData);

  return treeData;
}

// ========== 递归更新需求量 ==========
function updateDemandQtyInTree(items: ProductionItem[], qty: number) {
  items.forEach(item => {
    const demandQty = calculateDemandQty(qty, item.usage || 1, item.loss || 0);
    item.needQty = demandQty;
    if (item.source !== '自制') {
      item.purchaseQty = demandQty + (item.avail || 0);
    } else {
      item.produceQty = demandQty + (item.avail || 0);
    }
    if (item.children && item.children.length > 0) {
      updateDemandQtyInTree(item.children, qty);
    }
  });
}

function onSchQtyChange(newQty: number) {
  if (schDataSource.value.length > 0 && newQty >= 0) {
    updateDemandQtyInTree(schDataSource.value, newQty);
  }
}

// ========== 展平树形数据 ==========
function flattenTree(items: ProductionItem[]): ProductionItem[] {
  const result: ProductionItem[] = [];
  const traverse = (item: ProductionItem) => {
    result.push(item);
    if (item.children && item.children.length > 0) {
      item.children.forEach(traverse);
    }
  };
  items.forEach(traverse);
  return result;
}

// ========== 交货计划工具 ==========
function parseDeliveryPlans(deliveryPlanStr: string): DeliveryPlan[] {
  if (!deliveryPlanStr) return [];
  try {
    const parsed = JSON.parse(deliveryPlanStr);
    const plans = Array.isArray(parsed) ? parsed : [parsed];
    return plans.filter((p: any) => p && typeof p === 'object').map((p: any) => ({
      交货日期: p.交货日期 || '',
      交货数量: Number(p.交货数量) || 0,
      状态: p.状态 || '不满足',
    }));
  } catch {
    return [];
  }
}

function mergeDeliveryPlans(existingStr: string, newStr: string): string {
  const existing = parseDeliveryPlans(existingStr);
  const newPlans = parseDeliveryPlans(newStr);
  const map = new Map<string, DeliveryPlan>();
  existing.forEach(p => map.set(p.交货日期, { ...p }));
  newPlans.forEach(p => {
    const prev = map.get(p.交货日期);
    if (prev) {
      prev.交货数量 += p.交货数量;
    } else {
      map.set(p.交货日期, { ...p });
    }
  });
  return JSON.stringify(Array.from(map.values()));
}

function convertToWorkOrderSalesControl(item: ProductionItem, index: number): WorkOrderSalesControl {
  const sc = new WorkOrderSalesControl();
  sc.车间名称 = item.workshop || '未知车间';
  sc.商品属性 = item.attr || '-';
  sc.货号 = item.partNo || `TEMP-${index}`;
  sc.品名 = item.name || '-';
  sc.规格 = item.spec || '-';
  const totalQty = item.produceQty > 0 ? item.produceQty : (item.needQty || 0);
  sc.工单总数 = String(totalQty);
  sc.已入库数 = '0';
  sc.在产数量 = String(item.wip || 0);
  sc.齐套 = '未分析';
  sc.配料 = '未配料';
  sc.分析日期 = dayjs().format('YYYY-MM-DD HH:mm:ss');
  sc.生产完成率 = '0';
  const deliveryDate = schedulingForm.deliveryDate || dayjs().format('YYYY-MM-DD');
  sc.交货计划 = JSON.stringify([
    { 交货日期: deliveryDate, 交货数量: totalQty, 状态: '不满足' }
  ]);
  return sc;
}

// ========== 保存排产分析 ==========
async function handleSchSave() {
  if (!schedulingForm.deliveryDate) {
    message.warning('请先选择生产交期');
    return;
  }
  if (schDataSource.value.length === 0) {
    message.warning('没有可保存的详情数据');
    return;
  }

  schSaveLoading.value = true;
  try {
    const existingList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const existingMap = new Map<string, any>();
    (existingList || []).forEach((item: any) => {
      if (item.货号) existingMap.set(item.货号, item);
    });

    const flatItems = flattenTree(schDataSource.value);
    const productionNodes = flatItems.filter(item => item.produceQty > 0);
    if (productionNodes.length === 0) {
      message.warning('没有生产数大于0的数据可保存');
      schSaveLoading.value = false;
      return;
    }

    const collectAllChildren = (items: ProductionItem[]): ProductionItem[] => {
      const result: ProductionItem[] = [];
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          for (const child of item.children) {
            result.push(child);
            result.push(...collectAllChildren([child]));
          }
        }
      }
      return result;
    };

    const nodesToCollectChildren = productionNodes.filter(node => node.level !== 0);
    const allChildren = collectAllChildren(nodesToCollectChildren);
    const childMap = new Map<string, ProductionItem>();
    allChildren.forEach(child => childMap.set(child.key, child));
    const uniqueChildren = Array.from(childMap.values());

    const salesControlList = productionNodes.filter(item => item.level !== 0).map((item, idx) => {
      const newSc = convertToWorkOrderSalesControl(item, idx);
      const existing = existingMap.get(newSc.货号 || '');
      if (existing) {
        newSc.编号 = existing.编号 || existing.id;
        const oldTotal = Number(existing.工单总数) || 0;
        const addTotal = Number(newSc.工单总数) || 0;
        newSc.工单总数 = String(oldTotal + addTotal);
        const oldWip = Number(existing.在产数量) || 0;
        const addWip = Number(newSc.在产数量) || 0;
        newSc.在产数量 = String(oldWip + addWip);
        newSc.交货计划 = mergeDeliveryPlans(existing.交货计划 || '', newSc.交货计划 || '');
      }
      return newSc;
    });

    await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlList(salesControlList);

    const updatedMainList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const mainNoMap = new Map<string, string>();
    (updatedMainList || []).forEach((item: any) => {
      if (item.货号 && (item.编号 || item.id)) {
        mainNoMap.set(item.货号, item.编号 || item.id);
      }
    });

    const childParentMap = new Map<string, string>();
    const buildChildParentMap = (nodes: ProductionItem[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            childParentMap.set(child.key, node.partNo || '');
            buildChildParentMap([child]);
          }
        }
      }
    };
    buildChildParentMap(nodesToCollectChildren);

    const detailList = uniqueChildren.map(item => {
      const detail = new WorkOrderSalesControlDetail();
      detail.货号 = item.partNo || '';
      detail.品名 = item.name || '-';
      detail.规格 = item.spec || '-';
      detail.用量 = String(item.usage || 0);
      detail.需求数 = String(item.needQty || 0);
      detail.已出库数 = '0';
      detail.缺料数 = '0';
      detail.仓库名称 = item.warehouse || '-';
      detail.仓库数 = String(item.stock || 0);
      detail.仓库缺料 = '0';
      const parentPartNo = childParentMap.get(item.key);
      if (parentPartNo) {
        const parentNo = mainNoMap.get(parentPartNo);
        if (parentNo) detail.父级编号 = parentNo;
      }
      return detail;
    });

    if (detailList.length > 0) {
      await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlDetailList(detailList);
    }

    const externalProductionList = productionNodes.map(item => {
      const ep = new ExternalProduction();
      ep.合同号 = schedulingProduct.orderNo || '';
      ep.货号 = item.partNo || '';
      ep.排产编号 = props.record?.排产编号 || '';
      ep.需求量 = String(item.needQty || 0);
      ep.生产数量 = String(item.produceQty || 0);
      return ep;
    });

    await externalProductionService.addOrUpdateExternalProductionList(externalProductionList);

    message.success(`已保存 ${salesControlList.length} 条到工单销控表，${detailList.length} 条明细，${productionNodes.length} 条到外产生产`);
  } catch (error) {
    console.error('保存分析失败:', error);
    message.error('保存分析失败，请稍后重试');
  } finally {
    schSaveLoading.value = false;
  }
}

// ========== 保存BOM ==========
async function handleSchSaveBOM() {
  if (!schedulingProduct.partNo) {
    message.warning('货号不能为空');
    return;
  }
  schSaveBomLoading.value = true;
  try {
    await externalProductionService.saveExternalProductionBOMByPartNo(schedulingProduct.partNo);
    message.success(`货号【${schedulingProduct.partNo}】BOM保存成功`);
  } catch (error) {
    console.error('保存BOM失败:', error);
    message.error((error as Error).message || '保存BOM失败，请稍后重试');
  } finally {
    schSaveBomLoading.value = false;
  }
}

// ========== 加载排产分析数据 ==========
async function loadSchedulingData() {
  if (!schedulingProduct.partNo) return;
  schedulingLoading.value = true;
  keyCounter = 0;
  try {
    const requestDto = new PMCRequestDto({
      货号: schedulingProduct.partNo,
      排产编号: props.record?.排产编号,
    });
    const bomData = await salesControlService.getSchedulingAnalysisList(requestDto);
    if (!bomData || !bomData.length) {
      message.warning('未获取到排产分析数据');
      schDataSource.value = [];
      return;
    }

    schedulingForm.analysisType = 'normal';
    const treeData = buildTreeFromData(bomData, schedulingProduct.qty);
    schDataSource.value = treeData;
    schExpandedKeys.value = getAllParentKeys(schDataSource.value);
  } catch (error) {
    console.error('加载排产分析数据失败:', error);
    message.error('加载排产分析数据失败，请稍后重试');
  } finally {
    schedulingLoading.value = false;
    nextTick(() => updateTableScrollY());
  }
}

// ========== 事件处理 ==========
const handleVisibleUpdate = (val: boolean) => {
  emit('update:visible', val);
};

// 监听弹窗打开，初始化所有数据
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.record) {
      // 评审表单初始化
      reviewForm.coilItemNo = props.record.线圈货号 || '';
      verifyStatus.value = 'none';
      validatingCoil.value = false;

      reviewForm.finalDate = props.record.交货日期 ? dayjs(props.record.交货日期) : dayjs();
      reviewForm.resultStatus = 'pass';
      reviewForm.remark = '';
      reviewForm.specialRequirement = '';

      // 排产分析初始化
      schedulingProduct.partNo = props.record.货号 || '';
      schedulingProduct.productName = props.record.中文品名 || '';
      schedulingProduct.spec = props.record.中文规格 || '';
      schedulingProduct.qty = Number(props.record.数量) || 1;
      schedulingProduct.orderNo = props.record.合同号 || '';
      schedulingForm.deliveryDate = undefined;

      loadSchedulingData();
      nextTick(() => updateTableScrollY());

      // 加载企业微信部门列表
      loadSchedulingDepartments();
      schedulingUserSelectedKeys.value = [];
      schedulingSelectedUsers.value = [];
      schedulingDeptUsers.value = [];
      schedulingUserSearchText.value = '';

      // 延迟计算人员表格可用高度（等布局渲染）
      nextTick(() => setTimeout(() => updateUserTableScrollY(), 100));
    }
  },
  { flush: 'post' }
);

// 监听窗口尺寸变化，重新计算人员表格高度
onMounted(() => {
  window.addEventListener('resize', updateUserTableScrollY);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateUserTableScrollY);
});
</script>

<style scoped>
/* ========== 抽屉整体 ========== */
.review-detail-drawer :deep(.ant-drawer-header) {
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.review-detail-drawer :deep(.ant-drawer-header-title) {
  display: flex;
  align-items: center;
}

.review-detail-drawer :deep(.ant-drawer-close) {
  margin-inline-start: auto;
}

/* ========== 自定义抽屉标题 ========== */
.drawer-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
}

/* ========== 主体内容区 ========== */
.drawer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #f5f7fa;
}

/* ========== 上半部分 ========== */
.top-section {
  padding: 14px 20px 8px;
  flex-shrink: 0;
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.info-card :deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 18px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.info-card :deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f1f;
  padding: 10px 0;
}

.info-card :deep(.ant-card-body) {
  padding: 14px 18px;
}

/* 基础资料网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-label {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
}

.info-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  word-break: break-all;
  line-height: 1.5;
}

.info-value.copyable {
  font-family: 'Courier New', Courier, monospace;
  color: #1890ff;
  font-weight: 600;
}

/* 校验结果 */
.verify-result {
  margin-top: 8px;
}

.coil-form-item {
  margin-bottom: 0;
}

.coil-form-item :deep(.ant-form-item-label) {
  padding-bottom: 6px;
}

.coil-form-item :deep(.ant-form-item-label > label) {
  font-size: 13px;
  font-weight: 500;
}

/* 评审结论紧凑表单 */
.review-form-compact :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.review-form-compact :deep(.ant-form-item-label) {
  padding-bottom: 6px;
}

.review-form-compact :deep(.ant-form-item-label > label) {
  font-size: 13px;
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.half-width {
  width: 50%;
  text-align: center;
}

:deep(.reject-radio.ant-radio-button-wrapper-checked) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

:deep(.reject-radio.ant-radio-button-wrapper-checked:hover) {
  background-color: #ff7875;
  border-color: #ff7875;
  color: #fff;
}

:deep(.pass-radio.ant-radio-button-wrapper-checked) {
  background-color: #52c41a;
  border-color: #52c41a;
  color: #fff;
}

:deep(.pass-radio.ant-radio-button-wrapper-checked:hover) {
  background-color: #73d13d;
  border-color: #73d13d;
  color: #fff;
}

/* ========== 下半部分：排产分析 ========== */
.bottom-section {
  flex: 1;
  padding: 6px 20px 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.scheduling-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  background: #fff;
  margin-top: -8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.scheduling-card :deep(.ant-card-head) {
  min-height: 42px;
  padding: 0 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.scheduling-card :deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  padding: 11px 0;
}

.scheduling-card :deep(.ant-card-body) {
  padding: 14px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 排产控制区 */
.scheduling-controls {
  flex-shrink: 0;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e8e8e8;
  margin-bottom: 12px;
}

.sch-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.sch-input-row {
  gap: 28px;
  margin-bottom: 16px;
}

.sch-action-row {
  gap: 28px;
}

.sch-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sch-label {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}

.sch-value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  background: #f5f7fa;
  padding: 6px 14px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.6;
}

.sch-value.w-220 { width: 220px; }
.sch-value.w-300 { width: 300px; }
.sch-value.w-200 { width: 200px; }

.sch-analysis-modes {
  display: flex;
  align-items: center;
}

.sch-radio-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.sch-btn-group {
  display: flex;
  gap: 12px;
}

/* 排产表格 */
.scheduling-table-wrap {
  flex: 1;
  min-height: 0;
}

/* Spin 容器撑满 */
.scheduling-card :deep(.ant-spin-nested-loading),
.scheduling-card :deep(.ant-spin-container) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 表格内部滚动由 Ant Design 的 scroll.y 自动管理 */

.cell-input-small {
  width: 90px;
}

/* 树形图标 */
.product-symbol-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  margin-right: 0;
}

.tree-icon-box {
  cursor: pointer;
  color: #5383b3;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.tree-leaf-icon {
  color: #bfbfbf;
  font-size: 12px;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6f0ff;
  color: #1e3a5f;
  font-weight: 700;
  font-size: 13px;
}

.partno-text {
  font-weight: 500;
  color: #1e3a5f;
}

.product-text {
  color: #434343;
}

.spec-text {
  color: #595959;
  font-size: 12px;
}

/* 排产公式栏 */
.scheduling-formula-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0 0;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #595959;
}

/* 底部操作栏 */
.footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 0;
  margin-top: 10px;
  flex-shrink: 0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
  font-size: 13px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 排产表格样式覆盖 */
.scheduling-table-wrap :deep(.ant-table) {
  font-size: 13px;
}

.scheduling-table-wrap :deep(.ant-table-thead > tr > th) {
  background: #1e3a5f !important;
  color: #fff;
  font-weight: 500;
  padding: 10px 8px;
  font-size: 13px;
  white-space: nowrap;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr > td) {
  padding: 8px 8px;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}

/* ========== 排产用户选择卡片 ========== */
.user-selector-card :deep(.ant-card-body) {
  padding: 8px;
}

.required-mark {
  color: #f5222d;
  margin-left: 4px;
  font-weight: bold;
}

.user-selector-wrap {
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
  min-height: 300px;
}

/* 左侧：部门树 */
.dept-sidebar {
  flex: 4;
  min-width: 0;
  border-right: 1px solid #f0f0f0;
  padding: 4px 6px;
  background: #fafafa;
  overflow-y: auto;
}

.dept-compact-tree {
  font-size: 13px;
}

/* 右侧：人员选择 */
.user-side {
  flex: 6;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* 空状态居中 */
.empty-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-scheduling-users {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 1px 0 5px;
  min-height: 20px;
  flex-shrink: 0;
}

.user-table-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-search-input {
  margin-bottom: 4px;
  flex-shrink: 0;
}

.user-table-area :deep(.ant-table) {
  font-size: 12px;
}

.user-table-area :deep(.ant-table-thead > tr > th) {
  padding: 6px 8px !important;
  font-size: 12px;
}

.user-table-area :deep(.ant-table-tbody > tr > td) {
  padding: 5px 8px !important;
}

.user-table-area :deep(.ant-pagination) {
  margin: 4px 0 0 !important;
}

.user-table-area :deep(.ant-pagination-item),
.user-table-area :deep(.ant-pagination-prev),
.user-table-area :deep(.ant-pagination-next) {
  min-width: 26px !important;
  height: 26px !important;
  line-height: 24px !important;
}

.user-table-area :deep(.ant-pagination-total-text) {
  font-size: 12px;
}

/* ========== 核心校验紧凑卡片 ========== */
.verify-card-compact :deep(.ant-card-body) {
  padding: 10px 14px;
}

/* ========== 顶部三列等高 ========== */
.top-row-equal-height :deep(.ant-row) {
  display: flex;
}

.top-row-equal-height :deep(.ant-col) {
  display: flex;
  flex-direction: column;
}

.right-col {
  display: flex;
  flex-direction: column;
}

.right-col-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 核心校验卡片：固定高度 */
.verify-card-compact {
  flex-shrink: 0;
}

/* 评审结论卡片：填充剩余高度 */
.review-conclusion-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.review-conclusion-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.review-form-fill {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.review-form-fill .remark-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-bottom: 0;
}

.review-form-fill .remark-item :deep(.ant-form-item-control) {
  flex: 1;
  min-height: 0;
}

.review-form-fill .remark-item :deep(.ant-form-item-control-input) {
  flex: 1;
  min-height: 0;
}

.review-form-fill .remark-item :deep(.ant-form-item-control-input-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.review-form-fill .remark-item :deep(.ant-input) {
  flex: 1;
  min-height: 80px;
  resize: none;
}

/* 左侧卡片确保填充高度 */
.left-col-card {
  height: 100%;
}

.left-info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.left-info-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
}

/* 响应式 */
@media (max-width: 991px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item.full-width {
    grid-column: span 1;
  }

  .sch-input-row,
  .sch-action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-selector-wrap {
    flex-direction: column;
    height: auto;
  }

  .dept-sidebar {
    width: 100%;
    max-height: 160px;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }

  /* 移动端：恢复为正常流式布局 */
  .top-row-equal-height :deep(.ant-col) {
    display: block;
  }

  .left-info-card {
    height: auto;
    display: block;
  }

  .left-info-card :deep(.ant-card-body) {
    display: block;
  }

  .right-col {
    display: block;
  }

  .right-col-inner {
    display: block;
    margin-top: 16px;
  }

  .review-conclusion-card {
    display: block;
  }

  .review-conclusion-card :deep(.ant-card-body) {
    display: block;
  }

  .review-form-fill {
    display: block;
  }

  .review-form-fill .remark-item {
    margin-bottom: 12px;
  }

  .review-form-fill .remark-item :deep(.ant-input) {
    min-height: 60px;
  }
}
</style>