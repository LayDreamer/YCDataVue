<template>
  <a-layout class="app-container">
    <!-- 左侧导航栏 -->
    <a-layout-sider 
      v-model:collapsed="collapsed" 
      :trigger="null" 
      collapsible
      :width="220"
      :collapsedWidth="80"
      class="sider"
    >
      <!-- 折叠按钮区域 -->
      <div class="sider-trigger"  />      
      <!-- 导航菜单 - 动态配置 -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :inline-collapsed="collapsed"
        class="sider-menu"
        @click="handleMenuClick"
      >
        <template v-for="item in menuItems" :key="item.key">
          <a-sub-menu v-if="item.children" :key="item.key">
            <template #icon>
              <component :is="iconComponents[item.icon]" />
            </template>
            <template #title>{{ item.label }}</template>
            <a-menu-item v-for="child in item.children" :key="child.key">
              <template #icon>
                <component :is="iconComponents[child.icon]" />
              </template>
              <span>{{ child.label }}</span>
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="item.key">
            <template #icon>
              <component :is="iconComponents[item.icon]" />
            </template>
            <span>{{ item.label }}</span>
          </a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容区 -->
    <a-layout class="right-layout" :class="{ 'sider-collapsed': collapsed }">
      <!-- 头部 -->
      <a-layout-header class="header">
        <div class="header-content">
          <div class="header-left">
            <a-button 
              type="text" 
              class="menu-trigger"
              @click="collapsed = !collapsed"
            >
              <MenuUnfoldOutlined v-if="collapsed" style=" font-size: 18px;" />
              <MenuFoldOutlined v-else style=" font-size: 18px;" />
            </a-button>
            <h1 class="title">永创数据管理系统</h1>
          </div>
          <div class="header-actions">
            <a-button 
              type="primary" 
              class="wecom-btn"
              :icon="h(WechatOutlined)"
              @click="wechatModalVisible = true"
            >
              发送企业微信
            </a-button>
          </div>
        </div>
      </a-layout-header>

      <!-- 主要内容 -->
      <a-layout-content class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <!-- 底部 -->
      <a-layout-footer class="footer">
        永创数据管理系统 ©2026 v1.1.0
      </a-layout-footer>
    </a-layout>
  </a-layout>

   <!-- 使用封装的企业微信发送组件 -->
  <WeChatSendModal 
    v-model:visible="wechatModalVisible"
    @sendSuccess="handleSendSuccess"
    :defaultContent="''" 
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, markRaw, watch } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LineChartOutlined,
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  WechatOutlined
} from '@ant-design/icons-vue'
import { blfParameterService, type BLFParameter } from '../services/blfParameterService'
import WeChatSendModal from '../views/WeChatWork/WeChatSendModal.vue'

// 路由实例
const router = useRouter()
const route = useRoute()
// 导航栏状态
const collapsed = ref(false)
const selectedKeys = ref<string[]>(['products'])

// 图标组件映射（使用markRaw避免响应式开销）
const iconComponents = markRaw({
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LineChartOutlined,
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined
})

// 生成菜单项的函数
const generateMenuItems = (routes: any[], basePath = '') => {
  return routes
    .filter(route => route.meta?.title) // 只保留有 title 的路由（显示在菜单）
    .sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0))
    .map(route => {
      const fullPath = basePath + (route.path.startsWith('/') ? route.path : '/' + route.path)
      const item = {
        key: route.name || fullPath, // 优先使用 name 作为 key，稳定且不会随路径参数变化
        label: route.meta.title,
        icon: route.meta.icon || 'FileTextOutlined', // 默认图标
      }
      // 如果有子路由且子路由有 meta.title，则递归生成子菜单
      if (route.children && route.children.some(child => child.meta?.title)) {
        item.children = generateMenuItems(route.children, fullPath)
      }
      return item
    })
}

const menuItems = computed(() => {
  // 获取根路由（path: '/'）的 children
  const rootRoute = router.options.routes.find(r => r.path === '/')
  if (rootRoute && rootRoute.children) {
    return generateMenuItems(rootRoute.children)
  }
  return []
})




// 状态管理
const blfParameters = ref<BLFParameter[]>([])
const loading = ref(false)
const apiError = ref(false)

// 模态框状态
const addModalVisible = ref(false)
const addFormRef = ref<FormInstance>()

const wechatModalVisible = ref(false)

// 搜索状态
const searchText = ref('')

// 新产品表单数据
const newProduct = ref({
  name: '',
  price: 0,
  category: '',
  description: ''
})

// 分类颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  '电子产品': 'blue',
  '家居用品': 'green',
  '服装鞋帽': 'orange',
  '食品饮料': 'red',
  '图书音像': 'purple'
}

// 计算属性：分类数量
const categoryCount = computed(() => {
  return 1;
})

// 计算属性：分类分布
const categoryDistribution = computed(() => {
  const distribution: Record<string, number> = {}

  blfParameters.value.forEach(item => {
    const category = '未分类'
    distribution[category] = (distribution[category] || 0) + 1
  })

  return Object.entries(distribution).map(([name, count]) => ({
    name,
    count
  }))
})

// 计算属性：过滤后的数据
const filteredBLFParameters = computed(() => {
  const search = searchText.value.trim().toLowerCase()

  if (!search) {
    return blfParameters.value
  }

  return blfParameters.value.filter(item => {
    return item.blfNumber?.toLowerCase().includes(search) ||
      item.workOrderNumber.toLowerCase().includes(search)
  })
})

// 获取分类颜色
const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || 'default'
}

// 获取行索引
const getRowIndex = (record: BLFParameter): number => {
  const index = filteredBLFParameters.value.findIndex(item => item.id === record.id)
  return index + 1
}

// 导航到曲线详情页面
const navigateToCurveDetail = (record: BLFParameter, dataIndex: string): void => {
  router.push({
    name: 'CurveDetail',
    query: {
      id: record.blfNumber.toString(),
      index: dataIndex
    }
  })
}

// 菜单点击处理
const handleMenuClick = ({ key }) => {
  // 如果 key 是路由 name，直接用 name 跳转
  router.push({ name: key }).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('路由跳转失败', err)
    }
  })
}

// 根据当前路由更新选中菜单
const updateSelectedKeys = () => {
  if (route.name) {
    selectedKeys.value = [route.name]
  } else {
    selectedKeys.value = []
  }
}

// 监听路由变化
watch(() => route.path, updateSelectedKeys, { immediate: true })

const handleSendSuccess = (result: any) => {
  console.log('发送成功', result)
}


</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f0f2f5;
}

/* ==================== 左侧导航栏 ==================== */
.sider {
  background: #ffffff; /* 纯白背景 */
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05); /* 更淡的阴影 */
  border-right: 1px solid #f0f0f0; /* 增加分隔线 */
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow: hidden;
}

/* 折叠按钮区域 */
.sider-trigger {
 height: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #595959; /* 深灰色文字 */
  border-bottom: 1px solid #f0f0f0; /* 分割线 */
  transition: all 0.3s;
}

.sider-trigger:hover {
  background: #f5f5f5; /* 浅灰悬停 */
  color: #fff;
}

.trigger-icon {
  font-size: 18px;
}

.trigger-text {
  font-size: 14px;
  font-weight: 500;
}

/* 菜单样式 */
.sider-menu {
  background: transparent;
  border-right: none;
  padding: 12px 0;
}

/* 菜单项 */
.sider-menu :deep(.ant-menu-item),
.sider-menu :deep(.ant-menu-submenu-title) {
 color: #595959; /* 深灰文字 */
  margin: 4px 12px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}

.sider-menu :deep(.ant-menu-item .anticon),
.sider-menu :deep(.ant-menu-submenu-title .anticon) {
  font-size: 18px;
}

/* .sider-menu :deep(.ant-menu-item:hover),
.sider-menu :deep(.ant-menu-submenu-title:hover) {
  color: #fff;
  background: rgba(24, 144, 255, 0.35);
} */

.sider-menu :deep(.ant-menu-item-selected) {
  background: linear-gradient(90deg, #1890ff 0%, #9bbddd 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);
}

.sider-menu :deep(.ant-menu-submenu-selected > .ant-menu-submenu-title) {
  color: #1890ff !important;
  font-weight: 500;
  background: transparent;
}

.sider-menu :deep(.ant-menu-sub) {
   background: #fafafa !important; /* 浅灰背景 */
  border-radius: 8px; /* 添加圆角 */
  margin: 4px 0; /* 微调间距 */
}

.sider-menu :deep(.ant-menu-submenu-arrow) {
  color: rgba(255, 255, 255, 0.65);
}

/* ==================== 右侧布局 ==================== */
.right-layout {
  margin-left: 220px;
  transition: margin-left 0.2s;
  min-height: 100vh;
}

.right-layout.sider-collapsed {
  margin-left: 80px;
}

/* ==================== 头部样式 ==================== */
.header {
  background: #ffffff; /* 白色背景 */
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
  position: sticky;
  top: 0;
  z-index: 99;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.menu-trigger {
  margin-right: 16px;
  padding: 8px 12px;
  border-radius: 6px;
}

.menu-trigger:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header .title {
  color: #262626; /* 深色标题 */
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

/* 头部按钮统一样式 */
.header-actions :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.header-actions :deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
}

/* ==================== 主要内容 ==================== */
.main-content {
  max-width: 98%;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: calc(100vh - 64px - 60px);
  width: 100%;
  
}

/* ==================== 错误提示 ==================== */
.error-container {
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.error-tips {
  text-align: left;
  margin-bottom: 24px;
  padding: 20px;
  background: #fff7e6;
  border-radius: 8px;
  border-left: 4px solid #fa8c16;
}

.error-tips p {
  margin: 10px 0;
  color: #666;
  font-size: 14px;
}

/* ==================== 底部 ==================== */
.footer {
  text-align: center;
  padding: 20px 50px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  background: #f0f2f5;
  border-top: 1px solid #f0f0f0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .sider {
    position: fixed;
    z-index: 1000;
  }
  
  .right-layout {
    margin-left: 0;
  }
  
  .right-layout.sider-collapsed {
    margin-left: 0;
  }
  
  .header {
    padding: 0 16px;
  }

  .main-content {
    padding: 16px;
  }

  .table-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .table-toolbar :deep(.ant-input-search) {
    width: 100% !important;
  }
  
  .stats-card,
  .product-list-card {
    border-radius: 8px;
  }
}
</style>