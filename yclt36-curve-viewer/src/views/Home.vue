<template>
  <a-layout class="app-container" :class="{ 'layout-narrow': isNarrowLayout }">
    <!-- 左侧导航栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      breakpoint="lg"
      :width="220"
      :collapsed-width="collapsedSiderWidth"
      class="sider"
    >
      <div class="sider-trigger">
        <div class="logo-wrapper">
          <!-- 使用 Antd 自带图标 -->
          <AntCloudOutlined class="logo-icon" />
          <span v-if="!collapsed" class="logo-text-title">永创数据系统</span>
        </div>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :inline-collapsed="collapsed"
        class="sider-menu"
        @click="handleMenuClick"
      >
        <template v-for="item in menuItems" :key="item.key">
          <template v-if="item.children">
            <a-sub-menu :key="item.key">
              <template #icon><component :is="item.icon" /></template>
              <template #title>{{ item.label }}</template>
              <a-menu-item v-for="child in item.children" :key="child.key">
                <template #icon><component :is="child.icon" /></template>
                <span>{{ child.label }}</span>
              </a-menu-item>
            </a-sub-menu>
          </template>
          <template v-else>
            <a-menu-item :key="item.key">
              <template #icon><component :is="item.icon" /></template>
              <span>{{ item.label }}</span>
            </a-menu-item>
          </template>
        </template>
      </a-menu>
    </a-layout-sider>

    <!-- 移动端遮罩层：点击关闭侧边栏 -->
    <div v-if="isNarrowLayout && !collapsed" class="mobile-mask" @click="collapsed = true" />

    <!-- 右侧内容区 -->
    <a-layout class="right-layout" :class="{ 'sider-collapsed': collapsed, 'layout-narrow': isNarrowLayout }">
      <!-- 头部 Header -->
      <a-layout-header class="header">
        <div class="header-content">
          <div class="header-left">
            <a-button type="text" class="header-icon-btn" @click="collapsed = !collapsed">
              <MenuUnfoldOutlined v-if="collapsed" /><MenuFoldOutlined v-else />
            </a-button>
            <a-button type="text" class="header-icon-btn" @click="refreshPage"><ReloadOutlined /></a-button>
            <a-breadcrumb class="breadcrumb-nav">
              <a-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                <span class="breadcrumb-item-content">
                  <component :is="item.meta.icon" v-if="item.meta.icon" class="breadcrumb-icon" />
                  <span>{{ item.meta.title }}</span>
                </span>
              </a-breadcrumb-item>
            </a-breadcrumb>
          </div>
          <div class="header-actions">
            <a-badge :count="notificationCount" :offset="[-5, 5]">
              <a-button class="header-action-btn" @click="showNotifications = true"> <BellOutlined /> 通知 </a-button>
            </a-badge>
            <a-dropdown :trigger="['click']">
              <a-button class="header-action-btn">
                <UserOutlined /> {{ currentUser }}
                <DownOutlined />
              </a-button>
              <template #overlay>
                <a-menu @click="handleUserMenu">
                  <a-menu-item key="settings"><SettingOutlined /> 个人信息</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout"><LogoutOutlined /> 退出登录</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </a-layout-header>

      <!-- 多标签页区域 (Tabs) -->
      <div class="tabs-container">
        <a-tabs
          v-model:activeKey="activeTabKey"
          type="editable-card"
          :hide-add="true"
          class="nav-tabs"
          @change="handleTabChange"
          @edit="handleTabEdit"
        >
          <a-tab-pane v-for="tab in tabList" :key="tab.fullPath" :closable="tab.closable">
            <template #tab>
              <!-- 绑定右键菜单 -->
              <a-dropdown :trigger="['contextmenu']">
                <span class="tab-title-wrapper">
                  <component :is="tab.icon" v-if="tab.icon" class="tab-icon" />
                  {{ tab.title }}
                </span>
                <template #overlay>
                  <a-menu @click="handleTabContextMenu(tab)">
                    <a-menu-item key="refreshTab"
                      ><template #icon><ReloadOutlined /></template>重新加载</a-menu-item
                    >
                    <a-menu-item key="closeCurrent" :disabled="!tab.closable"
                      ><template #icon><CloseOutlined /></template>关闭标签页</a-menu-item
                    >
                    <a-menu-divider />
                    <a-menu-item key="closeLeft"
                      ><template #icon><VerticalRightOutlined /></template>关闭左侧标签页</a-menu-item
                    >
                    <a-menu-item key="closeRight"
                      ><template #icon><VerticalLeftOutlined /></template>关闭右侧标签页</a-menu-item
                    >
                    <a-menu-divider />
                    <a-menu-item key="closeOther"
                      ><template #icon><ColumnWidthOutlined /></template>关闭其它标签页</a-menu-item
                    >
                    <a-menu-item key="closeAll"
                      ><template #icon><LineOutlined /></template>关闭全部标签页</a-menu-item
                    >
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 主要内容展示 -->
      <a-layout-content class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <!-- keep-alive 保持页面状态，key 确保同一组件不同参数能共存 -->
            <keep-alive>
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </a-layout-content>

      <a-layout-footer class="footer">永创数据管理系统 ©2026 v1.1.0</a-layout-footer>
    </a-layout>
  </a-layout>

  <WeChatSendModal v-model:visible="wechatModalVisible" />

  <!-- 我的账户弹窗 -->
  <AccountModal v-model:open="accountModalOpen" />

  <!-- 通知抽屉 -->
  <a-drawer v-model:open="showNotifications" title="通知中心" placement="right" width="400">
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
</template>

<script setup lang="ts">
import { ref, computed, watch, provide, type Component } from 'vue';
import { CloseTabKey } from '@/keys';
import { Grid, Modal } from 'ant-design-vue';
import WeChatSendModal from '@/views/WeChatWork/WeChatSendModal.vue';
import AccountModal from '@/components/AccountModal.vue';
import { useRouter, useRoute, type RouteRecordRaw } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  CloseOutlined,
  VerticalRightOutlined,
  VerticalLeftOutlined,
  ColumnWidthOutlined,
  LineOutlined,
  AntCloudOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  LineChartOutlined,
  ContainerOutlined,
  FunnelPlotOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  DollarCircleOutlined,
  CommentOutlined,
  ApartmentOutlined,
  BellOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue';

// --- 基础配置 ---
const TABS_KEY = 'V_APP_TABS';

// 图标映射
const iconMap = {
  DashboardOutlined,
  ShoppingOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  LineChartOutlined,
  ContainerOutlined,
  FunnelPlotOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  DollarCircleOutlined,
  CommentOutlined,
  ApartmentOutlined
};

const DASHBOARD_CONF = {
  title: '仪表盘',
  fullPath: '/dashboard', // 请确保与你路由定义的仪表盘路径一致
  name: 'Dashboard',
  icon: DashboardOutlined,
  closable: false
};

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const screens = Grid.useBreakpoint();
const isNarrowLayout = computed(() => !screens.value?.lg);
const collapsedSiderWidth = computed(() => (isNarrowLayout.value ? 0 : 80));
const selectedKeys = ref<string[]>([]);
const wechatModalVisible = ref(false);
const accountModalOpen = ref(false);

// --- 通知与管理员 ---
const notificationCount = ref(3);
// 顶栏展示的用户名（从登录态读取）
const { displayName, logout: doLogout } = useAuth();
const currentUser = computed(() => displayName.value || '未登录');
const showNotifications = ref(false);
const notifTabKey = ref('all');
const notifications = ref([
  {
    id: 1,
    icon: '📢',
    avatarBg: '#1890ff',
    title: '系统维护通知',
    content: '计划于今晚23:00进行系统维护升级',
    time: '5分钟前',
    read: false
  },
  {
    id: 2,
    icon: '📋',
    avatarBg: '#52c41a',
    title: '任务提醒',
    content: '您有3个待处理任务需要处理',
    time: '1小时前',
    read: false
  },
  {
    id: 3,
    icon: '💬',
    avatarBg: '#faad14',
    title: '新消息',
    content: '李四给您发了一条私信',
    time: '2小时前',
    read: true
  }
]);
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

const handleUserMenu = ({ key }: { key: string }) => {
  if (key === 'settings') {
    accountModalOpen.value = true;
  } else if (key === 'logout') {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出后需要重新登录才能使用系统',
      okText: '退出',
      cancelText: '取消',
      onOk: () => {
        doLogout();
        // 清理掉多标签页缓存，避免下个用户继承
        localStorage.removeItem(TABS_KEY);
        router.replace('/login');
      }
    });
  }
};

// --- 面包屑 ---
const breadcrumbs = computed(() => route.matched.filter((item) => item.meta && item.meta.title));
const refreshPage = () => router.go(0);

// --- Tabs 核心逻辑 ---
interface TabItem {
  title: string;
  fullPath: string;
  name: string;
  icon?: Component;
  closable: boolean;
}

/** 本地缓存中的标签（icon 存为图标名，加载后转为组件） */
interface StoredTab {
  title?: string;
  fullPath?: string;
  name?: string;
  closable?: boolean;
  icon?: unknown;
}

/** 侧边栏菜单项 */
interface MenuItem {
  key: string;
  label: string;
  icon?: Component | string;
  children?: MenuItem[];
}

// 1. 初始化 TabList (从本地缓存读取)
const getInitialTabs = (): TabItem[] => {
  const cache = localStorage.getItem(TABS_KEY);
  if (cache) {
    try {
      const tabs = JSON.parse(cache) as StoredTab[];
      // 处理图标，将字符串转换为组件
      return tabs.map(
        (tab) =>
          ({
            ...tab,
            icon: typeof tab.icon === 'string' ? iconMap[tab.icon as keyof typeof iconMap] : tab.icon
          }) as TabItem
      );
    } catch {
      return [DASHBOARD_CONF];
    }
  }
  return [DASHBOARD_CONF];
};

const tabList = ref<TabItem[]>(getInitialTabs());
const activeTabKey = ref(route.fullPath);

// 2. 持久化存储 - 只保存图标名称字符串
watch(
  tabList,
  (newList) => {
    const listToSave = newList.map((tab) => {
      // 找到图标组件对应的名称
      let iconName = '';
      for (const [name, icon] of Object.entries(iconMap)) {
        if (icon === tab.icon) {
          iconName = name;
          break;
        }
      }
      return {
        ...tab,
        icon: iconName // 保存图标名称而不是组件
      };
    });
    localStorage.setItem(TABS_KEY, JSON.stringify(listToSave));
  },
  { deep: true }
);

// 3. 添加标签逻辑
const addTab = () => {
  const { meta, fullPath, name, query } = route;
  if (!name || ['Login', 'Redirect', '404'].includes(name as string)) return;

  // 优先级：参数 tabTitle > 路由 title > 默认
  const dynamicTitle = (query.tabTitle as string) || (meta.title as string) || '新标签页';

  const existingTab = tabList.value.find((tab) => tab.fullPath === fullPath);
  if (!existingTab) {
    // 处理图标，确保是组件形式
    let tabIcon: Component | string | undefined = meta.icon as Component | string | undefined;
    if (typeof tabIcon === 'string' && iconMap[tabIcon as keyof typeof iconMap]) {
      tabIcon = iconMap[tabIcon as keyof typeof iconMap];
    }
    tabList.value.push({
      title: dynamicTitle,
      fullPath: fullPath,
      name: name as string,
      icon: tabIcon as Component | undefined,
      closable: name !== DASHBOARD_CONF.name // 仪表盘不让关
    });
  } else {
    // 已存在的标签页同步最新标题（排除动态 tabTitle 的页面）
    if (!query.tabTitle) {
      existingTab.title = dynamicTitle;
    }
  }
  activeTabKey.value = fullPath;
};

// 4. 提供给子页面的关闭方法 (用于“返回”按钮)
const closeCurrentTab = (targetPath?: string) => {
  const path = targetPath || route.fullPath;
  handleTabEdit(path, 'remove');
};
provide(CloseTabKey, closeCurrentTab);

// 5. 标签页交互
const handleTabChange = (key: string) => router.push(key);

const handleTabEdit = (targetKey: string, action: string) => {
  if (action === 'remove') {
    const index = tabList.value.findIndex((tab) => tab.fullPath === targetKey);
    if (index === -1) return;

    // 如果是唯一不可关闭项，不允许删
    if (!tabList.value[index].closable) return;

    tabList.value.splice(index, 1);
    if (activeTabKey.value === targetKey) {
      const lastTab = tabList.value[tabList.value.length - 1];
      router.push(lastTab ? lastTab.fullPath : '/');
    }
  }
};

// 6. 右键菜单功能实现
const handleContextMenuClick = (key: string, currentTab: TabItem) => {
  const index = tabList.value.findIndex((t) => t.fullPath === currentTab.fullPath);

  switch (key) {
    case 'refreshTab':
      refreshPage();
      break;
    case 'closeCurrent':
      handleTabEdit(currentTab.fullPath, 'remove');
      break;
    case 'closeLeft':
      tabList.value = tabList.value.filter((t, i) => i >= index || !t.closable);
      ensureValidActiveTab();
      break;
    case 'closeRight':
      tabList.value = tabList.value.filter((t, i) => i <= index || !t.closable);
      ensureValidActiveTab();
      break;
    case 'closeOther':
      tabList.value = tabList.value.filter((t, i) => i === index || !t.closable);
      ensureValidActiveTab();
      break;
    case 'closeAll':
      tabList.value = tabList.value.filter((t) => !t.closable);
      router.push(tabList.value[0].fullPath);
      break;
  }
};

/** 右键菜单点击：a-menu-item 的 @click 通过柯里化拿到当前 tab */
const handleTabContextMenu = (tab: TabItem) => (e: { key: string }) => {
  handleContextMenuClick(e.key, tab);
};

const ensureValidActiveTab = () => {
  const exists = tabList.value.some((t) => t.fullPath === activeTabKey.value);
  if (!exists && tabList.value.length > 0) {
    router.push(tabList.value[tabList.value.length - 1].fullPath);
  }
};

// --- 侧边栏菜单生成 ---
const generateMenuItems = (routes: RouteRecordRaw[], basePath = '') => {
  return routes
    .filter((route) => route.meta?.title && !route.meta.hidden)
    .sort((a, b) => ((a.meta?.order as number) || 0) - ((b.meta?.order as number) || 0))
    .map((route) => {
      const fullPath = basePath + (route.path.startsWith('/') ? route.path : '/' + route.path);
      const item: MenuItem = {
        key: (route.name as string) || fullPath,
        label: route.meta?.title as string,
        icon: route.meta?.icon as Component | string | undefined
      };
      if (route.children?.some((child: RouteRecordRaw) => child.meta?.title && !child.meta.hidden)) {
        item.children = generateMenuItems(route.children, fullPath);
      }
      return item;
    });
};

const menuItems = computed(() => {
  const root = router.options.routes.find((r) => r.path === '/');
  return root?.children ? generateMenuItems(root.children) : [];
});

// --- 路由监听 ---
watch(
  () => route.fullPath,
  () => {
    addTab();
    if (route.name) selectedKeys.value = [route.name as string];
  },
  { immediate: true }
);

const handleMenuClick = ({ key }: { key: string }) => {
  if (isNarrowLayout.value) collapsed.value = true;
  router.push({ name: key }).catch(() => {});
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏样式优化 */
.sider {
  background: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sider-trigger {
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1890ff;
}

.logo-icon {
  font-size: 28px;
}

.logo-text-title {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  letter-spacing: 0.5px;
  color: #262626;
}

/* 侧边栏菜单样式优化 */
.sider-menu {
  border-right: none;
}

.sider-menu :deep(.ant-menu-item),
.sider-menu :deep(.ant-menu-submenu-title) {
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sider-menu :deep(.ant-menu-item:hover),
.sider-menu :deep(.ant-menu-submenu-title:hover) {
  background-color: #e6f7ff;
  color: #1890ff;
}

.sider-menu :deep(.ant-menu-item-selected) {
  background-color: #1890ff !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.sider-menu :deep(.ant-menu-item-selected:hover) {
  background-color: #40a9ff !important;
}

.sider-menu :deep(.ant-menu-submenu-selected > .ant-menu-submenu-title) {
  color: #1890ff;
  font-weight: 500;
}

.sider-menu :deep(.ant-menu-inline .ant-menu-item::after) {
  display: none;
}

/* 右侧布局 */
.right-layout {
  margin-left: 220px;
  transition: all 0.2s;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.right-layout.sider-collapsed {
  margin-left: 80px;
}
.layout-narrow.right-layout,
.layout-narrow .right-layout {
  margin-left: 0 !important;
}
.layout-narrow .sider {
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.12);
}

/* 移动端遮罩层 */
.mobile-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
}

/* 头部样式 */
.header {
  background: #fff;
  padding: 0 16px;
  height: 50px;
  line-height: 50px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 99;
  border-bottom: 1px solid #f0f2f5;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.header-left {
  display: flex;
  align-items: center;
}
.header-icon-btn {
  font-size: 18px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.header-icon-btn:hover {
  background-color: #f0f2f5;
  border-radius: 6px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.header-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.breadcrumb-nav {
  margin-left: 8px;
}
.breadcrumb-item-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Tabs 样式优化 */
.tabs-container {
  background: #fff;
  padding: 6px 12px 0 12px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 50px;
  z-index: 98;
}
.nav-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0 !important;
}
.nav-tabs :deep(.ant-tabs-tab) {
  background: #f5f5f5 !important;
  border: 1px solid #d9d9d9 !important;
  margin-right: 4px !important;
  border-radius: 6px 6px 0 0 !important;
  padding: 6px 14px !important;
  font-size: 13px;
  transition: all 0.3s ease;
}
.nav-tabs :deep(.ant-tabs-tab:hover) {
  background: #e6f7ff !important;
  border-color: #1890ff !important;
  color: #1890ff;
}
.nav-tabs :deep(.ant-tabs-tab-active) {
  background: #fff !important;
  border-top: 2px solid #1890ff !important;
  border-bottom-color: transparent !important;
  box-shadow: 0 -2px 8px rgba(24, 144, 255, 0.1);
}
.tab-title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: context-menu;
  user-select: none;
}
.tab-icon {
  font-size: 14px;
}

/* 主内容区域 */
.main-content {
  padding: 16px;
  flex: 1;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

/* 响应式布局优化 */
@media (max-width: 991px) {
  .main-content {
    padding: 8px;
  }
  .header-content {
    flex-wrap: wrap;
    gap: 8px;
  }
  .tabs-container {
    padding-left: 8px;
    padding-right: 8px;
  }
  .breadcrumb-nav {
    display: none;
  }
  .header {
    padding: 0 8px;
  }
  .wecom-btn span {
    display: none;
  }
  .wecom-btn {
    padding: 0 8px;
  }
}

@media (max-width: 576px) {
  .header-left {
    flex-wrap: wrap;
  }
  .tabs-container {
    overflow-x: auto;
  }
  .nav-tabs :deep(.ant-tabs-tab) {
    padding: 4px 8px !important;
    font-size: 12px;
  }
}

.footer {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 通知抽屉样式 */
.notif-item.unread {
  background-color: #f6ffed;
}
.notif-desc {
  color: #666;
  font-size: 13px;
}
.notif-time {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
</style>
