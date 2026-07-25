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
          :row-class-name="rowClassName"
          :custom-row="customRow"
          @expand="(expanded: boolean, record: any) => emit('expand', expanded, record)"
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
          :row-class-name="rowClassName"
          :custom-row="customRow"
          @expand="(expanded: boolean, record: any) => emit('expand', expanded, record)"
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
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'change', settings: ColumnSetting[]): void;
  (e: 'expand', expanded: boolean, record: any): void;
  (e: 'update:fullscreen', value: boolean): void;
}>();

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

const computedScrollX = computed(() => {
  if (!props.autoScrollX) return undefined;
  const total = displayColumns.value.reduce((sum, col) => {
    const w = (col?.width as number) || 120;
    return sum + w;
  }, 0);
  return total > 600 ? total : undefined;
});

function updateScrollY() {
  if (props.autoScrollY && tableWrapperRef.value) {
    internalScrollY.value = tableWrapperRef.value.clientHeight;
  }
}

const effectiveScroll = computed(() => ({
  x: props.autoScrollX ? computedScrollX.value : props.scroll?.x,
  y: props.autoScrollY ? internalScrollY.value : props.scroll?.y,
}));

onMounted(() => {
  nextTick(updateScrollY);
  window.addEventListener('resize', updateScrollY);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollY);
});

watch(
  () => [props.dataSource, props.fullscreen, displayColumns.value],
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
  inset: 24px;
  z-index: 1000;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
