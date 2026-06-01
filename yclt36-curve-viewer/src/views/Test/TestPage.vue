<template>
  <div class="advanced-test-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">高级测试功能展示</h1>
        <p class="page-description">探索数据可视化与复杂交互体验的无限可能</p>
      </div>
      <div class="header-right">
        <a-badge :count="notificationCount" :offset="[-5, 5]">
          <a-button @click="showNotifications = true">
            <BellOutlined /> 通知
          </a-button>
        </a-badge>
        <a-dropdown :trigger="['click']">
          <a-button>
            <UserOutlined /> {{ currentUser }}
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleUserMenu">
              <a-menu-item key="profile"><UserOutlined /> 个人中心</a-menu-item>
              <a-menu-item key="settings"><SettingOutlined /> 账户设置</a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout"><LogoutOutlined /> 退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 实时状态指示器 -->
    <div class="status-bar">
      <div class="status-item">
        <a-badge status="processing" />
        <span>系统运行正常</span>
      </div>
      <div class="status-item">
        <span class="label">在线用户:</span>
        <span class="value highlight">{{ onlineUsers }}</span>
      </div>
      <div class="status-item">
        <span class="label">服务器负载:</span>
        <a-progress :percent="serverLoad" size="small" :width="80" :status="serverLoad > 80 ? 'exception' : 'active'" />
      </div>
      <div class="status-item">
        <span class="label">最后更新:</span>
        <span class="value">{{ lastUpdateTime }}</span>
      </div>
    </div>

    <!-- 统计卡片 - 带迷你图表 -->
    <a-row :gutter="[16, 16]" class="stats-grid">
      <a-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in statsData" :key="index">
        <a-card class="stat-card" hoverable @click="handleStatClick(stat)">
          <div class="stat-header">
            <div class="stat-icon-wrapper" :style="{ background: stat.gradient }">
              <span class="stat-emoji">{{ stat.icon }}</span>
            </div>
            <div class="trend-indicator" :class="stat.trend > 0 ? 'up' : 'down'">
              <ArrowUpOutlined v-if="stat.trend > 0" />
              <ArrowDownOutlined v-else />
              {{ Math.abs(stat.trend) }}%
            </div>
          </div>
          <div class="stat-value">{{ formatNumber(stat.value) }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="mini-chart">
            <svg :viewBox="`0 0 ${stat.sparkline.length * 3} 20`" preserveAspectRatio="none">
              <polyline
                :points="generateSparklinePoints(stat.sparkline)"
                fill="none"
                :stroke="stat.color"
                stroke-width="2"
              />
            </svg>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 主内容区域 -->
    <a-row :gutter="[16, 16]">
      <!-- 左侧：实时监控面板 -->
      <a-col :xs="24" :lg="16">
        <a-tabs v-model:activeKey="mainTabKey" type="card" class="main-tabs">
          <a-tab-pane key="monitor" tab="📊 实时监控">
            <div class="monitor-panel">
              <div class="panel-toolbar">
                <a-space>
                  <a-radio-group v-model:value="chartTimeRange" size="small" button-style="solid">
                    <a-radio-button value="1h">1小时</a-radio-button>
                    <a-radio-button value="6h">6小时</a-radio-button>
                    <a-radio-button value="24h">24小时</a-radio-button>
                    <a-radio-button value="7d">7天</a-radio-button>
                  </a-radio-group>
                  <a-switch v-model:checked="autoRefresh" checked-children="自动刷新" unchecked-children="手动" />
                  <a-button size="small" @click="refreshChartData">
                    <ReloadOutlined :spin="refreshing" />
                  </a-button>
                </a-space>
              </div>

              <a-row :gutter="[16, 16]">
                <a-col :span="24">
                  <a-card title="系统性能趋势" class="chart-card">
                    <div ref="performanceChartRef" class="chart-container large"></div>
                  </a-card>
                </a-col>

                <a-col :xs="24" :md="12">
                  <a-card title="资源使用情况" class="chart-card">
                    <div ref="resourceChartRef" class="chart-container"></div>
                  </a-card>
                </a-col>

                <a-col :xs="24" :md="12">
                  <a-card title="请求分布" class="chart-card">
                    <div ref="requestChartRef" class="chart-container"></div>
                  </a-card>
                </a-col>
              </a-row>
            </div>
          </a-tab-pane>

          <a-tab-pane key="interactive" tab="🎮 复杂交互">
            <div class="interactive-demo">
              <!-- 可拖拽排序列表 -->
              <a-card title="拖拽排序任务列表" class="demo-card">
                <div class="drag-list">
                  <div
                    v-for="(task, index) in dragTasks"
                    :key="task.id"
                    class="drag-item"
                    :class="{ 'dragging': draggingIndex === index }"
                    draggable="true"
                    @dragstart="handleDragStart($event, index)"
                    @dragover.prevent
                    @drop="handleDrop($event, index)"
                    @dragend="handleDragEnd"
                  >
                    <HolderOutlined class="drag-handle" />
                    <a-checkbox v-model:checked="task.completed">{{ task.title }}</a-checkbox>
                    <a-tag :color="getTaskPriorityColor(task.priority)" size="small">{{ task.priority }}</a-tag>
                    <a-popconfirm title="确定删除？" @confirm="removeTask(index)">
                      <a-button type="text" danger size="small"><DeleteOutlined /></a-button>
                    </a-popconfirm>
                  </div>
                </div>
                <a-input-search
                  v-model:value="newTaskText"
                  placeholder="添加新任务，按回车确认"
                  enter-button="添加"
                  @search="addTask"
                  style="margin-top: 12px;"
                />
              </a-card>

              <!-- 可编辑表格 -->
              <a-card title="可编辑数据表格" class="demo-card">
                <a-table
                  :columns="editableColumns"
                  :data-source="editableData"
                  :pagination="false"
                  bordered
                  size="middle"
                >
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'name'">
                      <a-input
                        v-if="editingKey === `${index}-name`"
                        v-model:value="record.name"
                        size="small"
                        @pressEnter="save(index, 'name')"
                        @blur="save(index, 'name')"
                        autofocus
                      />
                      <div v-else class="editable-cell" @click="edit(index, 'name')">
                        {{ record.name }}
                        <EditOutlined class="edit-icon" />
                      </div>
                    </template>
                    <template v-else-if="column.key === 'age'">
                      <a-input-number
                        v-if="editingKey === `${index}-age`"
                        v-model:value="record.age"
                        size="small"
                        :min="0"
                        :max="150"
                        @change="save(index, 'age')"
                      />
                      <div v-else class="editable-cell" @click="edit(index, 'age')">
                        {{ record.age }}
                        <EditOutlined class="edit-icon" />
                      </div>
                    </template>
                    <template v-else-if="column.key === 'tags'">
                      <a-select
                        v-if="editingKey === `${index}-tags`"
                        v-model:value="record.tags"
                        mode="multiple"
                        size="small"
                        style="width: 100%"
                        @change="save(index, 'tags')"
                      >
                        <a-select-option value="nice">Nice</a-select-option>
                        <a-select-option value="developer">Developer</a-select-option>
                        <a-select-option value="designer">Designer</a-select-option>
                        <a-select-option value="manager">Manager</a-select-option>
                      </a-select>
                      <div v-else class="editable-cell" @click="edit(index, 'tags')">
                        <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                        <EditOutlined class="edit-icon" />
                      </div>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <a-space>
                        <a-button type="link" size="small" @click="addRow">+</a-button>
                        <a-popconfirm title="确定删除？" @confirm="deleteRow(index)">
                          <a-button type="link" danger size="small">-</a-button>
                        </a-popconfirm>
                      </a-space>
                    </template>
                  </template>
                </a-table>
              </a-card>

              <!-- 进度步骤演示 -->
              <a-card title="多步骤表单向导" class="demo-card">
                <a-steps :current="currentStep" class="wizard-steps">
                  <a-step title="基本信息" description="填写基本资料" />
                  <a-step title="详细配置" description="配置详细参数" />
                  <a-step title="确认提交" description="核对并提交" />
                  <a-step title="完成" description="操作成功" />
                </a-steps>

                <div class="wizard-content">
                  <div v-show="currentStep === 0" class="step-form">
                    <a-form layout="vertical" :model="wizardForm.basic">
                      <a-row :gutter="16">
                        <a-col :span="12">
                          <a-form-item label="项目名称" required>
                            <a-input v-model:value="wizardForm.basic.name" placeholder="请输入项目名称" />
                          </a-form-item>
                        </a-col>
                        <a-col :span="12">
                          <a-form-item label="项目类型">
                            <a-select v-model:value="wizardForm.basic.type" placeholder="请选择">
                              { id: 2, icon: '✅', avatarBg: '#52c41a', title: '审批通过', content: '您提交的采购申请已审批通过', time: '1小时前', read: false },
                              <a-select-option value="web">Web应用</a-select-option>
                              <a-select-option value="mobile">移动端</a-select-option>
                              <a-select-option value="desktop">桌面应用</a-select-option>
                            </a-select>
                          </a-form-item>
                        </a-col>
                      </a-row>
                      <a-form-item label="项目描述">
                        <a-textarea v-model:value="wizardForm.basic.description" :rows="3" />
                      </a-form-item>
                    </a-form>
                  </div>

                  <div v-show="currentStep === 1" class="step-form">
                    <a-form layout="vertical" :model="wizardForm.config">
                      <a-row :gutter="16">
                        <a-col :span="8">
                          <a-form-item label="CPU核心数">
                            <a-slider v-model:value="wizardForm.config.cpu" :min="1" :max="32" :marks="{ 1: '1', 4: '4', 8: '8', 16: '16', 32: '32' }" />
                          </a-form-item>
                        </a-col>
                        <a-col :span="8">
                          <a-form-item label="内存大小(GB)">
                            <a-input-number v-model:value="wizardForm.config.memory" :min="1" :max="256" style="width: 100%" />
                          </a-form-item>
                        </a-col>
                        <a-col :span="8">
                          <a-form-item label="存储空间(GB)">
                            <a-input-number v-model:value="wizardForm.config.storage" :min="10" :max="10000" style="width: 100%" />
                          </a-form-item>
                        </a-col>
                      </a-row>
                      <a-form-item label="启用功能">
                        <a-checkbox-group v-model:value="wizardForm.config.features">
                          <a-checkbox value="ssl">SSL证书</a-checkbox>
                          <a-checkbox value="cdn">CDN加速</a-checkbox>
                          <a-checkbox value="backup">自动备份</a-checkbox>
                          <a-checkbox value="monitor">性能监控</a-checkbox>
                        </a-checkbox-group>
                      </a-form-item>
                    </a-form>
                  </div>

                  <div v-show="currentStep === 2" class="step-form">
                    <a-descriptions :column="2" bordered size="small">
                      <a-descriptions-item label="项目名称">{{ wizardForm.basic.name || '-' }}</a-descriptions-item>
                      <a-descriptions-item label="项目类型">{{ wizardForm.basic.type || '-' }}</a-descriptions-item>
                      <a-descriptions-item label="CPU核心">{{ wizardForm.config.cpu || '-' }}核</a-descriptions-item>
                      <a-descriptions-item label="内存">{{ wizardForm.config.memory || '-' }}GB</a-descriptions-item>
                      <a-descriptions-item label="存储">{{ wizardForm.config.storage || '-' }}GB</a-descriptions-item>
                      <a-descriptions-item label="功能特性">{{ (wizardForm.config.features || []).join('、') || '-' }}</a-descriptions-item>
                    </a-descriptions>
                    <a-alert message="请仔细核对以上信息，确认无误后点击完成" type="info" show-icon style="margin-top: 16px;" />
                  </div>

                  <div v-show="currentStep === 3" class="step-form success-step">
                    <a-result
                      status="success"
                      title="创建成功！"
                      sub-title="您的项目已成功创建，可以开始部署了"
                    >
                      <template #extra>
                        <a-button type="primary" @click="resetWizard">再创建一个</a-button>
                        <a-button>查看详情</a-button>
                      </template>
                    </a-result>
                  </div>
                </div>

                <div class="wizard-actions">
                  <a-button v-if="currentStep > 0 && currentStep < 3" @click="prevStep">上一步</a-button>
                  <a-button v-if="currentStep < 3" type="primary" @click="nextStep">
                    {{ currentStep === 2 ? '完成' : '下一步' }}
                  </a-button>
                </div>
              </a-card>
            </div>
          </a-tab-pane>

          <a-tab-pane key="components" tab="🧩 组件展示">
            <a-row :gutter="[16, 16]">
              <!-- 树形控件 -->
              <a-col :xs="24" :md="12">
                <a-card title="可搜索树形选择器" class="component-card">
                  <a-tree-select
                    v-model:value="selectedTreeKeys"
                    show-search
                    tree-default-expand-all
                    style="width: 100%"
                    :tree-data="treeData"
                    placeholder="请选择部门/人员"
                    allow-clear
                    multiple
                    tree-node-filter-prop="title"
                  />
                </a-card>
              </a-col>

              <!-- 级联选择 -->
              <a-col :xs="24" :md="12">
                <a-card title="多级联动选择器" class="component-card">
                  <a-cascader
                    v-model:value="cascaderValue"
                    :options="cascaderOptions"
                    placeholder="请选择地区"
                    change-on-select
                    expand-trigger="hover"
                  />
                  <br><br>
                  <a-cascader
                    v-model:value="categoryValue"
                    :options="categoryOptions"
                    placeholder="选择商品分类"
                    style="margin-top: 8px;"
                  />
                </a-card>
              </a-col>

              <!-- 穿梭框 -->
              <a-col :span="24">
                <a-card title="穿梭框（人员分配）" class="component-card">
                  <a-transfer
                    v-model:target-keys="transferTargetKeys"
                    :data-source="transferData"
                    :titles="['可选人员', '已选人员']"
                    :render="item => item.title"
                    show-search
                    :filter-option="filterOption"
                  />
                </a-card>
              </a-col>

              <!-- 时间线 -->
              <a-col :xs="24" :md="12">
                <a-card title="活动时间线" class="component-card">
                  <a-timeline mode="left">
                    <a-timeline-item color="green">创建服务站点 2015-09-01</a-timeline-item>
                    <a-timeline-item>初步排除网络硬件故障 2015-09-01</a-timeline-item>
                    <a-timeline-item color="red">
                      <p>技术终端异常</p>
                      <p>网络异常</p>
                    </a-timeline-item>
                    <a-timeline-item>
                      <a-card size="small" title="异常报告单">
                        发生时间：2019-11-01<br>
                        异常描述：服务器响应超时
                      </a-card>
                    </a-timeline-item>
                    <a-timeline-item>解决网络异常 2015-09-01</a-timeline-item>
                    <a-timeline-item>服务上线 2015-09-01</a-timeline-item>
                  </a-timeline>
                </a-card>
              </a-col>

              <!-- 进度环 -->
              <a-col :xs="24" :md="12">
                <a-card title="进度环形图" class="component-card">
                  <div class="progress-rings">
                    <div class="ring-item">
                      <a-progress type="circle" :percent="75" :width="100" />
                      <span class="ring-label">前端</span>
                    </div>
                    <div class="ring-item">
                      <a-progress type="circle" :percent="60" :width="100" status="exception" />
                      <span class="ring-label">后端</span>
                    </div>
                    <div class="ring-item">
                      <a-progress type="circle" :percent="90" :width="100" />
                      <span class="ring-label">设计</span>
                    </div>
                    <div class="ring-item">
                      <a-progress type="circle" :percent="45" :width="100" />
                      <span class="ring-label">测试</span>
                    </div>
                  </div>
                </a-card>
              </a-col>

              <!-- 滑块验证码 -->
              <a-col :xs="24" :md="12">
                <a-card title="滑块验证组件" class="component-card">
                  <div class="slider-verify" @click="handleSliderVerify">
                    <div class="slider-track" :style="{ width: sliderVerified ? '100%' : '0%' }">
                      <div class="slider-thumb" :class="{ verified: sliderVerified }">
                        <RightOutlined v-if="!sliderVerified" />
                        <CheckOutlined v-else />
                      </div>
                    </div>
                    <div class="slider-text" v-if="!sliderVerified">向右滑动完成验证</div>
                    <div class="slider-text success" v-else>✓ 验证成功</div>
                  </div>
                </a-card>
              </a-col>

              <!-- 评分组件 -->
              <a-col :xs="24" :md="12">
                <a-card title="评分与评价" class="component-card">
                  <div class="rating-section">
                    <div class="big-rating">
                      <a-rate v-model:value="overallRating" allow-half />
                      <span class="rating-value">{{ overallRating }} 分</span>
                    </div>
                    <a-divider />
                    <div class="detail-ratings">
                      <div class="detail-rating-item" v-for="item in ratingItems" :key="item.label">
                        <span>{{ item.label }}</span>
                        <a-rate v-model:value="item.value" allow-half disabled />
                      </div>
                    </div>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </a-tab-pane>
        </a-tabs>
      </a-col>

      <!-- 右侧面板 -->
      <a-col :xs="24" :lg="8">
        <!-- 实时日志 -->
        <a-card title="实时日志流" class="log-card" :extra="logControls">
          <template #extra>
            <a-space>
              <a-switch v-model:checked="autoScrollLog" size="small" checked-children="跟随" />
              <a-button size="small" @click="clearLogs">清空</a-button>
            </a-space>
          </template>
          <div ref="logContainerRef" class="log-container">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="log-entry"
              :class="'log-' + log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-level">{{ log.level }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </a-card>

        <!-- 快捷操作 -->
        <a-card title="快捷操作面板" class="quick-actions-card" style="margin-top: 16px;">
          <a-collapse v-model:activeKey="collapseKey" accordion>
            <a-collapse-panel key="1" header="📤 数据导出">
              <a-space direction="vertical" style="width: 100%;">
                <a-button block @click="exportData('excel')">
                  <FileExcelOutlined /> 导出 Excel
                </a-button>
                <a-button block @click="exportData('csv')">
                  <FileTextOutlined /> 导出 CSV
                </a-button>
                <a-button block @click="exportData('pdf')">
                  <FilePdfOutlined /> 导出 PDF
                </a-button>
              </a-space>
            </a-collapse-panel>
            <a-collapse-panel key="2" header="⚙️ 系统工具">
              <a-list size="small" :split="false">
                <a-list-item @click="openTool('cache')">
                  <ClearOutlined /> 清除缓存
                </a-list-item>
                <a-list-item @click="openTool('backup')">
                  <CloudUploadOutlined /> 数据备份
                </a-list-item>
                <a-list-item @click="openTool('restore')">
                  <CloudDownloadOutlined /> 数据恢复
                </a-list-item>
              </a-list>
            </a-collapse-panel>
            <a-collapse-panel key="3" header="🔔 通知设置">
              <a-form layout="vertical" size="small">
                <a-form-item label="邮件通知">
                  <a-switch v-model:checked="notifySettings.email" />
                </a-form-item>
                <a-form-item label="站内消息">
                  <a-switch v-model:checked="notifySettings.message" />
                </a-form-item>
                <a-form-item label="弹窗提醒">
                  <a-switch v-model:checked="notifySettings.popup" />
                </a-form-item>
              </a-form>
            </a-collapse-panel>
          </a-collapse>
        </a-card>

        <!-- 团队成员在线状态 -->
        <a-card title="团队成员" class="team-card" style="margin-top: 16px;">
          <a-list :data-source="teamMembers" size="small" :split="false">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-badge :dot="item.online" :status="item.online ? 'success' : 'default'">
                      <a-avatar :src="item.avatar" :size="36">
                        {{ item.name.charAt(0) }}
                      </a-avatar>
                    </a-badge>
                  </template>
                  <template #title>
                    <span>{{ item.name }}</span>
                    <a-tag :color="item.roleColor" size="small">{{ item.role }}</a-tag>
                  </template>
                  <template #description>
                    {{ item.status }}
                  </template>
                </a-list-item-meta>
                <a-button type="text" size="small">
                  <MessageOutlined />
                </a-button>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 通知抽屉 -->
    <a-drawer
      v-model:open="showNotifications"
      title="通知中心"
      placement="right"
      width="400"
    >
      <a-tabs v-model:activeKey="notifTabKey">
        <a-tab-pane key="all" :tab="`全部 (${notifications.length})`">
          <a-list :data-source="notifications" :split="false">
            <template #renderItem="{ item }">
              <a-list-item class="notif-item" :class="{ unread: !item.read }">
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.avatarBg }">
                      {{ item.icon }}
                    </a-avatar>
                  </template>
                  <template #title>{{ item.title }}</template>
                  <template #description>
                    <div class="notif-desc">{{ item.content }}</div>
                    <div class="notif-time">{{ item.time }}</div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
        <a-tab-pane key="unread" :tab="`未读 (${unreadCount})`">
          <a-empty v-if="unreadCount === 0" description="暂无未读通知" />
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import * as echarts from 'echarts';
import {
  BellOutlined, UserOutlined, DownOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ReloadOutlined, HolderOutlined, DeleteOutlined, EditOutlined, SettingOutlined,
  LogoutOutlined, CheckOutlined, RightOutlined, FileExcelOutlined, FileTextOutlined,
  FilePdfOutlined, ClearOutlined, CloudUploadOutlined, CloudDownloadOutlined,
  MessageOutlined
} from '@ant-design/icons-vue';

const notificationCount = ref(3);
const currentUser = ref('管理员');
const onlineUsers = ref(128);
const serverLoad = ref(65);
const lastUpdateTime = ref(new Date().toLocaleTimeString());
const mainTabKey = ref('monitor');
const chartTimeRange = ref('6h');
const autoRefresh = ref(true);
const refreshing = ref(false);
const showNotifications = ref(false);
const notifTabKey = ref('all');
const currentStep = ref(0);
const editingKey = ref('');
const selectedTreeKeys = ref([]);
const cascaderValue = ref([]);
const categoryValue = ref([]);
const transferTargetKeys = ref(['2', '4']);
const overallRating = ref(4.5);
const sliderVerified = ref(false);
const autoScrollLog = ref(true);
const collapseKey = ref(['1']);
const draggingIndex = ref(-1);
const newTaskText = ref('');
const logContainerRef = ref(null);

const performanceChartRef = ref(null);
const resourceChartRef = ref(null);
const requestChartRef = ref(null);

let performanceChart = null;
let resourceChart = null;
let requestChart = null;
let refreshTimer = null;
let logTimer = null;

const statsData = ref([
  { icon: '👥', label: '活跃用户', value: 12847, trend: 12.5, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#667eea', sparkline: [30, 45, 35, 50, 40, 60, 55, 70, 65, 75] },
  { icon: '💰', label: '今日收入', value: 89234, trend: 8.3, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#f5576c', sparkline: [20, 35, 30, 55, 45, 65, 60, 80, 70, 85] },
  { icon: '📦', label: '订单数量', value: 1567, trend: -2.1, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#4facfe', sparkline: [50, 42, 48, 38, 45, 52, 48, 58, 55, 62] },
  { icon: '⚡', label: '转化率', value: 23.8, trend: 5.7, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#43e97b', sparkline: [15, 18, 22, 20, 25, 23, 28, 26, 30, 28] }
]);

const dragTasks = ref([
  { id: 1, title: '完成首页UI设计稿', priority: '高', completed: false },
  { id: 2, title: '修复登录页Bug', priority: '紧急', completed: true },
  { id: 3, title: '编写API文档', priority: '中', completed: false },
  { id: 4, title: '优化数据库查询', priority: '高', completed: false },
  { id: 5, title: '部署测试环境', priority: '低', completed: false }
]);

const editableColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '年龄', dataIndex: 'age', key: 'age' },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '操作', key: 'action', width: 100 }
];

const editableData = ref([
  { name: '张三', age: 28, tags: ['developer', 'nice'] },
  { name: '李四', age: 32, tags: ['manager'] },
  { name: '王五', age: 25, tags: ['designer', 'developer'] }
]);

const wizardForm = ref({
  basic: { name: '', type: '', description: '' },
  config: { cpu: 4, memory: 8, storage: 100, features: ['ssl', 'monitor'] }
});

const treeData = [
  {
    title: '技术部',
    value: 'tech',
    children: [
      { title: '前端组', value: 'frontend', children: [{ title: '张三', value: 'zhangsan' }, { title: '李四', value: 'lisi' }] },
      { title: '后端组', value: 'backend', children: [{ title: '王五', value: 'wangwu' }, { title: '赵六', value: 'zhaoliu' }] }
    ]
  },
  {
    title: '产品部',
    value: 'product',
    children: [
      { title: '产品一组', value: 'pg1', children: [{ title: '钱七', value: 'qianqi' }] },
      { title: '产品二组', value: 'pg2', children: [{ title: '孙八', value: 'sunba' }] }
    ]
  }
];

const cascaderOptions = [
  { value: 'beijing', label: '北京', children: [{ value: 'chaoyang', label: '朝阳区' }, { value: 'haidian', label: '海淀区' }] },
  { value: 'shanghai', label: '上海', children: [{ value: 'pudong', label: '浦东新区' }, { value: 'jingan', label: '静安区' }] },
  { value: 'guangzhou', label: '广州', children: [{ value: 'tianhe', label: '天河区' }, { value: 'yuexiu', label: '越秀区' }] }
];

const categoryOptions = [
  { value: 'electronics', label: '电子产品', children: [{ value: 'phone', label: '手机' }, { value: 'laptop', label: '笔记本' }] },
  { value: 'clothing', label: '服装', children: [{ value: 'men', label: '男装' }, { value: 'women', label: '女装' }] },
  { value: 'food', label: '食品', children: [{ value: 'snacks', label: '零食' }, { value: 'drinks', label: '饮料' }] }
];

const transferData = [];
for (let i = 1; i <= 10; i++) {
  transferData.push({ key: String(i), title: `员工${i}号`, disabled: i % 4 === 0 });
}

const logs = ref([]);
const notifySettings = ref({ email: true, message: true, popup: true });

const notifications = ref([
  { id: 1, icon: '📢', avatarBg: '#1890ff', title: '系统维护通知', content: '计划于今晚23:00进行系统维护升级', time: '5分钟前', read: false },
  { id: 3, icon: '💬', avatarBg: '#faad14', title: '新消息', content: '李四给您发了一条私信', time: '2小时前', read: true }
]);

const teamMembers = ref([
  { name: '张三', role: '前端开发', roleColor: 'blue', online: true, status: '编码中...', avatar: '' },
  { name: '李四', role: '产品经理', roleColor: 'green', online: true, status: '评审中...', avatar: '' },
  { name: '王五', role: '后端开发', roleColor: 'purple', online: true, status: '调试中...', avatar: '' },
  { name: '赵六', role: 'UI设计师', roleColor: 'cyan', online: false, status: '离线', avatar: '' },
  { name: '钱七', role: '测试工程师', roleColor: 'orange', online: false, status: '离线', avatar: '' }
]);

const ratingItems = ref([
  { label: '界面美观度', value: 4.5 },
  { label: '操作便捷性', value: 4.2 },
  { label: '功能完整性', value: 4.0 },
  { label: '性能稳定性', value: 4.8 }
]);

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

function formatNumber(num) {
  return num.toLocaleString();
}

function generateSparklinePoints(data) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return data.map((v, i) => `${i * 3},${20 - ((v - min) / range) * 18}`).join(' ');
}
function handleStatClick(stat) {
  message.info(`查看 ${stat.label} 详情`);
}

function handleUserMenu({ key }) {
  if (key === 'logout') {
    Modal.confirm({ title: '确认退出？', onOk: () => message.success('已退出') });
  } else {
    message.info(`打开 ${key}`);
  }
}

function initCharts() {
  setTimeout(() => {
    if (performanceChartRef.value) {
      performanceChartRef.value.style.width = '100%';
      performanceChartRef.value.style.height = '300px';
      performanceChart = echarts.init(performanceChartRef.value);
      performanceChart.setOption(getPerformanceOption());
    }

    if (resourceChartRef.value) {
      resourceChartRef.value.style.width = '100%';
      resourceChartRef.value.style.height = '250px';
      resourceChart = echarts.init(resourceChartRef.value);
      resourceChart.setOption(getResourceOption());
    }

    if (requestChartRef.value) {
      requestChartRef.value.style.width = '100%';
      requestChartRef.value.style.height = '250px';
      requestChart = echarts.init(requestChartRef.value);
      requestChart.setOption(getRequestOption());
    }
  }, 100);
}

function getPerformanceOption() {
  const hours = [];
  for (let i = 0; i < 24; i++) hours.push(`${String(i).padStart(2, '0')}:00`);
  
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['CPU使用率', '内存使用率', '磁盘I/O'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: hours.slice(-12) },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: 'CPU使用率', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40 + 30)) },
      { name: '内存使用率', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 30 + 40)) },
      { name: '磁盘I/O', type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50 + 20)) }
    ]
  };
}

function getResourceOption() {
  return {
    tooltip: { formatter: '{a}: {c}%' },
    legend: { bottom: 0 },
    series: [
      { type: 'gauge', radius: '70%', center: ['25%', '55%'], startAngle: 200, endAngle: -20, axisLine: { lineStyle: { width: 15 } }, pointer: { length: '60%', width: 6 }, detail: { fontSize: 14, offsetCenter: [0, '60%'] }, data: [{ value: 65, name: 'CPU' }] },
      { type: 'gauge', radius: '70%', center: ['75%', '55%'], startAngle: 200, endAngle: -20, axisLine: { lineStyle: { width: 15 } }, pointer: { length: '60%', width: 6 }, detail: { fontSize: 14, offsetCenter: [0, '60%'] }, data: [{ value: 78, name: '内存' }] }
    ]
  };
}

function getRequestOption() {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 450, name: 'GET请求', itemStyle: { color: '#1890ff' } },
        { value: 280, name: 'POST请求', itemStyle: { color: '#52c41a' } },
        { value: 120, name: 'PUT请求', itemStyle: { color: '#faad14' } },
        { value: 80, name: 'DELETE请求', itemStyle: { color: '#ff4d4f' } },
        { value: 50, name: '其他', itemStyle: { color: '#722ed1' } }
      ]
    }]
  };
}

function refreshChartData() {
  refreshing.value = true;
  setTimeout(() => {
    performanceChart?.setOption(getPerformanceOption());
    resourceChart?.setOption(getResourceOption());
    requestChart?.setOption(getRequestOption());
    refreshing.value = false;
    message.success('数据已更新');
  }, 800);
}

function addLog(type, level, msg) {
  const now = new Date();
  logs.value.unshift({
    time: now.toLocaleTimeString(),
    level,
    type,
    message: msg
  });
  if (logs.value.length > 100) logs.value.pop();

  if (autoScrollLog.value && logContainerRef.value) {
    nextTick(() => {
      logContainerRef.value.scrollTop = 0;
    });
  }
}

function clearLogs() {
  logs.value = [];
  message.info('日志已清空');
}

function getTaskPriorityColor(priority) {
  switch (priority) {
    case '紧急': return 'red';
    case '高': return 'orange';
    case '中': return 'blue';
    default: return 'default';
  }
}

function handleDragStart(e, index) {
  draggingIndex.value = index;
  e.dataTransfer.effectAllowed = 'move';
}

function handleDrop(e, index) {
  e.preventDefault();
  const from = draggingIndex.value;
  if (from !== index && from !== -1) {
    const item = dragTasks.value.splice(from, 1)[0];
    dragTasks.value.splice(index, 0, item);
  }
}

function handleDragEnd() {
  draggingIndex.value = -1;
}

function removeTask(index) {
  dragTasks.value.splice(index, 1);
}

function addTask(text) {
  if (!text.trim()) return;
  dragTasks.value.unshift({ id: Date.now(), title: text.trim(), priority: '中', completed: false });
  newTaskText.value = '';
  addLog('info', 'INFO', `新增任务: ${text}`);
}

function edit(index, key) {
  editingKey.value = `${index}-${key}`;
}

function save(index, key) {
  editingKey.value = '';
  addLog('success', 'SUCCESS', `修改了第 ${index + 1} 行的 ${key}`);
}

function addRow() {
  editableData.value.push({ name: '新成员', age: 25, tags: [] });
}

function deleteRow(index) {
  editableData.value.splice(index, 1);
}

function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++;
    if (currentStep.value === 3) {
      addLog('success', 'SUCCESS', '向导流程完成');
    }
  }
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--;
}

function resetWizard() {
  currentStep.value = 0;
  wizardForm.value = { basic: { name: '', type: '', description: '' }, config: { cpu: 4, memory: 8, storage: 100, features: ['ssl', 'monitor'] } };
}

function handleSliderVerify(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x > rect.width - 40) {
    sliderVerified.value = true;
    addLog('success', 'VERIFY', '滑块验证通过');
  }
}

function filterOption(input, option) {
  return option.title.toLowerCase().includes(input.toLowerCase());
}

function exportData(format) {
  message.success(`正在导出 ${format.toUpperCase()} 格式...`);
  addLog('info', 'EXPORT', `导出数据为 ${format.toUpperCase()} 格式`);
}

function openTool(tool) {
  message.info(`打开工具: ${tool}`);
  addLog('info', 'TOOL', `执行工具操作: ${tool}`);
}

onMounted(() => {
  initCharts();
  addLog('system', 'SYSTEM', '高级测试模块初始化完成');

  refreshTimer = setInterval(() => {
    lastUpdateTime.value = new Date().toLocaleTimeString();
    onlineUsers.value += Math.floor(Math.random() * 5) - 2;
    serverLoad.value = Math.min(100, Math.max(20, serverLoad.value + Math.floor(Math.random() * 10) - 5));
    
    if (Math.random() > 0.7) {
      const types = ['info', 'warning', 'error'];
      const levels = ['INFO', 'WARN', 'ERROR'];
      const msgs = [
        '新用户接入: user_' + Math.random().toString(36).substr(2, 6),
        '接口响应缓慢: /api/data 耗时 ' + (Math.random() * 2 + 0.5).toFixed(2) + 's',
        '缓存命中率: ' + (Math.random() * 30 + 70).toFixed(1) + '%',
        '队列积压警告: 当前积压 ' + Math.floor(Math.random() * 50 + 10) + ' 条'
      ];
      const idx = Math.floor(Math.random() * types.length);
      addLog(types[idx], levels[idx], msgs[idx]);
    }
  }, 3000);

  window.addEventListener('resize', () => {
    performanceChart?.resize();
    resourceChart?.resize();
    requestChart?.resize();
  });
});

onUnmounted(() => {
  clearInterval(refreshTimer);
  clearInterval(logTimer);
  performanceChart?.dispose();
  resourceChart?.dispose();
  requestChart?.dispose();
});
</script>

<style scoped>
.advanced-test-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
}

.page-description {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.header-right .ant-btn {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: white;
}
.header-right .ant-btn:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
  color: white;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  background: white;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  font-size: 13px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-item .label { color: #999; }
.status-item .value { color: #333; font-weight: 500; }
.status-item .value.highlight { color: #1890ff; font-weight: 700; }

.stats-grid { margin-bottom: 16px; }

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-emoji { font-size: 24px; }

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.trend-indicator.up { background: #f6ffed; color: #52c41a; }
.trend-indicator.down { background: #fff2f0; color: #ff4d4f; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2f3d;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.mini-chart {
  height: 24px;
  margin-top: 8px;
}

.main-tabs { background: transparent; }
.main-tabs :deep(.ant-tabs-nav) { margin-bottom: 0; }
.main-tabs :deep(.ant-tabs-content) { background: white; border-radius: 12px; padding: 16px; }
.main-tabs :deep(.ant-tabs-tab) { background: white; border-radius: 8px 8px 0 0; margin-right: 4px; }

.monitor-panel { padding: 0; }
.panel-toolbar { margin-bottom: 16px; padding: 12px; background: #fafafa; border-radius: 8px; }
.chart-card { margin-bottom: 16px; border-radius: 12px; }
.chart-container.large { height: 300px; }
.chart-container { height: 250px; }

.interactive-demo { display: flex; flex-direction: column; gap: 16px; }
.demo-card { border-radius: 12px; }

.drag-list { display: flex; flex-direction: column; gap: 8px; }
.drag-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
}
.drag-item:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24,144,255,0.15); }
.drag-item.dragging { opacity: 0.5; transform: scale(0.98); }
.drag-handle { cursor: grab; color: #bbb; font-size: 16px; }
.drag-item:hover .drag-handle { color: #1890ff; }

.editable-cell {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.editable-cell:hover { background: #f0f5ff; }
.edit-icon { color: #bbb; font-size: 12px; }

.wizard-steps { margin-bottom: 24px; }
.wizard-content { min-height: 200px; }
.step-form { padding: 16px 0; }
.wizard-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.success-step { text-align: center; padding: 40px 0; }

.component-card { border-radius: 12px; margin-bottom: 16px; }

.progress-rings {
  display: flex;
  justify-content: space-around;
  text-align: center;
}
.ring-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ring-label { font-size: 13px; color: #666; }

.slider-verify {
  position: relative;
  height: 44px;
  background: #e8e8e8;
  border-radius: 22px;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
}
.slider-track {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #1890ff 0%, #36cfc9 100%);
  transition: width 0.3s;
}
.slider-thumb {
  position: absolute;
  top: 3px;
  right: -21px;
  width: 38px;
  height: 38px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: right 0.3s;
  color: #ccc;
  font-size: 14px;
}
.slider-thumb.verified { right: calc(100% - 19px); color: #52c41a; }
.slider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  pointer-events: none;
}
.slider-text.success { color: #52c41a; }

.rating-section { padding: 8px 0; }
.big-rating { display: flex; align-items: center; gap: 16px; justify-content: center; margin-bottom: 16px; }
.rating-value { font-size: 24px; font-weight: 700; color: #1890ff; }
.detail-ratings { display: flex; flex-direction: column; gap: 12px; }
.detail-rating-item { display: flex; justify-content: space-between; align-items: center; }

.log-card { border-radius: 12px; }
.log-container {
  height: 300px;
  overflow-y: auto;
  background: #1f1f1f;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Consolas', Monaco, monospace;
  font-size: 12px;
}
.log-entry {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  line-height: 1.6;
  border-bottom: 1px solid #2a2a2a;
}
.log-time { color: #888; min-width: 70px; }
.log-log-info .log-level { color: #52c41a; }
.log-log-warning .log-level { color: #faad14; }
.log-log-error .log-level { color: #ff4d4f; }
.log-log-system .log-level { color: #1890ff; }
.log-message { color: #ddd; flex: 1; word-break: break-all; }

.quick-actions-card, .team-card { border-radius: 12px; }
.team-card :deep(.ant-list-item) { padding: 12px 0; }

.notif-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.notif-item.unread { background: #f6fffe; }
.notif-desc { color: #666; font-size: 13px; margin: 4px 0; }
.notif-time { color: #bbb; font-size: 12px; }

@media (max-width: 992px) {
  .advanced-test-container { padding: 12px; }
  .page-header { flex-direction: column; }
  .stats-grid .ant-col { margin-bottom: 12px; }
}
</style>
