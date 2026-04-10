import { ref, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { PressureCurve } from '@/types'

/**
 * ECharts 配置组合式函数
 * 提供图表选项的创建和更新逻辑
 */
export function useChartOptions(data: any, curveIndex: string) {
  // 创建本地副本，避免修改原始数据
  const safeData = JSON.parse(JSON.stringify(data))
  // 当前可见的曲线压力值集合
  const visiblePressures = ref<Set<number>>(new Set([1, 3, 5, 7]))

  // 构建压力曲线数据
  const pressureCurves: PressureCurve[] = [{
    pressure: 1,
    color: '#ef4444',
    name: '1bar',
    data: safeData
  }]

  /**
   * 获取 X 轴配置
   */
  const getXAxisConfig = () => {
    const baseConfig = {
      type: 'value' as const,
      nameLocation: 'middle' as const,
      nameGap: 35,
      axisLine: {
        lineStyle: {
          color: '#94a3b8'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#94a3b8'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed' as const, // 添加类型断言
          color: '#e2e8f0'
        }
      }
    }

    if (curveIndex == "currentFlowRateCurve") {
      // 曲线类型1: 电流-流量曲线
      return {
        ...baseConfig,
        name: '电流 (A)',
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500 as const,
          color: '#334155'
        },
        interval: 5,
        axisLabel: {
          formatter: (value: number) => (Number(value) || 0).toFixed(0),
          color: '#64748b'
        }
      }
    } else {
      // 曲线类型2: 压力-流量曲线
      return {
        ...baseConfig,
        name: '压力 (Pa)',
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500 as const,
          color: '#334155'
        },
        axisLabel: {
          formatter: (value: number) => (Number(value) || 0).toFixed(1),
          color: '#64748b'
        }
      }
    }
  }

  /**
   * 获取图表标题
   */
  const getChartTitle = () => {
    const baseTitle = {
      left: 'center' as const,
      top: 20,
      textStyle: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        color: '#1e293b'
      },
      subtextStyle: {
        fontSize: 14,
        color: '#64748b'
      }
    }

    if (curveIndex == "currentFlowRateCurve") {
      return {
        ...baseTitle,
        text: '电流-流量数据曲线',
      }
    } else {
      return {
        ...baseTitle,
        text: '压力-流量数据曲线',
      }
    }
  }

  /**
   * 获取 Y 轴配置
   */
  const getYAxisConfig = () => {
    return {
      type: 'value' as const,
      name: '流量 (L/min)',
      nameLocation: 'middle' as const,
      nameGap: 50,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 500 as const,
        color: '#334155'
      },
      interval: 10,
      axisLine: {
        lineStyle: {
          color: '#94a3b8'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#94a3b8'
        }
      },
      axisLabel: {
        formatter: (value: number) => (Number(value) || 0).toFixed(2),
        color: '#64748b'
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed' as const, // 添加类型断言
          color: '#e2e8f0'
        }
      }
    }
  }

  /**
   * 获取系列数据点
   */
  const getSeriesData = (curve: PressureCurve) => {
    if (curveIndex == "currentFlowRateCurve") {
      // 曲线类型1: 使用 current 作为 x 轴
      return curve.data.map((point: any) => [
        Number(point.current) || 0,
        Number(point.flowRate) || 0
      ])
    } else {
      // 曲线类型2: 使用 pressure 作为 x 轴
      return curve.data.map((point: any) => [
        Number(point.pressure) || 0,
        Number(point.flowRate) || 0
      ])
    }
  }

  /**
   * 获取 tooltip 格式化函数
   */
  const getTooltipFormatter = () => {
    if (curveIndex == "currentFlowRateCurve") {
      return (params: any) => {
        if (!params || params.length === 0) return ''

        const current = params[0].axisValue
        let content = `<div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
          电流: ${current} A
        </div>`
        params.forEach((param: any) => {
          const color = param.color
          // const seriesName = param.seriesName
          const value = param.value[1]
           // <span style="flex: 1;">${seriesName}:</span>
          content += `<div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>           
            <span style="font-weight: bold; margin-left: 8px;">${value?.toFixed(2) || '0.00'} L/min</span>
          </div>`
        })

        return content
      }
    } else {
      return (params: any) => {
        if (!params || params.length === 0) return ''

        const pressure = params[0].axisValue
        let content = `<div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
          压力: ${pressure} Pa
        </div>`
        params.forEach((param: any) => {
          const color = param.color
          const value = param.value[1]
          content += `<div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="font-weight: bold; margin-left: 8px;">${value?.toFixed(2) || '0.00'} L/min</span>
          </div>`
        })

        return content
      }
    }
  }

  /**
   * 创建 ECharts 图表配置选项
   */
  const createChartOptions = computed((): EChartsOption => {
    // 筛选可见的曲线数据
    const visibleCurves = pressureCurves.filter(curve =>
      visiblePressures.value.has(curve.pressure)
    )

    // 构建系列数据
    const series = visibleCurves.map((curve: PressureCurve) => ({
      type: 'line' as const,
      smooth: true,
      symbol: 'none' as const,
      lineStyle: {
        width: 2.5,
        color: curve.color
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: curve.color },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' }
        ]),
        opacity: 0.15
      },
      data: getSeriesData(curve)
    }))

    return {
      title: getChartTitle(),
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#334155'
        },
        formatter: getTooltipFormatter()
      },
      legend: {
        top: 100,
        right: 30,
        orient: 'vertical' as const,
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 12,
        textStyle: {
          fontSize: 13,
          color: '#475569'
        },
        selectedMode: true
      },
      grid: {
        left: 80,
        right: 120,
        top: 150,
        bottom: 80,
        containLabel: false
      },
      xAxis: getXAxisConfig(),
      yAxis: getYAxisConfig(),
      dataZoom: [
        {
          type: 'inside' as const,
          xAxisIndex: 0,
          filterMode: 'empty' as const
        },
        {
          type: 'inside' as const,
          yAxisIndex: 0,
          filterMode: 'empty' as const
        }
      ],
      series: series
    }
  })

  /**
   * 切换曲线的可见性
   */
  const toggleCurve = (pressure: number): void => {
    if (visiblePressures.value.has(pressure)) {
      visiblePressures.value.delete(pressure)
    } else {
      visiblePressures.value.add(pressure)
    }
    // 触发响应式更新
    visiblePressures.value = new Set(visiblePressures.value)
  }

  /**
   * 检查曲线是否可见
   */
  const isCurveVisible = (pressure: number): boolean => {
    return visiblePressures.value.has(pressure)
  }

  /**
   * 获取所有压力值
   */
  const allPressures = pressureCurves.map(curve => curve.pressure)

  return {
    visiblePressures,
    createChartOptions,
    toggleCurve,
    isCurveVisible,
    allPressures,
    pressureCurves
  }
}