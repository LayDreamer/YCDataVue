// vite.config.ts
import { defineConfig } from "file:///D:/work2026/AICode/AI%E6%B5%8B%E8%AF%95%E4%B8%93%E7%94%A8/YCDataVue/yclt36-curve-viewer/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/work2026/AICode/AI%E6%B5%8B%E8%AF%95%E4%B8%93%E7%94%A8/YCDataVue/yclt36-curve-viewer/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\work2026\\AICode\\AI\u6D4B\u8BD5\u4E13\u7528\\YCDataVue\\yclt36-curve-viewer";
var vite_config_default = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // '@': '/src'
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  // 基础路径配置
  base: "./",
  // 使用相对路径，便于在不同目录下部署
  build: {
    // 输出目录
    outDir: "dist",
    // 资源目录
    assetsDir: "assets",
    // 开启分裂chunk以优化加载
    rollupOptions: {
      output: {
        // 手动拆分入口文件
        manualChunks: void 0,
        // 资产命名
        assetFileNames: (assetInfo) => {
          if (/\.css$/.test(assetInfo.name || "")) {
            return "assets/css/[name]-[hash][extname]";
          }
          if (/\.(png|jpe?g|svg|gif|ico|webp)$/.test(assetInfo.name || "")) {
            return "assets/img/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    },
    // 压缩构建产物
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  //  开发服务器配置
  server: {
    port: 3002,
    open: true,
    host: "0.0.0.0"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3JrMjAyNlxcXFxBSUNvZGVcXFxcQUlcdTZENEJcdThCRDVcdTRFMTNcdTc1MjhcXFxcWUNEYXRhVnVlXFxcXHljbHQzNi1jdXJ2ZS12aWV3ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHdvcmsyMDI2XFxcXEFJQ29kZVxcXFxBSVx1NkQ0Qlx1OEJENVx1NEUxM1x1NzUyOFxcXFxZQ0RhdGFWdWVcXFxceWNsdDM2LWN1cnZlLXZpZXdlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovd29yazIwMjYvQUlDb2RlL0FJJUU2JUI1JThCJUU4JUFGJTk1JUU0JUI4JTkzJUU3JTk0JUE4L1lDRGF0YVZ1ZS95Y2x0MzYtY3VydmUtdmlld2VyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAvLyAnQCc6ICcvc3JjJ1xuICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpXG4gICAgfVxuICB9LFxuICAvLyBcdTU3RkFcdTc4NDBcdThERUZcdTVGODRcdTkxNERcdTdGNkVcbiAgYmFzZTogJy4vJywgLy8gXHU0RjdGXHU3NTI4XHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XHVGRjBDXHU0RkJGXHU0RThFXHU1NzI4XHU0RTBEXHU1NDBDXHU3NkVFXHU1RjU1XHU0RTBCXHU5MEU4XHU3RjcyXG4gIGJ1aWxkOiB7XG4gICAgLy8gXHU4RjkzXHU1MUZBXHU3NkVFXHU1RjU1XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgLy8gXHU4RDQ0XHU2RTkwXHU3NkVFXHU1RjU1XG4gICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAvLyBcdTVGMDBcdTU0MkZcdTUyMDZcdTg4QzJjaHVua1x1NEVFNVx1NEYxOFx1NTMxNlx1NTJBMFx1OEY3RFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBcdTYyNEJcdTUyQThcdTYyQzZcdTUyMDZcdTUxNjVcdTUzRTNcdTY1ODdcdTRFRjZcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICAgIC8vIFx1OEQ0NFx1NEVBN1x1NTQ3RFx1NTQwRFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGlmICgvXFwuY3NzJC8udGVzdChhc3NldEluZm8ubmFtZSB8fCAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnYXNzZXRzL2Nzcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJ1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL1xcLihwbmd8anBlP2d8c3ZnfGdpZnxpY298d2VicCkkLy50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdhc3NldHMvaW1nL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICAgIH0sXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJ1xuICAgICAgfVxuICAgIH0sXG4gICAgLy8gXHU1MzhCXHU3RjI5XHU2Nzg0XHU1RUZBXHU0RUE3XHU3MjY5XG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vICBcdTVGMDBcdTUzRDFcdTY3MERcdTUyQTFcdTU2NjhcdTkxNERcdTdGNkVcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMixcbiAgICBvcGVuOiB0cnVlLFxuICAgIGhvc3Q6ICcwLjAuMC4wJ1xuICB9XG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVksU0FBUyxvQkFBb0I7QUFDaGEsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDZixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUE7QUFBQSxNQUVKLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsTUFBTTtBQUFBO0FBQUEsRUFDTixPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQTtBQUFBLElBRVIsV0FBVztBQUFBO0FBQUEsSUFFWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQTtBQUFBLFFBRWQsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLFNBQVMsS0FBSyxVQUFVLFFBQVEsRUFBRSxHQUFHO0FBQ3ZDLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksa0NBQWtDLEtBQUssVUFBVSxRQUFRLEVBQUUsR0FBRztBQUNoRSxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsTUFDakI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
