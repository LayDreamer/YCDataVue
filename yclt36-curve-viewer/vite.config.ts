import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'node:fs';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

// antd 4.2.6 中部分组件（XxxItem 子组件、AutoComplete 等）没有独立 style 目录，
// 其样式由父组件提供。动态检测目录存在性，跳过不存在的样式导入避免构建失败。
const antdBaseResolver = AntDesignVueResolver({ importStyle: 'less' });
const antdResolver = (name: string) => {
  const resolved = antdBaseResolver.resolve(name);
  if (resolved && resolved.sideEffects) {
    const effects = Array.isArray(resolved.sideEffects) ? resolved.sideEffects : [resolved.sideEffects];
    const existing = effects.filter((e) => fs.existsSync(path.join(process.cwd(), 'node_modules', e)));
    if (existing.length === 0) {
      delete resolved.sideEffects;
    } else {
      resolved.sideEffects = existing.length === 1 ? existing[0] : existing;
    }
  }
  return resolved;
};

export default defineConfig({
  plugins: [
    vue(),
    // antd 按需引入：模板中的 a-* 组件自动注册（JS 按需）+ less 样式按需
    Components({
      resolvers: [antdResolver],
      dts: false
    })
  ],
  resolve: {
    alias: {
      // '@': '/src'
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['qrcode']
  },
  // 基础路径配置
  base: './', // 使用相对路径，便于在不同目录下部署
  build: {
    // 输出目录
    outDir: 'dist',
    // 资源目录
    assetsDir: 'assets',
    // 开启分裂chunk以优化加载
    rollupOptions: {
      output: {
        // 手动拆分入口文件
        manualChunks: undefined,
        // 资产命名
        assetFileNames: (assetInfo) => {
          if (/\.css$/.test(assetInfo.name || '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|ico|webp)$/.test(assetInfo.name || '')) {
            return 'assets/img/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // 压缩构建产物
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
  //  开发服务器配置（可选）
  // server: {
  //   port: 3000,
  //   open: true
  // }
});
