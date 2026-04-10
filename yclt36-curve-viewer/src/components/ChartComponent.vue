<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '300px'
  }
});

const chartRef = ref(null);
let chart = null;

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});

watch(() => props.option, (newOption) => {
  updateChart(newOption);
}, { deep: true });

function initChart() {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    updateChart(props.option);
  }
}

function updateChart(option) {
  if (chart) {
    chart.setOption(option);
  }
}

function handleResize() {
  chart?.resize();
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: v-bind(height);
}
</style>