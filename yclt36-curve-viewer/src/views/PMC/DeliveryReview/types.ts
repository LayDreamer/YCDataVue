import { ERPBase } from '../types';
import { TableColumnType, TableColumnsType } from 'ant-design-vue';

export interface PMCProductInfo extends ERPBase {
  /** 合同号 */
  合同号?: string;
  /** 排产编号 */
  排产编号?: string;
  /** 层 */
  层?: string;
  /** 货号 */
  货号?: string;
  /** 中文品名 */
  中文品名?: string;
  /** 中文规格 */
  中文规格?: string;
  /** 父编号 */
  父编号?: string;
  /** 分析单号 */
  分析单号?: string;
  /** 来源编号 */
  来源编号?: string;
  /** 来源 */
  来源?: string;
  /** 工单单号 */
  工单单号?: string;
  /** 线圈 */
  线圈?: string;
  /** 电压 */
  电压?: string;
  /** 交货日期 */
  交货日期?: string;
  /** 排产用户 */
  排产用户?: string;
  /** 状态 */
  状态?: string;
  /** 数量 */
  数量?: string;
  /** 发运数量 */
  发运数量?: string;
  /** 入库数量 */
  入库数量?: string;
}

export interface ProductDataAssembly extends ERPBase {
  /** 货号 */
  货号?: string;
  /** 创建日期 */
  创建日期?: string;
  /** 创建人 */
  创建人?: string;
}

/**
 * 产品资料装配清单项
 */
export interface ProductDataAssemblyList extends ERPBase {
  /** 主编号 */
  主编号?: string;
  /** 货号 */
  货号?: string;
  /** 主货号 */
  主货号?: string;
  /** 创建时间 */
  创建时间?: string;
  /** 用量 */
  用量?: string;
  /** 单位 */
  单位?: string;
  /** 来源 */
  来源?: string;
  /** 中间件（0/1 标记） */
  中间件?: string;
}

export interface PMCDeliveryReview extends ERPBase {
  /** 合同号 */
  合同号?: string;
  /** 排产编号 */
  排产编号?: string;
  /** 层 */
  层?: string;
  /** 货号 */
  货号?: string;
  /** 中文品名 */
  中文品名?: string;
  /** 中文规格 */
  中文规格?: string;
  /** 分析单号 */
  分析单号?: string;
  /** 来源编号 */
  来源编号?: string;
  /** 来源 */
  来源?: string;
  /** 工单单号 */
  工单单号?: string;
  /** 线圈 */
  线圈货号?: string;
  /** 电压 */
  电压?: string;
  /** 交货日期 */
  交货日期?: string;
  /** 排产用户 */
  排产用户?: string;
  /** 状态 */
  状态?: string;
  /** 物料货号 */
  物料货号?: string;
  备注?: string;
}

export interface SchedulingAnalysis extends ERPBase {
  分析单号?: string;
  分析人?: string;
  分析日期?: string;
  生产方式?: string;
  客户简称?: string;
  排产编号?: string;
}

// 排产分析表格列配置（交期评审详情弹窗使用，独立维护，不引用 SchedulingAnalysis/types）
// 保持扁平列结构，避免影响 CommonTable 的列设置、显示与排序功能；通过列 class 做视觉分组。
type SchedulingColumnGroup = 'identity' | 'material' | 'process' | 'inventory' | 'planning';

function withColumnGroup(group: SchedulingColumnGroup, column: TableColumnType, isGroupStart = false) {
  const className = `sch-col-group-${group}${isGroupStart ? ' sch-col-group-start' : ''}`;
  return {
    ...column,
    className,
    customHeaderCell: () => ({ class: className })
  };
}

export const columns: TableColumnsType = [
  withColumnGroup('identity', { title: '序号', key: 'index', width: 60, fixed: 'left', align: 'center' }),
  withColumnGroup('identity', { title: '层序号', dataIndex: 'levelIndex', width: 150, fixed: 'left', align: 'left' }),
  withColumnGroup('identity', { title: '货号', dataIndex: 'partNo', width: 220, fixed: 'left' }),
  withColumnGroup('identity', { title: '层', key: 'level', width: 60, align: 'center' }),
  withColumnGroup('material', { title: '产品属性', dataIndex: 'attr', width: 100 }, true),
  withColumnGroup('material', { title: '品名', key: 'name', width: 220 }),
  withColumnGroup('material', { title: '规格', dataIndex: 'spec', width: 300, ellipsis: true }),
  withColumnGroup('material', { title: '来源', key: 'source', width: 80, align: 'center' }),
  withColumnGroup('material', { title: '用量', dataIndex: 'usage', width: 70, align: 'right' }),
  withColumnGroup('material', { title: '需求量', dataIndex: 'needQty', width: 90, align: 'right' }),
  withColumnGroup('material', { title: '单位', dataIndex: 'unit', width: 60, align: 'center' }),
  // { title: '备注', dataIndex: 'remark', width: 100,align: 'center'  },
  withColumnGroup('process', { title: '中间件', dataIndex: 'mid', width: 80, align: 'center' }, true),
  withColumnGroup('process', { title: '工序名称', dataIndex: 'process', width: 100 }),
  withColumnGroup('process', { title: '工序车间', dataIndex: 'workshop', key: 'workshop', width: 150 }),
  withColumnGroup('inventory', { title: '仓库名称', dataIndex: 'warehouse', width: 110 }, true),
  withColumnGroup('inventory', { title: '仓库数', dataIndex: 'stock', width: 80, align: 'right' }),
  withColumnGroup('inventory', { title: '在途数', dataIndex: 'transit', width: 80, align: 'right' }),
  withColumnGroup('inventory', { title: '在产需求', dataIndex: 'wip', width: 90, align: 'right' }),
  withColumnGroup('inventory', { title: '库存上限', dataIndex: 'max', width: 80, align: 'right' }),
  withColumnGroup('inventory', { title: '库存下限', dataIndex: 'min', width: 80, align: 'right' }),
  withColumnGroup('inventory', { title: '仓库可用', dataIndex: 'avail', width: 90, align: 'right' }),
  withColumnGroup('planning', { title: '配料数', dataIndex: 'pickedQty', width: 90, align: 'right' }, true),
  withColumnGroup('planning', { title: '生产数', key: 'produceQty', width: 100, align: 'right' }),
  withColumnGroup('planning', { title: '采购数', key: 'purchaseQty', width: 100, align: 'right' }),
  withColumnGroup('planning', { title: '生产损耗', key: 'loss', width: 80, align: 'right' })
];
