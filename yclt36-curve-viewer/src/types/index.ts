/**
 * 曲线数据点类型定义
 */
export interface DataPoint {
  current: number

  flowRate: number
}

/**
 * 压力曲线数据类型
 */
export interface PressureCurve {
  pressure: number
  color: string
  name: string
  data: DataPoint[]
}

/**
 * 图表配置选项类型
 */
export interface ChartOptions {
  visibleCurves: Set<number>
  enableZoom: boolean
  enableTooltip: boolean
}

/**
 * 产品规格类型
 */
export interface ProductSpecs {
  model: string
  orificeDiameter: string
  voltage: string
  maxPressure: string
}
