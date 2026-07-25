import { ERPBase } from "../types";
import { TableColumnsType } from "ant-design-vue";


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
    备注?:string;
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
export const columns: TableColumnsType = [
  { title: '序号', key: 'index', width: 60, fixed: 'left', align: 'center' },
  { title: '层序号', dataIndex: 'levelIndex', minWidth: 150,  fixed: 'left', align: 'left' },
  { title: '货号', dataIndex: 'partNo', width: 220, fixed: 'left' },
  { title: '层', key: 'level', width: 60, align: 'center' },
  { title: '产品属性', dataIndex: 'attr', width: 100 },
  { title: '品名', key: 'name', width: 220 },
  { title: '规格', dataIndex: 'spec', width: 300, ellipsis: true },
  { title: '来源', key: 'source', width: 80, align: 'center' },
  { title: '用量', dataIndex: 'usage', width: 70, align: 'center' },
  { title: '需求量', dataIndex: 'needQty', width: 90, align: 'center' },
  { title: '单位', dataIndex: 'unit', width: 60, align: 'center' },
  { title: '备注', dataIndex: 'remark', width: 100 },
  { title: '工序名称', dataIndex: 'process', width: 100 },
  { title: '工序车间', dataIndex: 'workshop', key: 'workshop', width: 150 },
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