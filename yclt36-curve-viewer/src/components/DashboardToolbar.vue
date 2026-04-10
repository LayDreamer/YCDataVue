<template>
  <div class="dashboard-toolbar">
    <a-button type="primary" @click="onRefresh" icon="sync" :loading="isRefreshing" class="refresh-button">
      刷新数据
    </a-button>
    <a-dropdown :trigger="['click']" style="margin-left: 8px;">
      <a-button icon="download" class="export-button">
        导出
        <a-icon type="down" />
      </a-button>
      <template #overlay>
        <a-menu>
          <a-menu-item @click="onExport('sales')">
            <a-icon type="line-chart" /> 导出销售趋势
          </a-menu-item>
          <a-menu-item @click="onExport('user')">
            <a-icon type="pie-chart" /> 导出用户分布
          </a-menu-item>
          <a-menu-item @click="onExport('heatmap')">
            <a-icon type="heat-map" /> 导出活跃度热力图
          </a-menu-item>
          <a-menu-item @click="onExport('radar')">
            <a-icon type="radar-chart" /> 导出业务指标雷达图
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup>
const props = defineProps({
  isRefreshing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['refresh', 'export']);

function onRefresh() {
  emit('refresh');
}

function onExport(type) {
  emit('export', type);
}
</script>

<style scoped>
.dashboard-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideInRight 0.5s ease-out;
}

.refresh-button,
.export-button {
  transition: all 0.3s ease;
}

.refresh-button:hover,
.export-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>