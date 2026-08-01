<template>
  <a-drawer
    :open="visible"
    @update:open="handleVisibleUpdate"
    placement="right"
    :width="drawerWidth"
    :body-style="{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }"
    :mask="true"
    :mask-closable="false"
    :destroy-on-close="false"
    :class="['review-detail-drawer', { 'scheduling-fullscreen-mode': isSchedulingFullscreen }]"
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
              <a-button
                v-if="canChangeSchedulingUser"
                type="link"
                size="small"
                @click="showUserSelector = true"
              >
                <SwapOutlined /> 更换用户
              </a-button>
              <a-tooltip v-else title="已提交评审，排产用户不可再修改">
                <span class="readonly-hint">
                  <LockOutlined /> 已锁定
                </span>
              </a-tooltip>
            </div>
          </div>

          <!-- 无预设用户 且 组织架构加载失败：显示手动输入框 -->
          <div v-else-if="!hasPresetSchedulingUser && orgLoadFailed" class="manual-user-input-wrap">
            <a-alert
              class="manual-user-alert"
              type="warning"
              show-icon
              :message="orgLoadErrorMessage || '组织架构加载失败'"
              description="无法从企业微信拉取部门/人员信息，请手动输入排产用户名（提交后将以该用户名作为排产用户）。"
            />
            <a-input
              v-model:value="manualSchedulingUser"
              placeholder="请输入排产用户名"
              allow-clear
              :maxlength="50"
              :disabled="!canChangeSchedulingUser"
            />
            <div v-if="!canChangeSchedulingUser" class="readonly-hint-inline">
              <LockOutlined /> 已提交评审，排产用户已锁定
            </div>
          </div>

          <!-- 无预设用户 或 点击更换后：显示选择器 -->
          <div v-else class="user-selector-wrap">
            <div
              v-if="hasPresetSchedulingUser && showUserSelector && canChangeSchedulingUser"
              class="user-selector-header"
            >
              <a-button type="text" size="small" class="back-btn" @click="cancelUserChange">
                <LeftOutlined /> 返回
              </a-button>
              <span class="header-title">重新选择排产用户</span>
            </div>
            <div class="user-selector-inner" :class="{ 'is-readonly': !canChangeSchedulingUser }">
              <OrgUserSelector
                ref="orgSelectorRef"
                v-model:selectedUserIds="schedulingSelectedUserIds"
                :multiple="false"
                :maxTableHeight="'260px'"
                @userSelect="onSchedulingUserSelect"
                @deptLoadFailed="onOrgDeptLoadFailed"
                @deptLoadSuccess="onOrgDeptLoadSuccess"
              />
              <div v-if="!canChangeSchedulingUser" class="user-selector-mask">
                <LockOutlined class="user-selector-mask-icon" />
                <span>已提交评审，排产用户已锁定</span>
              </div>
            </div>
            <div
              v-if="hasPresetSchedulingUser && showUserSelector && canChangeSchedulingUser"
              class="cancel-change-hint"
            >
              <a-button type="text" size="small" @click="cancelUserChange">
                恢复默认用户
              </a-button>
            </div>
          </div>
        </a-card>

        <!-- 核心要素校验 -->
        <a-card title="核心要素校验" :bordered="false" class="info-card verify-card-compact left-card">
          <div class="verify-card-inner" :class="{ 'is-readonly': !canChangeSchedulingUser }">
            <div class="coil-search-row">
              <SearchSelect
                v-model:value="reviewForm.coilItemNo"
                :columns="coilColumns"
                :search="searchCoils"
                value-field="value"
                :dropdown-width="650"
                :max-height="220"
                placeholder="线圈货号进行系统反查"
                :disabled="validatingCoil || !canChangeSchedulingUser"
                style="flex: 1"
                @select="onCoilSelected"
              />
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
            <!-- 提交评审后整卡锁定：遮罩覆盖在卡片内容上，统一表达锁定状态 -->
            <div v-if="!canChangeSchedulingUser" class="user-selector-mask">
              <LockOutlined class="user-selector-mask-icon" />
              <span>已提交评审，核心要素校验已锁定</span>
            </div>
          </div>
        </a-card>

        <!-- 评审结论 -->
        <a-card title="评审结论" :bordered="false" class="info-card review-conclusion-card left-card">
          <div class="review-conclusion-inner" :class="{ 'is-readonly': !canChangeSchedulingUser }">
            <a-form layout="vertical" class="review-form-compact review-form-fill">
              <a-row :gutter="16">
                <a-col :xs="24" :sm="12">
                  <a-form-item label="最终生产交期" required>
                    <a-date-picker
                      v-model:value="reviewForm.finalDate"
                      style="width: 100%"
                      :disabled="showSchedulingPanel || reviewSubmitted"
                    />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12">
                  <a-form-item label="评审结果">
                    <a-radio-group
                      v-model:value="reviewForm.resultStatus"
                      button-style="solid"
                      class="w-full"
                      :disabled="showSchedulingPanel || reviewSubmitted"
                    >
                      <a-radio-button value="pass" class="half-width pass-radio">通过</a-radio-button>
                      <a-radio-button value="reject" class="half-width reject-radio">驳回</a-radio-button>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="评审备注" class="remark-item" :required="reviewForm.resultStatus === 'reject'">
                <a-textarea
                  v-model:value="reviewForm.remark"
                  :placeholder="reviewForm.resultStatus === 'reject' ? '驳回时评审备注为必填项，请说明驳回原因...' : '请输入评审意见或异常说明...'"
                  :auto-size="{ minRows: 3, maxRows: 8 }"
                  :disabled="showSchedulingPanel || reviewSubmitted"
                />
              </a-form-item>
            </a-form>
            <!-- 提交评审后整卡锁定：遮罩覆盖在 form 上方，
                 让\"最终生产交期/评审结果/评审备注\"控件不再依赖单独的灰显样式，
                 视觉上整卡片被锁定标识统一表达 -->
            <div v-if="!canChangeSchedulingUser" class="user-selector-mask">
              <LockOutlined class="user-selector-mask-icon" />
              <span>已提交评审，评审结论已锁定</span>
            </div>
          </div>
        </a-card>

        <!-- 左侧折叠态底部操作栏（提交评审后隐藏） -->
        <div v-if="!showSchedulingPanel && !reviewSubmitted" class="footer-bar left-footer">
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

      <!-- 右侧：排产分析单详情（未展开时不渲染，避免右侧出现空白占位条） -->
      <div v-if="showSchedulingPanel || reviewSubmitted" class="right-panel" :class="{ expanded: showSchedulingPanel }">
      <!-- 展开态：排产分析单详情（排产分析入口已改为由提交评审结果打开） -->
      <template v-if="showSchedulingPanel || reviewSubmitted">
        <a-spin :spinning="schedulingLoading" tip="加载排产分析数据...">
          <CommonTable
            card-class="scheduling-card"
            :columns="rawColumns"
            :data-source="filteredSchDataSource"
            storage-key="review-detail-scheduling-column-settings"
            :loading="schedulingLoading"
            :pagination="false"
            row-key="key"
            :auto-scroll-x="true"
            :auto-scroll-y="true"
            table-wrapper-class="scheduling-table-wrap"
            :expand-icon-column-index="1"
            :indent-size="20"
            :expanded-row-keys="schExpandedKeys"
            v-model:selected-row-key="selectedRowKey"
            :row-click-select="false"
            :custom-row="(record: any) => ({
              onClick: (e: MouseEvent) => handleRowClick(record, e),
              onContextmenu: (e: MouseEvent) => handleRowContextMenu(record, e)
            })"
            v-model:fullscreen="isSchedulingFullscreen"
            :overlay="false"
            @expand="(expanded: boolean, record: any) => handleSchExpand(expanded, record)"
            @refresh="loadSchedulingData"
          >
            <template #title>
              <div class="sch-card-title">
                <span class="sch-title-left">
                  <LeftOutlined v-if="!reviewSubmitted" class="sch-collapse-icon" @click="toggleSchedulingPanel" />
                  <span>排产分析单详情</span>
                </span>
              </div>
            </template>
            <template #top>
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
                    <a-button type="primary" @click="handleSchExpandAll">
                      <template #icon><FolderOpenOutlined /></template>
                      全部展开
                    </a-button>
                    <a-button type="primary" @click="handleSchCollapseAll">
                      <template #icon><FolderOutlined /></template>
                      全部收缩
                    </a-button>
                    <a-button type="primary" @click="handleSchSave" :loading="schSaveLoading">
                      <template #icon><SaveOutlined /></template>
                      保存分析
                    </a-button>
                  </div>
                </div>
              </div>
              </div>
            </template>

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
              <template v-if="column.dataIndex === 'levelIndex'">
                <span class="level-index-text">{{ record.levelIndex }}</span>
              </template>
              <template v-if="column.key === 'partNo'">
                <span class="partno-text">{{ record.partNo || '' }}</span>
              </template>
              <template v-if="column.key === 'name'">
                <span class="product-text">{{ record.name }}</span>
              </template>
              <template v-if="column.key === 'spec'">
                <a-tooltip :title="record.spec || record.unit || ''" placement="topLeft">
                  <span class="spec-text">{{ record.spec || record.unit || '' }}</span>
                </a-tooltip>
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

            <template #bottom>
              <!-- 公式提示 -->
              <div class="scheduling-formula-bar">
                <SettingOutlined />
                <span>需求量 = 成品数量 × 累计用量 × (1+损耗)</span>
              </div>
            </template>
          </CommonTable>

          <!-- 右键菜单（原生定位，稳定可靠） -->
          <div
            v-if="contextMenuVisible"
            class="sch-row-context-menu"
            :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
            @click.stop
          >
            <div
              class="ctx-menu-item"
              :class="{ 'is-disabled': !rightClickRowKey }"
              @click="onCtxAddChild"
            >
              <PlusOutlined /> 新增子级
            </div>
            <div
              class="ctx-menu-item"
              :class="{ 'is-disabled': !rightClickRowKey }"
              @click="onCtxDelete"
            >
              <DeleteOutlined /> 删除选中
            </div>
            <div
              class="ctx-menu-item"
              :class="{ 'is-disabled': !rightClickRowKey }"
              @click="onCtxDeleteRoot"
            >
              <DeleteOutlined /> 删除根节点
            </div>
          </div>
          <!-- 右键菜单关闭遮罩 -->
          <div
            v-if="contextMenuVisible"
            class="ctx-menu-mask"
            @click="closeContextMenu"
            @contextmenu.prevent="closeContextMenu"
          ></div>

          <a-modal
            v-model:open="addChildModalVisible"
            title="新增子级物料"
            ok-text="新增"
            cancel-text="取消"
            :mask-closable="false"
            :confirm-loading="addChildLoading"
            @ok="handleAddChild"
          >
            <a-form layout="vertical">
              <a-form-item label="货号" required>
                <SearchSelect
                  v-model:value="addChildForm.partNo"
                  :columns="productDataColumns"
                  :search="searchProductData"
                  value-field="value"
                  :dropdown-width="560"
                  :max-height="380"
                  placeholder="输入货号模糊查询产品资料"
                  @select="onChildProductSelected"
                />
              </a-form-item>
              <a-form-item label="品名">
                <a-input v-model:value="addChildForm.name" placeholder="请输入品名" />
              </a-form-item>
              <a-form-item label="规格">
                <a-input v-model:value="addChildForm.spec" placeholder="请输入规格" />
              </a-form-item>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="来源">
                    <div class="add-child-source-text">{{ addChildForm.source || '--' }}</div>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="用量" required>
                    <a-input-number v-model:value="addChildForm.usage" :min="0" :precision="4" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="单位">
                <a-input v-model:value="addChildForm.unit" placeholder="例如：个、件、米" />
              </a-form-item>
            </a-form>
          </a-modal>
        </a-spin>

        <!-- 底部操作栏（提交评审后隐藏） -->
        <div v-if="!reviewSubmitted" class="footer-bar">
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
import { ref, reactive, watch, computed, nextTick } from 'vue';
import { message, Modal, Grid } from 'ant-design-vue';
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
  PlusOutlined,
  LeftOutlined,
  SwapOutlined,
  LockOutlined,
} from '@ant-design/icons-vue';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { bomStructureProcessService } from '@/services/bomStructureProcessService';
import { type WeChatUser } from '@/services/wechatWorkService';
import { PMCRequestDto, PMCDeliveryReview, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail, ExternalProductionBOM, ExternalProductionPickMaterial, ExternalProductionWarehousing, ExternalProductionShipment } from '@/api-generated/api';
import { columns as rawColumns } from './types';
import CommonTable from '@/components/CommonTable.vue';
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
  levelIndex?: string;
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
  pickedQty?: number;
  remark?: string;
  /** 中间件（0/1 标记） */
  mid?: number | string;
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

// ========== 排产分析面板展开/折叠状态 ==========
const showSchedulingPanel = ref(false);
// 是否已经点击过"提交评审结果"（进入排产分析流程后隐藏取消/提交按钮）
const reviewSubmitted = ref(false);

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
const productDataColumns: SearchSelectColumn[] = [
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

// 新增子级时的产品资料模糊查询（复用线圈查询的下拉控件）
async function searchProductData(keyword: string): Promise<Record<string, any>[]> {
  const data = await deliveryReviewService.searchProductDataByKeyword(
    new PMCRequestDto({ 货号: keyword.trim() })
  );
  const list = Array.isArray(data) ? data : [];
  return list.map((item: any) => {
    const partNo = item?.货号 || item?.value || '';
    const name = item?.中文品名 || item?.name || item?.产品名称 || '';
    const spec = item?.中文规格 || item?.spec || item?.规格 || '';
    const source = item?.制造方式 || item?.来源 || '';
    return { value: partNo, 中文品名: name, 中文规格: spec, 制造方式: source };
  });
}

// 选中产品资料后回填子级基础信息
function onChildProductSelected(row: Record<string, any>) {
  const partNo = String(row.value ?? '');
  const parent = findItemByKey(schDataSource.value, addChildParentKey.value);
  if (parent && hasDirectChildPartNo(parent.children || [], partNo)) {
    addChildForm.partNo = '';
    Modal.warning({
      title: '货号已存在',
      content: `货号“${partNo}”已存在于当前节点的直接子级中，请选择其他货号。`,
    });
    return;
  }
  addChildForm.partNo = partNo;
  addChildForm.name = String(row.中文品名 ?? '');
  addChildForm.spec = String(row.中文规格 ?? '');
  addChildForm.source = String(row.制造方式 ?? '');
}

// ========== 排产用户选择（企业微信） ==========
const schedulingSelectedUserIds = ref<string[]>([]);
const schedulingSelectedUsers = ref<WeChatUser[]>([]);
const orgSelectorRef = ref<InstanceType<typeof OrgUserSelector>>();
const showUserSelector = ref(false);
// 组织架构（部门列表）是否加载失败：true 时在无默认用户场景下显示手动输入框
const orgLoadFailed = ref(false);
const orgLoadErrorMessage = ref<string>('');
// 手动输入的排产用户名（仅在 orgLoadFailed 且无默认用户时使用）
const manualSchedulingUser = ref<string>('');

// 是否有预设排产用户（来自主表 record）
const hasPresetSchedulingUser = computed(() => {
  return props.record?.排产用户 && props.record.排产用户.trim() !== '';
});

// 排产用户卡片是否仍可变更：
// 一旦点击"提交评审结果"进入排产分析流程（showSchedulingPanel 或 reviewSubmitted）即锁定，
// 与"评审结论"中最终生产交期 / 评审结果的 disabled 逻辑保持一致。
const canChangeSchedulingUser = computed(() => {
  return !showSchedulingPanel.value && !reviewSubmitted.value;
});

// 预设排产用户名称列表
const presetUserNames = computed(() => {
  if (!hasPresetSchedulingUser.value) return [];
  return props.record?.排产用户?.split(/[,，]/).map(n => n.trim()).filter(Boolean) ?? [];
});

// 计算当前评审对应的排产用户（已手动选择优先，否则取主表预设；无默认且加载失败时取手动输入）
function getSchedulingUserName(): string {
  // 1. 优先：手动从组织架构选中的用户
  if (schedulingSelectedUsers.value.length > 0) {
    return schedulingSelectedUsers.value.map(u => u.name).join(',');
  }
  // 2. 次之：主表预设的排产用户
  if (hasPresetSchedulingUser.value) {
    return presetUserNames.value.join(',');
  }
  // 3. 组织架构加载失败时的手动输入
  if (orgLoadFailed.value && manualSchedulingUser.value.trim()) {
    return manualSchedulingUser.value.trim();
  }
  return '';
}

// 组织架构部门列表加载失败的回调（由 OrgUserSelector 触发）
function onOrgDeptLoadFailed(errorMessage: string) {
  orgLoadFailed.value = true;
  orgLoadErrorMessage.value = errorMessage || '加载组织架构失败';
}

// 组织架构部门列表加载成功的回调
function onOrgDeptLoadSuccess() {
  orgLoadFailed.value = false;
  orgLoadErrorMessage.value = '';
}

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
    return false;
  }
  validatingCoil.value = true;
  verifyStatus.value = 'none';
  try {
    const result = await deliveryReviewService.checkIsExistInAssemblyList(
      new PMCRequestDto({ 线圈货号: reviewForm.coilItemNo })
    );
    if (result) {
      verifyStatus.value = 'success';
      return true;
    } else {
      verifyStatus.value = 'error';
      return false;
    }
  } catch {
    verifyStatus.value = 'error';
    return false;
  } finally {
    validatingCoil.value = false;
  }
};

// ========== 提交评审 ==========
// 真正提交评审结果到后端
const doSubmitReview = async () => {
  const mappedStatus = reviewForm.resultStatus === 'pass' ? '评审通过' : '评审驳回';
  const { 编号, 用户编号, 合同号, 排产编号, 中文品名, 中文规格, 分析单号, 来源编号, 来源, 工单单号, 电压, 数量, 生产类型 } = props.record!;
  const 排产用户 = getSchedulingUserName();

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

  await deliveryReviewService.addPMCDeliveryReview(reviewData);
  return mappedStatus;
};

// 点击"提交评审结果"：根据评审结果分两种情况处理
const submitReview = async () => {
  const isCoilValid = await validateCoil();
  if (!isCoilValid) {
    message.error('线圈货号未经验证或验证不通过，无法提交评审！');
    return;
  }
  // 校验排产用户：组织架构中选择 / 主表预设 / 组织架构加载失败时手动输入 三者至少有一个
  const hasManualUser = orgLoadFailed.value && manualSchedulingUser.value.trim().length > 0;
  if (
    schedulingSelectedUsers.value.length === 0
    && !hasPresetSchedulingUser.value
    && !hasManualUser
  ) {
    message.warning(
      orgLoadFailed.value
        ? '组织架构加载失败，请手动输入排产用户名'
        : '请选择排产用户'
    );
    return;
  }
  // 驳回时评审备注必填
  if (reviewForm.resultStatus === 'reject' && !reviewForm.remark.trim()) {
    message.error('驳回时评审备注为必填项，请说明驳回原因');
    return;
  }

  // 驳回：直接执行原提交接口（旧逻辑），不打开排产分析
  if (reviewForm.resultStatus === 'reject') {
    confirmLoading.value = true;
    try {
      const mappedStatus = await doSubmitReview();
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
    return;
  }

  // 通过：打开排产分析页面，提交动作延后到保存分析之后
  reviewSubmitted.value = true;
  showSchedulingPanel.value = true;

  // 展开排产分析时：交货日期默认同步最终生产交期
  schedulingForm.deliveryDate = reviewForm.finalDate
    ? dayjs(reviewForm.finalDate).format('YYYY-MM-DD')
    : undefined;

  // 线圈货号已修改且校验通过时，替换货号括号内线圈货号部分作为请求参数
  if (isCoilModified.value) {
    schedulingProduct.partNo = buildModifiedPartNo(props.record?.货号 || '', reviewForm.coilItemNo.trim());
  }

  loadSchedulingData();
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

// 监听 selectedLevel 变化：切换层数后重新计算层序号
watch(selectedLevel, () => {
  reassignLevelIndex(schDataSource.value);
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

// ========== 右键菜单 ==========
const contextMenuVisible = ref(false);
const contextMenuPosition = reactive({ x: 0, y: 0 });
const rightClickRowKey = ref<string>('');
const addChildModalVisible = ref(false);
const addChildLoading = ref(false);
const addChildParentKey = ref<string>('');
const addChildForm = reactive({
  partNo: '',
  name: '',
  spec: '',
  source: '',
  usage: 1,
  unit: '',
});
// 用户编辑或清空货号时，不保留上一条产品资料的基础字段；仅在下拉选中后由 onChildProductSelected 回填。
watch(
  () => addChildForm.partNo,
  () => {
    addChildForm.name = '';
    addChildForm.spec = '';
    addChildForm.source = '';
  },
  { flush: 'sync' }
);

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

// 右键菜单处理
function handleRowContextMenu(record: ProductionItem, e: MouseEvent) {
  e.preventDefault();
  // 先选中当前行
  selectedRowKey.value = record.key;
  rightClickRowKey.value = record.key;
  // 设置菜单位置（使用鼠标位置，并避免超出视口）
  const menuWidth = 160;
  const menuHeight = 124;
  let x = e.clientX;
  let y = e.clientY;
  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;
  contextMenuPosition.x = x;
  contextMenuPosition.y = y;
  contextMenuVisible.value = true;
}

// 关闭菜单
function closeContextMenu() {
  contextMenuVisible.value = false;
}

// 右键菜单：新增子级
function onCtxAddChild() {
  if (!rightClickRowKey.value) return;
  const parent = findItemByKey(schDataSource.value, rightClickRowKey.value);
  if (!parent) {
    message.error('未找到新增子级的父节点');
    return;
  }
  closeContextMenu();
  addChildParentKey.value = parent.key;
  Object.assign(addChildForm, {
    partNo: '',
    name: '',
    spec: '',
    source: '',
    usage: 1,
    unit: parent.unit || '',
  });
  addChildModalVisible.value = true;
}

async function handleAddChild() {
  const parent = findItemByKey(schDataSource.value, addChildParentKey.value);
  const partNo = addChildForm.partNo.trim();
  const usage = Number(addChildForm.usage);
  if (!parent) {
    message.error('未找到新增子级的父节点');
    return;
  }
  if (!partNo) {
    message.warning('请输入子级货号');
    return;
  }
  if (!addChildForm.source) {
    message.warning('请从下拉列表选择货号，以自动带出制造方式');
    return;
  }
  if (!Number.isFinite(usage) || usage <= 0) {
    message.warning('用量必须大于 0');
    return;
  }
  if (hasDirectChildPartNo(parent.children || [], partNo)) {
    Modal.warning({
      title: '货号已存在',
      content: `货号“${partNo}”已存在于当前节点的直接子级中，请选择其他货号。`,
    });
    return;
  }

  addChildLoading.value = true;
  try {
    // 新增产品资料仅提供基础字段；库存相关字段以排产分析根节点返回的数据为准。
    const analysisList = await salesControlService.getSchedulingAnalysisList(
      new PMCRequestDto({ 货号: partNo })
    );
    const inventoryData = (analysisList || []).find(item => Number(item?.层) === 0)
      || (analysisList || [])[0]
      || {};
    const toNumber = (value: unknown) => {
      const result = Number(value);
      return Number.isFinite(result) ? result : 0;
    };

    const parentWorkQty = parent.produceQty > 0 ? parent.produceQty : parent.purchaseQty;
    const needQty = Math.ceil(Math.max(0, parentWorkQty || 0) * usage);
    let maxRowNum = 0;
    const findMaxRowNum = (items: ProductionItem[]) => {
      items.forEach(item => {
        maxRowNum = Math.max(maxRowNum, item.rowNum || 0);
        if (item.children?.length) findMaxRowNum(item.children);
      });
    };
    findMaxRowNum(schDataSource.value);
    const child: ProductionItem = {
      key: generateKey('manual-child', keyCounter),
      level: parent.level + 1,
      name: addChildForm.name.trim(),
      source: addChildForm.source,
      produceQty: addChildForm.source === '自制' ? needQty : 0,
      purchaseQty: addChildForm.source === '自制' ? 0 : needQty,
      loss: 0,
      rowNum: maxRowNum + 1,
      spec: addChildForm.spec.trim(),
      partNo,
      usage,
      unit: addChildForm.unit.trim(),
      process: '',
      workshop: '',
      warehouse: String(inventoryData.仓库名称 || ''),
      stock: toNumber(inventoryData.仓库数),
      transit: toNumber(inventoryData.在途数),
      wip: toNumber(inventoryData.在产需求),
      max: 0,
      min: 0,
      avail: 0,
      attr: '',
      needQty,
      pickedQty: needQty,
      remark: '',
      // 中间件标识由排产分析接口按货号返回，表格“中间件”列会直接显示该值。
      mid: inventoryData.中间件 !== undefined && inventoryData.中间件 !== ''
        ? inventoryData.中间件
        : '',
      children: [],
    };
    if (!parent.children) parent.children = [];
    parent.children.push(child);
    if (!schExpandedKeys.value.includes(parent.key)) {
      schExpandedKeys.value.push(parent.key);
    }
    selectedRowKey.value = child.key;
    // 先重算仓库可用，再依据父级做货量计算新增子级的生产/采购数与配料数。
    updateAvailInTree(schDataSource.value);
    syncChildrenQty(parent);
    syncChildrenPickQty(parent);
    reassignLevelIndex(schDataSource.value);
    addChildModalVisible.value = false;
    message.success('已新增子级物料，并同步库存数据');
  } catch (error) {
    console.error('新增子级时获取库存数据失败:', error);
    message.error('库存数据获取失败，未新增子级物料');
  } finally {
    addChildLoading.value = false;
  }
}

// 右键菜单：删除选中
function onCtxDelete() {
  if (!rightClickRowKey.value) return;
  closeContextMenu();
  Modal.confirm({
    title: '确定要删除选中的货号吗？',
    content: '有子级物料将一并删除',
    okText: '确定',
    cancelText: '取消',
    onOk: () => handleSchDelete(),
  });
}

// 右键菜单：删除根节点
function onCtxDeleteRoot() {
  if (!rightClickRowKey.value) return;
  closeContextMenu();
  Modal.confirm({
    title: '确定要删除选中的根节点吗？',
    content: '子级物料将自动提升一级',
    okText: '确定',
    cancelText: '取消',
    onOk: () => handleSchDeleteRoot(),
  });
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

  // 展开后重新计算层序号（只对可见节点计算，未展开父级的子集不参与）
  reassignLevelIndex(schDataSource.value);

  message.success(
    materialScopeAll.value === 'all'
      ? `已分析货号【${selectedNode.partNo || '未知'}】的全部层级物料`
      : `已分析货号【${selectedNode.partNo || '未知'}】的下一层物料`
  );
}

// 保存状态
const schSaveLoading = ref(false);
const schSaveBomLoading = ref(false);

// 排产分析表格由 CommonTable 组件统一处理列设置、滚动及全屏

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
  // 展开/收起后重新计算层序号（只对可见节点计算）
  reassignLevelIndex(schDataSource.value);
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
  // 全部展开后重新计算层序号
  reassignLevelIndex(schDataSource.value);
}

function handleSchCollapseAll() {
  if (schExpandedKeys.value.length === 0) {
    message.info('当前已是全部收缩状态');
    return;
  }
  schExpandedKeys.value = [];
  // 全部收缩后重新计算层序号
  reassignLevelIndex(schDataSource.value);
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
    // 删除后整棵树按 rowNum 重新分配层序号
    reassignLevelIndex(schDataSource.value);
    message.success('已删除选中的货号及其子级物料');
  } else {
    message.error('删除失败，未找到选中的货号');
  }
}

// 重新分配层序号（按 rowNum 在同层递增），格式 "{level}-{position}"
// 严格按"序号"列动态排序，与分析/展开/遍历顺序无关
// 重要：只对"可见"节点计算（顶层 + 已展开父级的子节点），
// 未展开父级的子集不参与计算，避免折叠父级下的子集"抢占"层序号位置
// 最后替换 schDataSource.value 引用，触发 filteredSchDataSource computed 重新计算
function reassignLevelIndex(items: ProductionItem[]): void {
  // 先清空所有节点的 levelIndex（避免折叠父级的子集残留旧值）
  const clearAll = (list: ProductionItem[]) => {
    list.forEach(item => {
      item.levelIndex = undefined;
      if (item.children && item.children.length > 0) clearAll(item.children);
    });
  };
  clearAll(items);

  // 只收集"可见"节点：顶层节点 + 已展开父级（schExpandedKeys）的子节点
  const all: ProductionItem[] = [];
  const collectVisible = (list: ProductionItem[]) => {
    list.forEach(item => {
      all.push(item);
      if (item.children && item.children.length > 0 && schExpandedKeys.value.includes(item.key)) {
        collectVisible(item.children);
      }
    });
  };
  collectVisible(items);

  // 按序号升序排序，保证层序号顺序与"序号"列完全一致
  all.sort((a, b) => (a.rowNum ?? 0) - (b.rowNum ?? 0));
  // 同层内按序号顺序递增编号（跨父级共享同一计数器，全树唯一）
  const levelCounters: Map<number, number> = new Map();
  all.forEach(item => {
    const next = (levelCounters.get(item.level) || 0) + 1;
    levelCounters.set(item.level, next);
    item.levelIndex = `${item.level}-${next}`;
  });

  // 关键：替换 schDataSource.value 引用，触发 filteredSchDataSource computed 重新计算
  // （否则仅修改对象属性，Vue 不会感知，a-table 看不到新层序号）
  if (items === schDataSource.value) {
    schDataSource.value = [...items];
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
        // 重新分配层序号（提升子级后按 rowNum 重算）
        reassignLevelIndex(schDataSource.value);
        return true;
      }

      if (item.children && item.children.length > 0) {
        if (deleteRootAndPromote(item.children, targetKey)) {
          // 递归返回后也重新分配行号
          reassignRowNums(schDataSource.value);
          // 重新分配层序号
          reassignLevelIndex(schDataSource.value);
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
// 竞态保护：每次 loadSchedulingData 调用自增，await 返回后比对当前值；
// 若已被新调用覆盖则丢弃旧响应，避免“多次触发导致旧 partNo 的响应覆盖新数据”
let loadSeq = 0;
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
    const avail = schedulingForm.analysisType === 'limit' ? stock + transit - wip - min : stock + transit - wip;
    item.avail = Math.max(0, avail);
    // 仅根节点（成品，无父级）随分析模式重算生产数/采购数；
    // 子节点保留用户手动调整的值，避免切换模式时被自动重算覆盖
    if (item.level === 0) {
      if (item.source !== '自制') {
        item.purchaseQty = calculateProduceQty(item.needQty || 0, item.avail || 0);
        item.produceQty = 0;
      } else {
        item.produceQty = calculateProduceQty(item.needQty || 0, item.avail || 0);
        item.purchaseQty = 0;
      }
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
    // 分析模式变化会重算父级生产数/采购数，需同步子级
    syncAllChildrenQty(schDataSource.value);
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

// 仅检查当前节点的直接子级；孙级及更深层存在相同货号时仍允许新增。
function hasDirectChildPartNo(children: ProductionItem[], partNo: string): boolean {
  return children.some(item => item.partNo === partNo);
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
    // 损耗只影响当前行自身的需求量（needQty = 总数量 × 本行用量 × (1+本行损耗)），与子孙无关；
    // 只需重算本行的生产数/采购数，子孙保留手动值，由下方 syncChildrenQty 按父级新值联动
    const demandQty = calculateDemandQty(schedulingProduct.qty, originalItem.usage || 1, originalItem.loss || 0);
    originalItem.needQty = demandQty;
    if (originalItem.source !== '自制') {
      originalItem.purchaseQty = calculateProduceQty(demandQty, originalItem.avail || 0);
    } else {
      originalItem.produceQty = calculateProduceQty(demandQty, originalItem.avail || 0);
    }
    // 父级生产数变化后，同步其子级（递归）的配料数与生产数/采购数
    syncChildrenPickQty(originalItem);
    syncChildrenQty(originalItem);
  } else if (field === 'produceQty') {
    originalItem.produceQty = value || 0;
    // 父级生产数变化后，同步其直接子级的配料数
    syncChildrenPickQty(originalItem);
    syncChildrenQty(originalItem);
  } else if (field === 'purchaseQty') {
    originalItem.purchaseQty = value || 0;
    // 父级采购数变化后，同步其直接子级的配料数
    syncChildrenPickQty(originalItem);
    // 父级采购数变化后，同步其直接子级的生产数/采购数
    syncChildrenQty(originalItem);
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
    const _avail = Math.max(0, schedulingForm.analysisType === 'limit' ? _stock + _transit - _wip - _min : _stock + _transit - _wip);

    // 0 层，或 1 层且产品属性含“线圈”的节点：工序车间默认“包装车间”
    const isPackWorkshop = level === 0 || (level === 1 && (record.产品属性 || '').includes('线圈'));

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
      // 0 层，或 1 层且产品属性包含“线圈”的节点，工序车间默认“包装车间”，工序名称取“包装”
      process: record.工序名称 || (isPackWorkshop && !record.工序车间 ? '包装' : ''),
      workshop: record.工序车间 || (isPackWorkshop ? '包装车间' : ''),
      warehouse: record.仓库名称 || '',
      stock: _stock,
      transit: _transit,
      wip: _wip,
      max: record.库存上限 !== undefined && record.库存上限 !== '' ? Number(record.库存上限) : 0,
      min: _min,
      avail: _avail,
      attr: record.产品属性 || '',
      needQty: demandQty,
      pickedQty: 0,
      remark: record.备注 || '',
      mid: record.中间件 !== undefined && record.中间件 !== '' ? record.中间件 : '',
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

  // 注意：层序号的计算依赖 schExpandedKeys，必须在 loadSchedulingData 中
  // 设置 schExpandedKeys 之后才能调用 reassignLevelIndex

  return treeData;
}

// ========== 递归更新需求量 ==========
function updateDemandQtyInTree(items: ProductionItem[], qty: number) {
  items.forEach(item => {
    const demandQty = calculateDemandQty(qty, item.usage || 1, item.loss || 0);
    item.needQty = demandQty;
    // 仅根节点（成品）随数量重算生产数/采购数；子节点保留用户手动值，由父子联动按需覆盖
    if (item.level === 0) {
      if (item.source !== '自制') {
        item.purchaseQty = calculateProduceQty(demandQty, item.avail || 0);
      } else {
        item.produceQty = calculateProduceQty(demandQty, item.avail || 0);
      }
    }
    if (item.children && item.children.length > 0) {
      updateDemandQtyInTree(item.children, qty);
    }
  });
}

// 父级生产数/采购数变化后，同步其所有层子级的配料数（递归，与生产数联动保持一致）
// 配料数 = 父件做货量 × 子件用量（累计用量），向上取整以避免短缺
// 父件要做的量（生产数或采购数，取非 0 的那个）× 子件用量 = 配料数（与 syncChildrenQty 的毛需求保持一致）
// 注意：递归时以「当前节点自身更新后的做货量」驱动其子件配料数，保证中间节点为 0 时下层配料数也归 0。
function syncChildrenPickQty(parentItem: ProductionItem) {
  // 用 item 自身做货量逐层驱动其子件配料数
  const sync = (item: ProductionItem) => {
    const qty = (item.produceQty || 0) > 0
      ? (item.produceQty || 0)
      : (item.purchaseQty || 0);
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        child.pickedQty = Math.ceil(qty * (child.usage || 0));
        sync(child);
      });
    }
  };
  // 先用 parentItem 自身做货量驱动其直接子件，再逐层递归
  const parentQty = (parentItem.produceQty || 0) > 0
    ? (parentItem.produceQty || 0)
    : (parentItem.purchaseQty || 0);
  if (parentItem.children && parentItem.children.length > 0) {
    parentItem.children.forEach(child => {
      child.pickedQty = Math.ceil(parentQty * (child.usage || 0));
      sync(child);
    });
  }
}

// 遍历整棵树，对所有父级节点同步其直接子级的配料数（数量变化等全局联动时使用）
function syncAllChildrenPickQty(items: ProductionItem[]) {
  items.forEach(item => {
    syncChildrenPickQty(item);
    if (item.children && item.children.length > 0) {
      syncAllChildrenPickQty(item.children);
    }
  });
}

// 父级的生产数/采购数为 0 时，其所有子级对应的生产数/采购数也归 0；
// 父级"要做的量"（生产数或采购数，取非 0 的那个）变化时，所有子级按「父级量 × 子级用量」重新计算：
//   - 自制子件 → 生成生产数
//   - 外购/外协子件 → 生成采购数
// 注意：递归时以「当前节点自身更新后的做货量」驱动其子级，保证中间节点为 0 时下层联动正常归 0。
function syncChildrenQty(parentItem: ProductionItem) {
  // 用 item 自身更新后的做货量，逐层驱动其子级（递归时始终用当前节点的量，而非顶层父级）
  const sync = (item: ProductionItem) => {
    const qty = (item.produceQty || 0) > 0
      ? (item.produceQty || 0)
      : (item.purchaseQty || 0);
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        const usage = child.usage || 0;
        if (qty <= 0) {
          // 当前节点不需要生产/采购，子件的生产数与采购数都归 0
          child.produceQty = 0;
          child.purchaseQty = 0;
        } else {
          // 毛需求 = 当前节点量 × 子件用量；净需求 = 毛需求 − 子件自身可用库存
          const gross = Math.ceil(qty * usage);
          const net = Math.max(0, gross - (child.avail || 0));
          child.produceQty = child.source === '自制' ? net : 0;
          child.purchaseQty = child.source !== '自制' ? net : 0;
        }
        sync(child);
      });
    }
  };
  // 先用 parentItem 自身做货量驱动其直接子级，再逐层递归其子级
  const parentQty = (parentItem.produceQty || 0) > 0
    ? (parentItem.produceQty || 0)
    : (parentItem.purchaseQty || 0);
  if (parentItem.children && parentItem.children.length > 0) {
    parentItem.children.forEach(child => {
      const usage = child.usage || 0;
      if (parentQty <= 0) {
        child.produceQty = 0;
        child.purchaseQty = 0;
      } else {
        const gross = Math.ceil(parentQty * usage);
        const net = Math.max(0, gross - (child.avail || 0));
        child.produceQty = child.source === '自制' ? net : 0;
        child.purchaseQty = child.source !== '自制' ? net : 0;
      }
      sync(child);
    });
  }
}

// 遍历整棵树，对所有父级节点同步其直接子级的生产数/采购数（全局联动时使用）
function syncAllChildrenQty(items: ProductionItem[]) {
  items.forEach(item => {
    syncChildrenQty(item);
    if (item.children && item.children.length > 0) {
      syncAllChildrenQty(item.children);
    }
  });
}

function onSchQtyChange(newQty: number) {
  if (schDataSource.value.length > 0 && newQty >= 0) {
    updateDemandQtyInTree(schDataSource.value, newQty);
    // 数量变化会联动所有父级生产数，需重新同步各父级直接子级的配料数
    syncAllChildrenPickQty(schDataSource.value);
    // 同步各父级直接子级的生产数/采购数
    syncAllChildrenQty(schDataSource.value);
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
    const productionNodes: ProductionItem[] = [];
    const collectVisibleProductionNodes = (items: ProductionItem[], parentNeedsProduction = true) => {
      for (const item of items) {
        // 工单只有在当前节点自身、以及从根节点到其父级的生产数都大于 0 时才保存。
        // 任一父级生产数为 0，表示该分支不需要额外生产，其下所有子层级均跳过工单保存。
        const currentNeedsProduction = parentNeedsProduction && Number(item.produceQty) > 0;
        if (currentNeedsProduction) {
          productionNodes.push(item);
        }
        // 只有当前节点被展开时，才递归收集子节点（未展开=未显示在表格中）
        if (item.children && item.children.length > 0 && schExpandedKeys.value.includes(item.key)) {
          collectVisibleProductionNodes(item.children, currentNeedsProduction);
        }
      }
    };
    collectVisibleProductionNodes(schDataSource.value);

    if (productionNodes.length === 0) {
      message.warning('父级没有生产数大于0的数据可保存');
      schSaveLoading.value = false;
      return;
    }

    // 仅校验实际会保存工单的节点；父级生产数为 0 的分支无需选择工序车间
    const missingWorkshop = productionNodes.filter(
      item => !item.workshop || item.workshop === '-' || item.workshop.trim() === ''
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


    // 工单销控表明细：遍历当前主表记录，货号/品名/规格取自主表，区别仅在于交货日期与工单单号
    // 生产数/待产数取本次 BOM 的原始数量（非主表累加值），保证每次保存时记录的是当次实际数量
    const mergedQtyMap = new Map<string, number>();
    for (const node of mergedNodes) {
      const key = node.partNo || '';
      if (key) mergedQtyMap.set(key, node.produceQty > 0 ? node.produceQty : (node.needQty || 0));
    }

    // 当前评审对应的排产用户（明细与主表共用同一排产用户）
    const schedulingUser = getSchedulingUserName();

    const detailList = salesControlList.map(item => {
      const detail = new WorkOrderSalesControlDetail();
      detail.货号 = item.货号 || '';
      detail.品名 = item.品名 || '';
      detail.规格 = item.规格 || '';
      // 将对应的排产用户写入明细：优先取该货号在工单销控主表中的排产用户，
      // 再回退到本次评审选定的排产用户（主表预设），保证每条明细各持一个排产用户
      const existingSC = existingMap.get(item.货号 || '');
      detail.排产用户 = existingSC?.排产用户 || schedulingUser || props.record?.排产用户 || '';
      // 关联主表自身编号
      const no = mainNoMap.get(item.货号 || '');
      if (no) detail.父级编号 = no;
      // 关联外产BOM的分析单号 + 编号（从已保存的BOM返回值中按货号匹配，不查库）
      const analysisNo = bomAnalysisNoMap.get(item.货号 || '');
      if (analysisNo)       detail.分析单号 = analysisNo;
      // 明细编号直接取外产BOM对应的编号，使两表通过编号强关联
      const bomId = bomIdMap.get(item.货号 || '');
      if (bomId) detail.编号 = bomId;
      // 将当前评审对应的排产编号写入明细，方便按排产编号关联查询
      detail.排产编号 = props.record?.排产编号 || '';
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

    // ========== 保存外产生产：基于工单销控表明细，编号/货号/分析单号/排产编号直接赋值，需求量=生产数 ==========
    const externalProductionList = detailList.map(item => {
      const ep = new ExternalProduction();
      ep.编号 = item.编号;            // 直接取明细的编号
      ep.货号 = item.货号;            // 直接取明细的货号
      ep.分析单号 = item.分析单号;    // 关联明细的分析单号
      ep.排产编号 = item.排产编号;    // 关联明细的排产编号
      ep.需求量 = item.生产数;        // 需求量 = 生产数
      ep.生产数量 = '0';              // 生产数量默认为0
      return ep;
    });
    if (externalProductionList.length > 0) {
      await externalProductionService.addOrUpdateExternalProductionList(externalProductionList);
    }

    // ========== 保存外产发运：逻辑同外产生产，基于工单销控表明细，编号/货号/分析单号/排产编号直接赋值，需求量=生产数 ==========
    const externalShipmentList = detailList.map(item => {
      const ship = new ExternalProductionShipment();
      ship.编号 = item.编号;            // 直接取明细的编号
      ship.货号 = item.货号;            // 直接取明细的货号
      ship.分析单号 = item.分析单号;    // 关联明细的分析单号
      ship.排产编号 = item.排产编号;    // 关联明细的排产编号
      ship.需求量 = item.生产数;        // 需求量 = 生产数
      ship.发运数量 = '0';              // 发运数量默认为0
      return ship;
    });
    if (externalShipmentList.length > 0) {
      await externalProductionService.addOrUpdateExternalProductionShipmentList(externalShipmentList);
    }

    const bomCount = savedBomList?.length || 0;
    message.success(`已保存 ${salesControlList.length} 条到工单销控表，${detailList.length} 条明细，${bomCount} 条BOM数据，${pickMaterialList.length} 条领料，${warehousingList.length} 条入库，${externalProductionList.length} 条外产生产，${externalShipmentList.length} 条外产发运`);

    // 排产分析保存成功后，才真正提交评审结果
    const mappedStatus = await doSubmitReview();
    emit('update:visible', false);
    emit('confirm', { id: props.record!.编号 || '', status: mappedStatus });
    emit('refresh');
    message.success('评审结果提交成功!');
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
  // 竞态保护：本次调用的序列号
  const mySeq = ++loadSeq;
  try {
    const requestDto = new PMCRequestDto({
      货号: schedulingProduct.partNo,
      排产编号: props.record?.排产编号,
    });
    console.log('[排产分析详情] 请求参数:', JSON.parse(JSON.stringify(requestDto)));
    const bomData = await salesControlService.getSchedulingAnalysisList(requestDto);
    console.log('[排产分析详情] 后端返回原始数据:', bomData);

    // 竞态保护：若本次调用期间已有更新的 loadSchedulingData 启动，丢弃本次响应
    if (mySeq !== loadSeq) return;

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
    // 初始化各父级直接子级的配料数 = 父级生产数 × 子级用量
    syncAllChildrenPickQty(treeData);
    // 初始化各父级直接子级的生产数/采购数联动
    syncAllChildrenQty(treeData);

    schDataSource.value = treeData;
    selectedLevel.value = 1;
    selectedRowKey.value = '';          // 切换数据时清空选中行
    schExpandedKeys.value = getExpandedKeysForFiltered(filteredSchDataSource.value);

    // 在 schExpandedKeys 设置之后再计算层序号（依赖 schExpandedKeys）
    reassignLevelIndex(schDataSource.value);
  } catch (error) {
    console.error('加载排产分析数据失败:', error);
    message.error('加载排产分析数据失败，请稍后重试');
  } finally {
    schedulingLoading.value = false;

  }
}

// ========== 事件处理 ==========
const handleVisibleUpdate = (val: boolean) => {
  // 关闭页面时退出全屏，并重置排产分析相关状态
  if (!val) {
    isSchedulingFullscreen.value = false;
    showSchedulingPanel.value = false;
    reviewSubmitted.value = false;
  }
  emit('update:visible', val);
};

// 监听弹窗打开/record 变化，初始化所有数据
// 必须同时监听 props.record：外层 DeliveryReview 被 keep-alive 缓存，
// 组件重新激活时 props.visible 可能从 false 直接变为 true，但 record 的更新与
// visible 变化可能不在同一 tick；单独监听 visible 会导致用旧 record 初始化，
// 从而 partNo/排产编号错误，排产数据为空。
watch(
  [() => props.visible, () => props.record],
  ([newVisible, newRecord]) => {
    if (newVisible && newRecord) {
      // 重置提交状态
      reviewSubmitted.value = false;
      showSchedulingPanel.value = false;

      // 评审表单初始化
      reviewForm.coilItemNo = newRecord.线圈货号 || '';
      verifyStatus.value = 'none';
      validatingCoil.value = false;

      reviewForm.finalDate = newRecord.交货日期 ? dayjs(newRecord.交货日期) : dayjs();
      reviewForm.resultStatus = 'pass';
      reviewForm.remark = '';
      reviewForm.specialRequirement = newRecord.特殊要求 || '';

      // 排产分析初始化
      schedulingProduct.partNo = newRecord.货号 || '';
      schedulingProduct.productName = newRecord.中文品名 || '';
      schedulingProduct.spec = newRecord.中文规格 || '';
      schedulingProduct.qty = Number(newRecord.数量) || 1;
      schedulingProduct.orderNo = newRecord.合同号 || '';
      schedulingForm.deliveryDate = undefined;

      // 清空上一次的排产数据状态（keep-alive 缓存会导致旧数据残留）
      schDataSource.value = [];
      selectedLevel.value = 1;
      schExpandedKeys.value = [];
      selectedRowKey.value = '';

      showSchedulingPanel.value = false;
      loadWorkshopOptions();

      // 加载企业微信部门列表（重新加载，确保每次打开都刷新最新部门/用户数据）
      schedulingSelectedUserIds.value = [];
      schedulingSelectedUsers.value = [];
      showUserSelector.value = false;
      // 重置组织架构加载失败状态与手动输入（每次重新打开都重新判定）
      orgLoadFailed.value = false;
      orgLoadErrorMessage.value = '';
      manualSchedulingUser.value = '';
      orgSelectorRef.value?.clearSelection();
      orgSelectorRef.value?.loadDepartments();
      orgSelectorRef.value?.loadAllUsers();

      // 如果记录中已有排产用户，尝试自动匹配并预选
      initPreselectedUsers();
    } else if (!newVisible) {
      showSchedulingPanel.value = false;
      reviewSubmitted.value = false;
    }
  },
  { flush: 'post', immediate: true }
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

/* ========== 左侧面板 ========== */
.left-panel {
  flex: 0 0 auto;
  width: 400px;
  max-width: 400px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* 排产分析单详情全屏：隐藏左侧面板，右侧面板占满 */
.drawer-body.scheduling-fullscreen .left-panel {
  display: none;
}

.drawer-body.scheduling-fullscreen .right-panel {
  flex: 1;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 全屏时给抽屉遮罩加背景模糊，与交期评审页全屏效果保持一致 */
.review-detail-drawer.scheduling-fullscreen-mode :deep(.ant-drawer-mask) {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
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

/* 右侧 Spin 容器撑满高度：让 a-spin 在 flex column 的 right-panel 内成为弹性容器，
   否则 .scheduling-card 高度会由表格内容决定，形成"内容定高"死循环，
   导致表格只显示几行而无法与左侧"评审结论"卡片底部对齐 */
.right-panel :deep(.ant-spin-nested-loading) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
}

.right-panel :deep(.ant-spin-container) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
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

.scheduling-card :deep(.ant-card-extra .settings-trigger) {
  color: rgba(255, 255, 255, 0.85);
}

.scheduling-card :deep(.ant-card-extra .settings-trigger:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
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
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-identity) {
  box-shadow: inset 0 3px 0 #91caff;
}

.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-material) {
  background: #24456d !important;
  box-shadow: inset 0 3px 0 #69b1ff;
}

.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-process) {
  background: #28515f !important;
  box-shadow: inset 0 3px 0 #5cdbd3;
}

.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-inventory) {
  background: #3a4e6c !important;
  box-shadow: inset 0 3px 0 #b7eb8f;
}

.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-planning) {
  background: #4b4b70 !important;
  box-shadow: inset 0 3px 0 #d3adf7;
}

.scheduling-table-wrap :deep(.ant-table-tbody > tr > td) {
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 物料、工艺、库存、计划量四个业务区块的起始分隔线。 */
.scheduling-table-wrap :deep(.ant-table-thead > tr > th.sch-col-group-start),
.scheduling-table-wrap :deep(.ant-table-tbody > tr > td.sch-col-group-start) {
  border-left: 2px solid #91a8c2 !important;
}

/* 数量统一右对齐，便于横向比较数量级；录入框中的数字也与展示列保持一致。 */
.scheduling-table-wrap :deep(.ant-table-tbody > tr > td.sch-col-group-material),
.scheduling-table-wrap :deep(.ant-table-tbody > tr > td.sch-col-group-inventory),
.scheduling-table-wrap :deep(.ant-table-tbody > tr > td.sch-col-group-planning) {
  font-variant-numeric: tabular-nums;
}

.scheduling-table-wrap :deep(.sch-col-group-planning .ant-input-number-input) {
  text-align: right;
  font-variant-numeric: tabular-nums;
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
  /* 不再使用固定高度，避免遮住分页；让选择器随内容自适应高度，
     当左侧卡片过高时由 .left-panel 的 overflow-y: auto 整体滚动 */
  min-height: 300px;
}

.user-selector-wrap :deep(.org-user-selector) {
  min-height: 300px;
}

.user-selector-wrap :deep(.dept-sidebar) {
  max-height: 420px;
  overflow-y: auto;
}

.user-selector-wrap :deep(.user-table) {
  /* 表格区自身允许在内容多时滚动，但保留分页可见 */
  overflow: visible;
}

/* 组织架构加载失败时的手动输入区域 */
.manual-user-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.manual-user-alert {
  margin-bottom: 0;
}

.manual-user-input-wrap :deep(.ant-input) {
  border-radius: 6px;
}

.readonly-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;
  padding: 2px 4px;
  cursor: not-allowed;
}

.readonly-hint-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;
  padding: 2px 0;
}

/* 排产用户已锁定时的遮罩：覆盖整个 OrgUserSelector，阻断交互 */
.user-selector-inner {
  position: relative;
}

.user-selector-inner.is-readonly {
  pointer-events: none;
  user-select: none;
}

.user-selector-inner.is-readonly :deep(.org-user-selector) {
  filter: grayscale(0.4);
  opacity: 0.85;
}

.user-selector-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 6px;
  color: #595959;
  font-size: 13px;
  font-weight: 500;
  z-index: 2;
  /* 即使 .is-readonly 用 pointer-events:none 屏蔽了内层，
     遮罩自身需要保持可点击以承载 tooltip（外层父元素未设 pointer-events）。 */
  pointer-events: auto;
}

.user-selector-mask-icon {
  font-size: 14px;
  color: #fa8c16;
}

/* 评审结论卡片锁定：与排产用户卡片共用 .user-selector-mask 样式，
   这里只需要保证内层容器为相对定位并提供 pointer-events 屏蔽 */
.review-conclusion-inner {
  position: relative;
}

.review-conclusion-inner.is-readonly {
  /* 让遮罩拦截内层控件的点击/键盘交互，禁用 .ant-form 的默认行为 */
  pointer-events: none;
  user-select: none;
}

.review-conclusion-inner.is-readonly :deep(.ant-form) {
  /* 视觉上稍微淡化，使遮罩中的\"已锁定\"提示更突出 */
  filter: grayscale(0.25);
  opacity: 0.92;
}

/* 核心要素校验卡片锁定：与评审结论、排产用户卡片共用 .user-selector-mask 样式 */
.verify-card-inner {
  position: relative;
}

.verify-card-inner.is-readonly {
  pointer-events: none;
  user-select: none;
}

.verify-card-inner.is-readonly :deep(.coil-search-row),
.verify-card-inner.is-readonly :deep(.verify-result) {
  filter: grayscale(0.25);
  opacity: 0.92;
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
  min-height: 36px;
  padding: 0 14px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  border-bottom: none;
}

.left-card :deep(.ant-card-head-title) {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  padding: 7px 0;
}

.left-card :deep(.ant-card-body) {
  padding: 10px 14px;
}

.left-card .info-grid {
  gap: 8px 14px;
}

.left-card .info-item {
  gap: 2px;
}

.left-card .info-label {
  font-size: 12px;
}

.left-card .info-value {
  line-height: 1.4;
}

.left-panel .review-form-compact :deep(.ant-form-item) {
  margin-bottom: 10px;
}

.left-panel .review-form-compact :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

.left-panel .preset-user-display {
  gap: 10px;
  padding: 2px 0;
}

.left-panel .preset-user-tags {
  gap: 6px;
}

.left-panel .preset-user-tags .ant-tag {
  padding: 2px 10px;
}

.left-footer {
  margin-top: 4px;
  padding-top: 6px;
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

/* 新增子级的来源由产品资料自动带出，仅作正常文本展示，不使用禁用下拉样式。 */
.add-child-source-text {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 11px;
  color: #262626;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-sizing: border-box;
}

/* 表格行右键菜单：使用固定定位，避免被表格滚动容器裁剪。 */
.sch-row-context-menu {
  position: fixed;
  z-index: 2001;
  min-width: 160px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.ctx-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  color: #262626;
  cursor: pointer;
}

.ctx-menu-item:hover {
  background: #f5f5f5;
}

.ctx-menu-item.is-disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.ctx-menu-item.is-disabled:hover {
  background: transparent;
}

/* 点击菜单外区域关闭菜单，同时不遮挡菜单本身。 */
.ctx-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
}
</style>
