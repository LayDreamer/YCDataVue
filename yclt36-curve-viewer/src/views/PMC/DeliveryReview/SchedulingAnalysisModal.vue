<template>
  <a-drawer
    :visible="visible"
    @update:visible="handleVisibleUpdate"
    title="排产分析单详情"
    placement="right"
    :width="drawerWidth"
    :body-style="{ padding: 0 }"
    :mask="true"
    :mask-closable="true"
    :destroy-on-close="true"
    class="scheduling-analysis-modal"
  >
    <div class="modal-body">
      <!-- 加载状态 -->
      <a-spin :spinning="loading" tip="加载排产分析数据...">
        <!-- 顶部操作区域 -->
        <div class="header-card">
          <!-- 第一行：基础信息 -->
          <div class="input-row">
            <div class="info-item">
              <span class="label">货号</span>
              <span class="value w-220">{{ productData.partNo || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="label">品名</span>
              <span class="value w-300">{{ productData.productName || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="label">规格</span>
              <span class="value w-200">{{ productData.spec || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="label">成品数量</span>
              <a-input-number
                v-model:value="productData.qty"
                :min="0"
                :precision="0"
                style="width: 120px"
                @change="onQtyChange"
              />
            </div>
            <div class="info-item">
              <span class="label">生产交期</span>
              <a-date-picker
                v-model:value="form.deliveryDate"
                placeholder="选择交期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 170px"
              />
            </div>
          </div>
          <!-- 第二行：分析模式与按钮 -->
          <div class="action-row">
            <div class="analysis-modes">
              <a-radio-group v-model:value="form.analysisType">
                <a-radio value="normal">
                  <span class="radio-content">
                    <BarChartOutlined /> 普通分析
                  </span>
                </a-radio>
                <a-radio value="limit">
                  <span class="radio-content">
                    <LineChartOutlined /> 库存上限分析 (减下限)
                  </span>
                </a-radio>
              </a-radio-group>
            </div>
            <div class="btn-group">
              <a-button type="primary" @click="handleSave" :loading="saveLoading">
                <template #icon><SaveOutlined /></template>
                保存分析
              </a-button>
              <a-button type="primary" @click="handleSaveBOM" :loading="saveBomLoading">
                <template #icon><ClusterOutlined /></template>
                保存BOM
              </a-button>
              <a-button type="primary" @click="handleExpandAll">
                <template #icon><FolderOpenOutlined /></template>
                全部展开
              </a-button>
              <a-button type="primary" @click="handleCollapseAll">
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

        <!-- 表格区域 -->
        <div class="table-wrapper">
          <a-table
            :columns="displayColumns"
            :data-source="dataSource"
            :pagination="false"
            :scroll="{ x: 2200, y: 'calc(100vh - 440px)' }"
            bordered
            row-key="key"
            :expand-icon-column-index="1"
            :indent-size="20"
            :expanded-row-keys="expandedKeys"
            @expand="(expanded: boolean, record: any) => handleExpand(expanded, record)"
            size="middle"
          >
            <!-- 自定义展开图标 -->
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
              <!-- 序号列 -->
              <template v-if="column.key === 'index'">
                {{ record.rowNum || index + 1 }}
              </template>

              <!-- 层列 -->
              <template v-if="column.key === 'level'">
                <span class="level-badge">{{ record.level }}</span>
              </template>

              <!-- 货号列 -->
              <template v-if="column.key === 'partNo'">
                <span class="partno-text">{{ record.partNo || '-' }}</span>
              </template>

              <!-- 品名 -->
              <template v-if="column.key === 'name'">
                <span class="product-text">{{ record.name }}</span>
              </template>

              <!-- 规格 -->
              <template v-if="column.key === 'spec'">
                <span class="spec-text">{{ record.spec || record.unit || '-' }}</span>
              </template>

              <!-- 来源标签 -->
              <template v-if="column.key === 'source'">
                <a-tag :color="getSourceColor(record.source)" class="m-0">{{ record.source }}</a-tag>
              </template>

              <!-- 生产数/采购数/损耗 可编辑列 -->
              <template v-if="['produceQty', 'purchaseQty', 'loss'].includes(column.key as string)">
                <a-input-number
                  v-model:value="record[column.key]"
                  class="cell-input"
                  :controls="false"
                  @change="(val: any) => handleLossChange(record, column.key as string, val)"
                />
              </template>
            </template>
          </a-table>
          <a-empty v-if="!loading && dataSource.length === 0" description="暂无排产分析数据" />
        </div>

        <!-- 底部信息栏 -->
        <div class="footer-bar">
          <div class="formula">
            <SettingOutlined />
            <span>需求量 = 成品数量 × 累计用量 × (1+损耗)</span>
          </div>
        </div>
      </a-spin>
    </div>
  </a-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch } from 'vue';
import { message, Grid } from 'ant-design-vue';
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
import dayjs from 'dayjs';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { PMCRequestDto, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail } from '@/api-generated/api';
import { columns as rawColumns } from '../SchedulingAnalysis/types';
import FixedColumnControl from '@/components/FixedColumnControl.vue';

// ========== Props ==========
const props = defineProps<{
  visible: boolean;
  productNo?: string;
  partNo?: string;
  orderNo?: string;
  productName?: string;
  spec?: string;
  demand?: number;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
}>();

// ========== 响应式尺寸 ==========
const screens = Grid.useBreakpoint();
const drawerWidth = computed(() => (screens.value?.md ? '65vw' : '100%'));

// ========== 表单数据 ==========
const productData = reactive({
  partNo: '',
  productName: '',
  spec: '',
  qty: 1,
  orderNo: '',
});

const form = reactive({
  analysisType: 'normal' as 'normal' | 'limit',
  deliveryDate: undefined as string | undefined,
});

// ========== 表格数据 ==========
const loading = ref(false);
const dataSource = ref<ProductionItem[]>([]);
const expandedKeys = ref<string[]>([]);

// ========== 保存状态 ==========
const saveLoading = ref(false);
const saveBomLoading = ref(false);

// ========== 固定列 ==========
const fixedColumnKeys = ref<string[]>(['index', 'partNo']);

const displayColumns = computed(() => {
  return rawColumns.map(col => {
    const colKey = (col.key || (col as any).dataIndex) as string;
    return {
      ...col,
      fixed: fixedColumnKeys.value.includes(colKey) ? 'left' : undefined,
    };
  });
});

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

// ========== 来源颜色 ==========
function getSourceColor(src: string) {
  if (src === '外购') return 'green';
  if (src === '自制') return 'blue';
  if (src === '外协') return 'orange';
  return 'default';
}

// ========== 展开/收缩 ==========
function handleExpand(expanded: boolean, record: any) {
  if (expanded) {
    expandedKeys.value.push(record.key);
  } else {
    expandedKeys.value = expandedKeys.value.filter(k => k !== record.key);
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

function handleExpandAll() {
  const allKeys = getAllParentKeys(dataSource.value);
  if (allKeys.length === expandedKeys.value.length && allKeys.every(k => expandedKeys.value.includes(k))) {
    message.info('当前已是全部展开状态');
    return;
  }
  expandedKeys.value = allKeys;
}

function handleCollapseAll() {
  if (expandedKeys.value.length === 0) {
    message.info('当前已是全部收缩状态');
    return;
  }
  expandedKeys.value = [];
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
    item.avail = form.analysisType === 'limit' ? stock + transit - wip - min : stock + transit - wip;
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
watch(() => form.analysisType, () => {
  if (dataSource.value.length > 0) {
    updateAvailInTree(dataSource.value);
  }
});

// ========== 处理损耗变化 ==========
function handleLossChange(record: ProductionItem, field: string, value: number | null) {
  if (field === 'loss' && record) {
    const lossValue = value || 0;
    const updateItemAndChildren = (item: ProductionItem, loss: number) => {
      item.loss = loss;
      if (productData.qty > 0 && (item.usage || 1)) {
        const demandQty = calculateDemandQty(productData.qty, item.usage || 1, loss);
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
    const _avail = form.analysisType === 'limit' ? _stock + _transit - _wip - _min : _stock + _transit - _wip;

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

function onQtyChange(newQty: number) {
  if (dataSource.value.length > 0 && newQty >= 0) {
    updateDemandQtyInTree(dataSource.value, newQty);
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
  const deliveryDate = form.deliveryDate || dayjs().format('YYYY-MM-DD');
  sc.交货计划 = JSON.stringify([
    { 交货日期: deliveryDate, 交货数量: totalQty, 状态: '不满足' }
  ]);
  return sc;
}

// ========== 保存分析 ==========
async function handleSave() {
  if (!form.deliveryDate) {
    message.warning('请先选择生产交期');
    return;
  }
  if (dataSource.value.length === 0) {
    message.warning('没有可保存的详情数据');
    return;
  }

  saveLoading.value = true;
  try {
    const existingList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const existingMap = new Map<string, any>();
    (existingList || []).forEach((item: any) => {
      if (item.货号) existingMap.set(item.货号, item);
    });

    const flatItems = flattenTree(dataSource.value);
    const productionNodes = flatItems.filter(item => item.produceQty > 0);
    if (productionNodes.length === 0) {
      message.warning('没有生产数大于0的数据可保存');
      saveLoading.value = false;
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
      ep.合同号 = productData.orderNo || '';
      ep.货号 = item.partNo || '';
      ep.排产编号 = props.productNo || '';
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
    saveLoading.value = false;
  }
}

// ========== 保存BOM ==========
async function handleSaveBOM() {
  if (!productData.partNo) {
    message.warning('货号不能为空');
    return;
  }
  saveBomLoading.value = true;
  try {
    await externalProductionService.saveExternalProductionBOMByPartNo(productData.partNo);
    message.success(`货号【${productData.partNo}】BOM保存成功`);
  } catch (error) {
    console.error('保存BOM失败:', error);
    message.error((error as Error).message || '保存BOM失败，请稍后重试');
  } finally {
    saveBomLoading.value = false;
  }
}

// ========== 加载数据 ==========
async function loadData() {
  if (!productData.partNo) return;
  loading.value = true;
  keyCounter = 0;
  try {
    const requestDto = new PMCRequestDto({
      货号: productData.partNo,
      排产编号: props.productNo,
    });
    const bomData = await salesControlService.getSchedulingAnalysisList(requestDto);
    if (!bomData || !bomData.length) {
      message.warning('未获取到排产分析数据');
      dataSource.value = [];
      return;
    }

    form.analysisType = 'normal';
    const treeData = buildTreeFromData(bomData, productData.qty);
    dataSource.value = treeData;
    expandedKeys.value = getAllParentKeys(dataSource.value);
  } catch (error) {
    console.error('加载排产分析数据失败:', error);
    message.error('加载排产分析数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// ========== 弹窗打开时初始化 ==========
watch(() => props.visible, async (visible) => {
  if (visible) {
    productData.partNo = props.partNo || '';
    productData.productName = props.productName || '';
    productData.spec = props.spec || '';
    productData.qty = props.demand || 1;
    productData.orderNo = props.orderNo || '';
    await loadData();
  }
});

function handleVisibleUpdate(visible: boolean) {
  emit('update:visible', visible);
}
</script>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 顶部卡片 */
.header-card {
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}

.info-item .value {
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

.value.w-220 { width: 220px; }
.value.w-300 { width: 300px; }
.value.w-200 { width: 200px; }

/* 第二行：操作栏 */
.action-row {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-wrap: wrap;
}

.analysis-modes {
  display: flex;
  align-items: center;
}

.radio-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.btn-group {
  display: flex;
  gap: 12px;
}

/* 表格区域 */
.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0 8px;
}

.cell-input {
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

/* 底部信息栏 */
.footer-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.formula {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #595959;
}

/* 表格样式覆盖 */
.table-wrapper :deep(.ant-table) {
  font-size: 13px;
}

.table-wrapper :deep(.ant-table-thead > tr > th) {
  background: #1e3a5f;
  color: #fff;
  font-weight: 500;
  padding: 10px 8px;
  font-size: 13px;
  white-space: nowrap;
}

.table-wrapper :deep(.ant-table-tbody > tr > td) {
  padding: 8px 8px;
}

.table-wrapper :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff !important;
}
</style>
