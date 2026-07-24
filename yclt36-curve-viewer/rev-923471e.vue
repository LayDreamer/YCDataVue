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
    <div class="drawer-body" :class="{ 'scheduling-fullscreen': isSchedulingFullscreen }">
      <!-- 左侧：基础资料 + 校验 + 结论（上下排列） -->
      <div class="left-panel" :class="{ expanded: showSchedulingPanel, collapsed: !showSchedulingPanel }">
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
              <span class="info-label">生产类型</span>
              <span class="info-value">{{ record?.生产类型 || '--' }}</span>
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
            <span v-if="!hasPresetSchedulingUser" class="required-mark">*</span>
          </template>

          <!-- 已有预设排产用户：显示标签 + 更换按钮 -->
          <div v-if="hasPresetSchedulingUser && !showUserSelector" class="preset-user-display">
            <div class="preset-user-tags">
              <a-tag v-for="(name, idx) in presetUserNames" :key="idx" color="blue">
                {{ name }}
              </a-tag>
            </div>
            <div class="preset-user-action">
              <a-button type="link" size="small" @click="showUserSelector = true">
                <SwapOutlined /> 更换用户
              </a-button>
            </div>
          </div>

          <!-- 无预设用户 或 点击更换后：显示选择器 -->
          <div v-else class="user-selector-wrap">
            <div v-if="hasPresetSchedulingUser && showUserSelector" class="user-selector-header">
              <a-button type="text" size="small" class="back-btn" @click="cancelUserChange">
                <LeftOutlined /> 返回
              </a-button>
              <span class="header-title">重新选择排产用户</span>
            </div>
            <OrgUserSelector
              ref="orgSelectorRef"
              v-model:selectedUserIds="schedulingSelectedUserIds"
              :multiple="false"
              :maxTableHeight="'260px'"
              @userSelect="onSchedulingUserSelect"
            />
            <div v-if="hasPresetSchedulingUser && showUserSelector" class="cancel-change-hint">
              <a-button type="text" size="small" @click="cancelUserChange">
                恢复默认用户
              </a-button>
            </div>
          </div>
        </a-card>

        <!-- 核心要素校验 -->
        <a-card title="核心要素校验" :bordered="false" class="info-card verify-card-compact left-card">
          <div class="coil-search-row">
            <SearchSelect
              v-model:value="reviewForm.coilItemNo"
              :columns="coilColumns"
              :search="searchCoils"
              value-field="value"
              :dropdown-width="560"
              :max-height="380"
              placeholder="线圈货号进行系统反查"
              :disabled="validatingCoil"
              style="flex: 1"
              @select="onCoilSelected"
            />
            <a-button type="primary" :loading="validatingCoil" @click="validateCoil">校验</a-button>
          </div>
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

        <!-- 左侧折叠态底部操作栏 -->
        <div v-if="!showSchedulingPanel" class="footer-bar left-footer">
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

      <!-- 右侧：排产分析单详情 -->
      <div class="right-panel" :class="{ expanded: showSchedulingPanel, collapsed: !showSchedulingPanel }">
      <!-- 折叠态：箭头图标 + 文字 -->
      <div v-if="!showSchedulingPanel" class="scheduling-toggle" @click="toggleSchedulingPanel">
        <span class="toggle-text">排产分析</span>
        <RightOutlined class="toggle-arrow" />
      </div>

      <!-- 展开态：排产分析单详情 -->
      <template v-else>
        <a-card :bordered="false" class="scheduling-card">
          <template #title>
            <div class="sch-card-title">
              <span class="sch-title-left">
                <LeftOutlined class="sch-collapse-icon" @click="toggleSchedulingPanel" />
                <span>排产分析单详情</span>
              </span>
              <span class="sch-title-right">
                <a-tooltip :title="isSchedulingFullscreen ? '退出全屏' : '全屏'">
                  <a-button type="link" size="small" @click="toggleFullscreen">
                    <template #icon>
                      <FullscreenExitOutlined v-if="isSchedulingFullscreen" />
                      <FullscreenOutlined v-else />
                    </template>
                  </a-button>
                </a-tooltip>
                <a-button type="link" size="small" @click="loadSchedulingData" :loading="schedulingLoading">
                  <template #icon><ReloadOutlined /></template>
                  刷新
                </a-button>
              </span>
            </div>
          </template>
          <a-spin :spinning="schedulingLoading" tip="加载排产分析数据...">
            <!-- 排产分析控制区 -->
            <div class="scheduling-controls">
              <!-- 第一行：基础信息 -->
              <div class="sch-row sch-input-row">
                <div class="sch-info-item">
                  <span class="sch-label">货号</span>
                  <a-tooltip :title="schedulingProduct.partNo || '--'" placement="top">
                    <span class="sch-value w-220">{{ schedulingProduct.partNo || '--' }}</span>
                  </a-tooltip>
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">品名</span>
                  <a-tooltip :title="schedulingProduct.productName || '--'" placement="top">
                    <span class="sch-value w-300">{{ schedulingProduct.productName || '--' }}</span>
                  </a-tooltip>
                </div>
                <div class="sch-info-item">
                  <span class="sch-label">规格</span>
                  <a-tooltip :title="schedulingProduct.spec || '--'" placement="top">
                    <span class="sch-value w-200">{{ schedulingProduct.spec || '--' }}</span>
                  </a-tooltip>
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
                <!-- 隐藏列选择 -->
                <a-popover trigger="click" placement="bottomLeft">
                  <a-tooltip title="隐藏列" placement="top">
                    <a-button size="small" class="hide-column-btn">
                      <template #icon><EyeOutlined /></template>
                      列设置
                      <DownOutlined style="font-size: 10px; margin-left: 2px;" />
                    </a-button>
                  </a-tooltip>
                  <template #content>
                    <div class="hide-column-dropdown">
                      <div class="hide-column-header">选择要隐藏的列</div>
                      <a-checkbox-group
                        :value="hiddenColumnKeys"
                        @change="onHiddenColumnsChange"
                        class="hide-column-check-group"
                      >
                        <div
                          v-for="opt in hideableColumnOptions"
                          :key="opt.value"
                          class="hide-column-item"
                        >
                          <a-checkbox :value="opt.value">{{ opt.label }}</a-checkbox>
                        </div>
                      </a-checkbox-group>
                      <div class="hide-column-footer">
                        <a-button
                          type="link"
                          size="small"
                          @click="hideAllColumns"
                        >
                          {{ hiddenColumnKeys.length === hideableColumnOptions.length ? '取消全选' : '隐藏全部' }}
                        </a-button>
                      </div>
                    </div>
                  </template>
                </a-popover>
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
                  <a-button type="primary" @click="handleSchExpandAll">
                    <template #icon><FolderOpenOutlined /></template>
                    全部展开
                  </a-button>
                  <a-button type="primary" @click="handleSchCollapseAll">
                    <template #icon><FolderOutlined /></template>
                    全部收缩
                  </a-button>
                  <a-popconfirm
                    v-if="false"
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
                    v-if="false"
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
                    <span class="partno-text">{{ record.partNo || '' }}</span>
                  </template>
                  <template v-if="column.key === 'name'">
                    <span class="product-text">{{ record.name }}</span>
                  </template>
                  <template v-if="column.key === 'spec'">
                    <span class="spec-text">{{ record.spec || record.unit || '' }}</span>
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
      </template>
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
  ReloadOutlined,
  RightOutlined,
  LeftOutlined,
  SwapOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons-vue';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { bomStructureProcessService } from '@/services/bomStructureProcessService';
import { type WeChatUser } from '@/services/wechatWorkService';
import { PMCRequestDto, PMCDeliveryReview, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail, ExternalProductionBOM, ExternalProductionPickMaterial, ExternalProductionWarehousing } from '@/api-generated/api';
import { columns as rawColumns } from '../SchedulingAnalysis/types';
import TableColumnSettings, { type ColumnSetting } from '@/components/TableColumnSettings.vue';
import OrgUserSelector from '@/components/OrgUserSelector.vue';
import SearchSelect, { type SearchSelectColumn } from '@/components/SearchSelect.vue';

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
// 折叠态：抽屉宽度贴合左侧卡片（约 760px）；展开态：占满 86vw
const drawerWidth = computed(() => {
  if (!screens.value?.md) return '100%';
  return showSchedulingPanel.value ? '86vw' : '760px';
});

// 排产分析单详情局部全屏（隐藏左侧卡片，详情占满整个页面区域）
const isSchedulingFullscreen = ref(false);

function toggleFullscreen() {
  isSchedulingFullscreen.value = !isSchedulingFullscreen.value;
  nextTick(() => updateTableScrollY());
}

// ========== 排产分析面板展开/折叠状态 ==========
const showSchedulingPanel = ref(false);

// 线圈货号是否已修改（与主表不一致且校验通过）
const isCoilModified = computed(() => {
  const original = props.record?.线圈货号 || '';
  return verifyStatus.value === 'success' &&
    reviewForm.coilItemNo.trim() !== '' &&
    reviewForm.coilItemNo.trim() !== original;
});

// 根据原货号替换括号内线圈货号，生成新货号
// 例：原 YCSM31-25-1GSN-S91B(S91B-DC24V-D-16W) + 新 S91B-AC24V-D-20VA
//   → YCSM31-25-1GSN-S91B(S91B-AC24V-D-20VA)
function buildModifiedPartNo(originalPartNo: string, newCoilNo: string): string {
  const match = originalPartNo.match(/^(.*)\((.*)\)$/);
  if (match) {
    return `${match[1]}(${newCoilNo})`;
  }
  // 原货号无括号结构，直接追加括号
  return `${originalPartNo}(${newCoilNo})`;
}

const toggleSchedulingPanel = () => {
  showSchedulingPanel.value = !showSchedulingPanel.value;
  if (showSchedulingPanel.value) {
    // 展开排产分析时：交货日期默认同步最终生产交期
    schedulingForm.deliveryDate = reviewForm.finalDate
      ? dayjs(reviewForm.finalDate).format('YYYY-MM-DD')
      : undefined;
    // 线圈货号已修改且校验通过时，替换货号括号内线圈货号部分作为请求参数
    if (isCoilModified.value) {
      schedulingProduct.partNo = buildModifiedPartNo(props.record?.货号 || '', reviewForm.coilItemNo.trim());
    }
    loadSchedulingData();
  } else {
    // 收起时恢复原始货号（下次打开可能重新判断）
    if (isCoilModified.value) {
      schedulingProduct.partNo = props.record?.货号 || '';
      schedulingProduct.productName = props.record?.中文品名 || '';
      schedulingProduct.spec = props.record?.中文规格 || '';
    }
  }
};

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

// 线圈货号模糊查询：通用搜索选择组件配置
const coilColumns: SearchSelectColumn[] = [
  { title: '货号', dataIndex: 'value', width: 160, fixed: true, color: '#1e3a5f' },
  { title: '中文品名', dataIndex: '中文品名', width: 220 },
  { title: '中文规格', dataIndex: '中文规格', width: 260 },
];

// 远程搜索：传入关键字，返回下拉所需的数据源
async function searchCoils(keyword: string): Promise<Record<string, any>[]> {
  const data = await deliveryReviewService.searchCoilsByKeyword(
    new PMCRequestDto({ 线圈货号: keyword.trim() })
  );
  const list = Array.isArray(data) ? data : [];
  return list.map((item: any) => {
    const partNo = item?.货号 || item?.value || '';
    const name = item?.中文品名 || item?.name || item?.产品名称 || '';
    const spec = item?.中文规格 || item?.spec || item?.规格 || '';
    return { value: partNo, 中文品名: name, 中文规格: spec };
  });
}

// 选中某条线圈后触发系统校验
function onCoilSelected(row: Record<string, any>) {
  reviewForm.coilItemNo = String(row.value ?? '');
  validateCoil();
}

// ========== 排产用户选择（企业微信） ==========
const schedulingSelectedUserIds = ref<string[]>([]);
const schedulingSelectedUsers = ref<WeChatUser[]>([]);
const orgSelectorRef = ref<InstanceType<typeof OrgUserSelector>>();
const showUserSelector = ref(false);

// 是否有预设排产用户（来自主表 record）
const hasPresetSchedulingUser = computed(() => {
  return props.record?.排产用户 && props.record.排产用户.trim() !== '';
});

// 预设排产用户名称列表
const presetUserNames = computed(() => {
  if (!hasPresetSchedulingUser.value) return [];
  return props.record?.排产用户?.split(/[,，]/).map(n => n.trim()).filter(Boolean) ?? [];
});

const onSchedulingUserSelect = (userIds: string[]) => {
  const allUsers = orgSelectorRef.value?.deptUsers || [];
  schedulingSelectedUsers.value = allUsers.filter(u => userIds.includes(u.userid));
};

// 取消更换，恢复为默认预设用户
function cancelUserChange() {
  showUserSelector.value = false;
  schedulingSelectedUserIds.value = [];
  schedulingSelectedUsers.value = [];
}

// ========== 初始化预选排产用户 ==========
async function initPreselectedUsers() {
  const existingNames = props.record?.排产用户;
  if (!existingNames || !existingNames.trim()) return;

  // 等待全量用户列表加载完成
  await nextTick();
  let retryCount = 0;
  while (retryCount < 10) {
    const allUsers = orgSelectorRef.value?.deptUsers || [];
    if (allUsers.length > 0) break;
    await new Promise(resolve => setTimeout(resolve, 200));
    retryCount++;
  }

  const allUsers = orgSelectorRef.value?.deptUsers || [];
  if (allUsers.length === 0) return;

  // 按逗号分割已有用户名，匹配 WeChat 用户
  const nameList = existingNames.split(/[,，]/).map(n => n.trim()).filter(Boolean);
  const matchedIds: string[] = [];
  const matchedUsers: WeChatUser[] = [];

  for (const name of nameList) {
    const found = allUsers.find(u => u.name === name || u.userid === name);
    if (found && !matchedIds.includes(found.userid)) {
      matchedIds.push(found.userid);
      matchedUsers.push(found);
    }
  }

  if (matchedIds.length > 0) {
    schedulingSelectedUserIds.value = matchedIds;
    schedulingSelectedUsers.value = matchedUsers;
  }
}

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
  if (schedulingSelectedUsers.value.length === 0 && !hasPresetSchedulingUser.value) {
    message.warning('请选择排产用户');
    return;
  }
  // 有预设用户但未手动选择时，使用预设用户名
  const finalUserNames = schedulingSelectedUsers.value.length > 0
    ? schedulingSelectedUsers.value.map(u => u.name)
    : presetUserNames.value;
  const mappedStatus = reviewForm.resultStatus === 'pass' ? '评审通过' : '评审驳回';
  const { 编号, 用户编号, 合同号, 排产编号, 中文品名, 中文规格, 分析单号, 来源编号, 来源, 工单单号, 电压, 数量, 生产类型 } = props.record!;
  const 排产用户 = finalUserNames.join(',');

  // 线圈货号已修改且校验通过时，无论是否展开排产分析，提交均使用替换括号内线圈货号后的新完整货号
  const finalPartNo = isCoilModified.value
    ? buildModifiedPartNo(props.record?.货号 || '', reviewForm.coilItemNo.trim())
    : schedulingProduct.partNo;

  const reviewData = new PMCDeliveryReview({
    编号,
    用户编号,
    合同号,
    排产编号,
    数量,
    货号: finalPartNo,
    中文品名,
    中文规格,
    分析单号,
    来源编号,
    来源,
    工单单号,
    排产用户,
    电压,
    生产类型,
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

// 隐藏列（排除 index 和 partNo，这两个始终显示）
const hiddenColumnKeys = ref<string[]>([]);

// 可供隐藏的列选项（排除 index 和 partNo）
const hideableColumnOptions = computed(() =>
  rawColumns
    .map((col) => ({
      label: (col.title as string) || '',
      value: ((col.key || (col as any).dataIndex) as string) || '',
    }))
    .filter((opt) => !['index', 'partNo'].includes(opt.value))
);

const displayColumns = computed(() => {
  const getKey = (col: any) => ((col.key || (col as any).dataIndex) as string) || '';

  const visibleColumns = rawColumns.filter(
    (col) => !hiddenColumnKeys.value.includes(getKey(col))
  );

  // 固定列按用户选择顺序提到最左侧
  const fixedCols: typeof visibleColumns = [];
  fixedColumnKeys.value.forEach((key) => {
    const col = visibleColumns.find((c) => getKey(c) === key);
    if (col) {
      fixedCols.push({ ...col, fixed: 'left' as const });
    }
  });

  const otherCols = visibleColumns.filter(
    (col) => !fixedColumnKeys.value.includes(getKey(col))
  );

  return [...fixedCols, ...otherCols];
});

// 隐藏列变更处理
function onHiddenColumnsChange(checkedValue: any) {
  hiddenColumnKeys.value = checkedValue as string[];
}

// 隐藏/取消隐藏全部列
function hideAllColumns() {
  if (hiddenColumnKeys.value.length === hideableColumnOptions.value.length) {
    // 已全选，取消全选
    hiddenColumnKeys.value = [];
  } else {
    // 隐藏全部可选列
    hiddenColumnKeys.value = hideableColumnOptions.value.map(opt => opt.value);
  }
}

// 表格滚动高度 - 动态获取容器高度
const tableWrapRef = ref<HTMLElement | null>(null);
const schTableScrollY = ref(300);

// 根据可见列动态计算表格滚动宽度
const schTableScrollX = computed(() => {
  const totalWidth = displayColumns.value.reduce((sum, col) => {
    const w = (col.width as number) || 120;
    return sum + w;
  }, 0);
  // 如果总宽度较小，不需要横向滚动，返回 undefined 让表格自适应
  return totalWidth > 600 ? totalWidth : undefined;
});

const schTableScroll = computed(() => ({
  x: schTableScrollX.value,
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

// ========== 计算生产数/采购数：仓库可用 - 需求量 >= 0 则为0，否则取绝对值 ==========
function calculateProduceQty(needQty: number, avail: number): number {
  const diff = avail - needQty;
  return diff >= 0 ? 0 : Math.abs(diff);
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
      item.purchaseQty = calculateProduceQty(item.needQty || 0, item.avail || 0);
      item.produceQty = 0;
    } else {
      item.produceQty = calculateProduceQty(item.needQty || 0, item.avail || 0);
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

// ========== 排产分析交货日期变化时同步到最终生产交期 ==========
watch(
  () => schedulingForm.deliveryDate,
  (newDate) => {
    if (newDate) {
      reviewForm.finalDate = dayjs(newDate);
    }
  }
);

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
  // 清空车间时，工序名称也一并清空
  if (value) {
    originalItem.process = value.substring(0, 2);
  } else {
    originalItem.process = '';
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
          item.purchaseQty = calculateProduceQty(demandQty, item.avail || 0);
        } else {
          item.produceQty = calculateProduceQty(demandQty, item.avail || 0);
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
      name: record.品名 || '',
      source: record.来源 || '',
      produceQty: record.来源 === '自制' ? calculateProduceQty(demandQty, _avail) : 0,
      purchaseQty: record.来源 !== '自制' ? calculateProduceQty(demandQty, _avail) : 0,
      loss,
      rowNum: rowCounter,
      spec: record.规格 || '',
      partNo: record.货号 || '',
      usage: cumulativeUsage,
      unit: record.单位 || '',
      process: record.工序名称 || '',
      workshop: record.工序车间 || '',
      warehouse: record.仓库名称 || '',
      stock: _stock,
      transit: _transit,
      wip: _wip,
      max: record.库存上限 !== undefined && record.库存上限 !== '' ? Number(record.库存上限) : 0,
      min: _min,
      avail: _avail,
      attr: record.产品属性 || '',
      needQty: demandQty,
      remark: record.备注 || '',
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
      item.purchaseQty = calculateProduceQty(demandQty, item.avail || 0);
    } else {
      item.produceQty = calculateProduceQty(demandQty, item.avail || 0);
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
  sc.商品属性 = item.attr || '';
  sc.货号 = item.partNo || `TEMP-${index}`;
  sc.品名 = item.name || '';
  sc.规格 = item.spec || '';
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

    // 校验：生产数>0 的节点必须选择工序车间（不能为空或"-"）
    const missingWorkshop = flatItems.filter(
      item => item.produceQty > 0 && (!item.workshop || item.workshop === '-' || item.workshop.trim() === '')
    );
    if (missingWorkshop.length > 0) {
      const names = missingWorkshop.map(i => i.partNo || i.key).slice(0, 3).join('、');
      const tip = missingWorkshop.length > 3 ? `等${missingWorkshop.length}条` : '';
      message.warning(`以下货号，请选择合适的车间：${names}${tip}`);
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
        // const oldTotal = Number(existing.工单总数) || 0;
        // const addTotal = Number(newSc.工单总数) || 0;
        // newSc.工单总数 = String(oldTotal + addTotal);
        // const oldWip = Number(existing.在产数量) || 0;
        // const addWip = Number(newSc.在产数量) || 0;
        // newSc.在产数量 = String(oldWip + addWip);
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
      detail.品名 = item.品名 || '';
      detail.规格 = item.规格 || '';
      // 关联主表自身编号
      const no = mainNoMap.get(item.货号 || '');
      if (no) detail.父级编号 = no;
      // 关联外产BOM的分析单号 + 编号（从已保存的BOM返回值中按货号匹配，不查库）
      const analysisNo = bomAnalysisNoMap.get(item.货号 || '');
      if (analysisNo) detail.分析单号 = analysisNo;
      // 明细编号直接取外产BOM对应的编号，使两表通过编号强关联
      const bomId = bomIdMap.get(item.货号 || '');
      if (bomId) detail.编号 = bomId;
      // 工单单号由后端在保存明细表时赋值，此处不赋值
      detail.交货日期 = schedulingForm.deliveryDate || dayjs().format('YYYY-MM-DD');
      const qty = mergedQtyMap.get(item.货号 || '') || 0;
      // // // 入库数由其他表关联，暂不操作（当前固定为 0）
      //  const 入库数 = 0;
      detail.生产数 = String(qty);
      // detail.入库数 = String(入库数);
      // detail.待产数 = String(Math.max(0, qty - 入库数));
      return detail;
    });

    if (detailList.length > 0) {
      await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlDetailList(detailList);
    }

    // 构建 编号 -> 生产数 映射，用于按父级编号取生产数
    const bomProduceMap = new Map<string, string>();
    (savedBomList || []).forEach((b: any) => {
      if (b.编号) bomProduceMap.set(b.编号, b.生产数);
    });

    // 来源编号统一取整棵 BOM 最顶层根节点的编号（savedBomList 第一条即根）
    const rootBomNo = (savedBomList && savedBomList.length > 0) ? (savedBomList[0].编号 || '') : '';

    // ========== 保存外产领料：基于外产BOM数据，编号/货号直接赋值 ==========
    const pickMaterialList = (savedBomList || []).map((b: any) => {
      const pick = new ExternalProductionPickMaterial();
      pick.编号 = b.编号;            // 直接取外产BOM的编号
      pick.货号 = b.货号;            // 直接取外产BOM的货号
      pick.分析单号 = b.分析单号;    // 关联外产BOM的分析单号
      pick.父级编号 = b.父级编号;    // 父级编号取自外产BOM
      pick.来源编号 = rootBomNo;     // 来源编号 = 整棵BOM最顶层根节点的编号

      // 生产数：按父级编号去外产BOM中找到编号等于父级编号的记录，取其生产数
      // 用量：取外产BOM中相同编号（自身）的用量
      // 需求量 = 父级生产数 × 自身用量
      const parentProduce = b.父级编号 ? (Number(bomProduceMap.get(b.父级编号)) || 0) : 0;
      const usage = Number(b.用量) || 0;
      pick.需求量 = parentProduce > 0 ? String(Math.ceil(parentProduce * usage)) : '';
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
      wh.入库数量="0";
      wh.分析单号 = item.分析单号;   // 关联明细的分析单号
      // 入库数量不赋值
      return wh;
    });
    if (warehousingList.length > 0) {
      await externalProductionService.addOrUpdateExternalProductionWarehousingList(warehousingList);
    }

    // ========== 保存外产生产：基于外产BOM数据，编号/货号直接赋值 ==========
    // const externalProductionList = productionNodes.map(item => {
    //   const ep = new ExternalProduction();
    //   ep.合同号 = schedulingProduct.orderNo || '';
    //   ep.货号 = item.partNo || '';
    //   ep.排产编号 = props.record?.排产编号 || '';
    //   ep.需求量 = String(item.needQty || 0);
    //   ep.生产数量 = String(item.produceQty || 0);
    //   return ep;
    // });

    // await externalProductionService.addOrUpdateExternalProductionList(externalProductionList);

    const bomCount = savedBomList?.length || 0;
    message.success(`已保存 ${salesControlList.length} 条到工单销控表，${detailList.length} 条明细，${bomCount} 条BOM数据，${pickMaterialList.length} 条领料，${warehousingList.length} 条入库`);
  } catch (error) {
    console.error('保存分析失败:', error);
    message.error('保存分析失败，请稍后重试');
  } finally {
    schSaveLoading.value = false;
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

    const buildBOM = (item: ProductionItem, parentPartNo: string, visible: boolean) =>
      new ExternalProductionBOM({
        货号: item.partNo || '',
        层: String(item.level),
        品名: item.name || '',
        规格: item.spec || '',
        父级编号: parentPartNo,
        用量: String(item.usage || ''),
        仓库名称: item.warehouse || '',
        仓库数: String(item.stock || ''),
        // 仅可见且生产数>0 的节点才保存生产数，否则为 null
        生产数: ((visible && Number(item.produceQty) > 0) ? String(item.produceQty) : null) as any,
        交货日期: schedulingForm.deliveryDate || '',
      });

    const traverse = (items: ProductionItem[], parentPartNo: string, parentVisible: boolean) => {
      for (const item of items) {
        const partNo = item.partNo || '';
        const visible = parentVisible;
        if (partNo && !savedPartNoSet.has(partNo)) {
          savedPartNoSet.add(partNo);
          bomList.push(buildBOM(item, parentPartNo, visible));
        }
        if (item.children && item.children.length > 0) {
          // 子节点可见的前提：当前节点可见且当前节点已展开
          const childVisible = visible && schExpandedKeys.value.includes(item.key);
          traverse(item.children, partNo, childVisible);
        }
      }
    };
    traverse(schDataSource.value, '', true);

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

    // 如果线圈货号已修改，从后端返回的根节点（第0层）更新头部品名和规格
    if (isCoilModified.value && bomData.length > 0) {
      const rootNode = bomData.find((item: any) => Number(item.层) === 0) || bomData[0];
      if (rootNode) {
        schedulingProduct.productName = rootNode.品名 || schedulingProduct.productName;
        schedulingProduct.spec = rootNode.规格 || schedulingProduct.spec;
      }
    }

    const treeData = buildTreeFromData(bomData, schedulingProduct.qty);
    schDataSource.value = treeData;
    selectedLevel.value = 1;
    selectedRowKey.value = '';          // 切换数据时清空选中行
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
  // 关闭页面时退出全屏，下次打开不保留全屏状态
  if (!val) {
    isSchedulingFullscreen.value = false;
  }
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
      reviewForm.specialRequirement = props.record?.特殊要求 || '';

      // 排产分析初始化
      schedulingProduct.partNo = props.record.货号 || '';
      schedulingProduct.productName = props.record.中文品名 || '';
      schedulingProduct.spec = props.record.中文规格 || '';
      schedulingProduct.qty = Number(props.record.数量) || 1;
      schedulingProduct.orderNo = props.record.合同号 || '';
      schedulingForm.deliveryDate = undefined;

      showSchedulingPanel.value = false;
      loadWorkshopOptions();
      nextTick(() => updateTableScrollY());

      // 加载企业微信部门列表（重新加载，确保每次打开都刷新最新部门/用户数据）
      schedulingSelectedUserIds.value = [];
      schedulingSelectedUsers.value = [];
      showUserSelector.value = false;
      orgSelectorRef.value?.clearSelection();
      orgSelectorRef.value?.loadDepartments();
      orgSelectorRef.value?.loadAllUsers();

      // 如果记录中已有排产用户，尝试自动匹配并预选
      initPreselectedUsers();
    } else {
      showSchedulingPanel.value = false;
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

.drawer-body:has(.right-panel.collapsed) {
  justify-content: center;
}

/* ========== 左侧面板 ========== */
.left-panel {
  flex: 0 0 auto;
  width: 400px;
  max-width: 400px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
  padding-right: 4px;
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.left-panel.collapsed {
  flex: 1;
  max-width: 680px;
  min-width: 400px;
  margin: 0 auto;
}

/* 全屏时隐藏折叠箭头，避免误触导致页面空白，退出全屏用全屏按钮 */
.drawer-body.scheduling-fullscreen .sch-collapse-icon {
  display: none;
}

/* 排产分析单详情全屏占满，整页覆盖半透明黑色遮罩（放大图片的灯箱效果） */
.drawer-body.scheduling-fullscreen {
  position: relative;
}

.drawer-body.scheduling-fullscreen .left-panel {
  display: none;
}

.drawer-body.scheduling-fullscreen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 10;
  pointer-events: none;
}

.drawer-body.scheduling-fullscreen .right-panel {
  position: relative;
  z-index: 20;
  flex: 1;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 全屏时隐藏底部操作栏（提示文字、取消/提交按钮）和公式提示 */
.drawer-body.scheduling-fullscreen .footer-bar,
.drawer-body.scheduling-fullscreen .scheduling-formula-bar {
  display: none;
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
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.right-panel.collapsed {
  flex: 0 0 60px;
  min-width: 60px;
  max-width: 64px;
  background: linear-gradient(135deg, #f8fafc 0%, #e8eef5 100%);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(30, 58, 95, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 折叠态：箭头 + 文字 */
.scheduling-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
  color: #1e3a5f;
  font-size: 14px;
  font-weight: 600;
  user-select: none;
  transition: all 0.25s ease;
}

.scheduling-toggle:hover {
  color: #1890ff;
  transform: scale(1.05);
}

.toggle-arrow {
  font-size: 24px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.25s ease;
}

.scheduling-toggle:hover .toggle-arrow {
  transform: translateY(5px);
}

.toggle-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 3px;
  white-space: nowrap;
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.info-card :deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 18px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  border-bottom: none;
}

.info-card :deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
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
  animation: fadeInSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeInSlideIn {
  from {
    opacity: 0;
    transform: translateX(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
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

/* 排产分析单标题栏（标题+刷新按钮） */
.sch-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sch-title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sch-title-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sch-collapse-icon {
  cursor: pointer;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.sch-collapse-icon:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.sch-card-title .ant-btn-link {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  padding: 0 4px;
  height: auto;
}

.sch-card-title .ant-btn-link:hover {
  color: #fff;
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

/* 隐藏列按钮 */
.hide-column-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f5ff;
  border-color: #b3d8ff;
  color: #1890ff;
  font-size: 13px;
}

.hide-column-btn:hover {
  background: #e6f0ff !important;
  border-color: #69b1ff !important;
  color: #0958d9 !important;
}

/* 隐藏列下拉面板 */
.hide-column-dropdown {
  padding: 10px 12px;
  min-width: 180px;
  max-height: 360px;
  overflow-y: auto;
  background: #fff;
}

.hide-column-header {
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.hide-column-check-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hide-column-item {
  padding: 3px 0;
}

.hide-column-item :deep(.ant-checkbox-wrapper) {
  font-size: 13px;
  color: #434343;
}

.hide-column-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
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
  gap: 22px;
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

/* 预设排产用户展示区 */
.preset-user-display {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 8px 0;
}

/* 选择器返回栏 */
.user-selector-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.user-selector-header .back-btn {
  color: #1890ff;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
}

.user-selector-header .back-btn:hover {
  color: #0958d9;
}

.header-title {
  font-size: 13px;
  font-weight: 500;
  color: #595959;
}

.preset-user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-user-tags .ant-tag {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 4px;
}

.preset-user-action {
  text-align: right;
}

.preset-user-action .ant-btn-link {
  font-size: 13px;
  color: #1890ff;
}

.cancel-change-hint {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
  text-align: center;
}

/* ========== 核心校验紧凑卡片 ========== */
.verify-card-compact :deep(.ant-card-body) {
  padding: 10px 14px;
}

/* ========== 左侧卡片通用样式 ========== */
.left-card :deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 14px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  border-bottom: none;
}

.left-card :deep(.ant-card-head-title) {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
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

/* 线圈货号搜索行布局 */
.coil-search-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.coil-search-row :deep(.ant-input) {
  border-radius: 6px;
}
</style>
