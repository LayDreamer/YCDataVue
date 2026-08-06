import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * ECharts 按需注册入口。
 * 只注册业务实际用到的图表/组件/渲染器，减小打包体积。
 * 使用方（useECharts / useChartOptions）在模块顶层 import 本文件，
 * ESM 单例保证注册先于任何 init / setOption 执行。
 * 若新增图表类型（如 BarChart/ScatterChart）或组件（如 MarkLineComponent），在此追加。
 */
use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, CanvasRenderer]);

export {};
