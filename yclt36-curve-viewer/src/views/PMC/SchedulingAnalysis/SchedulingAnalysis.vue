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
            <FileTextOutlined class="icon-orange" />
            <span>排产分析单</span>
          </div>
          <div class="top-tip">点击货号/品名/规格可替换</div>
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
                <span class="display-field w-280">{{ form.productName || '-' }}</span>
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
              <a-tooltip :title="form.qty" placement="top">
                <span class="display-field w-100">{{ form.qty || 0 }}</span>
              </a-tooltip>
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
              <a-button type="primary" class="btn-update" @click="handleUpdate" :loading="updateLoading">
                <template #icon>
                  <ReloadOutlined />
                </template>更新分析
              </a-button>
              <a-button type="primary" class="btn-save" @click="handleSave" :loading="saveLoading">
                <template #icon>
                  <SaveOutlined />
                </template>保存分析
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 表格区域 -->
      <div class="table-wrapper">
        <a-table :columns="columns" :data-source="dataSource" :pagination="false"
          :scroll="{ x: 2200, y: 'calc(100vh - 280px)' }" bordered row-key="key" :expand-icon-column-index="1"
          :indent-size="18" :expanded-row-keys="expandedKeys"
          @expand="(expanded: boolean, record: any) => handleExpand(expanded, record)">
          <!-- 自定义展开图标：渲染在“货号”列中 -->
          <template #expandIcon="{ expanded, onExpand, record }">
            <div class="product-symbol-wrapper">
              <!-- 有子节点显示方框 +/- -->
              <template v-if="record.children && record.children.length">
                <span class="tree-icon-box" @click="e => onExpand(record, e)">
                  <MinusSquareOutlined v-if="expanded" />
                  <PlusSquareOutlined v-else />
                </span>
              </template>
              <!-- 叶子节点显示蓝色圆点 -->
              <template v-else>
                <span class="tree-leaf-dot"></span>
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
              <a-input-number v-model:value="record[column.key]" size="small" class="cell-input" :controls="false" />
            </template>
          </template>
        </a-table>
      </div>

      <!-- 3. 底部信息栏 -->
      <div class="footer-bar">
        <div class="formula">
          <SettingOutlined />
          <span v-if="form.analysisType === 'normal'">
            需求量 = 成品数量 × 累计用量 × (1+损耗) (普通)
          </span>
          <span v-else>
            需求量 = 成品数量 × 累计用量 × (1+损耗) (库存上限: 再减库存下限)
          </span>
        </div>
        <div class="save-info">点击货号/品名/规格替换物料</div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  LeftOutlined, FileTextOutlined, ReloadOutlined, SaveOutlined,
  BarChartOutlined, LineChartOutlined, SettingOutlined,
  PlusSquareOutlined, MinusSquareOutlined
} from '@ant-design/icons-vue';
import router from '@/router';
import { useRoute } from 'vue-router';

// 模拟API调用（实际项目中应替换为真实接口）
// import { getProductionAnalysis, updateProductionAnalysis, saveProductionAnalysis } from './api';
import { deliveryReviewService } from '@/services/deliveryReviewService';
import { PMCWorkOrder, PMCRequestDto } from '@/api-generated/api';
import { salesControlService } from '@/services/salesControlService';
import { workOrderService } from '@/services/workOrderService';
import { columns } from './types';

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

// 表单数据
const form = reactive({
  orderNo: '',
  partNo: '',
  productName: '',
  spec: '',
  qty: 0,
  analysisType: 'normal' as 'normal' | 'limit'
});

// 主记录数据（全局变量）
const mainRecord = ref<any>(null);




// 表格数据
const dataSource = ref<ProductionItem[]>([]);
// 展开状态管理
const expandedKeys = ref<string[]>([]);

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
const calculateDemandQty = (qty: number, usage: number, loss: number, analysisType: string, upperStock?: number, lowerStock?: number) => {
  // 普通分析：需求量 = 成品数量 × 累计用量 × (1+损耗)
  let demand = qty * usage * (1 + loss / 100);
  
  // 库存上限分析：需求量 = 成品数量 × 累计用量 × (1+损耗) - 库存下限
  if (analysisType === 'limit' && upperStock !== undefined && lowerStock !== undefined) {
    demand = demand - lowerStock;
  }
  
  // 确保需求量不为负数
  demand = Math.max(0, demand);
  
  return Math.ceil(demand);
};

// 构建树形数据（适配新BOM格式，层数按原数据字段显示）
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
    const demandQty = calculateDemandQty(qty, cumulativeUsage, loss, analysisType,
      record.库存上限 !== undefined && record.库存上限 !== '' ? Number(record.库存上限) : undefined,
      record.库存下限 !== undefined && record.库存下限 !== '' ? Number(record.库存下限) : undefined);

    const item: ProductionItem = {
      key,
      level: level,
      name: record.品名 || record.货号 || '-',
      source: record.来源 || record.产品属性 || '-',
      produceQty: 0,
      purchaseQty: demandQty,
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
      stock: record.仓库数 !== undefined && record.仓库数 !== '' ? Number(record.仓库数) : undefined,
      transit: record.在途数 !== undefined && record.在途数 !== '' ? Number(record.在途数) : undefined,
      wip: record.在产需求 !== undefined && record.在产需求 !== '' ? Number(record.在产需求) : undefined,
      max: record.库存上限 !== undefined && record.库存上限 !== '' ? Number(record.库存上限) : undefined,
      min: record.库存下限 !== undefined && record.库存下限 !== '' ? Number(record.库存下限) : undefined,
      avail: record.仓库可用 !== undefined && record.仓库可用 !== '' ? Number(record.仓库可用) : undefined,
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

  // 处理顶层BOM数据
  bomData.forEach((record) => {
    const item = processBOMItem(record, 0);
    treeData.push(item);
  });

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
  
    if (!bomData || !bomData.length) {
      message.warning('未获取到物料数据');
      return;
    }

    // 从BOM数据中提取基础信息（从层0的记录）
    mainRecord.value = bomData.find(item => Number(item.层) === 0) || bomData[0];
    form.orderNo = mainRecord.value?.合同号 || route.query.orderNo || ''; // 优先从BOM数据获取，否则从路由参数
    form.partNo = mainRecord.value?.货号 || partNo;
    form.productName = mainRecord.value?.品名 || '';
    form.spec = mainRecord.value?.规格 || '';
    form.qty = Number(route.query.qty) || 1;
    form.analysisType = 'normal';
   
    // 构建树形数据
    const treeData = buildTreeFromData(bomData, form.qty, form.analysisType);

    // 更新表格数据
    dataSource.value = treeData;

    // 默认展开所有父节点
    expandedKeys.value = getParentKeys(dataSource.value);
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('加载数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 更新分析
const handleUpdate = async () => {
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
};

// 保存分析
const handleSave = async () => { 
  saveLoading.value = true;
  try {    
    // 构建工单数据
    // const workOrderData = new PMCWorkOrder({   
    //   工单单号: '100152771033',
    //   生产单位:mainRecord.value.工序车间 || '',
    //   成品编号:form.partNo ,
    //   成品品名: form.productName,
    //   规格: form.spec,
    //   订单编号:mainRecord.value.合同号 || '',
    // }); 
    const requestDto= new PMCRequestDto({
      货号: form.partNo,
    });

    // 调用添加工单方法
    // await workOrderService.addPMCWorkOrder(workOrderData);
    await workOrderService.addPMCWorkOrderByRequest(requestDto);    
    message.success('分析数据已保存为工单');
  } catch (error) {
    console.error('保存分析失败:', error);
    message.error('保存分析失败，请稍后重试');
  } finally {
    saveLoading.value = false;
  }
};

// 展开/收起处理
const handleExpand = (expanded: boolean, record: any) => {
  if (expanded) {
    expandedKeys.value.push(record.key);
  } else {
    expandedKeys.value = expandedKeys.value.filter(k => k !== record.key);
  }
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
}

.btn-update {
  background-color: #001529;
  border-color: #001529;
}

.btn-save {
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
  color: #1890ff;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.tree-leaf-dot {
  width: 6px;
  height: 6px;
  background-color: #1890ff;
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