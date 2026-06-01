import type { StatusLegendItem } from '../types'

// 状态图例配置
export const statusLegendItems: StatusLegendItem[] = [
  {
    status: 'full',
    label: '配齐/齐套',
    color: '#52c41a',
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f'
  },
  {
    status: 'partial',
    label: '配料中/缺料',
    color: '#faad14',
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f'
  },
  {
    status: 'none',
    label: '未分析',
    color: '#ff4d4f',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7'
  }
]

// 齐套状态选项
export const kittingStatusOptions = [
  { label: '齐套', value: '齐套' },
  { label: '缺料', value: '缺料' }
]

// 配料状态选项
export const feedingStatusOptions = [
  { label: '配齐', value: '配齐' },
  { label: '配料中', value: '配料中' },
  { label: '未配料', value: '未配料' }
]

// 车间选项
export const workshopOptions = [
  { label: '装配车间A组', value: '装配车间A组' },
  { label: '装配车间B组', value: '装配车间B组' },
  { label: '加工车间', value: '加工车间' },
  { label: '注塑车间', value: '注塑车间' }
]

// 生成日期范围内的所有日期
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  while (start <= end) {
    const year = start.getFullYear()
    const month = String(start.getMonth() + 1).padStart(2, '0')
    const day = String(start.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    start.setDate(start.getDate() + 1)
  }

  return dates
}

// 模拟数据生成
export interface WorkOrderTrackItem {
  id: number
  车间名称: string
  商品属性: string
  货号: string
  中文品名: string
  中文规格: string
  工单总数: number
  已入库数: number
  在产数量: number
  齐套状态: string
  配料状态: string
  分析日期: string
  生产完成率: number
  交货计划: string
}

export function generateMockData(): WorkOrderTrackItem[] {
  const workshops = ['装配车间B组', '装配车间B组', '装配车间B组', '装配车间A组', '加工车间', '装配车间B组', '装配车间B组']
  const attributes = ['电磁阀系列', '零配件', '柴油回油管系列', '柴油回油管系列', '柴油回油管系列', '柴油回油管系列', '零配件']
  const productNames = ['燃油箱通气阀', '裁剪橡胶管', '燃油回油管', '燃油回油管', '燃油回油管', '燃油回油管', '管来扣组件']
  const specs = [
    '6OE906517A 6Q0906517A IC0906517A',
    '夹线AEM/外径φ9*内径φ3.2*长度78mm/黑色',
    '6120703832',
    '6460700932',
    'A6510702432',
    '材料：AEM，阀门开启8.5，10.5bar (059130218H 059130218C 0928402061)',
    '黑色'
  ]
  const kittingStatuses = ['缺料', '齐套', '齐套', '缺料', '缺料', '缺料', '缺料']
  const feedingStatuses = ['配料中', '配齐', '配料中', '未配料', '配料中', '配齐', '配齐']

  const data: WorkOrderTrackItem[] = []
  for (let i = 0; i < 20; i++) {
    const total = [2000, 2000, 700, 500, 3000, 300, 992][i % 7]
    const stored = [921, 0, 0, 451, 995, 42, 0][i % 7]
    const inProd = [1079, 2000, 700, 49, 2005, 258, 992][i % 7]
    const rate = Math.round((stored / total) * 100)

    data.push({
      id: i + 1,
      车间名称: workshops[i % 7],
      商品属性: attributes[i % 7],
      货号: ['18058', '80002.08.03', '80039', '80042', '80071', '80025', '80084.06.013'][i % 7] + (i >= 7 ? `-${i}` : ''),
      中文品名: productNames[i % 7],
      中文规格: specs[i % 7],
      工单总数: total,
      已入库数: stored,
      在产数量: inProd,
      齐套状态: kittingStatuses[i % 7],
      配料状态: feedingStatuses[i % 7],
      分析日期: i < 5 ? '2026-05-18 13:50:27' : '2026-05-10',
      生产完成率: rate,
      交货计划: JSON.stringify([
        { 交货日期: '2026-01-01', 交货数量: i % 7 === 1 ? 2000 : i % 7 === 2 ? 500 : i % 7 === 4 ? 5 : i % 7 === 3 ? 49 : i % 7 === 0 ? 79 : 0, 状态: 'full' },
        { 交货日期: '2026-01-03', 交货数量: i % 7 === 1 ? 2000 : 0, 状态: 'full' },
        { 交货日期: '2026-01-04', 交货数量: i % 7 === 4 ? 500 : 0, 状态: 'partial' },
        { 交货日期: '2026-01-05', 交货数量: 0, 状态: 'none' }
      ])
    })
  }
  return data
}
