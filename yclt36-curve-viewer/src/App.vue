<template>
  <a-config-provider :locale="zhCN">
    <div id="app">
      <div class="app-container">
        <router-view />
      </div>
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export default {
  name: 'App',  data() {
    return {
      zhCN
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  margin: 10 auto;  
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>