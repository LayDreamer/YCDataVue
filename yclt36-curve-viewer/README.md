---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3046022100e91b1ef322e458b114ec847e5e19a7c8cd044a3d13211afa285b57b4475c16cd022100817a79881bd86536e9db886f7fd33e99d630bb1bec5617a9f1b24aa47c9557f2
    ReservedCode2: 30460221009af2785946ce5b15c36ab2397146e7777af23baee16ab5138fa8daf9039cfa40022100f2b72334713e01aa42d51aa5c5dda313278e66288ab919ce0e074b91f700caa3
---

# YCLT36-电流流量测试曲线查看器

这是一个基于 Vue3 + TypeScript + ECharts 构建的交互式数据可视化项目，用于展示 YCLT36 电磁阀在不同工作压力下的电流-流量测试曲线。

## 功能特性

- **交互式图表**：使用 ECharts 绑制高性能、可交互的曲线图表
- **曲线控制**：可以通过侧边栏控制面板显示/隐藏不同压力下的曲线
- **数据详情**：鼠标悬停可查看详细的电流和流量数值
- **缩放和平移**：支持鼠标滚轮缩放和拖拽平移查看细节
- **响应式设计**：适配不同屏幕尺寸，桌面端和移动端均有良好体验

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **开发语言**：TypeScript
- **构建工具**：Vite
- **图表库**：Apache ECharts
- **样式方案**：CSS3 + SCSS

## 项目结构

```
yclt36-curve-viewer/
├── src/
│   ├── components/
│   │   ├── ProductHeader.vue    # 产品头部信息组件
│   │   ├── CurveChart.vue       # ECharts 图表组件
│   │   └── ControlPanel.vue     # 曲线控制面板组件
│   ├── composables/
│   │   └── useChartOptions.ts   # 图表配置组合式函数
│   ├── data/
│   │   └── mockData.ts          # 模拟数据
│   ├── types/
│   │   └── index.ts             # TypeScript 类型定义
│   ├── App.vue                  # 应用主组件
│   ├── main.ts                  # 应用入口
│   └── style.css                # 全局样式
├── index.html                   # HTML 入口
├── package.json                 # 项目依赖
├── tsconfig.json                # TypeScript 配置
└── vite.config.ts               # Vite 构建配置
```

## 安装和运行

### 1. 安装依赖

```bash
cd yclt36-curve-viewer
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 数据说明

### 图表数据

图表展示了 YCLT36 电磁阀在以下四种工作压力下的电流-流量特性曲线：

| 压力 | 曲线颜色 | 最大流量（约） |
|------|----------|----------------|
| 1bar | 红色     | 2.8 L/min      |
| 3bar | 黄色     | 5.8 L/min      |
| 5bar | 绿色     | 8.5 L/min      |
| 7bar | 蓝色     | 11.5 L/min     |

### 技术参数

- **型号**：YCLT36
- **通径**：1.0mm
- **电压**：24V
- **最大工作压差**：10bar

### 曲线特性

每条曲线都呈现磁滞回线特征，反映了电磁阀在开启和关闭过程中的非线性物理特性：
- **开启过程**：电流从 0 增加到最大值时，流量逐渐增加
- **关闭过程**：电流从最大值减小到 0 时，流量逐渐减小
- **回环宽度**：反映了磁滞效应的大小，与电磁阀的物理特性相关

## 使用说明

1. **查看曲线**：所有四条曲线默认全部显示
2. **隐藏曲线**：点击侧边栏中的曲线名称可以隐藏/显示对应曲线
3. **查看详情**：鼠标悬停在图表上可以查看当前电流值对应的各压力流量数据
4. **缩放查看**：使用鼠标滚轮可以缩放图表，查看特定区域的详细数据
5. **平移视图**：按住鼠标左键拖拽可以平移图表视图

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

MIT License
