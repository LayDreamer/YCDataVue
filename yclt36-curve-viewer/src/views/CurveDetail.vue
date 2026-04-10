<template>
  <a-layout class="app-container">
    <!-- 顶部导航栏 -->
    <div class="top-navigation">
      <div class="nav-content">
        <a-button type="text" @click="goBack" class="back-button">
          <template #icon>
            <LeftOutlined />
          </template>
          <span class="back-text">返回</span>
        </a-button>
        
        <div class="page-title">
          <h2>曲线详情</h2>
          <span class="page-subtitle">工单号: {{ recordData?.workOrderNumber || '加载中...' }}</span>
          <span class="page-subtitle">比例阀编号: {{ recordData?.blfNumber || '加载中...' }}</span>
        </div>
        
        <div class="nav-controls">
          <a-button 
            type="text" 
            @click="toggleDataSidebar" 
            class="sidebar-toggle"
            :class="{ 'active': !isDataSidebarCollapsed }"
          >
            <template #icon>
              <DatabaseOutlined />
            </template>
            <span class="toggle-text">数据列表</span>
          </a-button>
        </div>
      </div>
    </div>

    <a-layout class="main-layout">
      <!-- 主内容区域 -->
      <a-layout-content class="main-content">
        <div class="chart-wrapper">
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title-section">
                <h3 class="chart-title">
                  <LineChartOutlined />
                  <span>特性曲线 - {{ curveIndex === 'pressureFlowRateCurve' ? '压力流量' : '电流流量' }}</span>
                </h3>
              </div>
            </div>
            <a-card class="chart-card" :bordered="false">
              <div class="chart-section">
                <!-- 这里的 CurveChart 组件内部需要处理 options 变化 -->
                <CurveChart 
                  :options="chartOptions" 
                  :is-loading="isLoading" 
                  ref="chartRef" 
                />
              </div>              
            </a-card>
          </div>
        </div>
      </a-layout-content>

      <!-- 数据列表侧边栏 -->
      <a-layout-sider 
        class="right-sidebar data-sidebar" 
        :width="400" 
        theme="light" 
        collapsed-width="0"
        v-model:collapsed="isDataSidebarCollapsed" 
        :trigger="null" 
        collapsible
      >
        <div class="sidebar-header">
          <div class="chart-title-section">
            <h3 class="chart-title">
              <DatabaseOutlined />
              <span>数据列表</span>
            </h3>
          </div>
        </div>
        
        <div class="sidebar-content">
          <a-table 
            :columns="tableColumns" 
            :data-source="tableData"
            :pagination="{ 
              pageSize: 10, 
              showTotal: (total) => `共 ${total} 条数据` 
            }" 
            :loading="isLoading" 
            size="middle"
            bordered 
            :scroll="{ y: 'calc(100vh - 280px)' }" 
            class="data-table"
          />
        </div>
      </a-layout-sider>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef, inject, onActivated, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import type { EChartsOption } from 'echarts';
import { LeftOutlined, DatabaseOutlined, LineChartOutlined } from '@ant-design/icons-vue'
import CurveChart from '@/components/CurveChart.vue'
import { useChartOptions } from '@/composables/useChartOptions'
import { blfParameterService, type BLFParameter } from '@/services/blfParameterService'

// 路由和导航
const route = useRoute()
const router = useRouter()

// 状态管理
const isLoading = ref(false)
const chartRef = ref()
const isDataSidebarCollapsed = ref(false)
const chartOptions = shallowRef<EChartsOption | null>(null)
const recordData = ref<BLFParameter | null>(null)

// 从路由参数获取数据 (实时计算)
const blfNumber = computed(() => route.query.id as string)
const curveIndex = computed(() => route.query.index as string)

// 表格列定义
const tableColumns = computed<TableColumnsType>(() => {
  const isPressureCurve = curveIndex.value === 'pressureFlowRateCurve'
  return [
    { title: '序号', dataIndex: 'index', key: 'index', width: 60, align: 'center', fixed: 'left' },
    { 
      title: isPressureCurve ? '压力值 (Pa)' : '电流值 (A)',
      dataIndex: isPressureCurve ? 'pressure' : 'current', 
      key: isPressureCurve ? 'pressure' : 'current', 
      align: 'right', width: 120
    },
    { title: '流量值 (L/min)', dataIndex: 'flow', key: 'flow', align: 'right', width: 120 }
  ]
})

// 表格数据处理
const tableData = computed(() => {
  if (!recordData.value) return []
  const dataSource = curveIndex.value === 'pressureFlowRateCurve' 
    ? recordData.value.pressureFlowRateCurve 
    : recordData.value.currentFlowRateCurve
  
  if (!dataSource || !dataSource.length) return []

  return dataSource.map((item, index) => ({
    key: index,
    index: index + 1,
    current: (item as any).current?.toFixed(3) || '0.000',
    pressure: (item as any).pressure?.toFixed(3) || '0.000',
    flow: item.flowRate?.toFixed(2) || '0.00'
  }))
})

// 数据加载核心逻辑
const loadData = async () => {
  // 多标签页模式下，非当前活跃页不跑逻辑
  if (route.name !== 'CurveDetail') return; 
  if (!blfNumber.value) return;

  isLoading.value = true
  try {
    const data = await blfParameterService.getByNumber(blfNumber.value)
    if (data) {
      recordData.value = data
      updateChartOptions()
    }
  } catch (error) {
    message.error('加载曲线数据失败')
  } finally {
    isLoading.value = false
  }
}

// 更新图表配置
const updateChartOptions = () => {
  // 如果 recordData 本身就是空的，确保 options 也为空
  if (!recordData.value) {
    chartOptions.value = null;
    return;
  }

  const dataSource = curveIndex.value === 'pressureFlowRateCurve'
    ? recordData.value.pressureFlowRateCurve
    : recordData.value.currentFlowRateCurve

  // --- 【修改：核心修复】 ---
  if (!dataSource || dataSource.length === 0) {
    // 1. 设置为空对象 {}。这通常会触发子组件 ECharts 的 setOption({}, true) 从而清空画布
    chartOptions.value = {}; 
    
    // 2. 如果你的子组件 CurveChart 支持 ref 调用，也可以直接清空
    if (chartRef.value?.chartInstance) {
       chartRef.value.chartInstance.clear();
    }
    return;
  }
  // -------------------------

  const safeData = JSON.parse(JSON.stringify(dataSource))
  chartOptions.value = useChartOptions(safeData, curveIndex.value).createChartOptions.value
}

// 刷新图表尺寸 (关键：解决切换标签显示问题)
const refreshChart = () => {
  nextTick(() => {
    if (chartRef.value) {
      setTimeout(() => {
        chartRef.value?.resize?.()
      }, 150) // 延迟确保 DOM 容器完全展开
    }
  })
}

// 标签页切回来时触发
onActivated(() => {
  refreshChart()
})

// 导航操作
const closeTab = inject('closeTab') as (path?: string) => void;
const goBack = () => {
  const currentPath = route.fullPath; 
  router.push({ name: 'Products' }).then(() => {
    if (closeTab) closeTab(currentPath);
  });
}

const toggleDataSidebar = () => {
  isDataSidebarCollapsed.value = !isDataSidebarCollapsed.value
  refreshChart() // 侧边栏切换时重绘图表
}

// 生命周期
onMounted(async () => {
  await loadData()
})

// 监听路由参数：同时监听 ID 和 Index 的变化
watch(
  () => [route.query.id, route.query.index], 
  async ([newId, newIndex]) => {
    // 只有在当前组件确实处于活跃状态（当前路由）且参数有效时才触发
    if (newId && newIndex && route.name === 'CurveDetail') {
      await loadData()
      refreshChart()
    }
  }, 
  { immediate: false }
)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部导航栏 */
.top-navigation {
  background: white;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* 返回按钮样式 */
.back-button {
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  transition: all 0.2s;
}

.back-button:hover {
  background: #1890ff;
  color: #fff;
}

/* 页面标题 */
.page-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 4px;
}

/* 导航控件 */
.sidebar-toggle {
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
  background: #f1f5f9;
}

.sidebar-toggle.active {
  background: #1890ff;
  color: white;
}

/* 主布局 */
.main-layout {
  padding: 20px;
  gap: 16px;
  min-height: calc(100vh - 56px);
}

/* 图表区域 */
.chart-wrapper {
  flex: 1;
  min-width: 0;
}

.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-header {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.chart-section {
  height: calc(100vh - 220px);
  min-height: 400px;
  width: 100%;
  padding: 16px;
}

/* 侧边栏 */
.right-sidebar {
  background: white;
  border-left: 1px solid #f0f0f0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.03);
}

.sidebar-header {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-content {
  padding: 16px;
  height: calc(100% - 48px);
}

/* 响应式动画 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s;
}
.fade-slide-enter-from { opacity: 0; transform: translateX(-10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(10px); }
</style>