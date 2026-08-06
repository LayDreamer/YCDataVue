import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
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
  CommentOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue';
import { TOKEN_KEY } from '@/constants/storage';

// 登录/注册页在路由切换时强制重新渲染（避免动画残留）
const LoginRoute = {
  path: '/login',
  name: 'Login',
  component: () => import('../views/Login.vue'),
  meta: { title: '登录', skipAuth: true }
};
const ErpLoginRoute = {
  path: '/erp-login',
  name: 'ErpLogin',
  component: () => import('../views/ErpLogin.vue'),
  meta: { title: 'ERP 登录', skipAuth: true }
};
const RegisterRoute = {
  path: '/register',
  name: 'Register',
  component: () => import('../views/Register.vue'),
  meta: { title: '注册', skipAuth: true }
};

// 测试功能路由仅在开发环境注册，避免草稿页面进入生产包
const testRoutes: RouteRecordRaw[] = import.meta.env.DEV
  ? [
      {
        path: 'test',
        name: 'test',
        meta: { title: '测试功能', icon: FunnelPlotOutlined, order: 3 },
        redirect: '/test/advanced',
        children: [
          {
            path: 'advanced',
            name: 'advancedTest',
            component: () => import('@/views/Test/TestPage.vue'),
            meta: { title: '高级测试', icon: ExperimentOutlined }
          },
          {
            path: 'workflow',
            name: 'workflow',
            component: () => import('@/views/Test/Workflow.vue'),
            meta: { title: '工作流', icon: ProjectOutlined }
          },
          {
            path: 'wechatSend',
            name: 'wechatSend',
            component: () => import('@/views/Test/WeChatSend.vue'),
            meta: { title: '企业微信发送', icon: CommentOutlined }
          },
          {
            path: 'profitAnalysis',
            name: 'profitAnalysis',
            component: () => import('@/views/Test/ProfitAnalysis.vue'),
            meta: { title: '利润分红分析', icon: DollarCircleOutlined, hidden: true }
          },
          {
            path: 'externalProduction',
            name: 'externalProduction',
            component: () => import('@/views/Test/ExternalProductionTest.vue'),
            meta: { title: '外产领料入库测试', icon: ContainerOutlined }
          }
        ]
      }
    ]
  : [];

const routes: RouteRecordRaw[] = [
  LoginRoute,
  ErpLoginRoute,
  RegisterRoute,
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: DashboardOutlined }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue'),
        meta: { title: '比例阀管理', icon: ShoppingOutlined, order: 1 }
      },
      {
        path: 'products/detail',
        name: 'CurveDetail',
        component: () => import('../views/CurveDetail.vue')
      },
      {
        path: 'pmc',
        name: 'PMC',
        meta: { title: '排产分析', icon: LineChartOutlined, order: 2 },
        children: [
          {
            path: 'deliveryreview',
            name: 'DeliveryReview',
            component: () => import('@/views/PMC/DeliveryReview/DeliveryReview.vue'),
            meta: { title: '交期评审', icon: FileDoneOutlined }
          },
          {
            path: 'workOrderTracking',
            name: 'WorkOrderTracking',
            component: () => import('@/views/PMC/WorkOrderTracking/WorkOrderTracking.vue'),
            meta: { title: '工单销控表', icon: ContainerOutlined }
          }
        ]
      },
      ...testRoutes,
      {
        path: 'system',
        name: 'system',
        meta: { title: '系统设置', icon: SettingOutlined, order: 4 },
        children: [
          {
            path: 'users',
            name: 'users',
            component: () => import('@/views/System/UserManagement.vue'),
            meta: { title: '用户管理', icon: TeamOutlined }
          },
          {
            path: 'organization',
            name: 'OrganizationManagement',
            component: () => import('@/views/System/OrganizationManagement.vue'),
            meta: { title: '组织管理', icon: ApartmentOutlined }
          },
          {
            path: 'config',
            name: 'config',
            component: () => import('@/views/System/Config.vue'),
            meta: { title: '系统配置', icon: ToolOutlined }
          }
        ]
      },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// ========== 路由守卫：未登录跳转到登录页 ==========
router.beforeEach((to, _from, next) => {
  // 登录/注册页直接放行
  if (to.meta?.skipAuth) {
    // 已登录访问登录页：直接跳到首页
    if (to.name === 'Login' && localStorage.getItem(TOKEN_KEY)) {
      next({ path: '/' });
      return;
    }
    next();
    return;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // 未登录，记录来源页后跳转到登录
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
