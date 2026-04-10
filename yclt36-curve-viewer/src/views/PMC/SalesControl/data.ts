import type { Product, StatusLegendItem } from '../types'
// 状态图例配置
export const statusLegendItems: StatusLegendItem[] = [
  {
    status: 'full',
    label: '满足',
    color: '#52c41a',
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f'
  },
  {
    status: 'partial',
    label: '部分满足',
    color: '#faad14',
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f'
  },
  {
    status: 'none',
    label: '不满足',
    color: '#ff4d4f',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7'
  }
]

// 默认日期范围
export const defaultDateRange: [string, string] = ['2025-06-10', '2025-06-30']

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
