<template>
  <div class="profit-analysis-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">💰 利润分红数据分析</h1>
        <p class="page-description">基于实际经营数据的投资回报分析与趋势预测</p>
      </div>
      <div class="header-right">
        <a-radio-group v-model:value="viewMode" size="small" button-style="solid">
          <a-radio-button value="analysis">分析视图</a-radio-button>
          <a-radio-button value="detail">明细视图</a-radio-button>
          <a-radio-button value="forecast">预测视图</a-radio-button>
        </a-radio-group>
        <a-button type="primary" @click="exportReport">
          <template #icon>📊</template> 导出报告
        </a-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <a-row :gutter="[16, 16]" class="kpi-section">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card primary" hoverable>
          <div class="kpi-icon">💵</div>
          <div class="kpi-value">{{ formatMoney(totalInvestment) }}</div>
          <div class="kpi-label">分红总额度</div>
          <div class="kpi-desc">一期30w(15%) + 二期50w(25%)</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card success" hoverable>
          <div class="kpi-icon">📈</div>
          <div class="kpi-value">{{ formatMoney(totalProfit) }}</div>
          <div class="kpi-label">累计总利润</div>
          <div class="kpi-trend up">↑ {{ profitGrowthRate }}% 环比</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card warning" hoverable>
          <div class="kpi-icon">🎯</div>
          <div class="kpi-value">{{ paybackPeriod }}</div>
          <div class="kpi-label">预期回本周期</div>
          <div class="kpi-desc">基于当前月均利润计算</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card info" hoverable>
          <div class="kpi-icon">📊</div>
          <div class="kpi-value">{{ roi }}%</div>
          <div class="kpi-label">投资回报率 (ROI)</div>
          <div class="kpi-trend up">年化收益率 {{ annualizedROI }}%</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 回本进度条 -->
    <a-card class="progress-card" style="margin-bottom: 16px;">
      <div class="payback-progress">
        <div class="progress-header">
          <span class="progress-title">回本进度追踪</span>
          <span class="progress-percent">{{ recoveryPercent.toFixed(1) }}%</span>
        </div>
        <a-progress 
          :percent="recoveryPercent" 
          :stroke-color="{ '0%': '#108ee9', '100%': '#87d068' }"
          status="active"
          :format="(percent) => `${percent}% 已回收`"
        />
        <div class="progress-info">
          <span>已分红: <strong>{{ formatMoney(totalDividend) }}</strong></span>
          <span>剩余: <strong>{{ formatMoney(Math.max(0, totalInvestment - totalDividend)) }}</strong></span>
          <span>预计完成: <strong>{{ estimatedPaybackDate }}</strong></span>
        </div>
      </div>
    </a-card>

    <!-- 主图表区域 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="16">
        <a-card title="📈 利润与分红趋势分析" class="chart-card">
          <template #extra>
            <a-space>
              <a-select v-model:value="chartType" style="width: 120px;" size="small">
                <a-select-option value="line">折线图</a-select-option>
                <a-select-option value="bar">柱状图</a-select-option>
              </a-select>
            </a-space>
          </template>
          <div ref="mainChartRef" class="chart-container"></div>
        </a-card>

        <a-row :gutter="[16, 16]" style="margin-top: 16px;">
          <a-col :span="24">
            <a-card title="🎯 分红占比堆叠图" class="chart-card">
              <div ref="stackChartRef" class="chart-container medium"></div>
            </a-card>
          </a-col>
          <a-col :span="24">
            <a-card title="👥 股东分红占比" class="chart-card">
              <div ref="pieChartRef" class="chart-container medium"></div>
            </a-card>
          </a-col>
        </a-row>
      </a-col>

      <a-col :xs="24" :lg="8">

        <a-card title="� 两期对比分析" class="chart-card compare-phase-card" style="margin-top: 16px;">
          <a-row :gutter="[12, 12]">
            <a-col :span="12">
              <div class="phase-box phase1">
                <div class="phase-title">一期 (前3月)</div>
                <div class="phase-stat"><span class="label">本金</span><strong>30万</strong></div>
                <div class="phase-stat"><span class="label">分红率</span><strong>15%</strong></div>
                <div class="phase-stat"><span class="label">累计分红</span><strong class="green">{{ formatMoney(phase1TotalDividend) }}</strong></div>
                <div class="phase-stat"><span class="label">月均分红</span><strong>{{ formatMoney(phase1AvgDividend) }}</strong></div>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="phase-box phase2">
                <div class="phase-title">二期 (后3月)</div>
                <div class="phase-stat"><span class="label">本金</span><strong>50万</strong></div>
                <div class="phase-stat"><span class="label">分红率</span><strong>25%</strong></div>
                <div class="phase-stat"><span class="label">累计分红</span><strong class="green">{{ formatMoney(phase2TotalDividend) }}</strong></div>
                <div class="phase-stat"><span class="label">月均分红</span><strong>{{ formatMoney(phase2AvgDividend) }}</strong></div>
              </div>
            </a-col>
          </a-row>
          <a-divider style="margin: 12px 0;" />
          <div class="phase-growth">
            <span>二期较一期月均增长:</span>
            <strong :class="phase2AvgDividend > phase1AvgDividend ? 'green' : 'red'">
              {{ phase1AvgDividend > 0 ? (((phase2AvgDividend - phase1AvgDividend) / phase1AvgDividend) * 100).toFixed(0) : 0 }}%
            </strong>
          </div>
        </a-card>

        <a-card title="� 分红规则说明" class="rule-card" style="margin-top: 16px;">
          <a-alert message="两期投资结构：一期本金30w(分红15%) → 二期新增20w(共50w, 分红25%)" type="info" show-icon style="margin-bottom: 16px;" />
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="一期 (前3月)">
              <a-tag color="blue">本金 30万 | 分红比例 15%</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="二期 (后3月)">
              <a-tag color="green">本金 50万 | 分红比例 25%</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="罪老婆">
              一期: 1/6 (≈16.7%) | 二期: 30%
            </a-descriptions-item>
            <a-descriptions-item label="罪+麦（额外）">
              <a-tag color="orange">仅二期参与，占 20%</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="小可爱">
              <a-tag color="blue">2w额度 [4%]</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="力孝">
              <a-tag color="purple">3w额度 [6%]</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="剩余分红">
              一期: 2/3 (≈66.7%) | 二期: 40%
            </a-descriptions-item>
            <a-descriptions-item label="累计总利润">
              <strong style="color: #1890ff;">{{ formatMoney(totalProfit) }}</strong>
            </a-descriptions-item>
            <a-descriptions-item label="累计总分红">
              <strong style="color: #52c41a;">{{ formatMoney(totalDividend) }}</strong>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据表格 -->
    <a-card title="📋 利润分红明细表" class="table-card" style="margin-top: 16px;">
      <template #extra>
        <a-space>
          <a-input-search v-model:value="searchText" placeholder="搜索..." style="width: 200px;" />
          <a-button type="primary" @click="showAddModal"><PlusOutlined /> 新增数据</a-button>
          <a-button danger @click="clearData"><DeleteOutlined /> 清除数据</a-button>
        </a-space>
      </template>
      
      <a-table
        :columns="tableColumns"
        :data-source="filteredData"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 1200 }"
        bordered
        size="middle"
        :row-class-name="getRowClassName"
        summary
      >
        <template #summaryCell="{ column, record }">
          <template v-if="column.dataIndex === 'date'">
            <strong>合计 / 平均</strong>
          </template>
          <template v-else-if="column.dataIndex === 'totalProfit'">
            <strong>{{ formatMoney(totalProfit) }}</strong>
          </template>
          <template v-else-if="column.dataIndex === 'totalDividend'">
            <strong>{{ formatMoney(totalDividend) }}</strong>
          </template>
          <template v-else-if="column.dataIndex === 'profitMargin'">
            <strong>{{ avgProfitMargin }}%</strong>
          </template>
          <template v-else>
            <strong>{{ columnSummary(column) }}</strong>
          </template>
        </template>
        
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'totalProfit'">
            <span class="money-positive">{{ formatMoney(record.totalProfit) }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'profitMargin'">
            <a-progress 
              :percent="record.profitMargin" 
              size="small" 
              :status="record.profitMargin > 20 ? 'success' : 'normal'"
            />
          </template>
          <template v-else-if="['xulao', 'zuimai', 'xiaokeai', 'lixiao', 'remaining'].includes(column.dataIndex)">
            <span :class="record[column.dataIndex] > 0 ? 'money-positive' : ''">
              {{ record[column.dataIndex] > 0 ? formatMoney(record[column.dataIndex]) : '-' }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 预测分析面板 -->
    <a-card title="🔮 趋势预测与建议" class="forecast-card" style="margin-top: 16px;">
      <a-row :gutter="[24, 16]">
        <a-col :xs="24" :md="8">
          <div class="forecast-item">
            <h4>📅 回本时间预测</h4>
            <div class="forecast-value">{{ estimatedPaybackDate }}</div>
            <p>按当前月均分红 {{ formatMoney(monthlyAvgDividend) }} 计算</p>
            <a-statistic 
              title="还需分红" 
              :value="Math.max(0, totalInvestment - totalDividend)" 
              :precision="0"
              prefix="¥"
              :value-style="{ color: totalDividend >= totalInvestment ? '#52c41a' : '#1890ff' }"
            />
          </div>
        </a-col>
        <a-col :xs="24" :md="8">
          <div class="forecast-item">
            <h4>📈 年度收益预测</h4>
            <div class="forecast-value">{{ formatMoney(yearlyForecast) }}</div>
            <p>基于近3个月趋势线性外推</p>
            <a-statistic 
              title="年化ROI" 
              :value="annualizedROI" 
              suffix="%"
              precision="1"
              :value-style="{ color: annualizedROI > 30 ? '#52c41a' : '#faad14' }"
            />
          </div>
        </a-col>
        <a-col :xs="24" :md="8">
          <div class="forecast-item">
            <h4>⚠️ 风险提示</h4>
            <div class="risk-level" :class="riskLevelClass">
              {{ riskLevel }}
            </div>
            <a-alert 
              :message="riskMessage" 
              :type="riskAlertType" 
              show-icon 
              style="margin-top: 12px;"
            />
          </div>
        </a-col>
      </a-row>
    </a-card>

    <!-- 月度对比分析 -->
    <a-card title="📊 月度环比分析" class="compare-card" style="margin-top: 16px;">
      <div ref="compareChartRef" class="chart-container large"></div>
    </a-card>

    <!-- 新增数据模态框 -->
    <a-modal
      v-model:open="addModalVisible"
      title="新增利润分红数据"
      width="500px"
      @ok="handleAddData"
      @cancel="addModalVisible = false"
    >
      <a-form :model="newDataForm" :rules="addFormRules" ref="addFormRef">
        <a-form-item label="月份" name="date" required>
          <a-date-picker
            v-model:value="datePickerValue"
            picker="month"
            format="YY.MM"
            style="width: 100%"
            @change="handleDateChange"
          />
        </a-form-item>
        <a-form-item label="总利润" name="totalProfit" required>
          <a-input-number
            v-model:value="newDataForm.totalProfit"
            style="width: 100%"
            :min="0"
            placeholder="请输入总利润"
          />
        </a-form-item>
        <a-form-item label="投资期" name="phase">
          <a-select v-model:value="newDataForm.phase" style="width: 100%" disabled>
            <a-select-option value="二期">二期</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改数据模态框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="修改利润分红数据"
      width="500px"
      @ok="handleEditData"
      @cancel="editModalVisible = false"
    >
      <a-form :model="editDataForm" :rules="editFormRules" ref="editFormRef">
        <a-form-item label="月份" name="date" required>
          <a-input v-model:value="editDataForm.date" disabled />
        </a-form-item>
        <a-form-item label="总利润" name="totalProfit" required>
          <a-input-number
            v-model:value="editDataForm.totalProfit"
            style="width: 100%"
            :min="0"
            placeholder="请输入总利润"
          />
        </a-form-item>
        <a-form-item label="投资期" name="phase">
          <a-select v-model:value="editDataForm.phase" style="width: 100%" disabled>
            <a-select-option value="一期">一期</a-select-option>
            <a-select-option value="二期">二期</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const viewMode = ref('analysis');
const chartType = ref('line');
const searchText = ref('');
const mainChartRef = ref(null);
const stackChartRef = ref(null);
const pieChartRef = ref(null);
const compareChartRef = ref(null);

let mainChart = null;
let stackChart = null;
let pieChart = null;
let compareChart = null;

const totalInvestment = 500000;

// 本地存储键名
const STORAGE_KEY = 'profit_analysis_data';

// 新增数据相关
const addModalVisible = ref(false);
const addFormRef = ref(null);
const newDataForm = ref({
  date: '',
  totalProfit: null,
  phase: '二期'
});

const datePickerValue = ref(null);

// 修改数据相关
const editModalVisible = ref(false);
const editFormRef = ref(null);
const editDataForm = ref({
  date: '',
  totalProfit: null,
  phase: '二期'
});

const editFormRules = ref({
  totalProfit: [
    { required: true, message: '请输入总利润', trigger: 'blur' },
    { type: 'number', min: 0, message: '总利润必须大于等于0', trigger: 'blur' }
  ]
});

// 响应式数据源
const rawData = ref([
  { date: '25.11', totalProfit: 40934, totalDividend: 6140, xulao: 1023, zuimai: 0, xiaokeai: 409, lixiao: 614, remaining: 4094, phase: '一期', capital: 300000, rate: 0.15 },  
  { date: '25.12', totalProfit: 62667, totalDividend: 9400, xulao: 1567, zuimai: 0, xiaokeai: 627, lixiao: 940, remaining: 6266, phase: '一期', capital: 300000, rate: 0.15 },
  { date: '26.01', totalProfit: 66534, totalDividend: 9980, xulao: 1663, zuimai: 0, xiaokeai: 665, lixiao: 998, remaining: 6654, phase: '一期', capital: 300000, rate: 0.15 },
  { date: '26.02', totalProfit: 60140, totalDividend: 12029, xulao: 3008, zuimai: 1504, xiaokeai: 601, lixiao: 902, remaining: 6014, phase: '二期', capital: 500000, rate: 0.25 },
  { date: '26.03', totalProfit: 68000, totalDividend: 17000, xulao: 5100, zuimai: 3400, xiaokeai: 680, lixiao: 1020, remaining: 6800, phase: '二期', capital: 500000, rate: 0.25 },
  { date: '26.04', totalProfit: 62875, totalDividend: 15719, xulao: 4716, zuimai: 3144, xiaokeai: 629, lixiao: 943, remaining: 6288, phase: '二期', capital: 500000, rate: 0.25 },
]);

// 计算最近的月份
function getLatestMonth() {
  if (rawData.value.length === 0) return null;
  
  // 将日期转换为可比较的格式（YYYYMM）
  const dates = rawData.value.map(item => {
    const [year, month] = item.date.split('.');
    return parseInt(`20${year}${month}`, 10);
  });
  
  const maxDate = Math.max(...dates);
  const year = String(maxDate).slice(2, 4);
  const month = String(maxDate).slice(4);
  return `${year}.${month}`;
}

// 比较两个月份字符串，返回true如果第一个月份大于第二个
function isMonthGreater(month1, month2) {
  const [year1, monthNum1] = month1.split('.').map(Number);
  const [year2, monthNum2] = month2.split('.').map(Number);
  
  if (year1 > year2) return true;
  if (year1 === year2 && monthNum1 > monthNum2) return true;
  return false;
}

const addFormRules = ref({
  date: [
    { required: true, message: '请选择月份', trigger: 'change' },
    {
      validator: (_, value, callback) => {
        const isDuplicate = rawData.value.some(item => item.date === value);
        if (isDuplicate) {
          callback(new Error('该月份数据已存在'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    },
    {
      validator: (_, value, callback) => {
        const latestMonth = getLatestMonth();
        if (latestMonth && !isMonthGreater(value, latestMonth)) {
          callback(new Error(`请选择大于 ${latestMonth} 的月份`));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ],
  totalProfit: [
    { required: true, message: '请输入总利润', trigger: 'blur' },
    { type: 'number', min: 0, message: '总利润必须大于等于0', trigger: 'blur' }
  ]
});

const filteredData = computed(() => {
  if (!searchText.value) return rawData.value;
  return rawData.value.filter(item => 
    item.date.includes(searchText.value) ||
    item.totalProfit.toString().includes(searchText.value)
  );
});

const totalProfit = computed(() => rawData.value.reduce((sum, item) => sum + item.totalProfit, 0));
const totalDividend = computed(() => rawData.value.reduce((sum, item) => sum + item.totalDividend, 0));

const monthlyAvgDividend = computed(() => {
  return rawData.value.length > 0 ? totalDividend.value / rawData.value.length : 0;
});

const phase1Data = computed(() => rawData.value.filter(d => d.phase === '一期'));
const phase2Data = computed(() => rawData.value.filter(d => d.phase === '二期'));

const phase1TotalDividend = computed(() => phase1Data.value.reduce((s, d) => s + d.totalDividend, 0));
const phase2TotalDividend = computed(() => phase2Data.value.reduce((s, d) => s + d.totalDividend, 0));
const phase1AvgDividend = computed(() => phase1Data.value.length > 0 ? phase1TotalDividend.value / phase1Data.value.length : 0);
const phase2AvgDividend = computed(() => phase2Data.value.length > 0 ? phase2TotalDividend.value / phase2Data.value.length : 0);

const recoveryPercent = computed(() => Math.min((totalDividend.value / totalInvestment) * 100, 100));

const paybackPeriod = computed(() => {
  const months = monthlyAvgDividend.value > 0 ? Math.ceil((totalInvestment - totalDividend.value) / monthlyAvgDividend.value) : Infinity;
  return months === Infinity ? '无法预估' : `约 ${months} 个月`;
});

const estimatedPaybackDate = computed(() => {
  if (totalDividend.value >= totalInvestment) return '✅ 已回本';
  const months = monthlyAvgDividend.value > 0 ? Math.ceil((totalInvestment - totalDividend.value) / monthlyAvgDividend.value) : 999;
  const now = new Date();
  now.setMonth(now.getMonth() + months);
  return now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
});

const roi = computed(() => ((totalDividend.value - totalInvestment) / totalInvestment * 100).toFixed(1));
const annualizedROI = computed(() => (monthlyAvgDividend.value * 12 / totalInvestment * 100).toFixed(1));
const yearlyForecast = computed(() => monthlyAvgDividend.value * 12);

const profitGrowthRate = computed(() => {
  const lastTwo = rawData.value.slice(-2);
  if (lastTwo.length < 2) return 0;
  return (((lastTwo[1].totalDividend - lastTwo[0].totalDividend) / lastTwo[0].totalDividend) * 100).toFixed(1);
});

const avgProfitMargin = computed(() => {
  const valid = rawData.value.filter(d => d.totalProfit > 0);
  return valid.length > 0 ? (valid.reduce((s, d) => s + d.profitMargin, 0) / valid.length).toFixed(1) : 0;
}).value;

// 初始化利润率
rawData.value.forEach(item => {
  item.profitMargin = item.totalProfit > 0 ? Number(((item.totalDividend / item.totalProfit) * 100).toFixed(1)) : 0;
});

const riskLevel = computed(() => {
  if (monthlyAvgDividend.value >= 12000) return '低风险';
  if (monthlyAvgDividend.value >= 8000) return '中风险';
  return '较高风险';
});

const riskLevelClass = computed(() => ({
  'low': riskLevel.value === '低风险',
  'medium': riskLevel.value === '中风险',
  'high': riskLevel.value === '较高风险'
}));

const riskMessage = computed(() => {
  if (monthlyAvgDividend.value >= 12000) return '分红稳定增长，回本周期合理，投资回报良好';
  if (monthlyAvgDividend.value >= 8000) return '分红水平中等，需关注经营稳定性';
  return '分红波动较大，建议优化经营策略，提高收入稳定性';
});

const riskAlertType = computed(() => {
  if (monthlyAvgDividend.value >= 12000) return 'success';
  if (monthlyAvgDividend.value >= 8000) return 'warning';
  return 'error';
});

const tableColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 90, fixed: 'left' },
  { title: '投资期', dataIndex: 'phase', key: 'phase', width: 80,
    customRender: ({ text }) => h('a-tag', { color: text === '一期' ? 'blue' : 'green' }, text)
  },
  { title: '总利润', dataIndex: 'totalProfit', key: 'totalProfit', width: 120, sorter: (a, b) => a.totalProfit - b.totalProfit },
  { title: '分红率', dataIndex: 'rate', key: 'rate', width: 80, customRender: ({ text }) => `${(text * 100).toFixed(0)}%` },
  { title: '总分红', dataIndex: 'totalDividend', key: 'totalDividend', width: 80 },
  { title: '罪老婆', dataIndex: 'xulao', key: 'xulao', width: 80 },
  { title: '罪+麦', dataIndex: 'zuimai', key: 'zuimai', width: 80 },
  { title: '小可爱', dataIndex: 'xiaokeai', key: 'xiaokeai', width: 80 },
  { title: '力孝', dataIndex: 'lixiao', key: 'lixiao', width: 80 },
  { title: '剩余', dataIndex: 'remaining', key: 'remaining', width: 80 },
  
  { title: '操作', key: 'action', width: 160, fixed: 'right',
    customRender: ({ record }) => {
      return h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0' } }, [
        h('button', {
          style: {
            flex: 1,
            textAlign: 'center',
            borderRadius: '6px',
            fontSize: '12px',
            height: '28px',
            lineHeight: '28px',
            border: '1px solid #1890ff',
            backgroundColor: '#1890ff',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          },
          onMouseEnter: (e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.3)';
          },
          onMouseLeave: (e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          },
          onClick: () => handleEdit(record)
        }, '修改'),
        h('button', {
          style: {
            flex: 1,
            textAlign: 'center',
            borderRadius: '6px',
            fontSize: '12px',
            height: '28px',
            lineHeight: '28px',
            border: '1px solid #ff4d4f',
            backgroundColor: '#ff4d4f',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          },
          onMouseEnter: (e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 8px rgba(255, 77, 79, 0.3)';
          },
          onMouseLeave: (e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          },
          onClick: () => handleDelete(record)
        }, '删除')
      ]);
    }
  }
];

function formatMoney(num) {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getRowClassName(record, index) {
  return record.totalProfit === 0 ? 'zero-profit-row' : '';
}

function columnSummary(column) {
  const key = column.dataIndex;
  if (!key || ['date', 'totalProfit', 'totalDividend', 'profitMargin'].includes(key)) return '';
  const sum = rawData.reduce((s, r) => s + (r[key] || 0), 0);
  return formatMoney(sum);
}

function exportReport() {
  message.success('报告导出中...');
}



function showAddModal() {
  newDataForm.value = {
    date: '',
    totalProfit: null,
    phase: '二期'
  };
  datePickerValue.value = null;
  addModalVisible.value = true;
}

function handleDateChange(date) {
  if (date) {
    const year = date.year().toString().slice(2); // 取年份后两位
    const month = String(date.month() + 1).padStart(2, '0'); // 月份从0开始，所以加1
    newDataForm.value.date = `${year}.${month}`;
  } else {
    newDataForm.value.date = '';
  }
}

function handleAddData() {
  addFormRef.value.validate().then(() => {
    const { date, totalProfit } = newDataForm.value;
    
    // 计算分红数据（二期分红率25%）
    const totalDividend = Math.round(totalProfit * 0.25);
    const xulao = Math.round(totalDividend * 0.3); // 罪老婆 30%
    const zuimai = Math.round(totalDividend * 0.2); // 罪+麦 20%
    const xiaokeai = Math.round(totalDividend * 0.04); // 小可爱 4%
    const lixiao = Math.round(totalDividend * 0.06); // 力孝 6%
    const remaining = totalDividend - xulao - zuimai - xiaokeai - lixiao;
    
    // 计算利润率
    const profitMargin = totalProfit > 0 ? Number(((totalDividend / totalProfit) * 100).toFixed(1)) : 0;
    
    // 构建新数据对象
    const newData = {
      date,
      totalProfit,
      totalDividend,
      xulao,
      zuimai,
      xiaokeai,
      lixiao,
      remaining,
      phase: '二期',
      capital: 500000,
      rate: 0.25,
      profitMargin
    };
    
    // 添加到数据数组
    rawData.value.push(newData);
    
    // 保存数据到文件
    saveDataToFile();
    
    // 更新图表
    updateCharts();
    
    // 关闭模态框并重置表单
    addModalVisible.value = false;
    message.success('数据添加成功！');
  }).catch(error => {
    console.error('表单验证失败:', error);
  });
}

function updateCharts() {
  // 重新初始化所有图表
  setTimeout(() => {
    initMainChart();
    initStackChart();
    initPieChart();
    initCompareChart();
  }, 100);
}

// 从本地存储读取数据
function loadDataFromFile() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        rawData.value = parsedData;
        message.success('数据加载成功');
      }
    } else {
      // 本地存储不存在，写入初始数据
      saveDataToFile();
      message.info('数据不存在，已创建初始数据');
    }
  } catch (error) {
    console.error('读取数据失败:', error);
    message.error('读取数据失败，使用默认数据');
  }
}

// 保存数据到本地存储
function saveDataToFile() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData.value, null, 2));
    message.success('数据保存成功');
  } catch (error) {
    console.error('保存数据失败:', error);
    message.error('保存数据失败');
  }
}

// 清除数据
function clearData() {
  // 显示确认对话框
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    try {
      // 清除本地存储
      localStorage.removeItem(STORAGE_KEY);
      
      // 重置为初始数据
      rawData.value = [
        { date: '25.11', totalProfit: 40934, totalDividend: 6140, xulao: 1023, zuimai: 0, xiaokeai: 409, lixiao: 614, remaining: 4094, phase: '一期', capital: 300000, rate: 0.15 },        
        { date: '25.12', totalProfit: 62667, totalDividend: 9400, xulao: 1567, zuimai: 0, xiaokeai: 627, lixiao: 940, remaining: 6266, phase: '一期', capital: 300000, rate: 0.15 },
        { date: '26.01', totalProfit: 66534, totalDividend: 9980, xulao: 1663, zuimai: 0, xiaokeai: 665, lixiao: 998, remaining: 6654, phase: '一期', capital: 300000, rate: 0.15 },
        { date: '26.02', totalProfit: 60140, totalDividend: 12029, xulao: 3008, zuimai: 1504, xiaokeai: 601, lixiao: 902, remaining: 6014, phase: '二期', capital: 500000, rate: 0.25 },
        { date: '26.03', totalProfit: 68000, totalDividend: 17000, xulao: 5100, zuimai: 3400, xiaokeai: 680, lixiao: 1020, remaining: 6800, phase: '二期', capital: 500000, rate: 0.25 },
        { date: '26.04', totalProfit: 62875, totalDividend: 15719, xulao: 4716, zuimai: 3144, xiaokeai: 629, lixiao: 943, remaining: 6288, phase: '二期', capital: 500000, rate: 0.25 },
       
      ];
      
      // 重新计算利润率
      rawData.value.forEach(item => {
        item.profitMargin = item.totalProfit > 0 ? Number(((item.totalDividend / item.totalProfit) * 100).toFixed(1)) : 0;
      });
      
      // 保存初始数据到本地存储
      saveDataToFile();
      
      // 更新图表
      updateCharts();
      
      message.success('数据已清除，已恢复到初始状态！');
    } catch (error) {
      console.error('清除数据失败:', error);
      message.error('清除数据失败');
    }
  }
}

// 处理修改操作
function handleEdit(record) {
  // 填充表单数据
  editDataForm.value = {
    date: record.date,
    totalProfit: record.totalProfit,
    phase: record.phase
  };
  editModalVisible.value = true;
}

// 处理修改数据
function handleEditData() {
  editFormRef.value.validate().then(() => {
    const { date, totalProfit, phase } = editDataForm.value;
    
    // 计算分红数据
    const rate = phase === '二期' ? 0.25 : 0.15;
    const totalDividend = Math.round(totalProfit * rate);
    
    // 根据投资期计算各股东分红
    let xulao, zuimai, xiaokeai, lixiao, remaining;
    if (phase === '二期') {
      xulao = Math.round(totalDividend * 0.3); // 罪老婆 30%
      zuimai = Math.round(totalDividend * 0.2); // 罪+麦 20%
      xiaokeai = Math.round(totalDividend * 0.04); // 小可爱 4%
      lixiao = Math.round(totalDividend * 0.06); // 力孝 6%
      remaining = totalDividend - xulao - zuimai - xiaokeai - lixiao;
    } else {
      xulao = Math.round(totalDividend * (1/6)); // 罪老婆 1/6
      zuimai = 0; // 罪+麦 仅二期参与
      xiaokeai = Math.round(totalDividend * 0.04); // 小可爱 4%
      lixiao = Math.round(totalDividend * 0.06); // 力孝 6%
      remaining = totalDividend - xulao - zuimai - xiaokeai - lixiao;
    }
    
    // 计算利润率
    const profitMargin = totalProfit > 0 ? Number(((totalDividend / totalProfit) * 100).toFixed(1)) : 0;
    const capital = phase === '二期' ? 500000 : 300000;
    
    // 更新数据
    const index = rawData.value.findIndex(item => item.date === date);
    if (index !== -1) {
      rawData.value[index] = {
        ...rawData.value[index],
        totalProfit,
        totalDividend,
        xulao,
        zuimai,
        xiaokeai,
        lixiao,
        remaining,
        profitMargin
      };
      
      // 保存数据到本地存储
      saveDataToFile();
      
      // 更新图表
      updateCharts();
      
      // 关闭模态框
      editModalVisible.value = false;
      message.success('数据修改成功！');
    }
  }).catch(error => {
    console.error('表单验证失败:', error);
  });
}

// 处理删除操作
function handleDelete(record) {
  // 显示确认对话框
  if (confirm(`确定要删除 ${record.date} 的数据吗？`)) {
    try {
      // 从数据数组中删除记录
      const index = rawData.value.findIndex(item => item.date === record.date);
      if (index !== -1) {
        rawData.value.splice(index, 1);
        
        // 保存数据到本地存储
        saveDataToFile();
        
        // 更新图表
        updateCharts();
        
        message.success('数据删除成功！');
      }
    } catch (error) {
      console.error('删除数据失败:', error);
      message.error('删除数据失败');
    }
  }
}



function initCharts() {
  setTimeout(() => {
    initMainChart();
    initStackChart();
    initPieChart();
    initCompareChart();

    window.addEventListener('resize', handleResize);
  }, 200);
}

function handleResize() {
  mainChart?.resize();
  stackChart?.resize();
  pieChart?.resize();
  compareChart?.resize();
}

function initMainChart() {
  if (!mainChartRef.value) return;
  mainChartRef.value.style.width = '100%';
  mainChartRef.value.style.height = '380px';
  mainChart = echarts.init(mainChartRef.value);

  const dates = rawData.value.map(d => d.date);
  const profits = rawData.value.map(d => d.totalProfit);
  const dividends = rawData.value.map(d => d.totalDividend);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter(params) {
        let html = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(p => {
          html += `${p.marker}${p.seriesName}: ¥${Number(p.value).toLocaleString()}<br/>`;
        });
        const idx = dates.indexOf(params[0].axisValue);
        if (idx >= 0 && rawData.value[idx]) {
          html += `<hr/><small>分红比例: ${rawData.value[idx].profitMargin}%</small>`;
        }
        return html;
      }
    },
    legend: { data: ['总利润', '总分红'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30 } },
    yAxis: [
      { type: 'value', name: '金额(元)', axisLabel: { formatter: val => (val / 10000).toFixed(0) + 'w' } },
      { type: 'value', name: '分红比例%', max: 25, position: 'right' }
    ],
    series: [
      {
        name: '总利润',
        type: chartType.value,
        data: profits,
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: chartType.value === 'line' ? { opacity: 0.12 } : undefined,
        barMaxWidth: 40
      },
      {
        name: '总分红',
        type: chartType.value,
        data: dividends,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: chartType.value === 'line' ? { opacity: 0.08 } : undefined,
        barMaxWidth: 40
      },
      {
        name: '分红比例',
        type: 'line',
        yAxisIndex: 1,
        data: rawData.value.map(d => d.profitMargin),
        lineStyle: { type: 'dashed', color: '#faad14' },
        itemStyle: { color: '#faad14' },
        symbol: 'diamond',
        symbolSize: 8
      }
    ]
  };
  mainChart.setOption(option);
}

function initStackChart() {
  if (!stackChartRef.value) return;
  stackChartRef.value.style.width = '100%';
  stackChartRef.value.style.height = '280px';
  stackChart = echarts.init(stackChartRef.value);

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['罪老婆', '罪+麦', '小可爱', '力孝', '剩余'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '14%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: rawData.value.map(d => d.date), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}' } },
    series: [
      { name: '罪老婆', type: 'bar', stack: 'total', data: rawData.value.map(d => d.xulao), itemStyle: { color: '#ff4d4f' } },
      { name: '罪+麦', type: 'bar', stack: 'total', data: rawData.value.map(d => d.zuimai), itemStyle: { color: '#faad14' } },
      { name: '小可爱', type: 'bar', stack: 'total', data: rawData.value.map(d => d.xiaokeai), itemStyle: { color: '#1890ff' } },
      { name: '力孝', type: 'bar', stack: 'total', data: rawData.value.map(d => d.lixiao), itemStyle: { color: '#722ed1' } },
      { name: '剩余', type: 'bar', stack: 'total', data: rawData.value.map(d => d.remaining), itemStyle: { color: '#13c2c2' } }
    ]
  };
  stackChart.setOption(option);
}

function initPieChart() {
  if (!pieChartRef.value) return;
  pieChartRef.value.style.width = '100%';
  pieChartRef.value.style.height = '280px';
  pieChart = echarts.init(pieChartRef.value);

  const totalXulao = rawData.value.reduce((s, d) => s + d.xulao, 0);
  const totalZuimai = rawData.value.reduce((s, d) => s + d.zuimai, 0);
  const totalXiaokeai = rawData.value.reduce((s, d) => s + d.xiaokeai, 0);
  const totalLixiao = rawData.value.reduce((s, d) => s + d.lixiao, 0);
  const totalRemaining = rawData.value.reduce((s, d) => s + d.remaining, 0);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['55%', '50%'],
      avoidLabelOverlap: false,
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: totalXulao, name: '罪老婆 [30%]', itemStyle: { color: '#ff4d4f' } },
        { value: totalZuimai, name: '罪+麦 [额外]', itemStyle: { color: '#faad14' } },
        { value: totalXiaokeai, name: '小可爱 [2w]', itemStyle: { color: '#1890ff' } },
        { value: totalLixiao, name: '力孝 [3w]', itemStyle: { color: '#722ed1' } },
        { value: totalRemaining, name: '剩余 [40%]', itemStyle: { color: '#13c2c2' } }
      ],
      label: { show: false }
    }]
  };
  pieChart.setOption(option);
}

function initCompareChart() {
  if (!compareChartRef.value) return;
  compareChartRef.value.style.width = '100%';
  compareChartRef.value.style.height = '320px';
  compareChart = echarts.init(compareChartRef.value);

  const validData = rawData.value.filter(d => d.totalProfit > 0);
  const momChanges = [];
  for (let i = 1; i < validData.length; i++) {
    const prev = validData[i - 1];
    const curr = validData[i];
    const change = (((curr.totalProfit - prev.totalProfit) / prev.totalProfit) * 100).toFixed(1);
    momChanges.push({ date: curr.date, change: parseFloat(change), profit: curr.totalProfit });
  }

  const option = {
    tooltip: { trigger: 'axis', formatter: p => `${p[0].name}<br/>环比: ${p[0].value}%<br/>利润: ¥${momChanges.find(m => m.date === p[0].name)?.profit?.toLocaleString()}` },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: momChanges.map(d => d.date) },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, name: '环比增长率' },
    series: [{
      type: 'bar',
      data: momChanges.map(d => ({
        value: d.change,
        itemStyle: { color: d.change >= 0 ? '#52c41a' : '#ff4d4f' }
      })),
      barMaxWidth: 50,
      label: { show: true, position: 'top', formatter: '{c}%' }
    }]
  };
  compareChart.setOption(option);
}

onMounted(() => {
  loadDataFromFile();
  initCharts();
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  mainChart?.dispose();
  stackChart?.dispose();
  pieChart?.dispose();
  compareChart?.dispose();
});
</script>

<style scoped>
.profit-analysis-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 16px;
  color: white;
}
.page-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; color: white; }
.page-description { margin: 0; opacity: 0.9; font-size: 14px; }

.header-right { display: flex; gap: 12px; align-items: center; }

.kpi-section { margin-bottom: 16px; }
.kpi-card {
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}
.kpi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
.kpi-card.primary::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #1890ff, #36cfc9); }
.kpi-card.success::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #52c41a, #95de64); }
.kpi-card.warning::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #faad14, #ffd666); }
.kpi-card.info::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #722ed1, #b37feb); }

.kpi-icon { font-size: 36px; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 700; color: #1f2f3d; line-height: 1.2; }
.kpi-label { font-size: 13px; color: #666; margin-top: 4px; }
.kpi-desc { font-size: 12px; color: #999; margin-top: 2px; }
.kpi-trend { font-size: 13px; font-weight: 600; margin-top: 4px; }
.kpi-trend.up { color: #52c41a; }
.kpi-trend.down { color: #ff4d4f; }

.progress-card { border-radius: 12px; }
.payback-progress .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.progress-title { font-size: 16px; font-weight: 600; color: #1f2f3d; }
.progress-percent { font-size: 20px; font-weight: 700; color: #1890ff; }
.progress-info { display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px; color: #666; flex-wrap: wrap; gap: 8px; }

.chart-card, .table-card, .rule-card, .forecast-card, .compare-card { border-radius: 12px; }
.chart-container { min-height: 250px; }
.chart-container.large { height: 350px; }
.chart-container.medium { height: 280px; }

.money-positive { color: #52c41a; font-weight: 600; }
.zero-profit-row { background-color: #fffbe6; }

.forecast-item { text-align: center; padding: 20px; background: #fafafa; border-radius: 12px; height: 100%; }
.forecast-item h4 { font-size: 15px; color: #666; margin-bottom: 12px; }
.forecast-value { font-size: 28px; font-weight: 700; color: #1890ff; margin-bottom: 8px; }
.forecast-item p { font-size: 13px; color: #999; margin: 0 0 16px; }

.risk-level {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.risk-level.low { background: #f6ffed; color: #52c41a; border: 2px solid #b7eb8f; }
.risk-level.medium { background: #fffbe6; color: #faad14; border: 2px solid #ffe58f; }
.risk-level.high { background: #fff2f0; color: #ff4d4f; border: 2px solid #ffccc7; }

.rule-card :deep(.ant-descriptions-item-label) { width: 130px; }

.compare-phase-card { }
.phase-box {
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}
.phase-box.phase1 { background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%); border: 1px solid #91d5ff; }
.phase-box.phase2 { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); border: 1px solid #b7eb8f; }
.phase-title { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #1f2f3d; }
.phase-stat { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed rgba(0,0,0,0.06); }
.phase-stat:last-child { border-bottom: none; }
.phase-stat .label { color: #888; }
.phase-stat strong { font-weight: 600; }
.phase-stat .green { color: #52c41a; }

.phase-growth {
  text-align: center;
  font-size: 14px;
  color: #666;
}
.phase-growth strong.green { color: #52c41a; font-size: 18px; margin-left: 8px; }
.phase-growth strong.red { color: #ff4d4f; font-size: 18px; margin-left: 8px; }

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-button {
  flex: 1;
  text-align: center;
  border-radius: 6px !important;
  font-size: 12px !important;
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 8px !important;
  transition: all 0.3s ease !important;
}

.edit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.delete-button {
  flex: 1;
  text-align: center;
  border-radius: 6px !important;
  font-size: 12px !important;
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 8px !important;
  transition: all 0.3s ease !important;
}

.delete-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

@media (max-width: 768px) {
  .profit-analysis-container { padding: 12px; }
  .page-header { flex-direction: column; }
  .header-right { width: 100%; margin-top: 12px; justify-content: space-between; }
  .kpi-value { font-size: 22px; }
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  .edit-button,
  .delete-button {
    width: 100%;
  }
}
</style>