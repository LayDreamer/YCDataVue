
<template>
  <div class="dashboard">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <a-spin size="large" tip="加载中...">
        <div class="loading-content"></div>
      </a-spin>
    </div>
    
    <!-- 仪表盘内容 -->
    <div v-else class="dashboard-content">
      <div class="dashboard-header">
        <h2 class="dashboard-title">仪表盘</h2>
        <DashboardToolbar 
          :isRefreshing="isRefreshing"
          @refresh="handleRefresh"
          @export="exportChart"
        />
      </div>
      
      <!-- 统计卡片 -->
      <a-row :gutter="[16, 16]" class="dashboard-section">
        <a-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="item.title" class="stat-card-col">
          <StatCard 
            :title="item.title"
            :value="item.value"
            :prefix="item.prefix"
            :type="item.type"
          />
        </a-col>
      </a-row>

      <!-- 主要内容区域 -->
      <a-row :gutter="[16, 16]" style="margin-top: 24px;">
        <!-- 左侧区域：业务数据 -->
        <a-col :xs="24" :lg="16">
          <!-- 销售趋势和用户分布 -->
          <a-row :gutter="[16, 16]" class="dashboard-section">
            <a-col :xs="24" :md="12">
              <a-card title="销售趋势" :bordered="false" hoverable>
                <div class="chart-header">
                  <a-radio-group v-model:value="salesPeriod" @change="handleSalesPeriodChange" size="small">
                    <a-radio-button value="7">近7天</a-radio-button>
                    <a-radio-button value="30">近30天</a-radio-button>
                    <a-radio-button value="90">近90天</a-radio-button>
                  </a-radio-group>
                </div>
                <ChartComponent :option="salesChartOption" />
              </a-card>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-card title="用户分布" :bordered="false" hoverable>
                <div class="chart-header">
                  <a-select v-model:value="userType" @change="handleUserTypeChange" size="small" style="width: 120px;">
                    <a-option value="source">用户来源</a-option>
                    <a-option value="region">地区分布</a-option>
                    <a-option value="device">设备类型</a-option>
                  </a-select>
                </div>
                <ChartComponent :option="userChartOption" />
              </a-card>
            </a-col>
          </a-row>

          <!-- 热力图和雷达图 -->
          <a-row :gutter="[16, 16]" style="margin-top: 16px;" class="dashboard-section">
            <a-col :xs="24" :md="12">
              <a-card title="用户活跃度热力图" :bordered="false" hoverable>
                <ChartComponent :option="heatmapChartOption" />
              </a-card>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-card title="业务指标雷达图" :bordered="false" hoverable>
                <ChartComponent :option="radarChartOption" />
              </a-card>
            </a-col>
          </a-row>
        </a-col>

        <!-- 右侧区域：个人和项目信息 -->
        <a-col :xs="24" :lg="8">
          <!-- 个人工作台 -->
          <div class="dashboard-section">
            <PersonalWorkbench />
          </div>

          <!-- 项目进度 -->
          <div class="dashboard-section" style="margin-top: 16px;">
            <a-card title="项目进度" :bordered="false" hoverable>
              <div class="progress-item">
                <div class="progress-header">
                  <span>任务完成率</span>
                  <span class="progress-percent">80%</span>
                </div>
                <a-progress :percent="80" status="active" />
              </div>
              <div class="progress-item">
                <div class="progress-header">
                  <span>预算使用率</span>
                  <span class="progress-percent">45%</span>
                </div>
                <a-progress :percent="45" />
              </div>
              <div class="progress-item">
                <div class="progress-header">
                  <span>客户满意度</span>
                  <span class="progress-percent">92%</span>
                </div>
                <a-progress :percent="92" :stroke-color="'#52c41a'" />
              </div>
            </a-card>
          </div>

          <!-- 最近订单 -->
          <div class="dashboard-section" style="margin-top: 16px;">
            <a-card title="最近订单" :bordered="false" hoverable>
              <a-list :data-source="orderList" :split="false">
                <template #renderItem="{ item }">
                  <a-list-item class="order-item">
                    <div class="order-info">
                      <span class="order-no">{{ item.no }}</span>
                      <span class="order-amount">{{ item.amount }}</span>
                      <span class="order-status" :class="'status-' + item.statusClass">{{ item.statusText }}</span>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-card>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import StatCard from '../components/StatCard.vue';
import ChartComponent from '../components/ChartComponent.vue';
import DashboardToolbar from '../components/DashboardToolbar.vue';
import PersonalWorkbench from '../components/PersonalWorkbench.vue';

// 订单数据
const orderList = ref([
  { no: 'ORD-202310001', amount: '¥ 123.45', statusText: '已完成', statusClass: 'completed' },
  { no: 'ORD-202310002', amount: '¥ 2,345.00', statusText: '处理中', statusClass: 'processing' },
  { no: 'ORD-202310003', amount: '¥ 876.50', statusText: '已取消', statusClass: 'cancelled' },
  { no: 'ORD-202310004', amount: '¥ 432.00', statusText: '已完成', statusClass: 'completed' },
  { no: 'ORD-202310005', amount: '¥ 1,299.90', statusText: '处理中', statusClass: 'processing' },
]);

// 状态管理
const salesPeriod = ref('30');
const userType = ref('source');
const isRefreshing = ref(false);
const isLoading = ref(true);

// 统计卡片数据
const statCards = ref([
  { title: '用户总数', value: 1234, prefix: '👥', type: 'user' },
  { title: '订单总数', value: 345, prefix: '📦', type: 'order' },
  { title: '收入总额', value: 234567, prefix: '💰', type: 'income' },
  { title: '访问量', value: 45600, prefix: '👀', type: 'visit' }
]);

// 图表数据生成函数
function generateSalesData(days) {
  const labels = [];
  const sales = [];
  const orders = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
    
    // 生成随机数据
    const baseSales = 100000;
    const baseOrders = 100;
    sales.push(Math.round(baseSales + Math.random() * 300000));
    orders.push(Math.round(baseOrders + Math.random() * 150));
  }
  
  return { labels, sales, orders };
}

function generateUserData(type) {
  switch (type) {
    case 'source':
      return {
        title: '用户来源',
        data: [
          { value: 300, name: '直接访问' },
          { value: 278, name: '邮件营销' },
          { value: 188, name: '联盟广告' },
          { value: 235, name: '搜索引擎' },
          { value: 342, name: '社交媒体' }
        ]
      };
    case 'region':
      return {
        title: '地区分布',
        data: [
          { value: 400, name: '北京' },
          { value: 300, name: '上海' },
          { value: 200, name: '广州' },
          { value: 150, name: '深圳' },
          { value: 350, name: '其他' }
        ]
      };
    case 'device':
      return {
        title: '设备类型',
        data: [
          { value: 500, name: '移动端' },
          { value: 300, name: 'PC端' },
          { value: 100, name: '平板' },
          { value: 50, name: '其他' }
        ]
      };
    default:
      return {
        title: '用户来源',
        data: [
          { value: 300, name: '直接访问' },
          { value: 278, name: '邮件营销' },
          { value: 188, name: '联盟广告' },
          { value: 235, name: '搜索引擎' },
          { value: 342, name: '社交媒体' }
        ]
      };
  }
}

function generateHeatmapData() {
  const data = [];
  const days = 7;
  const hours = 24;
  
  for (let i = 0; i < days; i++) {
    for (let j = 0; j < hours; j++) {
      // 生成随机活跃度数据，模拟用户行为
      let value;
      if (j >= 9 && j <= 18) {
        // 工作时间活跃度较高
        value = Math.round(50 + Math.random() * 50);
      } else if (j >= 19 && j <= 23) {
        // 晚上活跃度中等
        value = Math.round(30 + Math.random() * 40);
      } else {
        // 凌晨活跃度较低
        value = Math.round(0 + Math.random() * 20);
      }
      data.push([j, i, value]);
    }
  }
  
  return data;
}

function generateRadarData() {
  return {
    current: [85, 75, 90, 92, 78, 82],
    target: [100, 100, 100, 100, 100, 100]
  };
}

// 图表选项计算
const salesChartOption = computed(() => {
  const period = parseInt(salesPeriod.value);
  const data = generateSalesData(period);
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(item => {
          if (item.seriesName === '销售额') {
            result += `${item.marker}${item.seriesName}: ¥${item.value.toLocaleString()}<br/>`;
          } else {
            result += `${item.marker}${item.seriesName}: ${item.value}单<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: ['销售额', '订单量'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: data.labels
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '销售额',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '订单量',
        axisLabel: {
          formatter: '{value}单'
        }
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          opacity: 0.3
        },
        emphasis: {
          focus: 'series'
        },
        data: data.sales
      },
      {
        name: '订单量',
        type: 'line',
        yAxisIndex: 1,
        emphasis: {
          focus: 'series'
        },
        data: data.orders
      }
    ]
  };
});

const userChartOption = computed(() => {
  const data = generateUserData(userType.value);
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: data.title,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: data.data
      }
    ]
  };
});

const heatmapChartOption = computed(() => {
  const data = generateHeatmapData();
  
  return {
    tooltip: {
      position: 'top'
    },
    grid: {
      height: '60%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: ['1时', '2时', '3时', '4时', '5时', '6时', '7时', '8时', '9时', '10时', '11时', '12时', '13时', '14时', '15时', '16时', '17时', '18时', '19时', '20时', '21时', '22时', '23时', '24时'],
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [
      {
        name: '用户活跃度',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: '{c}'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
});

const radarChartOption = computed(() => {
  const data = generateRadarData();
  
  return {
    tooltip: {},
    legend: {
      data: ['当前值', '目标值'],
      top: 0
    },
    radar: {
      indicator: [
        { name: '销售额', max: 100 },
        { name: '订单量', max: 100 },
        { name: '用户增长', max: 100 },
        { name: '客户满意度', max: 100 },
        { name: '转化率', max: 100 },
        { name: '复购率', max: 100 }
      ]
    },
    series: [
      {
        name: '业务指标',
        type: 'radar',
        data: [
          {
            value: data.current,
            name: '当前值',
            areaStyle: {
              opacity: 0.3
            }
          },
          {
            value: data.target,
            name: '目标值',
            areaStyle: {
              opacity: 0.3
            }
          }
        ]
      }
    ]
  };
});

// 生命周期钩子
onMounted(() => {
  // 模拟初始加载
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
});

// 事件处理函数
function handleSalesPeriodChange() {
  // 图表会自动更新，因为使用了computed
}

function handleUserTypeChange() {
  // 图表会自动更新，因为使用了computed
}

function handleRefresh() {
  isRefreshing.value = true;
  
  // 模拟数据刷新
  setTimeout(() => {
    // 重新生成数据
    salesPeriod.value = salesPeriod.value; // 触发computed更新
    userType.value = userType.value; // 触发computed更新
    isRefreshing.value = false;
  }, 1000);
}

function exportChart(type) {
  // 由于使用了组件化，导出功能需要在ChartComponent中实现
  // 这里可以添加导出逻辑，或者在ChartComponent中添加导出方法
  console.log('导出图表:', type);
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  position: relative;
}

/* 加载状态 */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(245, 247, 250, 0.9);
  z-index: 1000;
}

.loading-content {
  width: 200px;
  height: 200px;
}

/* 仪表盘内容 */
.dashboard-content {
  animation: fadeIn 0.8s ease-out;
}

.dashboard-section {
  animation: fadeIn 0.8s ease-out;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.dashboard-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-title {
  font-weight: 600;
  font-size: 32px;
  color: #1f2f3d;
  margin: 0;
  animation: slideInLeft 0.5s ease-out;
}

/* 统计卡片列 */
.stat-card-col {
  animation: slideInUp 0.6s ease-out;
}

.stat-card-col:nth-child(1) {
  animation-delay: 0.1s;
}

.stat-card-col:nth-child(2) {
  animation-delay: 0.2s;
}

.stat-card-col:nth-child(3) {
  animation-delay: 0.3s;
}

.stat-card-col:nth-child(4) {
  animation-delay: 0.4s;
}

/* 卡片动画 */
.a-card {
  animation: slideInUp 0.6s ease-out;
}

.a-card:nth-child(1) {
  animation-delay: 0.2s;
}

.a-card:nth-child(2) {
  animation-delay: 0.3s;
}

.a-card:nth-child(3) {
  animation-delay: 0.4s;
}

.a-card:nth-child(4) {
  animation-delay: 0.5s;
}

/* 图表样式 */
.chart-container {
  width: 100%;
  height: 300px;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 进度条样式 */
.progress-item {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.progress-percent {
  color: #1890ff;
  font-weight: 600;
}

/* 订单列表样式 */
.order-item {
  padding: 12px 0;
  transition: all 0.2s ease;
}

.order-item:hover {
  background-color: #f0f5ff;
  border-radius: 8px;
  padding-left: 12px;
}

.order-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.order-no {
  font-weight: 500;
  color: #1890ff;
  flex: 1;
}

.order-amount {
  color: #52c41a;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.order-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
  text-align: right;
}

.status-completed {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-processing {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.status-cancelled {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .dashboard-title {
    font-size: 24px;
    margin: 0;
  }
  .dashboard-toolbar {
    width: 100%;
    justify-content: space-between;
  }
  .chart-container {
    height: 250px;
  }
  .chart-header {
    justify-content: center;
  }
  .order-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .order-no,
  .order-amount,
  .order-status {
    text-align: left;
    flex: none;
  }
}

@media (max-width: 480px) {
  .dashboard-title {
    font-size: 20px;
  }
  .chart-container {
    height: 200px;
  }
  .progress-item {
    margin-bottom: 16px;
  }
}
</style>