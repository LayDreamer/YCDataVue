import { ProductionItem } from './types';
export const rawDataSource: ProductionItem[] = [
  {
    key: '1', rowNum: 1, partNo: 'AL-001', level: 1, attr: '原材料', name: '铝型材A', spec: '30cm', source: '外购',
    usage: 2, needQty: 200, unit: '米', remark: '挤压成型', process: '切割', workshop: '下料车间', warehouse: '原料库',
    stock: 120, transit: 30, wip: 20, max: 200, min: 10, avail: 120, produceQty: 0, purchaseQty: 80, loss: 0
  },
  {
    key: '2', rowNum: 2, partNo: 'CP-100', level: 1, attr: '半成品', name: '组件B', spec: '预装框架', source: '自制',
    usage: 1, needQty: 130, unit: '套', remark: '预组装', process: '装配', workshop: '装配车间', warehouse: '半成品库',
    stock: 50, transit: 10, wip: 5, max: 100, min: 5, avail: 50, produceQty: 80, purchaseQty: 0, loss: 0.30,
    children: [
      {
        key: '3', rowNum: 3, partNo: 'SC-002', level: 2, attr: '标准件', name: '不锈钢螺丝', spec: 'M4*10', source: '外购',
        usage: 4, needQty: 400, unit: '个', remark: '不锈钢', process: '备料', workshop: '仓库', warehouse: '标准件库',
        stock: 400, transit: 100, wip: 50, max: 600, min: 50, avail: 400, produceQty: 0, purchaseQty: 0, loss: 0
      },
      {
        key: '6', rowNum: 6, partNo: 'SUB-006', level: 2, attr: '半成品', name: '小支架', spec: '金属', source: '自制',
        usage: 3, needQty: 330, unit: '个', remark: '焊接件', process: '焊接', workshop: '焊接车间', warehouse: '半成品库',
        stock: 30, transit: 5, wip: 2, max: 80, min: 5, avail: 28, produceQty: 302, purchaseQty: 0, loss: 0.10,
        children: [
          {
            key: '7', rowNum: 7, partNo: 'SCR-007', level: 3, attr: '标准件', name: '垫片', spec: 'M3', source: '外购',
            usage: 6, needQty: 1800, unit: '个', remark: '镀锌', process: '装配', workshop: '装配车间', warehouse: '标准件库',
            stock: 200, transit: 20, wip: 10, max: 300, min: 15, avail: 195, produceQty: 0, purchaseQty: 1605, loss: 0
          }
        ]
      }
    ]
  },
  {
    key: '8', rowNum: 8, partNo: 'BR-004', level: 1, attr: '外协件', name: '塑料挡板', spec: '黑色', source: '外协',
    usage: 2, needQty: 220, unit: '块', remark: '喷塑', process: '注塑', workshop: '外协', warehouse: '外协库',
    stock: 80, transit: 20, wip: 10, max: 150, min: 8, avail: 82, produceQty: 0, purchaseQty: 138, loss: 0.10
  }
];



