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

    <!-- 主体内容区：左右布局 -->
    <div class="drawer-body">
      <!-- 左侧：基础资料 + 校验 + 结论（上下排列） -->
      <div class="left-panel">
        <!-- 基础资料 -->
        <a-card title="基础资料" :bordered="false" class="info-card left-card">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">排产编号</span>
              <span class="info-value ">{{ record?.排产编号 || '--' }}</span>
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

        <!-- 选择排产用户 -->
        <a-card :bordered="false" class="info-card user-selector-card left-card">
          <template #title>
            <span>选择排产用户</span>
            <span class="required-mark">*</span>
          </template>
          <div class="user-selector-wrap">
            <OrgUserSelector
              ref="orgSelectorRef"
              v-model:selectedUserIds="schedulingSelectedUserIds"
              :multiple="false"
              :maxTableHeight="'260px'"
              @userSelect="onSchedulingUserSelect"
            />
          </div>
        </a-card>

        <!-- 核心要素校验 -->
        <a-card title="核心要素校验" :bordered="false" class="info-card verify-card-compact left-card">
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

        <!-- 评审结论 -->
        <a-card title="评审结论" :bordered="false" class="info-card review-conclusion-card left-card">
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

      <!-- 右侧：排产分析单详情（占满剩余空间） -->
      <div class="right-panel">
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
                  <span class="sch-label">交货日期</span>
                  <a-date-picker
                    v-model:value="schedulingForm.deliveryDate"
                    placeholder="选择交期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 170px"
                  />
                </div>
              </div>
              <!-- 操作行1：分析模式 + 核心操作按钮 -->
            <div class="sch-card">
              <!-- 操作行：所有控件在同一行，根据宽度自动换行 -->
              <div class="sch-row sch-action-row">
                <FixedColumnControl
                  v-model="fixedColumnKeys"
                  :columns="rawColumns"
                />
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
                  <span class="sch-control-label">范围</span>
                  <a-radio-group
                    v-model:value="materialScopeAll"
                    button-style="solid"
                  >
                    <a-radio-button value="current">当前数据</a-radio-button>
                    <a-radio-button value="all">所有数据</a-radio-button>
                  </a-radio-group>

                  <a-button
                    type="primary"
                    :disabled="!selectedRowKey"
                    @click="handleMaterialAnalysis"
                  >
                    <template #icon><SearchOutlined /></template>
                    物料分析
                  </a-button>

                </div>
                <div class="sch-btn-group sch-btn-group-2">
                  <a-button type="primary" @click="handleSchSave" :loading="schSaveLoading">
                    <template #icon><SaveOutlined /></template>
                    保存分析
                  </a-button>
                  <a-button type="primary" @click="handleTestSaveBOM" :loading="schSaveBomLoading">
                    <template #icon><SaveOutlined /></template>
                    仅保存BOM
                  </a-button>
                  <a-button type="primary" @click="handleSchExpandAll">
                    <template #icon><FolderOpenOutlined /></template>
                    全部展开
                  </a-button>
                  <a-button type="primary" @click="handleSchCollapseAll">
                    <template #icon><FolderOutlined /></template>
                    全部收缩
                  </a-button>
                  <a-popconfirm
                    title="确定要删除选中的货号吗？"
                    :subtitle="'有子级物料将一并删除'"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="handleSchDelete"
                  >
                    <a-button type="primary" danger :disabled="!selectedRowKey">
                      <template #icon><DeleteOutlined /></template>
                      删除选中
                    </a-button>
                  </a-popconfirm>
                  <a-popconfirm
                    title="确定要删除选中的根节点吗？"
                    subtitle="子级物料将自动提升一级"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="handleSchDeleteRoot"
                  >
                    <a-button danger :disabled="!selectedRowKey">
                      <template #icon><DeleteOutlined /></template>
                      删除根节点
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>
            </div>
            </div>

            <!-- 排产分析表格 -->
            <div ref="tableWrapRef" class="scheduling-table-wrap">
              <a-table
                :columns="displayColumns"
                :data-source="filteredSchDataSource"
                :pagination="false"
                :scroll="schTableScroll"
                bordered
                row-key="key"
                :expand-icon-column-index="1"
                :indent-size="20"
                :expanded-row-keys="schExpandedKeys"
                :row-class-name="(record: any) => record.key === selectedRowKey ? 'selected-row' : ''"
                :custom-row="(record: any) => ({ onClick: (e: MouseEvent) => handleRowClick(record, e) })"
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
                  {{ index + 1 }}
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
                    <div @click.stop>
                    <a-input-number
                      v-model:value="record[column.key]"
                      class="cell-input-small"
                      :controls="false"
                      @change="(val: any) => handleSchLossChange(record, column.key as string, val)"
                    />
                    </div>
                  </template>
                  <template v-if="column.key === 'workshop'">
                    <div @click.stop>
                    <a-select
                      :value="record.workshop"
                      class="cell-input-small"
                      :options="workshopOptions"
                      placeholder="选择车间"
                      allow-clear
                      size="small"
                      @change="(val: any) => handleSchWorkshopChange(record, val)"
                    />
                    </div>
                  </template>
                </template>
              </a-table>
              <a-empty v-if="!schedulingLoading && filteredSchDataSource.length === 0" description="暂无排产分析数据" />
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
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { bomStructureProcessService } from '@/services/bomStructureProcessService';
import { type WeChatUser } from '@/services/wechatWorkService';
import { PMCRequestDto, PMCDeliveryReview, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail, ExternalProductionBOM, ExternalProductionPickMaterial, ExternalProductionWarehousing } from '@/api-generated/api';
import { columns as rawColumns } from '../SchedulingAnalysis/types';
import FixedColumnControl from '@/components/FixedColumnControl.vue';
import OrgUserSelector from '@/components/OrgUserSelector.vue';

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
const schedulingSelectedUserIds = ref<string[]>([]);
const schedulingSelectedUsers = ref<WeChatUser[]>([]);
const orgSelectorRef = ref<InstanceType<typeof OrgUserSelector>>();

const onSchedulingUserSelect = (userIds: string[]) => {
  const allUsers = orgSelectorRef.value?.deptUsers || [];
  schedulingSelectedUsers.value = allUsers.filter(u => userIds.includes(u.userid));
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

// BOM结构工序-执行车间选项列表
const workshopOptions = ref<{ label: string; value: string }[]>([]);

// 加载BOM结构工序列表（获取执行车间）
async function loadWorkshopOptions() {
  try {
    const data = await bomStructureProcessService.getBOMStructureProcessList();
    const uniqueWorkshops = new Set<string>();
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((item: any) => {
        // 兼容多种可能的字段名
        const workshop = item.执行车间 || item.工序车间 || item.workshop
          || item.WorkShop || item.车间 || item.执行部门 || '';
        if (workshop && typeof workshop === 'string') {
          uniqueWorkshops.add(workshop);
        }
      });
    }
    // 如果没从对象字段提取到，尝试数据本身就是字符串数组的情况
    if (uniqueWorkshops.size === 0 && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (typeof item === 'string' && item.trim()) {
          uniqueWorkshops.add(item.trim());
        }
      });
    }
    workshopOptions.value = Array.from(uniqueWorkshops).map(w => ({ label: w, value: w }));
  } catch (error) {
    console.error('加载BOM结构工序列表失败:', error);
  }
}

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

// 层数选择
const selectedLevel = ref(1);

// 计算数据中包含的层数（排除0）
const availableLevels = computed(() => {
  const levels = new Set<number>();
  const traverse = (items: ProductionItem[]) => {
    items.forEach(item => {
      if (item.level > 0) levels.add(item.level);
      if (item.children) traverse(item.children);
    });
  };
  traverse(schDataSource.value);
  return Array.from(levels).sort((a, b) => a - b);
});

// 根据层数过滤树
function filterTreeByLevel(items: ProductionItem[], maxLevel: number): ProductionItem[] {
  return items
    .filter(item => item.level <= maxLevel)
    .map(item => {
      const newItem = { ...item };
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterTreeByLevel(item.children, maxLevel);
        if (filteredChildren.length > 0) {
          newItem.children = filteredChildren;
        } else {
          newItem.children = undefined;
        }
      }
      return newItem;
    });
}

// 过滤后的表格数据
const filteredSchDataSource = computed(() => {
  return filterTreeByLevel(schDataSource.value, selectedLevel.value);
});

// 获取过滤后需要展开的节点（所有有子节点的父节点）
function getExpandedKeysForFiltered(items: ProductionItem[]): string[] {
  const keys: string[] = [];
  const traverse = (node: ProductionItem) => {
    if (node.children && node.children.length > 0) {
      keys.push(node.key);
      node.children.forEach(traverse);
    }
  };
  items.forEach(traverse);
  return keys;
}

// ========== 行选中与物料分析 ==========
const selectedRowKey = ref<string>('');
const materialScopeAll = ref<'current' | 'all'>('current');

// 行点击选中/取消选中（点击生产数/采购数/生产损耗输入框列时不触发）
function handleRowClick(record: ProductionItem, e?: MouseEvent) {
  // 如果点击目标在输入框或选择框内，不触发行选中
  if (e) {
    const target = e.target as HTMLElement;
    if (
      target.closest('.ant-input-number')
      || target.closest('.ant-select')
      || target.closest('.ant-select-dropdown')
      || target.closest('.cell-input-small')
    ) {
      return;
    }
  }
  if (selectedRowKey.value === record.key) {
    selectedRowKey.value = '';
  } else {
    selectedRowKey.value = record.key;
  }
}

// 收集节点下所有子孙的 key（用于全部展开）
function collectAllDescendantKeys(node: ProductionItem): string[] {
  const keys: string[] = [];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      keys.push(child.key);
      keys.push(...collectAllDescendantKeys(child));
    }
  }
  return keys;
}

// 物料分析按钮处理
function handleMaterialAnalysis() {
  if (!selectedRowKey.value) {
    message.warning('请先在表格中选择一行');
    return;
  }

  // 在原始完整数据（schDataSource）中按 key 查找选中的节点
  const findNodeInTree = (items: ProductionItem[], targetKey: string): ProductionItem | null => {
    for (const item of items) {
      if (item.key === targetKey) return item;
      if (item.children && item.children.length > 0) {
        const found = findNodeInTree(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNodeInTree(schDataSource.value, selectedRowKey.value);
  if (!selectedNode) {
    message.warning('未找到选中的行数据');
    return;
  }

  if (!selectedNode.children || selectedNode.children.length === 0) {
    message.info(`货号【${selectedNode.partNo || '未知'}】下没有子级物料数据`);
    return;
  }

  const childLevel = selectedNode.children[0]?.level || selectedNode.level + 1;

  if (materialScopeAll.value === 'all') {
    // 所有数据：展开选中节点下的全部层级
    const allDescendantKeys = [selectedNode.key, ...collectAllDescendantKeys(selectedNode)];
    schExpandedKeys.value = [...schExpandedKeys.value, ...allDescendantKeys].filter(
      (k, i, arr) => arr.indexOf(k) === i
    );
    // 设置层数为最大可用层级
    selectedLevel.value = Math.max(...availableLevels.value, childLevel);
  } else {
    // 当前数据：只展开选中节点（显示直接子节点），不展开更深层级
    if (!schExpandedKeys.value.includes(selectedNode.key)) {
      schExpandedKeys.value = [...schExpandedKeys.value, selectedNode.key];
    }
    // 确保选中的层数至少能显示到子节点层级
    if (selectedLevel.value < childLevel) {
      selectedLevel.value = childLevel;
    }
  }

  message.success(
    materialScopeAll.value === 'all'
      ? `已分析货号【${selectedNode.partNo || '未知'}】的全部层级物料`
      : `已分析货号【${selectedNode.partNo || '未知'}】的下一层物料`
  );
}

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
  const allKeys = getAllParentKeys(filteredSchDataSource.value);
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

// ========== 删除选中货号及其子级 ==========
function handleSchDelete() {
  if (!selectedRowKey.value) {
    message.warning('请先在表格中选择一行');
    return;
  }

  // 查找选中的节点，层级为 0 的根节点不允许删除
  const findNode = (items: ProductionItem[], targetKey: string): ProductionItem | null => {
    for (const item of items) {
      if (item.key === targetKey) return item;
      if (item.children && item.children.length > 0) {
        const found = findNode(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };
  const targetNode = findNode(schDataSource.value, selectedRowKey.value);
  if (targetNode && targetNode.level === 0) {
    message.warning('层级为 0 的根节点不允许删除');
    return;
  }

  // 收集该节点及其所有子孙节点的 key
  const collectKeys = (node: ProductionItem): string[] => {
    const keys = [node.key];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        keys.push(...collectKeys(child));
      }
    }
    return keys;
  };

  // 在树中查找并删除节点（返回是否删除成功）
  const deleteFromTree = (items: ProductionItem[], targetKey: string): boolean => {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item) continue;
      if (item.key === targetKey) {
        // 收集所有将被删除的 key（含子孙）
        const keysToRemove = collectKeys(item);
        // 从展开列表中移除
        schExpandedKeys.value = schExpandedKeys.value.filter(k => !keysToRemove.includes(k));
        // 删除节点
        items.splice(i, 1);
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (deleteFromTree(item.children, targetKey)) {
          return true;
        }
      }
    }
    return false;
  };

  const deleted = deleteFromTree(schDataSource.value, selectedRowKey.value);
  if (deleted) {
    selectedRowKey.value = '';
    message.success('已删除选中的货号及其子级物料');
  } else {
    message.error('删除失败，未找到选中的货号');
  }
}

// ========== 删除根节点（子级提升） ==========
function handleSchDeleteRoot() {
  if (!selectedRowKey.value) {
    message.warning('请先在表格中选择一行');
    return;
  }

  // 查找选中的节点，层级为 0 的根节点不允许删除
  const findNode = (items: ProductionItem[], targetKey: string): ProductionItem | null => {
    for (const item of items) {
      if (item.key === targetKey) return item;
      if (item.children && item.children.length > 0) {
        const found = findNode(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };
  const targetNode = findNode(schDataSource.value, selectedRowKey.value);
  if (targetNode && targetNode.level === 0) {
    message.warning('层级为 0 的根节点不允许删除');
    return;
  }

  // 递归降低子树中所有节点的层级
  const decreaseLevels = (items: ProductionItem[], decrement: number): void => {
    items.forEach(item => {
      item.level = item.level - decrement;
      if (item.children && item.children.length > 0) {
        decreaseLevels(item.children, decrement);
      }
    });
  };

  // 重新分配行号
  const reassignRowNums = (items: ProductionItem[]): void => {
    let counter = 0;
    const traverse = (list: ProductionItem[]) => {
      list.forEach(item => {
        counter++;
        item.rowNum = counter;
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(items);
  };

  // 在树中查找并执行"删根提子"操作
  const deleteRootAndPromote = (items: ProductionItem[], targetKey: string): boolean => {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item) continue;

      if (item.key === targetKey) {
        // 从展开列表中移除被删除节点自身
        schExpandedKeys.value = schExpandedKeys.value.filter(k => k !== item.key);

        if (item.children && item.children.length > 0) {
          // 子级提升：将所有子级降低1层
          decreaseLevels(item.children, 1);
          // 将子级插入到父级数组中（替换原节点位置）
          items.splice(i, 1, ...item.children);
        } else {
          // 没有子级，直接删除
          items.splice(i, 1);
        }

        // 重新分配行号
        reassignRowNums(schDataSource.value);
        return true;
      }

      if (item.children && item.children.length > 0) {
        if (deleteRootAndPromote(item.children, targetKey)) {
          // 递归返回后也重新分配行号
          reassignRowNums(schDataSource.value);
          return true;
        }
      }
    }
    return false;
  };

  const result = deleteRootAndPromote(schDataSource.value, selectedRowKey.value);
  if (result) {
    selectedRowKey.value = '';
    message.success('已删除根节点，子级物料已自动提升一级');
  } else {
    message.error('删除失败，未找到选中的货号');
  }
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

// 通过 key 在原始 schDataSource 树中查找节点（返回原始引用，非 filteredSchDataSource 的副本）
function findItemByKey(items: ProductionItem[], key: string): ProductionItem | null {
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children?.length) {
      const found = findItemByKey(item.children, key);
      if (found) return found;
    }
  }
  return null;
}

// ========== 处理工序车间变化 ==========
function handleSchWorkshopChange(record: ProductionItem, value: string | undefined) {
  if (!record) return;
  // 通过 key 在原始 schDataSource 中找到节点，修改原始数据以触发表格实时刷新
  const originalItem = findItemByKey(schDataSource.value, record.key);
  if (!originalItem) return;
  originalItem.workshop = value || '';
  // 每次选择车间时，自动取车间前两字作为工序名称（实时联动）
  if (value) {
    originalItem.process = value.substring(0, 2);
  }
}

// ========== 处理损耗变化 ==========
function handleSchLossChange(record: ProductionItem, field: string, value: number | null) {
  if (!record) return;
  // 关键：通过 key 在原始 schDataSource 中找到节点（而非 filteredSchDataSource 的副本），
  // 这样修改会触发 computed 重新计算，表格实时刷新
  const originalItem = findItemByKey(schDataSource.value, record.key);
  if (!originalItem) return;

  if (field === 'loss') {
    const lossValue = value || 0;
    originalItem.loss = lossValue;
    // 重新计算该行及子行的需求量、生产数/采购数
    const updateItemAndChildren = (item: ProductionItem) => {
      if (schedulingProduct.qty > 0 && (item.usage || 1)) {
        const demandQty = calculateDemandQty(schedulingProduct.qty, item.usage || 1, item.loss || 0);
        item.needQty = demandQty;
        if (item.source !== '自制') {
          item.purchaseQty = demandQty + (item.avail || 0);
        } else {
          item.produceQty = demandQty + (item.avail || 0);
        }
      }
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => updateItemAndChildren(child));
      }
    };
    updateItemAndChildren(originalItem);
  } else if (field === 'produceQty') {
    originalItem.produceQty = value || 0;
  } else if (field === 'purchaseQty') {
    originalItem.purchaseQty = value || 0;
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

// ========== 转换工单销控数据 ==========
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
  return sc;
}

// ========== 保存排产分析 ==========
async function handleSchSave() {
  if (!schedulingForm.deliveryDate) {
    message.warning('请先选择交货日期');
    return;
  }
  if (schDataSource.value.length === 0) {
    message.warning('没有可保存的详情数据');
    return;
  }

  schSaveLoading.value = true;
  try {
    // ========== 1. 先保存外产BOM（最前面），拿到后端返回的完整列表（含分析单号、编号） ==========
    const savedBomList = await handleSchSaveBOM();
    // 建立货号→{分析单号, 编号} 的映射，供后续明细使用（不查库，用内存返回值）
    const bomAnalysisNoMap = new Map<string, string>();
    const bomIdMap = new Map<string, string>();
    (savedBomList || []).forEach((b: any) => {
      if (b.货号) {
        bomAnalysisNoMap.set(b.货号, b.分析单号 || '');
        if (b.编号) bomIdMap.set(b.货号, String(b.编号));
      }
    });

    const existingList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const existingMap = new Map<string, any>();
    (existingList || []).forEach((item: any) => {
      if (item.货号) existingMap.set(item.货号, item);
    });

    // ========== 根据保存范围决定数据源 ==========
    // 当前显示模式：只收集展开可见的节点（类似保存BOM的collectVisibleItems逻辑）
    // 全部数据模式：使用全部节点（原有逻辑）
    // 只收集当前页面展开可见的节点（类似保存BOM的collectVisibleItems逻辑）
    const flatItems: ProductionItem[] = [];
    const collectVisibleFlat = (items: ProductionItem[]) => {
      for (const item of items) {
        flatItems.push(item);
        // 只有当前节点被展开时，才递归收集子节点（未展开=未显示在表格中）
        if (item.children && item.children.length > 0 && schExpandedKeys.value.includes(item.key)) {
          collectVisibleFlat(item.children);
        }
      }
    };
    collectVisibleFlat(schDataSource.value);

    const productionNodes = flatItems.filter(item => item.produceQty > 0);
    if (productionNodes.length === 0) {
      message.warning('没有生产数大于0的数据可保存');
      schSaveLoading.value = false;
      return;
    }

    // 按货号合并 BOM 内相同货号的数量，避免重复保存时彼此覆盖导致丢数
    const mergedMap = new Map<string, ProductionItem>();
    for (const item of productionNodes) {
      const mergeKey = item.partNo || `TEMP-${item.key}`;
      const exist = mergedMap.get(mergeKey);
      if (exist) {
        exist.produceQty += item.produceQty || 0;
        exist.needQty = (exist.needQty || 0) + (item.needQty || 0);
        exist.wip = (exist.wip || 0) + (item.wip || 0);
      } else {
        mergedMap.set(mergeKey, { ...item });
      }
    }
    const mergedNodes = Array.from(mergedMap.values());

    const salesControlList = mergedNodes.map((item, idx) => {
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

    // 工单销控明细：遍历当前主表记录，货号/品名/规格取自主表，区别仅在于交货日期与工单单号
    // 生产数/待产数取本次 BOM 的原始数量（非主表累加值），保证每次保存时记录的是当次实际数量
    const mergedQtyMap = new Map<string, number>();
    for (const node of mergedNodes) {
      const key = node.partNo || '';
      if (key) mergedQtyMap.set(key, node.produceQty > 0 ? node.produceQty : (node.needQty || 0));
    }

    const detailList = salesControlList.map(item => {
      const detail = new WorkOrderSalesControlDetail();
      detail.货号 = item.货号 || '';
      detail.品名 = item.品名 || '-';
      detail.规格 = item.规格 || '-';
      // 关联主表自身编号
      const no = mainNoMap.get(item.货号 || '');
      if (no) detail.父级编号 = no;
      // 关联外产BOM的分析单号 + 编号（从已保存的BOM返回值中按货号匹配，不查库）
      const analysisNo = bomAnalysisNoMap.get(item.货号 || '');
      if (analysisNo) detail.分析单号 = analysisNo;
      // 明细编号直接取外产BOM对应的编号，使两表通过编号强关联
      const bomId = bomIdMap.get(item.货号 || '');
      if (bomId) detail.编号 = bomId;
      // 工单单号暂未赋值
      detail.交货日期 = schedulingForm.deliveryDate || dayjs().format('YYYY-MM-DD');
      const qty = mergedQtyMap.get(item.货号 || '') || 0;
      // 入库数由其他表关联，暂不操作（当前固定为 0）
      const 入库数 = 0;
      detail.生产数 = String(qty);
      detail.入库数 = String(入库数);
      detail.待产数 = String(Math.max(0, qty - 入库数));
      return detail;
    });

    if (detailList.length > 0) {
      await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlDetailList(detailList);
    }

    // ========== 保存外产领料：基于外产BOM数据，编号/货号直接赋值，需求量=生产数 ==========
    const pickMaterialList = (savedBomList || []).map((b: any) => {
      const pick = new ExternalProductionPickMaterial();
      pick.编号 = b.编号;            // 直接取外产BOM的编号
      pick.货号 = b.货号;            // 直接取外产BOM的货号
      pick.需求量 = b.生产数;        // 需求量 = 生产数
      // 其他字段不赋值
      return pick;
    });
    if (pickMaterialList.length > 0) {
      await externalProductionService.addOrUpdateExternalProductionPickMaterialList(pickMaterialList);
    }

    // ========== 保存外产入库：基于工单销控表明细，编号/货号直接赋值，需求量=生产数，入库数量不赋值 ==========
    const warehousingList = detailList.map(item => {
      const wh = new ExternalProductionWarehousing();
      wh.编号 = item.编号;           // 直接取明细的编号
      wh.货号 = item.货号;           // 直接取明细的货号
      wh.需求量 = item.生产数;       // 需求量 = 生产数
      // 入库数量不赋值
      return wh;
    });
    if (warehousingList.length > 0) {
      await externalProductionService.addOrUpdateExternalProductionWarehousingList(warehousingList);
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

    const bomCount = savedBomList?.length || 0;
    message.success(`已保存 ${salesControlList.length} 条到工单销控表，${detailList.length} 条明细，${productionNodes.length} 条到外产生产，${bomCount} 条BOM数据，${pickMaterialList.length} 条领料，${warehousingList.length} 条入库`);
  } catch (error) {
    console.error('保存分析失败:', error);
    message.error('保存分析失败，请稍后重试');
  } finally {
    schSaveLoading.value = false;
  }
}

// ========== 测试：仅执行保存BOM功能 ==========
async function handleTestSaveBOM() {
  const savedList = await handleSchSaveBOM();
  if (savedList && savedList.length > 0) {
    message.success(`已保存 ${savedList.length} 条BOM数据`);
  }
}

// ========== 保存BOM（返回后端保存后的完整列表，含分析单号） ==========
async function handleSchSaveBOM(): Promise<ExternalProductionBOM[] | null> {
  if (!schedulingProduct.partNo) {
    message.warning('货号不能为空');
    return null;
  }
  if (schDataSource.value.length === 0) {
    message.warning('没有排产分析数据可保存');
    return null;
  }
  schSaveBomLoading.value = true;
  try {
    // 保存当前根节点及其所有子级的完整 BOM 结构：递归遍历整棵树，
    // 每个货号存一条（父级编号取树中的父货号），按货号全局去重，保证结构从根到子完整。
    const bomList: ExternalProductionBOM[] = [];
    const savedPartNoSet = new Set<string>();

    const buildBOM = (item: ProductionItem, parentPartNo: string) =>
      new ExternalProductionBOM({
        货号: item.partNo || '',
        层: String(item.level),
        品名: item.name || '',
        规格: item.spec || '',
        父级编号: parentPartNo,
        用量: String(item.usage || ''),
        仓库名称: item.warehouse || '',
        仓库数: String(item.stock || ''),
        生产数: String(item.produceQty || ''),
        交货日期: schedulingForm.deliveryDate || '',
      });

    const traverse = (items: ProductionItem[], parentPartNo: string) => {
      for (const item of items) {
        const partNo = item.partNo || '';
        if (partNo && !savedPartNoSet.has(partNo)) {
          savedPartNoSet.add(partNo);
          bomList.push(buildBOM(item, parentPartNo));
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children, partNo);
        }
      }
    };
    traverse(schDataSource.value, '');

    if (bomList.length === 0) {
      message.warning('没有可保存的BOM数据');
      return null;
    }
    // 后端返回 Data = savedList（包含填好的分析单号等字段）
    const response = await externalProductionService.saveExternalProductionBOM(
      "user",
      props.record?.排产编号 || '',
      bomList
    );
    return response as ExternalProductionBOM[];
  } catch (error) {
    console.error('保存BOM失败:', error);
    message.error((error as Error).message || '保存BOM失败，请稍后重试');
    return null;
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
    selectedLevel.value = 1;
    schExpandedKeys.value = getExpandedKeysForFiltered(filteredSchDataSource.value);
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
      loadWorkshopOptions();
      nextTick(() => updateTableScrollY());

      // 加载企业微信部门列表（重新加载，确保每次打开都刷新最新部门/用户数据）
      schedulingSelectedUserIds.value = [];
      schedulingSelectedUsers.value = [];
      orgSelectorRef.value?.clearSelection();
      orgSelectorRef.value?.loadDepartments();
      orgSelectorRef.value?.loadAllUsers();
    }
  },
  { flush: 'post' }
);
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

/* ========== 主体内容区：左右布局 ========== */
.drawer-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
  background: #f5f7fa;
  gap: 12px;
  padding: 14px 20px 16px;
}

/* ========== 左侧面板（固定比例 1:2） ========== */
.left-panel {
  flex: 0 0 38%;
  max-width: 520px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
}

.left-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  background: #fff;
}

/* ========== 右侧面板 ========== */
.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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

/* ========== 右侧面板：排产分析 ========== */
.scheduling-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  background: #fff;
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

/* 卡片容器：包裹操作行 + 工具栏行 */
.sch-card {
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

/* 操作行（所有控件，自适应换行） */
.sch-action-row {
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.sch-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 工具栏行标签 */
.sch-control-label {
  font-size: 13px;
  color: #595959;
  white-space: nowrap;
  line-height: 1;
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
  align-items: center;
  gap: 16px;
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
  width: 100%;
  min-width: 0;
}

.cell-input-small :deep(.ant-input-number) {
  border: 1px solid transparent;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  width: 100%;
}

.cell-input-small :deep(.ant-input-number:hover) {
  border-color: #d9d9d9;
  background: #fff;
  border-radius: 4px;
}

.cell-input-small :deep(.ant-input-number-focused) {
  border-color: #1890ff !important;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.cell-input-small :deep(.ant-input-number-input) {
  text-align: center;
  padding: 0 4px;
  height: 28px;
  font-size: 13px;
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
  color: #faad14;
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
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr.selected-row > td) {
  background: #bae7ff !important;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr.selected-row:hover > td) {
  background: #91d5ff !important;
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
  height: 320px;
  overflow: hidden;
}

.user-selector-wrap :deep(.org-user-selector) {
  height: 100%;
}

.user-selector-wrap :deep(.dept-sidebar) {
  max-height: 100%;
  overflow-y: auto;
}

/* ========== 核心校验紧凑卡片 ========== */
.verify-card-compact :deep(.ant-card-body) {
  padding: 10px 14px;
}

/* ========== 左侧卡片通用样式 ========== */
.left-card :deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 14px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.left-card :deep(.ant-card-head-title) {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  padding: 8px 0;
}

.left-card :deep(.ant-card-body) {
  padding: 12px 14px;
}

/* 响应式：小屏幕恢复为上下布局 */
@media (max-width: 1199px) {
  .drawer-body {
    flex-direction: column;
    padding: 12px 16px 16px;
  }

  .left-panel {
    width: 100%;
    flex-shrink: 0;
    overflow-y: visible;
    padding-right: 0;
  }

  .right-panel {
    min-height: 400px;
  }
}
</style>