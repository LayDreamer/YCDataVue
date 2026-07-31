<template>
  <div class="production-container">
    <!-- 加载状态 -->
    <a-spin :spinning="loading" tip="加载中...">
      <!-- 1. 顶部操作区域 -->
      <div class="header-card">
        <div class="title-row">
          <div class="title-text">
            <a-button type="text" @click="goBack" class="back-button">
              <template #icon>
                <LeftOutlined />
              </template>
              <span class="back-text">返回</span>
            </a-button>
            <!-- <FileTextOutlined class="icon-orange" /> -->
            <span>排产分析单</span>
          </div>
          <!-- <div class="top-tip">点击货号/品名/规格可替换</div> -->
        </div>

        <div class="search-bar">
          <!-- 第一行：基础信息输入（改为只读展示） -->
          <div class="input-row">
            <!-- <div class="input-group">
              <span class="label">订单号</span>
              <a-tooltip :title="form.orderNo" placement="top">
                <span class="display-field w-180">{{ form.orderNo || '-' }}</span>
              </a-tooltip>
            </div> -->
            <div class="input-group">
              <span class="label">货号</span>
              <a-tooltip :title="form.partNo" placement="top">
                <span class="display-field w-220">{{ form.partNo || '-' }}</span>
              </a-tooltip>
            </div>
            <div class="input-group">
              <span class="label">品名</span>
              <a-tooltip :title="form.productName" placement="top">
                <span class="display-field w-300">{{ form.productName || '-' }}</span>
              </a-tooltip>
            </div>
            <div class="input-group">
              <span class="label">规格</span>
              <a-tooltip :title="form.spec" placement="top">
                <span class="display-field w-200">{{ form.spec || '-' }}</span>
              </a-tooltip>
            </div>
            <div class="input-group">
              <span class="label">成品数量</span>
              <a-input-number v-model:value="form.qty" :min="0" :precision="0" size="small" style="width: 100px" />
            </div>
            <div class="input-group">
              <span class="label">生产交期</span>
              <a-date-picker v-model:value="form.deliveryDate" placeholder="选择交期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" size="small" style="width: 160px" />
            </div>
          </div>
          <!-- 第二行：分析模式与按钮 (靠左对齐) -->
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

            <div class="button-group">
              <!-- <a-button type="primary" class="btn-update" @click="handleUpdate" :loading="updateLoading">
                <template #icon>
                  <ReloadOutlined />
                </template>更新分析
              </a-button> -->
              <a-button type="primary" class="btn-save" @click="handleSave" :loading="saveLoading">
                <template #icon>
                  <SaveOutlined />
                </template>保存分析
              </a-button>
              <a-button type="primary" class="btn-save-bom" @click="handleSaveBOM" :loading="saveBomLoading">
                <template #icon>
                  <ClusterOutlined />
                </template>保存BOM
              </a-button>
              <a-button type="primary" class="btn-expand-all" @click="handleExpandAll">
              <template #icon>
                <FolderOpenOutlined />
              </template>全部展开
            </a-button>
            <a-button type="primary" class="btn-collapse-all" @click="handleCollapseAll">
              <template #icon>
                <FolderOutlined />
              </template>全部收缩
            </a-button>
            <a-select
              v-model:value="selectedLevel"
              style="width: 100px; margin-left: 8px;"
              placeholder="选择层数"
            >
              <a-select-option v-for="level in availableLevels" :key="level" :value="level">
                层 {{ level }}
              </a-select-option>
            </a-select>
            </div>

            <FixedColumnControl
              v-model="fixedColumnKeys"
              :columns="rawColumns"
              style="margin-left: auto;"
            />
          </div>
        </div>
      </div>

      <!-- 2. 表格区域 -->
      <div class="table-wrapper">
        <a-table :columns="columns" :data-source="filteredDataSource" :pagination="false"
          :scroll="{ x: 2200, y: 'calc(100vh - 280px)' }" bordered row-key="key" :expand-icon-column-index="1"
          :indent-size="18" :expanded-row-keys="expandedKeys"
          @expand="(expanded: boolean, record: any) => handleExpand(expanded, record)">
          <!-- 自定义展开图标：渲染在"货号"列中 -->
          <template #expandIcon="{ expanded, onExpand, record }">
            <div class="product-symbol-wrapper">
              <!-- 有子节点显示方框 +/- -->
              <template v-if="record.children && record.children.length">
                <span class="tree-icon-box" @click="e => onExpand(record, e)">
                <FolderOpenOutlined v-if="expanded" />
                <FolderOutlined v-else />
                </span>
              </template>             
            <!-- 叶子节点显示文件图标 -->
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

            <!-- 层列：仅显示加粗数字，居中对齐 -->
            <template v-if="column.key === 'level'">
              <span class="level-badge">{{ record.level }}</span>
            </template>

            <!-- 货号列：显示货号内容 -->
            <template v-if="column.key === 'partNo'">
              <span class="partno-text">{{ record.partNo || '-' }}</span>
            </template>

            <!-- 品名录：仅显示文字 -->
            <template v-if="column.key === 'name'">
              <span class="product-text">{{ record.name }}</span>
            </template>

            <!-- 规格列：显示规格或单位 -->
            <template v-if="column.key === 'spec'">
              <span class="spec-text">{{ record.spec || record.unit || '-' }}</span>
            </template>

            <!-- 来源标签 -->
            <template v-if="column.key === 'source'">
              <a-tag :color="getSourceColor(record.source)" class="m-0">{{ record.source }}</a-tag>
            </template>

            <!-- 输入框列 -->
            <template v-if="['produceQty', 'purchaseQty', 'loss'].includes(column.key as string)">
              <div @click.stop>
              <a-input-number 
                v-model:value="record[column.key]" 
                size="small" 
                class="cell-input" 
                :controls="false" 
                @change="(val: any) => handleLossChange(record, column.key as string, val)"
              />
              </div>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 3. 底部信息栏 -->
      <div class="footer-bar">
        <div class="formula">
          <SettingOutlined />
          <span>需求量 = 成品数量 × 累计用量 × (1+损耗)</span>
        </div>
        <!-- <div class="save-info">点击货号/品名/规格替换物料</div> -->
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  LeftOutlined, FileTextOutlined, ReloadOutlined, SaveOutlined,
  BarChartOutlined, LineChartOutlined, SettingOutlined,
  FolderOpenOutlined, FolderOutlined, ClusterOutlined
} from '@ant-design/icons-vue';
import router from '@/router';
import { useRoute } from 'vue-router';

// 模拟API调用（实际项目中应替换为真实接口）
// import { getProductionAnalysis, updateProductionAnalysis, saveProductionAnalysis } from './api';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { PMCRequestDto, WorkOrderSalesControl, ExternalProduction, WorkOrderSalesControlDetail } from '@/api-generated/api';
import { salesControlService } from '@/services/salesControlService';
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService';
import { externalProductionService } from '@/services/externalProductionService';
import { columns as rawColumns } from './types';
import FixedColumnControl from '@/components/FixedColumnControl.vue';
import dayjs from 'dayjs';

// ProductionItem 类型定义
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
  // 额外字段
  spec?: string;
  partNo?: string;
  orderNo?: string;
  analysisNo?: string;
  productionNo?: string;
  totalDemand?: number;
  warehouseQty?: number;
  inProductionQty?: number;
  usage?: number;
  unit?: string;
  createTime?: string;
  userName?: string;
  // 工序相关字段
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



const route = useRoute();
const closeTab = inject('closeTab') as (path?: string) => void;

// 加载状态
const loading = ref(false);
const updateLoading = ref(false);
const saveLoading = ref(false);
const saveBomLoading = ref(false);

// 表单数据
const form = reactive({
  orderNo: '',
  partNo: '',
  productName: '',
  spec: '',
  qty: 0,
  deliveryDate: undefined as string | undefined,
  analysisType: 'normal' as 'normal' | 'limit'
});

// 主记录数据（全局变量）
const mainRecord = ref<any>(null);
// 表格数据
const dataSource = ref<ProductionItem[]>([]);
// 展开状态管理
const expandedKeys = ref<string[]>([]);

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
  traverse(dataSource.value);
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
const filteredDataSource = computed(() => {
  return filterTreeByLevel(dataSource.value, selectedLevel.value);
});

// 获取过滤后需要展开的节点
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

// 监听层数变化，自动展开对应节点
watch(selectedLevel, () => {
  if (filteredDataSource.value.length > 0) {
    expandedKeys.value = getExpandedKeysForFiltered(filteredDataSource.value);
    // 切换层数后重新计算层序号
    reassignLevelIndex(dataSource.value);
  }
});

// 固定列控制
const fixedColumnKeys = ref<string[]>(['index', 'levelIndex', 'partNo']);

// 动态计算带 fixed 属性的 columns
const columns = computed(() => {
  return rawColumns.map(col => {
    const colKey = (col.key || (col as any).dataIndex) as string;
    return {
      ...col,
      fixed: fixedColumnKeys.value.includes(colKey) ? 'left' : undefined
    };
  });
});

// 获取所有父级节点的key（用于默认展开）
const getParentKeys = (data: ProductionItem[]): string[] => {
  const keys: string[] = [];
  const traverse = (items: ProductionItem[]) => {
    items.forEach(item => {
      if (item.children && item.children.length) {
        keys.push(item.key);
        traverse(item.children);
      }
    });
  };
  traverse(data);
  return keys;
};

// 生成唯一key
const generateKey = (prefix: string, index: number) => {
  return `${prefix}-${index}-${Date.now()}`;
};

// 计算需求量
const calculateDemandQty = (qty: number, usage: number, loss: number) => {
  // 需求量 = 成品数量 × 累计用量 × (1+损耗)
  let demand = qty * usage * (1 + loss);
  // 确保需求量不为负数
  demand = Math.max(0, demand);
  return Math.ceil(demand);
};

// 递归更新树形数据中的需求量
const updateDemandQtyInTree = (items: ProductionItem[], qty: number) => {
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
};

// 监听成品数量变化，动态更新需求量
watch(() => form.qty, (newQty) => {
  if (dataSource.value.length > 0 && newQty >= 0) {
    updateDemandQtyInTree(dataSource.value, newQty);
  }
});

// 监听分析类型变化，动态更新仓库可用量及生产数/采购数
const updateAvailInTree = (items: ProductionItem[], analysisType: string) => {
  items.forEach(item => {
    const stock = item.stock || 0;
    const transit = item.transit || 0;
    const wip = item.wip || 0;
    const min = item.min || 0;
    const avail = analysisType === 'limit' ? stock + transit - wip - min : stock + transit - wip;
    item.avail = Math.max(0, avail);
    if (item.source !== '自制') {
      item.purchaseQty = (item.needQty || 0) + (item.avail || 0);
      item.produceQty = 0;
    } else {
      item.produceQty = (item.needQty || 0) + (item.avail || 0);
      item.purchaseQty = 0;
    }
    if (item.children && item.children.length > 0) {
      updateAvailInTree(item.children, analysisType);
    }
  });
};

watch(() => form.analysisType, (newType) => {
  if (dataSource.value.length > 0) {
    updateAvailInTree(dataSource.value, newType);
  }
});

// 通过 key 在原始 dataSource 树中查找节点（返回原始引用，非副本）
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

// 处理损耗字段变化，动态更新该行及子行的需求量
const handleLossChange = (record: ProductionItem, field: string, value: number | null) => {
  // produceQty / purchaseQty / loss 字段变化都需要处理
  if (!record) return;

  // 关键：通过 key 在原始 dataSource 中找到节点（而非 filteredDataSource 的副本）
  const originalItem = findItemByKey(dataSource.value, record.key);
  if (!originalItem) return;

  // 如果是 loss 变化，更新值并重新计算该行及子行的需求量
  if (field === 'loss') {
    const lossValue = value || 0;
    originalItem.loss = lossValue;
    
    const updateItemAndChildren = (item: ProductionItem) => {
      if (form.qty > 0 && (item.usage || 1)) {
        const demandQty = calculateDemandQty(form.qty, item.usage || 1, item.loss || 0);       
        item.needQty = demandQty;
        if (item.source !== '自制') {
          item.purchaseQty = demandQty + (item.avail || 0);
        } else {
          item.produceQty = demandQty + (item.avail || 0);
        }
      }
      // 递归更新子节点（子节点保持各自损耗率不变，但因父级需求变化可能需重算）
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
};

// 重新分配层序号（按 rowNum 在同层递增），格式 "{level}-{position}"
// 重要：只对"可见"节点计算（顶层 + 已展开父级的子节点），
// 未展开父级的子集不参与计算，避免折叠父级下的子集"抢占"层序号位置
// 最后替换 dataSource.value 引用，触发 filteredDataSource computed 重新计算
function reassignLevelIndex(items: ProductionItem[]): void {
  // 先清空所有节点的 levelIndex（避免折叠父级的子集残留旧值）
  const clearAll = (list: ProductionItem[]) => {
    list.forEach(item => {
      item.levelIndex = undefined;
      if (item.children && item.children.length > 0) clearAll(item.children);
    });
  };
  clearAll(items);

  // 只收集"可见"节点：顶层节点 + 已展开父级（expandedKeys）的子节点
  const all: ProductionItem[] = [];
  const collectVisible = (list: ProductionItem[]) => {
    list.forEach(item => {
      all.push(item);
      if (item.children && item.children.length > 0 && expandedKeys.value.includes(item.key)) {
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

  // 关键：替换 dataSource.value 引用，触发 filteredDataSource computed 重新计算
  // （否则仅修改对象属性，Vue 不会感知，a-table 看不到新层序号）
  if (items === dataSource.value) {
    dataSource.value = [...items];
  }
}

// 构建树形数据（适配新BOM格式，支持多层嵌套）
const buildTreeFromData = (bomData: any[], qty: number, analysisType: string): ProductionItem[] => {
  const treeData: ProductionItem[] = [];
  let rowCounter = 0; // 全局行号计数器

  // 递归处理BOM数据和子集
  const processBOMItem = (record: any, parentLevel: number = 0, parentUsage: number = 1): ProductionItem => {
    const level = Number(record.层) || parentLevel;
    const key = generateKey('item', rowCounter++);

    // 计算用量：父级用量 × 当前用量
    const usage = Number(record.用量) || 1;
    const cumulativeUsage = parentUsage * usage;
    const loss = Number(record.损耗) || 0;
    const demandQty = calculateDemandQty(qty, cumulativeUsage, loss);

    // 提前计算库存相关字段，供 purchaseQty 使用
    const _stock = record.仓库数 !== undefined && record.仓库数 !== '' ? Number(record.仓库数) : 0;
    const _transit = record.在途数 !== undefined && record.在途数 !== '' ? Number(record.在途数) : 0;
    const _wip = record.在产需求 !== undefined && record.在产需求 !== '' ? Number(record.在产需求) : 0;
    const _min = record.库存下限 !== undefined && record.库存下限 !== '' ? Number(record.库存下限) : 0;
    const _avail = Math.max(0, analysisType === 'limit' ? _stock + _transit - _wip - _min : _stock + _transit - _wip);

    const item: ProductionItem = {
      key,
      level: level,
      name: record.品名 || '-',
      source: record.来源 || '-',
      produceQty: record.来源 === '自制' ? demandQty + _avail : 0,
      purchaseQty: record.来源 !== '自制' ? demandQty + _avail : 0,
      loss: loss,
      rowNum: rowCounter,
      // 基础字段
      spec: record.规格 || '-',
      partNo: record.货号 || '-',
      usage: cumulativeUsage,
      unit: record.单位 || '-',
      // 工序相关字段
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
      children: []
    };

    // 递归处理子集（支持多层嵌套）
    if (record.子集 && Array.isArray(record.子集) && record.子集.length > 0) {
      record.子集.forEach((childRecord: any) => {
        const childItem = processBOMItem(childRecord, level + 1, cumulativeUsage);
        item.children!.push(childItem);
      });
    }

    return item;
  };

  // 排序规则：level === 1 时，产品属性为"线圈"的排在最底部
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

  // 处理顶层BOM数据
  bomData.forEach((record) => {
    const item = processBOMItem(record, 0);
    treeData.push(item);
  });

  // 对顶层节点的子节点（即 level=1 的节点）进行排序
  treeData.forEach(item => {
    if (item.children && item.children.length > 0) {
      item.children = sortLevel1Items(item.children);
    }
  });

  // 排序完成后，重新按显示顺序分配 rowNum
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

  // 重新分配层序号（按序号 rowNum 在同层递增），格式 "{level}-{position}"
  reassignLevelIndex(treeData);

  return treeData;
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const partNo = route.query.id as string;

    const productNo = route.query.productNo as string;
    if (!partNo) {
      message.error('缺少货号参数');
      return;
    }
    const requestDto = new PMCRequestDto({ 货号: partNo, 排产编号: productNo});
    // 直接获取BOM数据
    const bomData = await salesControlService.getSchedulingAnalysisList(requestDto);
    console.log(bomData);
    if (!bomData || !bomData.length) {
      message.warning('未获取到物料数据');
      return;
    }

    // 从BOM数据中提取基础信息（从层0的记录）
    mainRecord.value = bomData.find(item => Number(item.层) === 0) || bomData[0];

    form.analysisType = 'normal';
    form.orderNo = (route.query.orderNo as string) || '';
    form.partNo = partNo || '';
    form.productName = mainRecord.value?.品名 || (route.query.productName as string) || '';
    form.spec = mainRecord.value?.规格 || (route.query.spec as string) || '';
    form.qty = Number(route.query.demand) || 1;
 
    // 构建树形数据
    const treeData = buildTreeFromData(bomData, form.qty, form.analysisType);

    // 更新表格数据
    dataSource.value = treeData;
    selectedLevel.value = 1;
    expandedKeys.value = getExpandedKeysForFiltered(filteredDataSource.value);
    // 在 expandedKeys 设置之后再计算层序号（依赖 expandedKeys）
    reassignLevelIndex(dataSource.value);
  } catch (error) {
    console.error('加载数据失败:', error); 
    message.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 更新分析
// const handleUpdate = async () => {
  // updateLoading.value = true;
  // try {
  //   const res = await updateProductionAnalysis({
  //     orderNo: form.orderNo,
  //     partNo: form.partNo,
  //     analysisType: form.analysisType,
  //     qty: form.qty
  //   });

  //   // 更新表格数据
  //   dataSource.value = res.bomData;
  //   // 刷新展开状态
  //   expandedKeys.value = getParentKeys(dataSource.value);
  //   message.success('分析数据已更新');
  // } catch (error) {
  //   console.error('更新分析失败:', error);
  //   message.error('更新分析失败，请稍后重试');
  // } finally {
  //   updateLoading.value = false;
  // }
//};

// 展平树形数据
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




// 将排产分析明细项转换为工单销控表数据
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
  sc.交货日期 = form.deliveryDate || dayjs().format('YYYY-MM-DD');
  return sc;
}



// 保存分析
const handleSave = async () => {
  if (!form.deliveryDate) {
    message.warning('请先选择交货日期');
    return;
  }
  if (dataSource.value.length === 0) {
    message.warning('没有可保存的详情数据');
    return;
  }

  saveLoading.value = true;
  try {
    // 1. 先查询现有工单销控表数据
    const existingList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const existingMap = new Map<string, any>();
    (existingList || []).forEach((item: any) => {
      if (item.货号) {
        existingMap.set(item.货号, item);
      }
    });

    // 2. 将排产分析详情中生产数>0的数据保存到工单销控表主表
    const flatItems = flattenTree(dataSource.value);
    const productionNodes = flatItems.filter(item => item.produceQty > 0);
    if (productionNodes.length === 0) {
      message.warning('没有生产数大于0的数据可保存');
      return;
    }

    // 收集子级（仅收集非0层节点的子级，保存到明细表）
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

    // 只对非0层的 productionNodes 收集子级
    const nodesToCollectChildren = productionNodes.filter(node => node.level !== 0);
    const allChildren = collectAllChildren(nodesToCollectChildren);
    // 按 key 去重
    const childMap = new Map<string, ProductionItem>();
    allChildren.forEach(child => childMap.set(child.key, child));
    const uniqueChildren = Array.from(childMap.values());

    // 货号 -> 工单单号 映射，用于明细赋值
    const workOrderNoMap = new Map<string, string>();
    // 保存主表（排除0层节点）
    const salesControlList = productionNodes.filter(item => item.level !== 0).map((item, idx) => {
      const newSc = convertToWorkOrderSalesControl(item, idx);
      const existing = existingMap.get(newSc.货号 || '');

      if (existing) {
        // 合并更新
        newSc.编号 = existing.编号 || existing.id;
        newSc.工单单号 = existing.工单单号 || form.orderNo || '';
        const oldTotal = Number(existing.工单总数) || 0;
        const addTotal = Number(newSc.工单总数) || 0;
        newSc.工单总数 = String(oldTotal + addTotal);

        const oldWip = Number(existing.在产数量) || 0;
        const addWip = Number(newSc.在产数量) || 0;
        newSc.在产数量 = String(oldWip + addWip);
      }

      if (newSc.货号) {
        workOrderNoMap.set(newSc.货号, newSc.工单单号 || '');
      }

      return newSc;
    });

    await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlList(salesControlList);

    // 3. 重新查询主表，获取最新的编号（用于给明细表赋值父级编号）
    const updatedMainList = await workOrderSalesControlService.getWorkOrderSalesControlList();
    const mainNoMap = new Map<string, string>();
    (updatedMainList || []).forEach((item: any) => {
      if (item.货号 && (item.编号 || item.id)) {
        mainNoMap.set(item.货号, item.编号 || item.id);
      }
    });

    // 4. 保存子级到工单销控表明细表，父级编号赋值为主表的编号
    // 预先构建 childKey -> parentPartNo 映射
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
      // 父级编号 = 直接父节点在主表中的编号
      const parentPartNo = childParentMap.get(item.key);
      if (parentPartNo) {
        const parentNo = mainNoMap.get(parentPartNo);
        if (parentNo) {
          detail.父级编号 = parentNo;
        }
        const parentWorkOrderNo = workOrderNoMap.get(parentPartNo);
        if (parentWorkOrderNo) {
          detail.工单单号 = parentWorkOrderNo;
        }
      }
      detail.交货日期 = form.deliveryDate || dayjs().format('YYYY-MM-DD');
      const produceQty = item.produceQty > 0 ? item.produceQty : (item.needQty || 0);
      detail.生产数 = String(produceQty);
      detail.入库数 = '0';
      detail.待产数 = String(Math.max(0, produceQty));
      return detail;
    });

    if (detailList.length > 0) {
      await workOrderSalesControlService.addOrUpdateWorkOrderSalesControlDetailList(detailList);
    }

    // 4. 批量保存到外产_生产（仅保存生产数>0的节点）
    const productNo = route.query.productNo as string;
    const externalProductionList = productionNodes.map(item => {
      const ep = new ExternalProduction();
      ep.合同号 = form.orderNo || '';
      ep.货号 = item.partNo || '';
      ep.排产编号 = productNo || '';
      ep.需求量 = String(item.needQty || 0);
      ep.生产数量 = String(item.produceQty || 0);
      return ep;
    });

    await externalProductionService.addOrUpdateExternalProductionList(externalProductionList);
    const savedMainCount = salesControlList.length;
    const savedDetailCount = detailList.length;
    message.success(`已保存 ${savedMainCount} 条数据到工单销控表主表，${savedDetailCount} 条数据到明细表，${productionNodes.length} 条数据到外产生产`);
  } catch (error) {
    console.error('保存分析失败:', error);
    message.error('保存分析失败，请稍后重试');
  } finally {
    saveLoading.value = false;
  }
};

// 保存BOM
const handleSaveBOM = async () => {
  if (!form.partNo) {
    message.warning('货号不能为空');
    return;
  }
  saveBomLoading.value = true;
  try {
    await externalProductionService.saveExternalProductionBOMByPartNo("","",form.partNo);
    
    message.success(`货号【${form.partNo}】BOM保存成功`);
  } catch (error) {
    console.error('保存BOM失败:', error);
    message.error((error as Error).message || '保存BOM失败，请稍后重试');
  } finally {
    saveBomLoading.value = false;
  }
};

// 展开/收起处理
const handleExpand = (expanded: boolean, record: any) => {
  if (expanded) {
    expandedKeys.value.push(record.key);
  } else {
    expandedKeys.value = expandedKeys.value.filter(k => k !== record.key);
  }
  // 展开/收起后重新计算层序号（只对可见节点计算）
  reassignLevelIndex(dataSource.value);
};

// 全部展开
const handleExpandAll = () => {
  const getAllKeys = (items: ProductionItem[]): string[] => {
    const keys: string[] = [];
    items.forEach(item => {
      if (item.children && item.children.length) {
        keys.push(item.key);
        keys.push(...getAllKeys(item.children));
      }
    });
    return keys;
  };
  const allKeys = getAllKeys(dataSource.value);
  if (allKeys.length === expandedKeys.value.length && allKeys.every(k => expandedKeys.value.includes(k))) {
    message.info('当前已是全部展开状态');
    return;
  }
  expandedKeys.value = allKeys;
  // 全部展开后重新计算层序号
  reassignLevelIndex(dataSource.value);
};

// 全部收缩
const handleCollapseAll = () => {
  if (expandedKeys.value.length === 0) {
    message.info('当前已是全部收缩状态');
    return;
  }
  expandedKeys.value = [];
  // 全部收缩后重新计算层序号
  reassignLevelIndex(dataSource.value);
};


// 来源标签颜色
const getSourceColor = (src: string) => {
  if (src === '外购') return 'green';
  if (src === '自制') return 'blue';
  if (src === '外协') return 'orange';
  return 'default';
};

// 返回上一页
const goBack = () => {
  const currentPath = route.fullPath;
  router.push({ name: 'SalesControl' }).then(() => {
    if (closeTab) {
      closeTab(currentPath);
    }
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 原有样式保持不变，添加loading相关样式 */
.production-container {
  background-color: #f0f2f5;
  padding: 12px;
  min-height: 100vh;
}

/* 顶部卡片布局 */
.header-card {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.title-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title-text {
  font-size: 22px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.icon-orange {
  color: #fa8c16;
}

.top-tip {
  color: #999;
  font-size: 12px;
}

/* 返回按钮样式 */
.back-button {
  height: 36px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
  background: transparent;
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  user-select: none;
  position: relative;
  overflow: hidden;
  margin-right: 15px;
}

/* 搜索栏：强制换行布局 */
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 30px;
  align-items: center;
  padding: 8px 0;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: max-content;
}

/* 展示字段样式 */
.display-field {
  display: inline-block;
  max-width: 400px;
  min-width: 80px;
  padding: 4px 11px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
  transition: all 0.3s ease;
}

.display-field:hover {
  background-color: #e8e8e8;
  border-color: #1890ff;
}

.w-80 {
  width: 80px;
}

.w-100 {
  width: 100px;
}

.w-120 {
  width: 120px;
}

.w-160 {
  width: 160px;
}

.w-180 {
  width: 180px;
}

.w-200 {
  width: 200px;
}

.w-220 {
  width: 220px;
}

.w-280 {
  width: 280px;
}

.label {
  white-space: nowrap;
  color: #666;
  font-size: 13px;
}

/* 第二行靠左排列 */
.action-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 40px;
  padding-top: 12px;
  border-top: 1px dashed #f0f0f0;
}

.radio-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-update {
  background-color: #001529;
  border-color: #001529;
}

.btn-save {
  background-color: #004d4f;
  border-color: #004d4f;
}

.btn-save-bom {
  background-color: #8c3b00;
  border-color: #8c3b00;
}

.btn-expand-all, .btn-collapse-all {
  background-color: #004d4f;
  border-color: #004d4f;
}


/* 表格定制 */
.table-wrapper {
  background: #fff;
  border-radius: 4px;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #002140 !important;
  color: #fff !important;
  font-size: 14px;
  padding: 12px 8px !important;
  text-align: center;
  line-height: 1.5;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px !important;
  font-size: 14px;
  line-height: 1.5;
}

.cell-input {
  width: 100%;
  height: 32px;
}

.product-symbol-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  vertical-align: middle;
}

.partno-text {
  vertical-align: middle;
  color: #1890ff;
  font-weight: 500;
}

.tree-icon-box {
  cursor: pointer;
  color:yellowgreen;
  font-size: 18px;
  display: flex;
  align-items: center;
}

.tree-leaf-icon {
  font-size: 12px;
  color: gray;
  border-radius: 50%;
  display: inline-block;
}

.product-text {
  vertical-align: middle;
}

.level-badge {
  font-weight: bold;
  color: #333;
}

.spec-text {
  color: #666;
  font-size: 13px;
}

:deep(.ant-table-row-expand-icon-cell) {
  padding: 0 !important;
  width: 32px !important;
  text-align: center;
}

/* 底部栏 */
.footer-bar {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  padding: 0 8px;
}

.formula {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>