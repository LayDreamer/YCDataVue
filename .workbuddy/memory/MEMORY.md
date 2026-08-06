# 项目长期记忆 (YCDataVue)

## 项目概况
- 前端项目 `yclt36-curve-viewer`：Vue 3.3 + TypeScript + Ant Design Vue 4 + ECharts + Vite 5 + vue-router 4 + axios。
- 后端：.NET `LocalDataApi`，Swagger 地址 `http://localhost:5246/swagger/v1/swagger.json`，生产 `http://192.168.1.110:90`。
- API 层：`src/api-generated/api.ts`（NSwag 生成，运行 `npm run generate-api` 即 `nswag run` 重新生成）、`src/services/*` 业务封装、`src/api/index.ts` 手写 axios 实例（带 Bearer/401 拦截器）。
- 状态管理：无 Pinia，模块级 `ref` 单例 composable（如 `useAuth.ts`）；`provide/inject` 偶用（无 InjectionKey）。
- 业务模块：PMC / WeChatWork / System；`src/views/Test/*` 为开发草稿。

## 约定与已落地事项
- 代码规范权威来源：WorkBuddy skill `vue-best-practices`（Composition API + `<script setup lang="ts">`、props 下事件上、computed/watch、composable 组织）。
- 路径别名 `@/` → `src/`。
- 鉴权 token key 已统一：`src/constants/storage.ts`（TOKEN_KEY='V_AUTH_TOKEN'、USER_KEY）；router/useAuth/api/http 均引用常量。
- HTTP 通道已统一：NSwag Service 统一传 `apiHttp`（`src/api/http.ts`，fetch 适配器带 Bearer + 401 → `handleUnauthorized()`，`src/api/unauthorized.ts` 动态 import useAuth + hash 重定向）；`src/api/index.ts` axios 实例保留给手写调用。
- 错误收敛：所有业务 catch 统一 `toServiceError(error, 兜底文案)`（`src/services/error.ts`）；NSwag ApiException.response 是字符串。
- 类型工具：`ApiResponse`/`toCamelCase` 在 `src/utils/api.ts`；`src/services/index.ts` 仅作兼容 shim（请勿新增内容）。
- 跨组件通信：`src/keys.ts` 的 `CloseTabKey`（InjectionKey，Home provide / CurveDetail inject）。
- ECharts 生命周期统一走 `src/composables/useECharts.ts`（init/ResizeObserver/dispose/watch），组件仅传 containerRef+chartRef+options；**echarts 按需注册在 `src/plugins/echarts.ts`**（新增图表类型在此 use() 追加）。
- 路由：全动态 import 懒加载；Test/* 草稿路由仅 `import.meta.env.DEV` 注册（`src/router/index.ts` 顶部 testRoutes），生产包不含。
- 项目使用 CRLF 换行，脚本处理注意 `\r?\n`；`isolatedModules` 开启，re-export 类型必须 `export type`。
- 工具链（P0 已落地）：ESLint 10 flat config（`eslint.config.js`，忽略 `src/api-generated/**`；**P1 后 no-explicit-any / no-unused-vars 已收紧为 error，当前 0 problems**）+ Prettier 3（`.prettierrc.json`：semi/singleQuote/printWidth 120）+ `.editorconfig` + husky 9 + lint-staged（`package.json` 内联配置，仅格式化暂存文件）。**git 仓库根在父目录**（`D:\work2026\AICode\AI测试专用\YCDataVue`），`.husky/pre-commit` 在仓库根，勿在子目录 package.json 加 `prepare:husky`。
- antd 按需（P0 已落地）：`unplugin-vue-components` + 自定义 resolver（`vite.config.ts`，动态过滤无 style 目录组件的样式导入）；main.ts 无 `app.use(Antd)`，保留 reset.css + `es/message/style`、`es/modal/style`；命令式 API（message/Modal/Grid）具名导入不受影响。antd 4.2.6 无预编译全量 css。
- **环境坑**：npm 需 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY` 绕过系统代理（127.0.0.1:7890 未运行时 ECONNREFUSED），官方 registry 比 npmmirror 快；npm install 删除旧包会被沙箱 safe-delete 拦截 → 需沙箱外运行；**dev server 必须清 `NODE_OPTIONS` 启动**（safe-delete 通过 `NODE_OPTIONS=--require=.../genie-safe-delete.cjs` 全局注入，拦截 vite 预构建 commit 时删除 deps_temp_*）；**dev 端口必须用 5173**（后端 CORS 白名单只配 5173）。
- **blfParameterService URL**：手写 axios 通道需带 `/api` 前缀（如 `post('/api/blfParameter/list')`），NSwag 通道路径自带 `/api` 两者不一致是历史 bug；后端 blfParameter list/detail 接口对合法参数均返回 500（后端 bug）；后端 LocalDataApi 当前不校验 Bearer token（curl 无/坏 token 均 200）。

## 已知待办
- `useColumnSettings` 去重（CommonTable vs TableColumnSettings）：两组件 mergeSettings/buildDefaultSettings 签名有差异，暂缓，避免用户配置丢失；如做仅抽取合并算法。
- P1 已完成（xlsx 卸载 / 手写 any 清零 157→0 / noUnusedLocals+noUnusedParameters 开启）：eslint 0 problems（no-explicit-any、no-unused-vars 已收紧为 error，新代码必须遵守）；vue-tsc 0 error；build 通过。保留 2 处 any 带 eslint-disable（schedulingAnalysisService Promise<any[]>、vite-env.d.ts DefineComponent）。
- P2（待执行）：GitHub Actions CI（type-check + lint + build，.github 已留空目录）；manualChunks 拆 vendor 进一步优化缓存；清 main.ts 注释死代码；修复后端 blfParameter 500 bug（前端无能为力）。
- 风险：ERP 登录（erpLogin/quickLogin）写入假 token（`ERP-*`/`TEMP-*` 前缀）绕过鉴权，统一 Bearer 后需回归；后端 LocalDataApi 当前不校验 Bearer token（401 登出为前端防御逻辑）。
