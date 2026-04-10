<template>
  <a-card title="个人工作台" :bordered="false" hoverable class="personal-workbench">
    <!-- 个人信息 -->
    <div class="personal-info">
      <div class="avatar">
        <a-avatar size="large" :src="userInfo.avatar">{{ userInfo.name.charAt(0) }}</a-avatar>
      </div>
      <div class="user-details">
        <h3 class="user-name">{{ userInfo.name }}</h3>
        <p class="user-role">{{ userInfo.role }}</p>
        <div class="user-stats">
          <span class="stat-item">{{ userInfo.department }}</span>
          <span class="stat-item">{{ userInfo.joinDate }}</span>
        </div>
      </div>
    </div>

    <!-- 个人绩效指标 -->
    <div class="performance-metrics" style="margin-top: 24px;">
      <h4 class="section-title">个人绩效</h4>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-value">{{ performanceMetrics.completionRate }}%</div>
          <div class="metric-label">任务完成率</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ performanceMetrics.productivity }}</div>
          <div class="metric-label">工作效率</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ performanceMetrics.quality }}</div>
          <div class="metric-label">工作质量</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ performanceMetrics.teamwork }}</div>
          <div class="metric-label">团队协作</div>
        </div>
      </div>
    </div>

    <!-- 待办任务 -->
    <div class="todo-list" style="margin-top: 24px;">
      <div class="section-header">
        <h4 class="section-title">待办任务</h4>
        <a href="#" class="view-all">查看全部</a>
      </div>
      <a-list :data-source="todoList" :split="false">
        <template #renderItem="{ item }">
          <a-list-item class="todo-item">
            <div class="todo-content">
              <a-checkbox :checked="item.completed" @change="() => toggleTodo(item.id)">{{ item.title }}</a-checkbox>
              <span class="todo-due">{{ item.dueDate }}</span>
            </div>
            <a-tag :color="getPriorityColor(item.priority)">{{ item.priority }}</a-tag>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities" style="margin-top: 24px;">
      <div class="section-header">
        <h4 class="section-title">最近活动</h4>
        <a href="#" class="view-all">查看全部</a>
      </div>
      <a-timeline>
        <a-timeline-item v-for="(activity, index) in recentActivities" :key="index">
          <div class="activity-content">
            <p class="activity-title">{{ activity.title }}</p>
            <p class="activity-time">{{ activity.time }}</p>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </a-card>
</template>

<script setup>
import { ref } from 'vue';

// 用户信息
const userInfo = ref({
  name: '张三',
  role: '产品经理',
  department: '产品部',
  joinDate: '2023-06-15',
  avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait&image_size=square'
});

// 个人绩效指标
const performanceMetrics = ref({
  completionRate: 92,
  productivity: 85,
  quality: 90,
  teamwork: 88
});

// 待办任务列表
const todoList = ref([
  { id: 1, title: '完成产品需求文档', dueDate: '2023-10-15', priority: '高', completed: false },
  { id: 2, title: '参加团队周会', dueDate: '2023-10-10', priority: '中', completed: false },
  { id: 3, title: '与设计团队沟通', dueDate: '2023-10-12', priority: '中', completed: true },
  { id: 4, title: '更新产品路线图', dueDate: '2023-10-18', priority: '低', completed: false }
]);

// 最近活动
const recentActivities = ref([
  { title: '创建了新的产品需求文档', time: '2023-10-09 14:30' },
  { title: '参加了产品评审会议', time: '2023-10-08 10:00' },
  { title: '更新了产品路线图', time: '2023-10-07 16:45' },
  { title: '与开发团队讨论了技术实现', time: '2023-10-06 11:20' }
]);

// 切换任务完成状态
function toggleTodo(id) {
  const todo = todoList.value.find(item => item.id === id);
  if (todo) {
    todo.completed = !todo.completed;
  }
}

// 获取优先级颜色
function getPriorityColor(priority) {
  switch (priority) {
    case '高':
      return 'red';
    case '中':
      return 'orange';
    case '低':
      return 'green';
    default:
      return 'blue';
  }
}
</script>

<style scoped>
.personal-workbench {
  border-radius: 12px;
  overflow: hidden;
}

/* 个人信息样式 */
.personal-info {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar {
  margin-right: 16px;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
}

.user-role {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.user-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
}

/* 绩效指标样式 */
.performance-metrics {
  padding: 0 8px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2f3d;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-item {
  text-align: center;
  padding: 12px 8px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-item:hover {
  background-color: #f0f5ff;
  transform: translateY(-2px);
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

/* 待办任务样式 */
.todo-list {
  padding: 0 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.view-all {
  font-size: 12px;
  color: #1890ff;
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.todo-item {
  padding: 8px 0;
  transition: all 0.2s ease;
}

.todo-item:hover {
  background-color: #f0f5ff;
  border-radius: 8px;
  padding-left: 8px;
}

.todo-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-due {
  font-size: 12px;
  color: #999;
  margin-left: 16px;
}

/* 最近活动样式 */
.recent-activities {
  padding: 0 8px 8px;
}

.activity-content {
  padding: 4px 0;
}

.activity-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #1f2f3d;
}

.activity-time {
  margin: 0;
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .personal-info {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>