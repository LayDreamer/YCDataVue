<template>
  <div class="chart-container" ref="containerRef">
    <!-- 图表容器 -->
    <div ref="chartRef" class="chart-canvas"></div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

/**
 * 图表组件属性
 */
interface Props {
  options: EChartsOption
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

// DOM 引用
const containerRef = ref<HTMLElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)

// ECharts 实例
let chartInstance: ECharts | null = null

// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null

/**
 * 初始化图表
 */
const initChart = (): void => {
  if (!chartRef.value) return

  // 创建 ECharts 实例，使用容器宽度
  chartInstance = echarts.init(chartRef.value, undefined, {
    renderer: 'canvas',
    width: 'auto',
    height: 'auto'
  })

  // 设置图表选项
  if (props.options) {
    chartInstance.setOption(props.options, true)
  }
}

/**
 * 处理尺寸变化
 */
const handleResize = (): void => {
  chartInstance?.resize()
}

/**
 * 清理资源
 */
const cleanup = (): void => {
  resizeObserver?.disconnect()
  resizeObserver = null

  chartInstance?.dispose()
  chartInstance = null
}

// 监听选项变化
watch(
  () => props.options,
  (newOptions) => {
    if (chartInstance && newOptions) {
      chartInstance.setOption(newOptions, true)
    }
  },
  { deep: false }
)

// 生命周期钩子
onMounted(async () => {
  await nextTick()

  // 使用 ResizeObserver 监听容器大小变化
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerRef.value)
  }

  // 延迟初始化，确保 DOM 已渲染
  setTimeout(initChart, 50)
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  handleResize,
  resize: handleResize
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.chart-canvas {
  width: 100%;
  height: 700px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 12px;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 768px) {
  .chart-canvas {
    height: 450px;
  }

  .chart-container {
    min-height: 450px;
  }
}
</style>