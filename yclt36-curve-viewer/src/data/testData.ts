import type { PressureCurve,DataPoint } from '@/types'

/**
 * YCLT36 电磁阀在不同压力下的电流-流量测试数据
 * 数据模拟了磁滞回线特性（上升和下降路径不完全重合）
 */

// 1bar 压力曲线数据
var bar1: DataPoint[] = [
  {current:60,flowRate: 55.6100006103516},   // 起始点
  {current:62,flowRate: 57.25},
  {current:64,flowRate: 57.8899993896484},   
  {current:66,flowRate:58.5400009155273},
  {current:68, flowRate:59.3899993896484},
  {current:70, flowRate:60.0800018310547},
  {current:72, flowRate:60.6599998474121},
  {current:74, flowRate:61.4500007629395},
  {current:74,flowRate:73.8300018310547},   // 最大流量点
  {current:72, flowRate:72.9899978637695},
  {current:68, flowRate:70.1800003051758},
  {current:66,flowRate:68.9499969482422},   
  {current:64,flowRate: 68.1800003051758},  
  {current:62,flowRate: 67.5400009155273}, 
  {current:60,flowRate:66.5199966430664},   
]


/**
 * 所有压力曲线的配置数据
 */
export const pressureCurves: PressureCurve[] = [
  {
    pressure: 1,
    color: '#ef4444',
    name: '1bar',
    data: bar1
  },
]

/**
 * 产品规格数据
 */
export const productSpecs = {
  model: 'YCLT36',
  orificeDiameter: '1.0mm',
  voltage: '24V',
  maxPressure: '10bar'
}
