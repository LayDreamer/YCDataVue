import { createRouter, createWebHashHistory  } from 'vue-router'
import Products from '../views/Products.vue'   
import CurveDetail from '../views/CurveDetail.vue'
import NotFound from '../views/NotFound.vue'
import Dashboard from '../views/Dashboard.vue'
import Home from '../views/Home.vue'
import SalesControl from '@/views/PMC/SalesControl/SalesControl.vue'
import WorkOrderManagement from '@/views/PMC/WorkOrderManagement/WorkOrderManagement.vue'
import SchedulingAnalysis from '@/views/PMC/SchedulingAnalysis/SchedulingAnalysis.vue'
import DeliveryReview from '@/views/PMC/DeliveryReview/DeliveryReview.vue' 
import ReviewDetail from '@/views/PMC/DeliveryReview/ReviewDetail.vue'
import { 
  DashboardOutlined, 
  ShoppingOutlined, 
  SettingOutlined,
  TeamOutlined,
  ToolOutlined, 
  FileDoneOutlined,
  ScheduleOutlined,
  LineChartOutlined,
  ContainerOutlined
} from '@ant-design/icons-vue'
// import Home from '../views/TestDetail.vue'

// 占位组件（用于其他未开发的页面）
const Placeholder = { template: '<div style="padding: 24px; background: #fff;">开发中...</div>' }
//有title的会在菜单栏进行显示
const routes = [
 {
    path: '/',
    component: Home,  // 布局组件
    children: [
      { path: '', redirect: 'dashboard' },
      {
        path: 'dashboard', 
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', icon: DashboardOutlined  }
      },      
       {
        path: 'products',
        name: 'Products',
        component:Products,
        meta: { title: '比例阀管理', icon: ShoppingOutlined ,order:1}
      },
      { 
        //比例阀曲线详情
        path: 'products/detail',
        name: 'CurveDetail',
        component: CurveDetail 
      },  
      {
        path: 'pmc',
        name: 'PMC',
        meta: { title: '排产分析', icon: LineChartOutlined ,order:2},
        children: [
          {
            path: 'deliveryreview',
            name: 'DeliveryReview',
            component:  DeliveryReview,
            meta: { title: '交期评审', icon: FileDoneOutlined }
          },
          {
            path: 'salesControl',
            name: 'SalesControl',
            component:  SalesControl,
            meta: { title: '销控管理', icon: ScheduleOutlined }
          },
          {
            path: 'workOrder',
            name: 'WorkOrderManagement',
            component: WorkOrderManagement,
            meta: { title: '工单管理', icon: ContainerOutlined }
          }
        ]
      },
      {
        path: 'pmc/detail',
        name: 'PMCDetail',
        component:SchedulingAnalysis,
        // meta: { title: '排产分析详情', icon: ShoppingOutlined}
      },         
      { path: '/:pathMatch(.*)*',name: 'NotFound', component: NotFound },
      {
        path: 'system',
        name: 'system',
      
        component: { render: () => null },
        meta: { title: '系统设置', icon: SettingOutlined,order:2 },
        children: [
          {
            path: 'users',
            name: 'users',
            component:  { render: () => null },
            meta: { title: '用户管理', icon: TeamOutlined }
          },
          {
            path: 'config',
            name: 'config',
            component:  { render: () => null },
            meta: { title: '系统配置', icon: ToolOutlined }
          }
        ]
      }
    ]
  }

  //  {
  //   path: '/',
  //   name: 'Home',
  //   component: Home,  // 根路径重定向到比例阀管理
  // },
  //  {
  //   path: '/products',
  //   name: 'Products',
  //   component: Products,
  //   meta: { title: '比例阀管理' }
  // },
  // {
  //   path: '/products/detail',
  //   name: 'CurveDetail',
  //   component:CurveDetail,
  //   //  meta: { title: '电流流量曲线详情' }
  // }, 
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   component: Dashboard,
  //   meta: { title: '仪表盘' }
  // },


  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'NotFound',
  //   component: NotFound,
  //   meta: { title: '页面未找到' }
  // }
]


// const routes = [
//   {
//     path: '/',
//     name: 'TablePage',
//     component: () => import('../views/Test.vue'),
//   },
//   {
//     path: '/detail/:id',
//     name: 'DetailPage',
//     component: () => import('../views/TestDetail.vue'),
//       props: true
//   },
// ]

const router = createRouter({
  history: createWebHashHistory (),
  routes,
})

export default router