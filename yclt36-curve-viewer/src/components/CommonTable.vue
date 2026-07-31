<template>
  <a-card
    v-if="carded"
    class="common-table-card"
    :class="cardClasses"
    :title="title"
    size="small"
  >
    <template #title>
      <slot name="title">{{ title }}</slot>
    </template>
    <template #extra>
      <slot name="extra">
        <TableColumnSettings
          v-model="columnSettings"
          :columns="columns"
          :storage-key="storageKey"
          :loading="loading"
          :fullscreen="isFullscreen"
          :overlay="overlay"
          @change="handleColumnSettingsChange"
          @refresh="handleRefresh"
          @update:fullscreen="handleFullscreenChange"
        />
      </slot>
    </template>
    <div class="common-table__body">
      <div v-if="$slots.top" class="common-table__top">
        <slot name="top" />
      </div>
      <div ref="tableWrapperRef" class="table-scroll" :class="tableWrapperClass">
        <a-table
          :columns="displayColumns"
          :data-source="dataSource"
          :pagination="pagination"
          :row-key="rowKey"
          :loading="loading"
          :scroll="effectiveScroll"
          :size="size"
          :bordered="bordered"
          :class="tableClass"
          :expand-icon-column-index="expandIconColumnIndex"
          :indent-size="indentSize"
          :expanded-row-keys="expandedRowKeys"
          :row-class-name="mergedRowClassName"
          :custom-row="mergedCustomRow"
          @expand="handleExpand"
        >
          <template v-if="$slots.expandIcon" #expandIcon="slotProps">
            <slot name="expandIcon" v-bind="slotProps" />
          </template>
          <template v-if="$slots.bodyCell" #bodyCell="slotProps">
            <slot name="bodyCell" v-bind="slotProps" />
          </template>
          <template v-if="$slots.empty" #emptyText>
            <slot name="empty" />
          </template>
        </a-table>
      </div>
      <div v-if="$slots.bottom" class="common-table__bottom">
        <slot name="bottom" />
      </div>
    </div>
  </a-card>

  <div
    v-else
    class="common-table common-table--flat"
    :class="flatClasses"
  >
    <div class="common-table__header">
      <div class="common-table__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="common-table__extra">
        <slot name="extra">
          <TableColumnSettings
            v-model="columnSettings"
            :columns="columns"
            :storage-key="storageKey"
            :loading="loading"
            :fullscreen="isFullscreen"
            :overlay="overlay"
            @change="handleColumnSettingsChange"
            @refresh="handleRefresh"
            @update:fullscreen="handleFullscreenChange"
          />
        </slot>
      </div>
    </div>
    <div class="common-table__body">
      <div v-if="$slots.top" class="common-table__top">
        <slot name="top" />
      </div>
      <div ref="tableWrapperRef" class="table-scroll" :class="tableWrapperClass">
        <a-table
          :columns="displayColumns"
          :data-source="dataSource"
          :pagination="pagination"
          :row-key="rowKey"
          :loading="loading"
          :scroll="effectiveScroll"
          :size="size"
          :bordered="bordered"
          :class="tableClass"
          :expand-icon-column-index="expandIconColumnIndex"
          :indent-size="indentSize"
          :expanded-row-keys="expandedRowKeys"
          :row-class-name="mergedRowClassName"
          :custom-row="mergedCustomRow"
          @expand="handleExpand"
        >
          <template v-if="$slots.expandIcon" #expandIcon="slotProps">
            <slot name="expandIcon" v-bind="slotProps" />
          </template>
          <template v-if="$slots.bodyCell" #bodyCell="slotProps">
            <slot name="bodyCell" v-bind="slotProps" />
          </template>
          <template v-if="$slots.empty" #emptyText>
            <slot name="empty" />
          </template>
        </a-table>
      </div>
      <div v-if="$slots.bottom" class="common-table__bottom">
        <slot name="bottom" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import TableColumnSettings, { type ColumnSetting } from './TableColumnSettings.vue';

interface Props {
  /** 卡片标题 */
  title?: string;
  /** 原始列配置 */
  columns: any[];
  /** 表格数据源 */
  dataSource: any[];
  /** localStorage 缓存 key */
  storageKey: string;
  /** 加载状态 */
  loading?: boolean;
  /** 分页配置 */
  pagination?: any;
  /** 行唯一标识 */
  rowKey?: string | ((record: any) => string);
  /** 滚动配置（autoScrollX/Y 为 true 时会自动计算对应方向） */
  scroll?: { x?: number | string; y?: number | string };
  /** 表格尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否使用卡片外壳（默认 true） */
  carded?: boolean;
  /** 根卡片自定义 class */
  cardClass?: string;
  /** 表格自定义 class */
  tableClass?: string;
  /** 表格滚动容器自定义 class */
  tableWrapperClass?: string;
  /** 全屏状态（v-model:fullscreen） */
  fullscreen?: boolean;
  /** 是否渲染全屏遮罩（抽屉内等场景建议传 false） */
  overlay?: boolean;
  /** 展开图标所在列索引 */
  expandIconColumnIndex?: number;
  /** 树形缩进大小 */
  indentSize?: number;
  /** 已展开行 keys */
  expandedRowKeys?: string[];
  /** 行类名 */
  rowClassName?: string | ((record: any, index: number) => string);
  /** 自定义行属性（如点击事件） */
  customRow?: (record: any, index?: number) => any;
  /** 是否根据列宽自动计算横向滚动宽度 */
  autoScrollX?: boolean;
  /** 是否根据容器高度自动计算纵向滚动高度 */
  autoScrollY?: boolean;
  /** 是否开启点击行自动选中并高亮（默认 true） */
  rowClickSelect?: boolean;
  /** 当前选中行 key（v-model:selectedRowKey），用于高亮与控制 */
  selectedRowKey?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id',
  size: 'middle',
  bordered: true,
  carded: true,
  overlay: true,
  autoScrollX: false,
  autoScrollY: false,
  rowClickSelect: true,
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'change', settings: ColumnSetting[]): void;
  (e: 'expand', expanded: boolean, record: any): void;
  (e: 'update:fullscreen', value: boolean): void;
  (e: 'update:selectedRowKey', value: string | number | undefined): void;
}>();

// ========== 选中行高亮 ==========
// 选中 key：支持外部 v-model:selectedRowKey 控制，未传时使用内部状态
const internalSelectedKey = ref<string | number | undefined>(undefined);
const selectedKey = computed<string | number | undefined>({
  get: () => (props.selectedRowKey !== undefined ? props.selectedRowKey : internalSelectedKey.value),
  set: (val) => {
    internalSelectedKey.value = val;
    emit('update:selectedRowKey', val);
  },
});

// 取行 key（兼容 rowKey 为函数或字段名）
function getRowKeyValue(record: any): any {
  if (typeof props.rowKey === 'function') return props.rowKey(record);
  return record[props.rowKey as string];
}

// 合并外部传入的 rowClassName，并在选中时追加 selected-row
function mergedRowClassName(record: any, index: number): string {
  const base =
    typeof props.rowClassName === 'function'
      ? props.rowClassName(record, index)
      : (props.rowClassName || '');
  const isSelected =
    selectedKey.value !== undefined &&
    selectedKey.value !== null &&
    selectedKey.value !== '' &&
    getRowKeyValue(record) === selectedKey.value;
  if (isSelected) return base ? `${base} selected-row` : 'selected-row';
  return base || '';
}

// 合并外部传入的 customRow，开启点击选中时包裹 onClick 实现自动选中
// 点击交互元素（输入框、下拉、按钮等）不触发选中，避免与单元格内的编辑控件冲突
function mergedCustomRow(record: any, index?: number) {
  const base = props.customRow ? props.customRow(record, index) : {};
  if (!props.rowClickSelect) return base;
  const originalClick = base.onClick;
  return {
    ...base,
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inInteractive = target?.closest(
        'input, select, textarea, button, a, [contenteditable="true"], .ant-input-number, .ant-select, .cell-input-small'
      );
      if (!inInteractive) {
        selectedKey.value = getRowKeyValue(record);
      }
      if (originalClick) originalClick(e);
    },
  };
}

// ========== 列设置 ==========
function getColKey(col: any): string {
  return ((col?.key || col?.dataIndex) as string) || '';
}

function getColTitle(col: any): string {
  return (col?.title as string) || getColKey(col);
}

function buildDefaultSettings(cols: any[]): ColumnSetting[] {
  return cols.map((col) => ({
    key: getColKey(col),
    title: getColTitle(col),
    visible: true,
    fixed: (col?.fixed as 'left' | 'right' | undefined) || undefined,
  }));
}

function loadSavedSettings(): ColumnSetting[] | null {
  try {
    const raw = localStorage.getItem(props.storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(value: ColumnSetting[]) {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** 按当前 columns 顺序，合并已保存设置，新增列默认显示 */
function mergeSettings(cols: any[], saved: ColumnSetting[] | null): ColumnSetting[] {
  const defaults = buildDefaultSettings(cols);
  if (!saved || saved.length === 0) return defaults;
  const savedMap = new Map(saved.map((s) => [s.key, s]));
  const result: ColumnSetting[] = [];

  // 优先使用保存顺序
  saved.forEach((s) => {
    const def = defaults.find((d) => d.key === s.key);
    if (def) {
      result.push({
        ...def,
        visible: s.visible !== undefined ? s.visible : def.visible,
        fixed: s.fixed !== undefined ? s.fixed : def.fixed,
      });
    }
  });

  // 追加新增列
  defaults.forEach((def) => {
    if (!savedMap.has(def.key)) {
      result.push(def);
    }
  });

  return result;
}

function computeSettings(cols: any[], current?: ColumnSetting[]): ColumnSetting[] {
  const currentMap = new Map((current || []).map((s) => [s.key, s]));
  return cols.map((col) => {
    const key = getColKey(col);
    const saved = currentMap.get(key);
    if (saved) {
      return { ...saved, title: getColTitle(col) };
    }
    return { key, title: getColTitle(col), visible: true, fixed: col?.fixed };
  });
}

const columnSettings = ref<ColumnSetting[]>(mergeSettings(props.columns, loadSavedSettings()));

watch(
  () => props.columns,
  (newCols) => {
    columnSettings.value = computeSettings(newCols, columnSettings.value);
  },
  { deep: true }
);

const displayColumns = computed(() => {
  const baseMap = new Map<string, any>();
  props.columns.forEach((col) => {
    baseMap.set(getColKey(col), col);
  });

  const mapped = columnSettings.value
    .filter((s) => s.visible)
    .map((s) => {
      const base = baseMap.get(s.key);
      return {
        ...(base || { title: s.title, dataIndex: s.key, key: s.key }),
        fixed: s.fixed,
      };
    });

  // 安全兜底：如果所有列都被隐藏，则显示全部原始列
  const effectiveColumns = mapped.length > 0 ? mapped : props.columns;

  // 固定列分组：左侧固定在前，右侧固定在后，中间列保持设置顺序
  const left = effectiveColumns.filter((c: any) => c.fixed === 'left');
  const center = effectiveColumns.filter((c: any) => !c.fixed);
  const right = effectiveColumns.filter((c: any) => c.fixed === 'right');
  return [...left, ...center, ...right];
});

function handleColumnSettingsChange(settings: ColumnSetting[]) {
  columnSettings.value = settings;
  saveSettings(settings);
  emit('change', settings);
}

// ========== 全屏 ==========
const internalFullscreen = ref(false);
const isFullscreen = computed(() =>
  props.fullscreen !== undefined ? props.fullscreen : internalFullscreen.value
);

function handleFullscreenChange(value: boolean) {
  if (props.fullscreen !== undefined) {
    emit('update:fullscreen', value);
  } else {
    internalFullscreen.value = value;
  }
}

// ========== 刷新 ==========
function handleRefresh() {
  emit('refresh');
}

// ========== 自动滚动宽高 ==========
const tableWrapperRef = ref<HTMLElement | null>(null);
const internalScrollY = ref<number | undefined>(undefined);
const scrollVersion = ref(0);
let resizeObserver: ResizeObserver | null = null;

const computedScrollX = computed(() => {
  if (!props.autoScrollX) return undefined;
  const total = displayColumns.value.reduce((sum, col) => {
    const w = (col?.width as number) || (col?.minWidth as number) || 120;
    return sum + w;
  }, 0);
  return total > 600 ? total : undefined;
});

let cachedScrollbarHeight: number | null = null;
function getScrollbarHeight(): number {
  if (cachedScrollbarHeight !== null) return cachedScrollbarHeight;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;overflow:scroll;height:100px;width:100px;visibility:hidden;z-index:-1;';
  document.body.appendChild(probe);
  cachedScrollbarHeight = probe.offsetHeight - probe.clientHeight;
  document.body.removeChild(probe);
  return cachedScrollbarHeight;
}

function updateScrollY() {
  if (props.autoScrollY && tableWrapperRef.value) {
    const wrapper = tableWrapperRef.value;
    let height = wrapper.clientHeight;

    // 扣除表头高度：Ant Design Vue 的 scroll.y 指 tbody 高度，
    // 直接拿容器高度会导致整个表格（header + body）超出容器，底部被截断
    const headerEl = wrapper.querySelector('.ant-table-header, .ant-table-thead') as HTMLElement | null;
    if (headerEl) {
      height -= headerEl.getBoundingClientRect().height;
    }

    // 当内容宽度超过容器宽度时，预留水平滚动条高度，避免其遮挡最后一行
    if (props.autoScrollX && computedScrollX.value && computedScrollX.value > wrapper.clientWidth) {
      height -= getScrollbarHeight();
    }

    internalScrollY.value = Math.max(height, 120);
  }
}

function handleExpand(expanded: boolean, record: any) {
  // 树形展开/收起会改变表格可视内容，需要重新计算滚动尺寸
  nextTick(() => {
    scrollVersion.value++;
    updateScrollY();
  });
  emit('expand', expanded, record);
}

const effectiveScroll = computed(() => {
  // 读取 scrollVersion 使其成为依赖，展开/收起时强制生成新的 scroll 对象引用，
  // 触发 Ant Design Vue 表格重新应用滚动设置
  scrollVersion.value;
  return {
    x: props.autoScrollX ? computedScrollX.value : props.scroll?.x,
    y: props.autoScrollY ? internalScrollY.value : props.scroll?.y,
  };
});

onMounted(() => {
  nextTick(updateScrollY);
  window.addEventListener('resize', updateScrollY);
  if (tableWrapperRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      nextTick(updateScrollY);
    });
    resizeObserver.observe(tableWrapperRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollY);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(
  () => [props.dataSource, props.fullscreen, displayColumns.value, props.expandedRowKeys],
  () => nextTick(updateScrollY),
  { deep: true }
);

// ========== class 计算 ==========
const cardClasses = computed(() => ({
  fullscreen: isFullscreen.value,
  [props.cardClass || '']: !!props.cardClass,
}));

const flatClasses = computed(() => ({
  fullscreen: isFullscreen.value,
  [props.cardClass || '']: !!props.cardClass,
}));
</script>

<style scoped>
.common-table-card,
.common-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.common-table-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.common-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2b4b78 100%);
  color: #fff;
}

.common-table__title {
  font-size: 14px;
  font-weight: 600;
}

.common-table__extra {
  display: flex;
  align-items: center;
}

.common-table__extra :deep(.settings-trigger) {
  color: rgba(255, 255, 255, 0.85);
}

.common-table__extra :deep(.settings-trigger:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.common-table__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.common-table__top,
.common-table__bottom {
  flex-shrink: 0;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

/* 全屏模式：默认占满视口，可被业务侧样式覆盖 */
.common-table-card.fullscreen {
  position: fixed;
  inset: 4px;
  z-index: 1000;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* ========== 选中行高亮（通用） ========== */
.common-table-card :deep(.ant-table-tbody > tr.selected-row > td),
.common-table--flat :deep(.ant-table-tbody > tr.selected-row > td) {
  background: #e6f7ff !important;
}

.common-table-card :deep(.ant-table-tbody > tr.selected-row:hover > td),
.common-table--flat :deep(.ant-table-tbody > tr.selected-row:hover > td) {
  background: #bae7ff !important;
}

.common-table-card.fullscreen :deep(.ant-card-body) {
  flex: 1;
  overflow: hidden;
}

.common-table-card.fullscreen .table-scroll {
  flex: 1;
  overflow: auto;
}
</style>
