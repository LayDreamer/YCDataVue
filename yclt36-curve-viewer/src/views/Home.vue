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
            <a-button type="primary" class="wecom-btn" :icon="h(WechatOutlined)" @click="wechatModalVisible = true">发送企业微信</a-button>
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
                  <a-menu @click="(e: any) => handleContextMenuClick(e.key, tab)">
                    <a-menu-item key="refreshTab"><template #icon><ReloadOutlined /></template>重新加载</a-menu-item>
                    <a-menu-item key="closeCurrent" :disabled="!tab.closable"><template #icon><CloseOutlined /></template>关闭标签页</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="closeLeft"><template #icon><VerticalRightOutlined /></template>关闭左侧标签页</a-menu-item>
                    <a-menu-item key="closeRight"><template #icon><VerticalLeftOutlined /></template>关闭右侧标签页</a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="closeOther"><template #icon><ColumnWidthOutlined /></template>关闭其它标签页</a-menu-item>
                    <a-menu-item key="closeAll"><template #icon><LineOutlined /></template>关闭全部标签页</a-menu-item>
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

  <WeChatSendModal v-model:visible="wechatModalVisible" @sendSuccess="handleSendSuccess" />
</template>

<script setup lang="ts">
import { ref, computed, h, watch, provide } from 'vue'
import { Grid } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuFoldOutlined, MenuUnfoldOutlined, WechatOutlined, ReloadOutlined,
  CloseOutlined, VerticalRightOutlined, VerticalLeftOutlined,
  ColumnWidthOutlined, LineOutlined,AntCloudOutlined,
  DashboardOutlined, ShoppingOutlined, SettingOutlined,
  TeamOutlined, ToolOutlined, FileDoneOutlined,
  ScheduleOutlined, LineChartOutlined, ContainerOutlined,
  FunnelPlotOutlined, ExperimentOutlined, ProjectOutlined,
  DollarCircleOutlined
} from '@ant-design/icons-vue'
import WeChatSendModal from '../views/WeChatWork/WeChatSendModal.vue'

// --- 基础配置 ---
const TABS_KEY = 'V_APP_TABS'

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
  DollarCircleOutlined
}

const DASHBOARD_CONF = {
  title: '仪表盘',
  fullPath: '/dashboard', // 请确保与你路由定义的仪表盘路径一致
  name: 'Dashboard',
  icon: DashboardOutlined,
  closable: false
}

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const screens = Grid.useBreakpoint()
const isNarrowLayout = computed(() => !screens.value?.lg)
const collapsedSiderWidth = computed(() => (isNarrowLayout.value ? 0 : 80))
const selectedKeys = ref<string[]>([])
const wechatModalVisible = ref(false)

// --- 面包屑 ---
const breadcrumbs = computed(() => route.matched.filter(item => item.meta && item.meta.title))
const refreshPage = () => router.go(0)

// --- Tabs 核心逻辑 ---
interface TabItem {
  title: string;
  fullPath: string;
  name: string;
  icon?: any;
  closable: boolean;
}

// 1. 初始化 TabList (从本地缓存读取)
const getInitialTabs = (): TabItem[] => {
  const cache = localStorage.getItem(TABS_KEY)
  if (cache) {
    try {
      const tabs = JSON.parse(cache)
      // 处理图标，将字符串转换为组件
      return tabs.map((tab: any) => ({
        ...tab,
        icon: typeof tab.icon === 'string' ? iconMap[tab.icon as keyof typeof iconMap] : tab.icon
      }))
    } catch (e) {
      return [DASHBOARD_CONF]
    }
  }
  return [DASHBOARD_CONF]
}

const tabList = ref<TabItem[]>(getInitialTabs())
const activeTabKey = ref(route.fullPath)

// 2. 持久化存储 - 只保存图标名称字符串
watch(tabList, (newList) => {
  const listToSave = newList.map(tab => {
    // 找到图标组件对应的名称
    let iconName = ''
    for (const [name, icon] of Object.entries(iconMap)) {
      if (icon === tab.icon) {
        iconName = name
        break
      }
    }
    return {
      ...tab,
      icon: iconName // 保存图标名称而不是组件
    }
  })
  localStorage.setItem(TABS_KEY, JSON.stringify(listToSave))
}, { deep: true })

// 3. 添加标签逻辑
const addTab = () => {
  const { meta, fullPath, name, query } = route
  if (!name || ['Login', 'Redirect', '404'].includes(name as string)) return

  const hasTab = tabList.value.some(tab => tab.fullPath === fullPath)
  if (!hasTab) {
    // 优先级：参数 tabTitle > 路由 title > 默认
    const dynamicTitle = (query.tabTitle as string) || (meta.title as string) || '新标签页'
    // 处理图标，确保是组件形式
    let tabIcon = meta.icon
    if (typeof tabIcon === 'string' && iconMap[tabIcon as keyof typeof iconMap]) {
      tabIcon = iconMap[tabIcon as keyof typeof iconMap]
    }
    tabList.value.push({
      title: dynamicTitle,
      fullPath: fullPath,
      name: name as string,
      icon: tabIcon,
      closable: name !== DASHBOARD_CONF.name // 仪表盘不让关
    })
  }
  activeTabKey.value = fullPath
}

// 4. 提供给子页面的关闭方法 (用于“返回”按钮)
const closeCurrentTab = (targetPath?: string) => {
  const path = targetPath || route.fullPath
  handleTabEdit(path, 'remove')
}
provide('closeTab', closeCurrentTab)

// 5. 标签页交互
const handleTabChange = (key: any) => router.push(key)

const handleTabEdit = (targetKey: any, action: string) => {
  if (action === 'remove') {
    const index = tabList.value.findIndex(tab => tab.fullPath === targetKey)
    if (index === -1) return
    
    // 如果是唯一不可关闭项，不允许删
    if (!tabList.value[index].closable) return

    tabList.value.splice(index, 1)
    if (activeTabKey.value === targetKey) {
      const lastTab = tabList.value[tabList.value.length - 1]
      router.push(lastTab ? lastTab.fullPath : '/')
    }
  }
}

// 6. 右键菜单功能实现
const handleContextMenuClick = (key: string, currentTab: TabItem) => {
  const index = tabList.value.findIndex(t => t.fullPath === currentTab.fullPath)
  
  switch (key) {
    case 'refreshTab':
      refreshPage()
      break
    case 'closeCurrent':
      handleTabEdit(currentTab.fullPath, 'remove')
      break
    case 'closeLeft':
      tabList.value = tabList.value.filter((t, i) => i >= index || !t.closable)
      ensureValidActiveTab()
      break
    case 'closeRight':
      tabList.value = tabList.value.filter((t, i) => i <= index || !t.closable)
      ensureValidActiveTab()
      break
    case 'closeOther':
      tabList.value = tabList.value.filter((t, i) => i === index || !t.closable)
      ensureValidActiveTab()
      break
    case 'closeAll':
      tabList.value = tabList.value.filter(t => !t.closable)
      router.push(tabList.value[0].fullPath)
      break
  }
}

const ensureValidActiveTab = () => {
  const exists = tabList.value.some(t => t.fullPath === activeTabKey.value)
  if (!exists && tabList.value.length > 0) {
    router.push(tabList.value[tabList.value.length - 1].fullPath)
  }
}

// --- 侧边栏菜单生成 ---
const generateMenuItems = (routes: any[], basePath = '') => {
  return routes
    .filter(route => route.meta?.title && !route.meta.hidden)
    .sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0))
    .map(route => {
      const fullPath = basePath + (route.path.startsWith('/') ? route.path : '/' + route.path)
      const item: any = { key: route.name || fullPath, label: route.meta.title, icon: route.meta.icon }
      if (route.children?.some((child: any) => child.meta?.title && !child.meta.hidden)) {
        item.children = generateMenuItems(route.children, fullPath)
      }
      return item
    })
}

const menuItems = computed(() => {
  const root = router.options.routes.find(r => r.path === '/')
  return root?.children ? generateMenuItems(root.children) : []
})

// --- 路由监听 ---
watch(() => route.fullPath, () => {
  addTab()
  if (route.name) selectedKeys.value = [route.name as string]
}, { immediate: true })

const handleMenuClick = ({ key }: any) => router.push({ name: key }).catch(() => {})
const handleSendSuccess = (res: any) => console.log('Send Success', res)
</script>

<style scoped>
.app-container { min-height: 100vh; background: #f0f2f5; }

/* 侧边栏样式优化 */
.sider { 
  background: #fff; 
  box-shadow: 2px 0 10px rgba(0,0,0,0.05); 
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
.right-layout.sider-collapsed { margin-left: 80px; }
.layout-narrow.right-layout,
.layout-narrow .right-layout { margin-left: 0 !important; }
.layout-narrow .sider { box-shadow: 2px 0 12px rgba(0,0,0,0.12); }

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
.header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.header-left { display: flex; align-items: center; }
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
.breadcrumb-nav { margin-left: 8px; }
.breadcrumb-item-content { display: inline-flex; align-items: center; gap: 4px; }

/* Tabs 样式优化 */
.tabs-container { 
  background: #fff; 
  padding: 6px 12px 0 12px; 
  border-bottom: 1px solid #e5e7eb; 
  position: sticky; 
  top: 50px; 
  z-index: 98; 
}
.nav-tabs :deep(.ant-tabs-nav) { margin-bottom: 0 !important; }
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
.tab-title-wrapper { display: flex; align-items: center; gap: 6px; cursor: context-menu; user-select: none; }
.tab-icon { font-size: 14px; }

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
  .main-content { padding: 8px; }
  .header-content { flex-wrap: wrap; gap: 8px; }
  .tabs-container { padding-left: 8px; padding-right: 8px; }
  .breadcrumb-nav { display: none; }
  .header { padding: 0 8px; }
  .wecom-btn span { display: none; }
  .wecom-btn { padding: 0 8px; }
}

@media (max-width: 576px) {
  .header-left { flex-wrap: wrap; }
  .tabs-container { overflow-x: auto; }
  .nav-tabs :deep(.ant-tabs-tab) { padding: 4px 8px !important; font-size: 12px; }
}

.footer { text-align: center; padding: 12px; color: #999; font-size: 12px; }

/* 页面切换动画 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(20px); }

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
</style>