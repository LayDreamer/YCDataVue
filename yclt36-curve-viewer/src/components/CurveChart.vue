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
import { ref, toRef } from 'vue';
import type { EChartsOption } from 'echarts';
import { useECharts } from '@/composables/useECharts';

/**
 * 图表组件属性
 */
interface Props {
  options: EChartsOption;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
});

// DOM 引用
const containerRef = ref<HTMLElement | null>(null);
const chartRef = ref<HTMLElement | null>(null);

// ECharts 实例生命周期统一由 composable 管理（init / resize / watch / dispose）
const { handleResize, resize } = useECharts(containerRef, chartRef, toRef(props, 'options'));

// 暴露方法给父组件（与旧实现保持一致）
defineExpose({
  handleResize,
  resize
});
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
