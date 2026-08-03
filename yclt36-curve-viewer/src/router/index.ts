import { createRouter, createWebHashHistory } from 'vue-router'
import Products from '../views/Products.vue'
import CurveDetail from '../views/CurveDetail.vue'
import NotFound from '../views/NotFound.vue'
import Dashboard from '../views/Dashboard.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ErpLogin from '../views/ErpLogin.vue'
import WorkOrderTracking from '@/views/PMC/WorkOrderTracking/WorkOrderTracking.vue'
import DeliveryReview from '@/views/PMC/DeliveryReview/DeliveryReview.vue'
import ReviewDetail from '@/views/PMC/DeliveryReview/ReviewDetail.vue'
import Users from '@/views/System/UserManagement.vue'
import Config from '@/views/System/Config.vue'
import OrganizationManagement from '@/views/System/OrganizationManagement.vue'
import TestPage from '@/views/Test/TestPage.vue'
import Workflow from '@/views/Test/Workflow.vue'
import ProfitAnalysis from '@/views/Test/ProfitAnalysis.vue'
import WeChatSend from '@/views/Test/WeChatSend.vue'
import ExternalProductionTest from '@/views/Test/ExternalProductionTest.vue'
import {
  DashboardOutlined,
  ShoppingOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  FileDoneOutlined,
  LineChartOutlined,
  ContainerOutlined,
  FunnelPlotOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  DollarCircleOutlined,
  WechatOutlined,
  CommentOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue'

// 登录/注册页在路由切换时强制重新渲染（避免动画残留）
const LoginRoute = { path: '/login', name: 'Login', component: Login, meta: { title: '登录', skipAuth: true } }
const ErpLoginRoute = { path: '/erp-login', name: 'ErpLogin', component: ErpLogin, meta: { title: 'ERP 登录', skipAuth: true } }
const RegisterRoute = { path: '/register', name: 'Register', component: Register, meta: { title: '注册', skipAuth: true } }

const routes = [
  LoginRoute,
  ErpLoginRoute,
  RegisterRoute,
  {
    path: '/',
    component: Home,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', icon: DashboardOutlined }
      },
      {
        path: 'products',
        name: 'Products',
        component: Products,
        meta: { title: '比例阀管理', icon: ShoppingOutlined, order: 1 }
      },
      {
        path: 'products/detail',
        name: 'CurveDetail',
        component: CurveDetail
      },
      {
        path: 'pmc',
        name: 'PMC',
        meta: { title: '排产分析', icon: LineChartOutlined, order: 2 },
        children: [
          {
            path: 'deliveryreview',
            name: 'DeliveryReview',
            component: DeliveryReview,
            meta: { title: '交期评审', icon: FileDoneOutlined }
          },
          {
            path: 'workOrderTracking',
            name: 'WorkOrderTracking',
            component: WorkOrderTracking,
            meta: { title: '工单销控表', icon: ContainerOutlined }
          }
        ]
      },
      {
        path: 'test',
        name: 'test',
        meta: { title: '测试功能', icon: FunnelPlotOutlined, order: 3 },
        redirect: '/test/advanced',
        children: [
          {
            path: 'advanced',
            name: 'advancedTest',
            component: TestPage,
            meta: { title: '高级测试', icon: ExperimentOutlined }
          },
          {
            path: 'workflow',
            name: 'workflow',
            component: Workflow,
            meta: { title: '工作流', icon: ProjectOutlined }
          },
          {
            path: 'wechatSend',
            name: 'wechatSend',
            component: WeChatSend,
            meta: { title: '企业微信发送', icon: CommentOutlined }
          },
          {
            path: 'profitAnalysis',
            name: 'profitAnalysis',
            component: ProfitAnalysis,
            meta: { title: '利润分红分析', icon: DollarCircleOutlined, hidden: true }
          },
          {
            path: 'externalProduction',
            name: 'externalProduction',
            component: ExternalProductionTest,
            meta: { title: '外产领料入库测试', icon: ContainerOutlined }
          }
        ]
      },
      {
        path: 'system',
        name: 'system',
        meta: { title: '系统设置', icon: SettingOutlined, order: 4 },
        children: [
          {
            path: 'users',
            name: 'users',
            component: Users,
            meta: { title: '用户管理', icon: TeamOutlined }
          },
          {
            path: 'organization',
            name: 'OrganizationManagement',
            component: OrganizationManagement,
            meta: { title: '组织管理', icon: ApartmentOutlined }
          },
          {
            path: 'config',
            name: 'config',
            component: Config,
            meta: { title: '系统配置', icon: ToolOutlined }
          }
        ]
      },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// ========== 路由守卫：未登录跳转到登录页 ==========
const TOKEN_KEY = 'V_AUTH_TOKEN'
router.beforeEach((to, _from, next) => {
  // 登录/注册页直接放行
  if (to.meta?.skipAuth) {
    // 已登录访问登录页：直接跳到首页
    if (to.name === 'Login' && localStorage.getItem(TOKEN_KEY)) {
      next({ path: '/' })
      return
    }
    next()
    return
  }

  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    // 未登录，记录来源页后跳转到登录
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
