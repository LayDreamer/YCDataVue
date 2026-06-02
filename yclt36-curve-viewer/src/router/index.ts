import { createRouter, createWebHashHistory  } from 'vue-router'
import Products from '../views/Products.vue'   
import CurveDetail from '../views/CurveDetail.vue'
import NotFound from '../views/NotFound.vue'
import Dashboard from '../views/Dashboard.vue'
import Home from '../views/Home.vue'
import SalesControl from '@/views/PMC/SalesControl/SalesControl.vue'
import WorkOrderManagement from '@/views/PMC/WorkOrderManagement/WorkOrderManagement.vue'
import WorkOrderTracking from '@/views/PMC/WorkOrderTracking/WorkOrderTracking.vue'
import SchedulingAnalysis from '@/views/PMC/SchedulingAnalysis/SchedulingAnalysis.vue'
import DeliveryReview from '@/views/PMC/DeliveryReview/DeliveryReview.vue' 
import ReviewDetail from '@/views/PMC/DeliveryReview/ReviewDetail.vue'
import Users from '@/views/System/UserManagement.vue'
import Config from '@/views/System/Config.vue'
import TestPage from '@/views/Test/TestPage.vue'
import Workflow from '@/views/Test/Workflow.vue'
import ProfitAnalysis from '@/views/Test/ProfitAnalysis.vue'
import { 
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
} from '@ant-design/icons-vue'

const routes = [
 {
    path: '/',
    component: Home,
    children: [
      { path: '', redirect: 'dashboard' },
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
            path: 'salesControl',
            name: 'SalesControl',
            component: SalesControl,
            meta: { title: '销控管理', icon: ScheduleOutlined }
          },
          {
            path: 'workOrder',
            name: 'WorkOrderManagement',
            component: WorkOrderManagement,
            meta: { title: '工单管理', icon: ContainerOutlined }
          },
          {
            path: 'workOrderTracking',
            name: 'WorkOrderTracking',
            component: WorkOrderTracking,
            meta: { title: '工单销控表', icon: ContainerOutlined ,hidden: true}
          }
        ]
      },
      {
        path: 'pmc/detail',
        name: 'PMCDetail',
        component: SchedulingAnalysis
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
            path: 'profitAnalysis',
            name: 'profitAnalysis',
            component: ProfitAnalysis,
            meta: { title: '利润分红分析', icon: DollarCircleOutlined ,hidden: true}  
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

export default router
