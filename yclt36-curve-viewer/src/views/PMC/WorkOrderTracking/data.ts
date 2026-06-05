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


