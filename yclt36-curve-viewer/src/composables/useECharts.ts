import { watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue';
import { init } from 'echarts/core';
import type { EChartsType } from 'echarts/core';
import type { EChartsOption } from 'echarts';
import '@/plugins/echarts';

/**
 * 统一管理 ECharts 实例的生命周期：初始化、容器尺寸自适应、配置更新与销毁。
 * 用法：
 *   const { resize } = useECharts(containerRef, chartRef, toRef(props, 'options'))
 */
export function useECharts(
  containerRef: Ref<HTMLElement | null>,
  chartRef: Ref<HTMLElement | null>,
  options: Ref<EChartsOption>
) {
  let chartInstance: EChartsType | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let initTimer: number | undefined;

  const handleResize = (): void => {
    chartInstance?.resize();
  };

  const initChart = (): void => {
    if (!chartRef.value) return;
    chartInstance = init(chartRef.value, undefined, {
      renderer: 'canvas',
      width: 'auto',
      height: 'auto'
    });
    if (options.value) {
      chartInstance.setOption(options.value, true);
    }
  };

  const cleanup = (): void => {
    if (initTimer) window.clearTimeout(initTimer);
    resizeObserver?.disconnect();
    resizeObserver = null;
    chartInstance?.dispose();
    chartInstance = null;
  };

  onMounted(async () => {
    await nextTick();
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(containerRef.value);
    }
    // 延迟初始化，确保 DOM 已渲染（与原组件行为一致）
    initTimer = window.setTimeout(initChart, 50);
  });

  onUnmounted(cleanup);

  watch(
    options,
    (newOptions) => {
      if (chartInstance && newOptions) {
        chartInstance.setOption(newOptions, true);
      }
    },
    { deep: false }
  );

  return {
    handleResize,
    resize: handleResize,
    getInstance: () => chartInstance
  };
}
