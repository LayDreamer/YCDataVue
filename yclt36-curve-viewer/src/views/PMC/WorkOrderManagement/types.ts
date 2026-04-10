export interface WorkOrderTrackRow {
  id: string
  计划开工日: string
  计划完工日: string
  状态: string
  工单单号: string
  物料齐套: string
  物料配料: string
  上线情况: string
  生产单位: string
  成品编号: string
  成品品名: string
  规格: string
  需求数量: number
  入库数量: number
  未入库数量: number
  报工工艺: string
  报工数: number
  报工日期: string
  制单: string
  订单编号: string
}
