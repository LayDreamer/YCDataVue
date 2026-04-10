import { ERPBase } from "../types";


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