export interface ERPBase {

    编号: string;

    用户编号?: string;

    用户铭?: string;

    修改状态?: string;

    创建时间?: string;

    锁定用户?: string;

    审核过程?: string;

    打印?: string;
}

// 交货计划状态
export type DeliveryStatus = 'full' | 'partial' | 'none'

// 交货计划
export interface DeliveryPlan {
  交货日期: string
  交货数量: number
  状态: DeliveryStatus
  排产用户: string
}

// 产品数据接口
export interface Product extends ERPBase {
  合同号: string
  排产编号: string
  货号: string 
  中文品名: string 
  中文规格: string 
  缺量:string
  订单总需求: string 
  仓库数: string 
  在产数: string 
  初始可用量: string 
  商品属性: string 
  交货计划: string
}

// 筛选条件接口
export interface FilterParams {
  validationBasis: 'warehouseOnly' | 'warehouseAndProduction' // 验证依据
  startDate: string // 开始日期
  endDate: string // 结束日期
}

// 状态图例项
export interface StatusLegendItem {
  status: DeliveryStatus
  label: string
  color: string
  backgroundColor: string
  borderColor: string
}

export interface PMCSalesControl extends ERPBase {
  合同号: string
  排产编号: string
  货号: string 
  父级货号:string
  物料货号:string
  中文品名: string 
  中文规格: string 
  缺量:string
  订单总需求: string 
  仓库数: string 
  在产数: string 
  初始可用量: string 
  商品属性: string 
  交货计划: string
}

export interface RequestDto {   
    合同号?: string;
    分析单号?: string;
    排产用户?: string;
    货号?:string;
    线圈货号?:string;
    // page?: number
    // pageSize?: number
}

export interface PMCWorkOrder extends ERPBase {
    计划开工日?: string;
    计划完工日?: string;
    状态?: string;
    工单单号?: string;
    物料齐套?: string;
    物料配料?: string;
    上线情况?: string;
    生产单位?: string;
    成品编号?: string;
    成品品名?: string;
    规格?: string;
    需求数量?: string;
    入库数量?: string;
    未入库数量?: string;
    报工工艺?: string;
    报工数?: string;
    报工日期?: string;
    制单?: string;
    订单编号?: string;
}