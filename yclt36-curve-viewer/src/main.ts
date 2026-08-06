import { createApp } from 'vue';
import './style.css';
import 'ant-design-vue/dist/reset.css';
// 命令式 API（message/Modal 等）不走模板按需解析，需手动引入样式
import 'ant-design-vue/es/message/style';
import 'ant-design-vue/es/modal/style';
// import App from './views/Test.vue'
import App from './App.vue';
import router from './router';

// 创建 Vue 应用实例并挂载到 DOM
const app = createApp(App);
// antd 组件已由 unplugin-vue-components 按需注册（见 vite.config.ts），无需全量 app.use(Antd)
app.use(router);
app.mount('#app');
