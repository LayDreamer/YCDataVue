import { createApp } from 'vue'
import './style.css'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css' 
// import App from './views/Test.vue'
import App from './App.vue'
import router from './router'

// 创建 Vue 应用实例并挂载到 DOM
const app = createApp(App)
app.use(Antd)
app.use(router)
app.mount('#app')
