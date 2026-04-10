import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // '@': '/src'
       '@': path.resolve(__dirname, 'src')
    }
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
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|svg|gif|ico|webp)$/.test(assetInfo.name || '')) {
            return 'assets/img/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
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
  },
  //  开发服务器配置（可选）
  // server: {
  //   port: 3000,
  //   open: true
  // }
})