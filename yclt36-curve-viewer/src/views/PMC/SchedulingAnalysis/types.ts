import { TableColumnsType } from "ant-design-vue";



// 定义单个物料项的接口
export interface ProductionItem {
  key: string;
  rowNum: number;
  partNo: string;
  level: number;
  attr: string;
  name: string;
  spec: string;
  source: '外购' | '自制' | '外协';
  usage: number;
  needQty: number;
  unit: string;
  remark: string;
  process: string;
  workshop: string;
  warehouse: string;
  stock: number;
  transit: number;
  wip: number;
  max: number;
  min: number;
  avail: number;
  produceQty: number;
  purchaseQty: number;
  loss: number;
  children?: ProductionItem[]; // 递归子节点
}

// 列配置
export const columns: TableColumnsType = [
  { title: '序号', key: 'index', width: 60, fixed: 'left', align: 'center' },
  { title: '货号', dataIndex: 'partNo', width: 220, fixed: 'left' },
  { title: '层', key: 'level', width: 60, align: 'center' },
  { title: '产品属性', dataIndex: 'attr', width: 100 },
  { title: '品名', key: 'name', width: 220 },
  { title: '规格', dataIndex: 'spec', width: 120 },
  { title: '来源', key: 'source', width: 80, align: 'center' },
  { title: '用量', dataIndex: 'usage', width: 70, align: 'center' },
  { title: '需求量', dataIndex: 'needQty', width: 90, align: 'center' },
  { title: '单位', dataIndex: 'unit', width: 60, align: 'center' },
  { title: '备注', dataIndex: 'remark', width: 100 },
  { title: '工序名称', dataIndex: 'process', width: 100 },
  { title: '工序车间', dataIndex: 'workshop', width: 100 },
  { title: '仓库名称', dataIndex: 'warehouse', width: 110 },
  { title: '仓库数', dataIndex: 'stock', width: 80, align: 'center' },
  { title: '在途数', dataIndex: 'transit', width: 80, align: 'center' },
  { title: '在产需求', dataIndex: 'wip', width: 90, align: 'center' },
  { title: '库存上限', dataIndex: 'max', width: 80, align: 'center' },
  { title: '库存下限', dataIndex: 'min', width: 80, align: 'center' },
  { title: '仓库可用', dataIndex: 'avail', width: 90, align: 'center' },
  { title: '生产数', key: 'produceQty', width: 100, align: 'center' },
  { title: '采购数', key: 'purchaseQty', width: 100, align: 'center' },
  { title: '生产损耗', key: 'loss', width: 80, align: 'center' },
];