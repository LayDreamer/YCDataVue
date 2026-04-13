
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
        <!-- 左侧区域：个人工作台主要内容 -->
        <a-col :xs="24" :lg="16">
          <!-- 快速操作栏 -->
          <a-row :gutter="[16, 16]" class="dashboard-section">
            <a-col :span="24">
              <a-card title="快速操作" :bordered="false" hoverable>
                <div class="quick-actions">
                  <div class="action-item" v-for="action in quickActions" :key="action.title" @click="handleQuickAction(action)">
                    <div class="action-icon" :style="{ backgroundColor: action.color }">
                      {{ action.icon }}
                    </div>
                    <span class="action-title">{{ action.title }}</span>
                  </div>
                </div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 今日日程和工作统计 -->
          <a-row :gutter="[16, 16]" style="margin-top: 16px;">
            <a-col :xs="24" :md="12" class="dashboard-section">
              <a-card title="今日日程" :bordered="false" hoverable>
                <a-list :data-source="todaySchedule" :split="false">
                  <template #renderItem="{ item }">
                    <a-list-item class="schedule-item">
                      <div class="schedule-time">{{ item.time }}</div>
                      <div class="schedule-content">
                        <div class="schedule-title">{{ item.title }}</div>
                        <div class="schedule-location" v-if="item.location">{{ item.location }}</div>
                      </div>
                      <a-badge :status="item.status" />
                    </a-list-item>
                  </template>
                </a-list>
              </a-card>
            </a-col>
            <a-col :xs="24" :md="12" class="dashboard-section">
              <a-card title="工作统计" :bordered="false" hoverable>
                <div class="work-stats">
                  <div class="stat-row">
                    <span class="stat-label">今日已完成任务</span>
                    <span class="stat-value">{{ workStats.todayCompleted }} 个</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">本周任务完成率</span>
                    <span class="stat-value">{{ workStats.weekCompletion }}%</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">待审批事项</span>
                    <span class="stat-value">{{ workStats.pendingApproval }} 个</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">本月协作次数</span>
                    <span class="stat-value">{{ workStats.monthCollaboration }} 次</span>
                  </div>
                </div>
              </a-card>
            </a-col>
          </a-row>

          <!-- 团队成员动态 -->
          <a-row :gutter="[16, 16]" style="margin-top: 16px;" class="dashboard-section">
            <a-col :span="24">
              <a-card title="团队成员动态" :bordered="false" hoverable>
                <div class="team-activities">
                  <a-row :gutter="[16, 16]">
                    <a-col :xs="24" :sm="12" :md="6" v-for="member in teamMembers" :key="member.name">
                      <div class="member-card">
                        <a-avatar :src="member.avatar" size="large">{{ member.name.charAt(0) }}</a-avatar>
                        <div class="member-info">
                          <div class="member-name">{{ member.name }}</div>
                          <div class="member-role">{{ member.role }}</div>
                          <div class="member-status">
                            <a-badge :status="member.online ? 'success' : 'default'" :text="member.online ? '在线' : '离线'" />
                          </div>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>
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

          <!-- 快捷链接 -->
          <div class="dashboard-section" style="margin-top: 16px;">
            <a-card title="快捷链接" :bordered="false" hoverable>
              <div class="quick-links">
                <a href="#" class="link-item" v-for="link in quickLinks" :key="link.title">
                  <span class="link-icon" :style="{ color: link.color }">{{ link.icon }}</span>
                  <span class="link-title">{{ link.title }}</span>
                </a>
              </div>
            </a-card>
          </div>

          <!-- 系统公告 -->
          <div class="dashboard-section" style="margin-top: 16px;">
            <a-card title="系统公告" :bordered="false" hoverable>
              <a-list :data-source="systemNotices" :split="false">
                <template #renderItem="{ item }">
                  <a-list-item class="notice-item">
                    <a-tag :color="item.type === 'important' ? 'red' : 'blue'" style="margin-right: 8px;">
                      {{ item.type === 'important' ? '重要' : '通知' }}
                    </a-tag>
                    <div class="notice-content">
                      <div class="notice-title">{{ item.title }}</div>
                      <div class="notice-time">{{ item.time }}</div>
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
import { ref, onMounted } from 'vue';
import StatCard from '../components/StatCard.vue';
import PersonalWorkbench from '../components/PersonalWorkbench.vue';



// 状态管理
const isLoading = ref(true);

// 快速操作数据
const quickActions = ref([
  { title: '新建任务', icon: '📝', color: '#1890ff', action: 'createTask' },
  { title: '发起审批', icon: '✏️', color: '#52c41a', action: 'createApproval' },
  { title: '安排会议', icon: '📅', color: '#faad14', action: 'scheduleMeeting' },
  { title: '提交报告', icon: '📊', color: '#722ed1', action: 'submitReport' },
  { title: '发送邮件', icon: '📧', color: '#eb2f96', action: 'sendEmail' },
  { title: '查看文档', icon: '📖', color: '#13c2c2', action: 'viewDocuments' }
]);

// 今日日程数据
const todaySchedule = ref([
  { time: '09:00', title: '项目启动会', location: '会议室A', status: 'success' },
  { time: '10:30', title: '与客户沟通', location: '线上会议', status: 'processing' },
  { time: '14:00', title: '代码评审', location: '开发区', status: 'default' },
  { time: '16:00', title: '团队周会', location: '会议室B', status: 'default' }
]);

// 工作统计数据
const workStats = ref({
  todayCompleted: 5,
  weekCompletion: 78,
  pendingApproval: 3,
  monthCollaboration: 42
});

// 团队成员数据
const teamMembers = ref([
  { name: '李四', role: '前端开发', avatar: '', online: true },
  { name: '王五', role: '后端开发', avatar: '', online: true },
  { name: '赵六', role: 'UI设计', avatar: '', online: false },
  { name: '钱七', role: '测试工程师', avatar: '', online: true }
]);

// 快捷链接数据
const quickLinks = ref([
  { title: '项目管理', icon: '📁', color: '#1890ff' },
  { title: '文档中心', icon: '📚', color: '#52c41a' },
  { title: '知识库', icon: '💡', color: '#faad14' },
  { title: '人事管理', icon: '👨‍👩‍👧‍👦', color: '#722ed1' },
  { title: '财务系统', icon: '💰', color: '#eb2f96' },
  { title: 'IT支持', icon: '🔧', color: '#13c2c2' }
]);

// 系统公告数据
const systemNotices = ref([
  { title: '系统维护通知', time: '2023-10-10 09:00', type: 'important' },
  { title: '新功能上线公告', time: '2023-10-08 14:00', type: 'normal' },
  { title: '季度会议安排', time: '2023-10-07 10:00', type: 'normal' }
]);

// 统计卡片数据
const statCards = ref([
  { title: '用户总数', value: 1234, prefix: '👥', type: 'user' },
  { title: '订单总数', value: 345, prefix: '📦', type: 'order' },
  { title: '收入总额', value: 234567, prefix: '💰', type: 'income' },
  { title: '访问量', value: 45600, prefix: '👀', type: 'visit' }
]);



// 生命周期钩子
onMounted(() => {
  // 模拟初始加载
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
});

// 事件处理函数
function handleQuickAction(action) {
  console.log('执行快速操作:', action.title);
  // 这里可以根据 action.action 来执行不同的操作
  switch (action.action) {
    case 'createTask':
      // 新建任务
      break;
    case 'createApproval':
      // 发起审批
      break;
    case 'scheduleMeeting':
      // 安排会议
      break;
    case 'submitReport':
      // 提交报告
      break;
    case 'sendEmail':
      // 发送邮件
      break;
    case 'viewDocuments':
      // 查看文档
      break;
  }
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
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: both;
}

.dashboard-section {
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

/* 快速操作样式 */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  background-color: #fafafa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.action-item:hover {
  background-color: #f0f5ff;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  color: white;
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2f3d;
}

/* 日程样式 */
.schedule-item {
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.schedule-time {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
  min-width: 60px;
}

.schedule-content {
  flex: 1;
}

.schedule-title {
  font-size: 14px;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.schedule-location {
  font-size: 12px;
  color: #999;
}

/* 工作统计样式 */
.work-stats {
  padding: 8px 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

/* 团队成员样式 */
.team-activities {
  padding: 8px 0;
}

.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.member-card:hover {
  background-color: #f0f5ff;
  transform: translateY(-2px);
}

.member-info {
  text-align: center;
  margin-top: 12px;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.member-role {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.member-status {
  font-size: 12px;
}

/* 快捷链接样式 */
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fafafa;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.link-item:hover {
  background-color: #f0f5ff;
  transform: translateX(4px);
}

.link-icon {
  font-size: 20px;
  margin-right: 12px;
}

.link-title {
  font-size: 14px;
  color: #1f2f3d;
}

/* 系统公告样式 */
.notice-item {
  padding: 8px 0;
  display: flex;
  align-items: flex-start;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  color: #1f2f3d;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 12px;
  color: #999;
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
  .quick-actions {
    justify-content: center;
  }
  .action-item {
    min-width: 80px;
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .dashboard-title {
    font-size: 20px;
  }
}
</style>