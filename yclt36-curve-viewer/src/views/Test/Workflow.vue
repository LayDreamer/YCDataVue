<template>
  <div class="workflow-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">工作流管理</h1>
        <p class="page-description">管理和跟踪业务流程的执行状态</p>
      </div>
      <div class="header-right">
        <a-radio-group v-model:value="timeRange" size="small" @change="handleTimeRangeChange" style="margin-right: 16px;">
          <a-radio-button value="today">今日</a-radio-button>
          <a-radio-button value="week">本周</a-radio-button>
          <a-radio-button value="month">本月</a-radio-button>
        </a-radio-group>
        <a-button type="primary" @click="showCreateModal = true">
          <template #icon>➕</template>
          新建流程
        </a-button>
      </div>
    </div>

    <!-- 工作流统计卡片 -->
    <a-row :gutter="[16, 16]" class="stats-section">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card hoverable class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);">
              📊
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workflowStats.total }}</div>
              <div class="stat-label">总流程数</div>
              <div class="stat-trend positive">↑ {{ workflowStats.totalTrend }}%</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card hoverable class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);">
              ✅
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workflowStats.completed }}</div>
              <div class="stat-label">已完成</div>
              <div class="stat-trend positive">↑ {{ workflowStats.completedTrend }}%</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card hoverable class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #faad14 0%, #d48806 100%);">
              ⏳
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workflowStats.inProgress }}</div>
              <div class="stat-label">进行中</div>
              <div class="stat-trend negative">↓ {{ Math.abs(workflowStats.inProgressTrend) }}%</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card hoverable class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);">
              ❌
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ workflowStats.pending }}</div>
              <div class="stat-label">待处理</div>
              <div class="stat-trend neutral">→ {{ workflowStats.pendingTrend }}%</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 效率指标 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px;">
      <a-col :span="8">
        <a-card title="平均处理时长" class="metric-card">
          <div class="metric-content">
            <div class="metric-value">{{ efficiencyMetrics.avgDuration }}</div>
            <div class="metric-desc">较上周 {{ efficiencyMetrics.durationChange > 0 ? '+' : '' }}{{ efficiencyMetrics.durationChange }}%</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="按时完成率" class="metric-card">
          <div class="metric-content">
            <div class="metric-value green">{{ efficiencyMetrics.onTimeRate }}%</div>
            <div class="metric-desc">目标 ≥90%</div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="审批通过率" class="metric-card">
          <div class="metric-content">
            <div class="metric-value blue">{{ efficiencyMetrics.approvalRate }}%</div>
            <div class="metric-desc">本月数据</div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选和搜索 -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="关键词">
          <a-input 
            v-model:value="filterForm.keyword" 
            placeholder="搜索工作流名称/编号"
            allow-clear
            style="width: 200px;"
            @pressEnter="handleSearch"
          >
            <template #prefix>🔍</template>
          </a-input>
        </a-form-item>
        <a-form-item label="状态">
          <a-select 
            v-model:value="filterForm.status" 
            placeholder="全部状态"
            allow-clear
            style="width: 120px;"
            @change="handleSearch"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="inProgress">进行中</a-select-option>
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="rejected">已驳回</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="类型">
          <a-select 
            v-model:value="filterForm.type" 
            placeholder="全部类型"
            allow-clear
            style="width: 140px;"
            @change="handleSearch"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="purchase">采购审批</a-select-option>
            <a-select-option value="leave">请假申请</a-select-option>
            <a-select-option value="reimbursement">费用报销</a-select-option>
            <a-select-option value="contract">合同评审</a-select-option>
            <a-select-option value="project">项目立项</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="优先级">
          <a-select 
            v-model:value="filterForm.priority" 
            placeholder="全部优先级"
            allow-clear
            style="width: 120px;"
            @change="handleSearch"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="low">低</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 工作流列表 -->
    <a-card title="工作流列表" class="list-card">
      <template #extra>
        <a-space>
          <a-dropdown>
            <a-button>
              批量操作
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleBatchAction">
                <a-menu-item key="approve">批量通过</a-menu-item>
                <a-menu-item key="reject">批量驳回</a-menu-item>
                <a-menu-item key="export">导出数据</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button @click="refreshData" :loading="refreshing">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      
      <a-table 
        :columns="columns" 
        :data-source="filteredWorkflowList" 
        :pagination="pagination"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
        row-key="id"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="workflow-name-cell">
              <a-tag :color="getTypeColor(record.type)" style="margin-right: 8px;">{{ getTypeText(record.type) }}</a-tag>
              <a class="workflow-name-link" @click="handleView(record)">{{ record.name }}</a>
              <a-tag v-if="record.urgent" color="red" style="margin-left: 8px;">紧急</a-tag>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge :status="getStatusBadge(record.status)" :text="getStatusText(record.status)" />
          </template>
          <template v-else-if="column.key === 'priority'">
            <a-tag :color="getPriorityColor(record.priority)">{{ getPriorityText(record.priority) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'progress'">
            <a-progress 
              :percent="record.progress" 
              :status="record.status === 'completed' ? 'success' : record.status === 'rejected' ? 'exception' : 'active'"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-tooltip title="查看详情">
                <a-button size="small" type="link" @click="handleView(record)">
                  <EyeOutlined />
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button size="small" type="link" @click="handleEdit(record)">
                  <EditOutlined />
                </a-button>
              </a-tooltip>
              <a-popconfirm title="确定删除此工作流？" @confirm="handleDelete(record)">
                <a-tooltip title="删除">
                  <a-button size="small" type="link" danger>
                    <DeleteOutlined />
                  </a-button>
                </a-tooltip>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 工作流详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="工作流详情"
      width="900px"
      :footer="null"
      destroyOnClose
    >
      <div v-if="selectedWorkflow" class="workflow-detail">
        <a-descriptions :column="3" bordered size="small">
          <a-descriptions-item label="流程编号">{{ selectedWorkflow.code }}</a-descriptions-item>
          <a-descriptions-item label="流程名称">{{ selectedWorkflow.name }}</a-descriptions-item>
          <a-descriptions-item label="流程类型">
            <a-tag :color="getTypeColor(selectedWorkflow.type)">{{ getTypeText(selectedWorkflow.type) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="发起人">
            <a-avatar :size="20" :src="selectedWorkflow.creatorAvatar" style="margin-right: 8px;">
              {{ selectedWorkflow.creator.charAt(0) }}
            </a-avatar>
            {{ selectedWorkflow.creator }}
          </a-descriptions-item>
          <a-descriptions-item label="所属部门">{{ selectedWorkflow.department }}</a-descriptions-item>
          <a-descriptions-item label="发起时间">{{ selectedWorkflow.createTime }}</a-descriptions-item>
          <a-descriptions-item label="当前状态">
            <a-badge :status="getStatusBadge(selectedWorkflow.status)" :text="getStatusText(selectedWorkflow.status)" />
          </a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="getPriorityColor(selectedWorkflow.priority)">{{ getPriorityText(selectedWorkflow.priority) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="预计完成时间">{{ selectedWorkflow.expectedTime }}</a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <div class="detail-section">
          <h3>📋 流程描述</h3>
          <p>{{ selectedWorkflow.description || '暂无描述' }}</p>
        </div>

        <div class="detail-section">
          <h3>📝 审批进度</h3>
          <a-steps direction="vertical" :current="selectedWorkflow.currentStep" status-process class="workflow-steps">
            <a-step
              v-for="(step, index) in selectedWorkflow.steps"
              :key="index"
              :title="step.title"
              :description="step.description"
              :status="step.status"
            >
              <template #icon v-if="step.avatar">
                <a-avatar :src="step.avatar" :size="28">{{ step.approver?.charAt(0) }}</a-avatar>
              </template>
              <template #subTitle v-if="step.approver">
                <div class="step-subtitle">
                  <span>{{ step.approver }}</span>
                  <span class="step-time">{{ step.time }}</span>
                  <a-tag v-if="step.action" :color="getActionColor(step.action)" size="small">{{ getActionText(step.action) }}</a-tag>
                </div>
              </template>
            </a-step>
          </a-steps>
        </div>

        <div class="detail-section" v-if="selectedWorkflow.attachments && selectedWorkflow.attachments.length">
          <h3>📎 相关附件</h3>
          <a-list :data-source="selectedWorkflow.attachments" :split="false">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <FileOutlined style="font-size: 24px; color: #1890ff;" />
                  </template>
                  <template #title>{{ item.name }}</template>
                  <template #description>{{ item.size }} · {{ item.uploadTime }}</template>
                </a-list-item-meta>
                <a-button type="link" size="small">下载</a-button>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <div class="detail-section">
          <h3>💬 操作记录</h3>
          <a-timeline>
            <a-timeline-item 
              v-for="(log, index) in selectedWorkflow.logs" 
              :key="index"
              :color="getLogColor(log.type)"
            >
              <div class="log-content">
                <div class="log-header">
                  <strong>{{ log.operator }}</strong>
                  <span class="log-time">{{ log.time }}</span>
                </div>
                <p class="log-action">{{ log.action }}</p>
                <p v-if="log.comment" class="log-comment">备注：{{ log.comment }}</p>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>

        <div class="detail-actions" v-if="selectedWorkflow.status !== 'completed' && selectedWorkflow.status !== 'rejected'">
          <a-space>
            <a-button type="primary" @click="handleApprove(selectedWorkflow)">✅ 通过</a-button>
            <a-button danger @click="handleReject(selectedWorkflow)">❌ 驳回</a-button>
            <a-button @click="handleTransfer(selectedWorkflow)">🔄 转交</a-button>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 新建工作流模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新建工作流"
      width="600px"
      @ok="handleCreateSubmit"
      @cancel="handleCreateCancel"
      :confirmLoading="creating"
    >
      <a-form :model="createForm" layout="vertical" ref="createFormRef">
        <a-form-item label="流程类型" required>
          <a-select v-model:value="createForm.type" placeholder="请选择流程类型" @change="handleTypeChange">
            <a-select-option value="purchase">采购审批</a-select-option>
            <a-select-option value="leave">请假申请</a-select-option>
            <a-select-option value="reimbursement">费用报销</a-select-option>
            <a-select-option value="contract">合同评审</a-select-option>
            <a-select-option value="project">项目立项</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="流程名称" required>
          <a-input v-model:value="createForm.name" placeholder="请输入流程名称" />
        </a-form-item>
        <a-form-item label="详细描述">
          <a-textarea v-model:value="createForm.description" placeholder="请输入流程描述" :rows="4" />
        </a-form-item>
        <a-form-item label="优先级">
          <a-radio-group v-model:value="createForm.priority">
            <a-radio value="low"><a-tag color="green">低</a-tag></a-radio>
            <a-radio value="medium"><a-tag color="orange">中</a-tag></a-radio>
            <a-radio value="high"><a-tag color="red">高</a-tag></a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="期望完成时间">
          <a-date-picker v-model:value="createForm.expectedTime" show-time style="width: 100%;" />
        </a-form-item>
        <a-form-item label="附件上传">
          <a-upload
            v-model:file-list="createForm.attachments"
            action="/api/upload"
            :max-count="5"
          >
            <a-button>📎 上传文件</a-button>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { DownOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons-vue';

const timeRange = ref('week');
const loading = ref(false);
const refreshing = ref(false);
const creating = ref(false);
const detailModalVisible = ref(false);
const showCreateModal = ref(false);
const selectedWorkflow = ref(null);
const selectedRowKeys = ref([]);
const createFormRef = ref(null);

const filterForm = ref({
  keyword: '',
  status: '',
  type: '',
  priority: ''
});

const createForm = ref({
  type: '',
  name: '',
  description: '',
  priority: 'medium',
  expectedTime: null,
  attachments: []
});

const workflowStats = ref({
  total: 156,
  completed: 98,
  inProgress: 38,
  pending: 15,
  rejected: 5,
  totalTrend: 12.5,
  completedTrend: 8.2,
  inProgressTrend: -5.1,
  pendingTrend: 2.3
});

const efficiencyMetrics = ref({
  avgDuration: '2.3天',
  durationChange: -8.5,
  onTimeRate: 92.5,
  approvalRate: 87.3
});

const columns = [
  { title: '流程名称', dataIndex: 'name', key: 'name' },
  { title: '编号', dataIndex: 'code', key: 'code', width: 120 },
  { title: '发起人', dataIndex: 'creator', key: 'creator', width: 80 },
  { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
  { title: '发起时间', dataIndex: 'createTime', key: 'createTime', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '进度', dataIndex: 'progress', key: 'progress', width: 140 },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' }
];

const workflowList = ref([
  {
    id: 1,
    code: 'WF20231010001',
    name: '服务器设备采购申请',
    type: 'purchase',
    creator: '张三',
    creatorAvatar: '',
    department: '技术部',
    createTime: '2023-10-10 09:30',
    expectedTime: '2023-10-17 18:00',
    status: 'inProgress',
    progress: 60,
    priority: 'high',
    urgent: true,
    currentStep: 2,
    description: '因业务扩展需要，申请采购5台高性能服务器用于生产环境部署。',
    steps: [
      { title: '提交申请', description: '张三提交采购申请', status: 'finish', approver: '张三', time: '2023-10-10 09:30', avatar: '', action: 'submit' },
      { title: '部门经理审批', description: '李四已批准', status: 'finish', approver: '李四', time: '2023-10-11 14:20', avatar: '', action: 'approve' },
      { title: '财务审核', description: '等待王五审核预算', status: 'process', approver: '王五', avatar: '' },
      { title: '总经理审批', description: '等待最终审批', status: 'wait' },
      { title: '完成采购', description: '等待采购执行', status: 'wait' }
    ],
    logs: [
      { operator: '张三', time: '2023-10-10 09:30', action: '提交了采购申请', comment: '急需设备支持新业务上线', type: 'info' },
      { operator: '系统', time: '2023-10-11 08:45', action: '自动分配给部门经理李四审批', type: 'system' },
      { operator: '李四', time: '2023-10-11 14:20', action: '已批准该申请', comment: '同意采购，预算合理', type: 'success' },
      { operator: '系统', time: '2023-10-11 14:21', action: '流转至财务部审核', type: 'system' }
    ],
    attachments: [
      { name: '采购需求说明书.pdf', size: '2.3MB', uploadTime: '2023-10-10 09:30' },
      { name: '报价单对比.xlsx', size: '156KB', uploadTime: '2023-10-10 09:31' }
    ]
  },
  {
    id: 2,
    code: 'WF20231009002',
    name: '年假申请',
    type: 'leave',
    creator: '李四',
    creatorAvatar: '',
    department: '产品部',
    createTime: '2023-10-09 14:20',
    expectedTime: '2023-10-12 18:00',
    status: 'completed',
    progress: 100,
    priority: 'medium',
    urgent: false,
    currentStep: 4,
    description: '计划于10月16日-10月20日休年假5天，已完成工作交接。',
    steps: [
      { title: '提交申请', description: '李四提交年假申请', status: 'finish', approver: '李四', time: '2023-10-09 14:20', avatar: '', action: 'submit' },
      { title: '直属领导审批', description: '赵六已批准', status: 'finish', approver: '赵六', time: '2023-10-09 16:30', avatar: '', action: 'approve' },
      { title: 'HR确认', description: 'HR确认年假余额充足', status: 'finish', approver: '钱七', time: '2023-10-10 10:00', avatar: '', action: 'approve' },
      { title: '完成', description: '年假申请已通过', status: 'finish' }
    ],
    logs: [
      { operator: '李四', time: '2023-10-09 14:20', action: '提交了年假申请', comment: '需提前安排好手头工作', type: 'info' },
      { operator: '赵六', time: '2023-10-09 16:30', action: '已批准', comment: '注意保持手机畅通', type: 'success' },
      { operator: '钱七', time: '2023-10-10 10:00', action: '确认年假余额并批准', type: 'success' }
    ],
    attachments: []
  },
  {
    id: 3,
    code: 'WF20231008003',
    name: '差旅费报销',
    type: 'reimbursement',
    creator: '王五',
    creatorAvatar: '',
    department: '销售部',
    createTime: '2023-10-08 16:45',
    expectedTime: '2023-10-13 18:00',
    status: 'pending',
    progress: 0,
    priority: 'low',
    urgent: false,
    currentStep: 0,
    description: '上海出差3天差旅费报销，包含交通、住宿、餐饮等费用。',
    steps: [
      { title: '提交报销申请', description: '等待王五提交', status: 'wait' },
      { title: '部门主管审核', description: '等待审核', status: 'wait' },
      { title: '财务复核', description: '等待复核', status: 'wait' },
      { title: '打款', description: '等待打款', status: 'wait' }
    ],
    logs: [],
    attachments: []
  },
  {
    id: 4,
    code: 'WF20231007004',
    name: '客户合同评审',
    type: 'contract',
    creator: '赵六',
    creatorAvatar: '',
    department: '法务部',
    createTime: '2023-10-07 11:15',
    expectedTime: '2023-10-14 18:00',
    status: 'inProgress',
    progress: 75,
    priority: 'high',
    urgent: true,
    currentStep: 3,
    description: '与ABC公司年度服务框架合同评审，金额500万元。',
    steps: [
      { title: '起草合同', description: '合同已起草完成', status: 'finish', approver: '赵六', time: '2023-10-07 11:15', avatar: '', action: 'submit' },
      { title: '法务初审', description: '法务部已审核通过', status: 'finish', approver: '孙八', time: '2023-10-08 10:30', avatar: '', action: 'approve' },
      { title: '商务谈判', description: '商务条款确认中', status: 'process', approver: '周九', avatar: '' },
      { title: '总经理终审', description: '等待最终审批', status: 'wait' },
      { title: '签署归档', description: '等待签署', status: 'wait' }
    ],
    logs: [
      { operator: '赵六', time: '2023-10-07 11:15', action: '起草了合同初稿', type: 'info' },
      { operator: '孙八', time: '2023-10-08 10:30', action: '法务审核通过', comment: '条款合规，建议补充违约责任细则', type: 'success' },
      { operator: '周九', time: '2023-10-09 09:00', action: '开始商务条款谈判', type: 'info' }
    ],
    attachments: [
      { name: '合同草案_v3.docx', size: '1.8MB', uploadTime: '2023-10-07 11:15' },
      { name: '法务意见书.pdf', size: '450KB', uploadTime: '2023-10-08 10:35' }
    ]
  },
  {
    id: 5,
    code: 'WF20231006005',
    name: '新产品研发立项',
    type: 'project',
    creator: '钱七',
    creatorAvatar: '',
    department: '研发部',
    createTime: '2023-10-06 09:00',
    expectedTime: '2023-10-13 18:00',
    status: 'completed',
    progress: 100,
    priority: 'high',
    urgent: false,
    currentStep: 4,
    description: '智能数据分析平台V2.0版本研发立项，预计周期6个月，预算200万元。',
    steps: [
      { title: '立项申请', description: '钱七提交立项报告', status: 'finish', approver: '钱七', time: '2023-10-06 09:00', avatar: '', action: 'submit' },
      { title: '技术评审', description: '技术委员会评审通过', status: 'finish', approver: '技术委员会', time: '2023-10-06 15:00', avatar: '', action: 'approve' },
      { title: '预算审批', description: '财务部确认预算可行', status: 'finish', approver: '王五', time: '2023-10-07 11:00', avatar: '', action: 'approve' },
      { title: '总经理批准', description: '总经理正式批准立项', status: 'finish', approver: '吴十', time: '2023-10-07 16:00', avatar: '', action: 'approve' },
      { title: '启动项目', description: '项目正式启动', status: 'finish' }
    ],
    logs: [
      { operator: '钱七', time: '2023-10-06 09:00', action: '提交了研发立项申请', type: 'info' },
      { operator: '技术委员会', time: '2023-10-06 15:00', action: '技术评审通过', comment: '方案可行，建议分阶段实施', type: 'success' },
      { operator: '王五', time: '2023-10-07 11:00', action: '预算审批通过', type: 'success' },
      { operator: '吴十', time: '2023-10-07 16:00', action: '批准立项', comment: '尽快组建团队，下周启动', type: 'success' }
    ],
    attachments: [
      { name: '立项报告.pdf', size: '3.2MB', uploadTime: '2023-10-06 09:00' },
      { name: '技术方案.pptx', size: '5.6MB', uploadTime: '2023-10-06 09:01' },
      { name: '预算明细.xlsx', size: '128KB', uploadTime: '2023-10-06 09:02' }
    ]
  },
  {
    id: 6,
    code: 'WF20231011006',
    name: '办公用品采购',
    type: 'purchase',
    creator: '孙八',
    creatorAvatar: '',
    department: '行政部',
    createTime: '2023-10-11 10:00',
    expectedTime: '2023-10-14 18:00',
    status: 'rejected',
    progress: 25,
    priority: 'low',
    urgent: false,
    currentStep: 1,
    description: '季度办公用品采购，包括纸张、笔、文件夹等日常消耗品。',
    steps: [
      { title: '提交申请', description: '孙八提交采购申请', status: 'finish', approver: '孙八', time: '2023-10-11 10:00', avatar: '', action: 'submit' },
      { title: '行政主管审批', description: '被驳回', status: 'error', approver: '郑十一', time: '2023-10-11 14:30', avatar: '', action: 'reject' }
    ],
    logs: [
      { operator: '孙八', time: '2023-10-11 10:00', action: '提交了办公用品采购申请', type: 'info' },
      { operator: '郑十一', time: '2023-10-11 14:30', action: '驳回了申请', comment: '库存还有剩余，下季度再采购', type: 'error' }
    ],
    attachments: []
  }
]);

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: computed(() => filteredWorkflowList.value.length),
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`
});

const filteredWorkflowList = computed(() => {
  let list = [...workflowList.value];
  
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase();
    list = list.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword)
    );
  }
  
  if (filterForm.value.status) {
    list = list.filter(item => item.status === filterForm.value.status);
  }
  
  if (filterForm.value.type) {
    list = list.filter(item => item.type === filterForm.value.type);
  }
  
  if (filterForm.value.priority) {
    list = list.filter(item => item.priority === filterForm.value.priority);
  }
  
  return list;
});

function getStatusColor(status) {
  switch (status) {
    case 'completed': return 'green';
    case 'inProgress': return 'blue';
    case 'pending': return 'orange';
    case 'rejected': return 'red';
    default: return 'default';
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'completed': return 'success';
    case 'inProgress': return 'processing';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    default: return 'default';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'completed': return '已完成';
    case 'inProgress': return '进行中';
    case 'pending': return '待处理';
    case 'rejected': return '已驳回';
    default: return '未知';
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'purchase': return 'blue';
    case 'leave': return 'cyan';
    case 'reimbursement': return 'orange';
    case 'contract': return 'purple';
    case 'project': return 'geekblue';
    default: return 'default';
  }
}

function getTypeText(type) {
  switch (type) {
    case 'purchase': return '采购';
    case 'leave': return '请假';
    case 'reimbursement': return '报销';
    case 'contract': return '合同';
    case 'project': return '项目';
    default: return '其他';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'default';
  }
}

function getPriorityText(priority) {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '-';
  }
}

function getActionColor(action) {
  switch (action) {
    case 'submit': return 'blue';
    case 'approve': return 'green';
    case 'reject': return 'red';
    case 'transfer': return 'orange';
    default: return 'default';
  }
}

function getActionText(action) {
  switch (action) {
    case 'submit': return '提交';
    case 'approve': return '通过';
    case 'reject': return '驳回';
    case 'transfer': return '转交';
    default: return '';
  }
}

function getLogColor(type) {
  switch (type) {
    case 'success': return 'green';
    case 'error': return 'red';
    case 'system': return 'blue';
    default: return 'gray';
  }
}

function handleTimeRangeChange() {
  refreshData();
}

function handleSearch() {}

function handleReset() {
  filterForm.value = {
    keyword: '',
    status: '',
    type: '',
    priority: ''
  };
}

function handleTableChange(pag) {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
}

function onSelectChange(keys) {
  selectedRowKeys.value = keys;
}

function handleBatchAction({ key }) {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要操作的项');
    return;
  }
  message.info(`批量${key} ${selectedRowKeys.value.length} 项`);
}

async function refreshData() {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    message.success('数据已刷新');
  }, 800);
}

function handleView(record) {
  selectedWorkflow.value = record;
  detailModalVisible.value = true;
}

function handleEdit(record) {
  message.info(`编辑工作流: ${record.name}`);
}

function handleDelete(record) {
  const index = workflowList.value.findIndex(item => item.id === record.id);
  if (index > -1) {
    workflowList.value.splice(index, 1);
    message.success('删除成功');
  }
}

function handleApprove(record) {
  Modal.confirm({
    title: '确认通过',
    content: `确定要通过 "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk() {
      record.status = 'completed';
      record.progress = 100;
      detailModalVisible.value = false;
      message.success('已通过');
    }
  });
}

function handleReject(record) {
  Modal.confirm({
    title: '确认驳回',
    content: `确定要驳回 "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk() {
      record.status = 'rejected';
      detailModalVisible.value = false;
      message.info('已驳回');
    }
  });
}

function handleTransfer(record) {
  message.info(`转交功能开发中...`);
}

function handleTypeChange(value) {
  const typeNames = {
    purchase: '采购审批申请',
    leave: '请假申请',
    reimbursement: '费用报销申请',
    contract: '合同评审申请',
    project: '项目立项申请'
  };
  if (value && !createForm.value.name) {
    createForm.value.name = typeNames[value] || '';
  }
}

async function handleCreateSubmit() {
  if (!createForm.value.type) {
    message.error('请选择流程类型');
    return;
  }
  if (!createForm.value.name) {
    message.error('请输入流程名称');
    return;
  }
  
  creating.value = true;
  setTimeout(() => {
    const newId = Math.max(...workflowList.value.map(w => w.id)) + 1;
    const newCode = `WF${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(newId).padStart(3,'0')}`;
    
    const newWorkflow = {
      id: newId,
      code: newCode,
      name: createForm.value.name,
      type: createForm.value.type,
      creator: '当前用户',
      creatorAvatar: '',
      department: '我的部门',
      createTime: new Date().toLocaleString('zh-CN'),
      expectedTime: createForm.value.expectedTime?.format('YYYY-MM-DD HH:mm') || '-',
      status: 'pending',
      progress: 0,
      priority: createForm.value.priority,
      urgent: false,
      currentStep: 0,
      description: createForm.value.description,
      steps: getDefaultSteps(createForm.value.type),
      logs: [{ operator: '当前用户', time: new Date().toLocaleString('zh-CN'), action: '创建了此流程', type: 'info' }],
      attachments: []
    };
    
    workflowList.value.unshift(newWorkflow);
    showCreateModal.value = false;
    createForm.value = { type: '', name: '', description: '', priority: 'medium', expectedTime: null, attachments: [] };
    creating.value = false;
    message.success('创建成功');
  }, 600);
}

function getDefaultSteps(type) {
  const stepMap = {
    purchase: ['提交申请', '部门审批', '财务审核', '总经理审批', '完成采购'],
    leave: ['提交申请', '直属领导审批', 'HR确认', '完成'],
    reimbursement: ['提交报销', '部门审核', '财务复核', '打款'],
    contract: ['起草合同', '法务审核', '商务谈判', '总经理审批', '签署'],
    project: ['立项申请', '技术评审', '预算审批', '总经理批准', '启动']
  };
  return (stepMap[type] || ['步骤一', '步骤二', '步骤三']).map(title => ({
    title,
    description: '等待处理',
    status: 'wait'
  }));
}

function handleCreateCancel() {
  showCreateModal.value = false;
  createForm.value = { type: '', name: '', description: '', priority: 'medium', expectedTime: null, attachments: [] };
}
</script>

<style scoped>
.workflow-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left .page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2f3d;
}

.page-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2f3d;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}

.stat-trend.positive { color: #52c41a; }
.stat-trend.negative { color: #ff4d4f; }
.stat-trend.neutral { color: #999; }

.metric-card {
  text-align: center;
}

.metric-content .metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2f3d;
}

.metric-content .metric-value.green { color: #52c41a; }
.metric-content .metric-value.blue { color: #1890ff; }

.metric-content .metric-desc {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.list-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.workflow-name-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.workflow-name-link {
  color: #1890ff;
  cursor: pointer;
  font-weight: 500;
}

.workflow-name-link:hover {
  text-decoration: underline;
}

.workflow-detail {
  padding: 8px 0;
}

.detail-section {
  margin-top: 24px;
}

.detail-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2f3d;
}

.detail-section p {
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.workflow-steps {
  margin-top: 16px;
}

.step-subtitle {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.step-time {
  color: #999;
  font-size: 12px;
}

.log-content {
  padding: 4px 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #999;
}

.log-action {
  color: #333;
  margin: 0;
  font-size: 14px;
}

.log-comment {
  color: #888;
  margin: 4px 0 0 0;
  font-size: 13px;
  font-style: italic;
}

.detail-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

@media (max-width: 768px) {
  .workflow-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .stat-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
