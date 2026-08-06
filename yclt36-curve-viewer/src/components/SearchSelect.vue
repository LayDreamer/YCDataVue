<template>
  <a-auto-complete
    v-bind="rootAttrs"
    :value="inputValue"
    :options="options"
    :open="dropdownOpen"
    :filter-option="false"
    :disabled="disabled"
    :popup-class-name="popupClassName"
    :dropdown-style="dropdownStyle"
    :dropdown-match-select-width="false"
    :get-popup-container="getPopupContainer"
    @update:value="onAutoCompleteUpdate"
    @search="onSearch"
    @select="onSelect"
    @blur="onBlur"
  >
    <a-input :placeholder="placeholder" :disabled="disabled">
      <template #suffix>
        <LoadingOutlined v-if="loading" spin />
      </template>
    </a-input>

    <template #dropdownRender>
      <div class="ss-dropdown-scroll" :class="{ 'ss-scrolled-x': scrolledX }" :style="scrollStyle" @scroll="onScroll">
        <div class="ss-dropdown-table">
          <div class="ss-dropdown-header">
            <span
              v-for="col in columns"
              :key="'h-' + col.dataIndex"
              class="ss-option-cell"
              :class="{ 'ss-option-fixed': col.fixed }"
              :style="cellStyle(col)"
              >{{ col.title }}</span
            >
          </div>
          <div
            v-for="(row, i) in displayData"
            :key="rowKey(row, i)"
            class="ss-option-row"
            @mousedown.prevent.stop="selectRow(row)"
          >
            <span
              v-for="col in columns"
              :key="col.dataIndex"
              class="ss-option-cell"
              :class="{ 'ss-option-fixed': col.fixed }"
              :title="String(row[col.dataIndex] ?? '')"
              :style="cellStyle(col)"
              >{{ row[col.dataIndex] }}</span
            >
          </div>
          <div v-if="displayData.length === 0" class="ss-dropdown-empty">{{ emptyText }}</div>
        </div>
      </div>
    </template>
  </a-auto-complete>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted, useAttrs } from 'vue';
import { debounce } from 'lodash';
import { LoadingOutlined } from '@ant-design/icons-vue';

// 关键：禁止 Vue 自动把父组件传入的 attrs 透传到根元素 <a-auto-complete>，
// 否则父组件的 v-model:value 产生的 onUpdate:value 会与本组件显式绑定的 @update:value
// 合并成数组，触发 a-auto-complete -> a-select 内部的 prop 类型校验失败：
//   "Invalid prop: type check failed for prop 'onUpdate:value'. Expected Function, got Array."
defineOptions({ inheritAttrs: false });

// 兜底：即便未来误改 inheritAttrs，也手动剥离 onUpdate:value 后再回绑给根元素
const attrs = useAttrs();
const rootAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { 'onUpdate:value': _drop1, onUpdateValue: _drop2, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

export interface SearchSelectColumn {
  /** 列标题（下拉表头显示） */
  title: string;
  /** 字段名，对应数据源对象中的 key */
  dataIndex: string;
  /** 该列最小宽度（px） */
  width?: number;
  /** 是否固定（横向滚动时固定在左侧，一般用于首列） */
  fixed?: boolean;
  /** 该列字体颜色 */
  color?: string;
}

/** 下拉数据源行的内部表示：字段名对应 columns.dataIndex，按使用处动态取值 */
export type SearchSelectRow = Record<string, unknown>;

const props = defineProps<{
  /** 当前选中值（v-model:value） */
  value?: string;
  /** 列定义 */
  columns: SearchSelectColumn[];
  /** 远程搜索函数：传入关键字，返回数据源数组（对象 key 对应 columns.dataIndex）。
   *  返回行声明为 object：调用方通常传具体 interface，而 interface 无法赋值给含索引签名的类型，
   *  组件内部再收窄为 SearchSelectRow */
  search: (keyword: string) => Promise<object[]>;
  /** 选中后回填到输入框的字段，默认取第一列的 dataIndex */
  valueField?: string;
  placeholder?: string;
  /** 搜索防抖时间（ms） */
  debounceTime?: number;
  /** 下拉面板宽度（px） */
  dropdownWidth?: number;
  /** 下拉面板最大高度（px） */
  maxHeight?: number;
  emptyText?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
  (e: 'select', record: SearchSelectRow): void;
}>();

const inputValue = ref(props.value ?? '');
watch(
  () => props.value,
  (v) => {
    if (v !== inputValue.value) inputValue.value = v ?? '';
  }
);

const valueField = computed(() => props.valueField || props.columns[0]?.dataIndex || '');
const displayData = ref<SearchSelectRow[]>([]);
const loading = ref(false);
const scrolledX = ref(false);
// 远程数据异步返回后主动展开面板，避免 options 初始为空时自动完成组件不再打开下拉。
const dropdownOpen = ref(false);

// a-auto-complete 需要非空 options 才会渲染下拉，这里用显示数据同步生成
const options = computed(() =>
  displayData.value.map((d) => ({
    value: String(d[valueField.value] ?? ''),
    label: String(d[valueField.value] ?? '')
  }))
);

const popupClassName = 'ss-search-dropdown';
const dropdownStyle = computed(() => ({ width: `${props.dropdownWidth ?? 560}px` }));
const scrollStyle = computed(() => ({
  width: `${props.dropdownWidth ?? 560}px`,
  maxWidth: 'calc(100vw - 48px)',
  maxHeight: `${props.maxHeight ?? 380}px`
}));

function cellStyle(col: SearchSelectColumn) {
  const style: Record<string, string> = { minWidth: `${col.width ?? 120}px` };
  if (col.color) style.color = col.color;
  return style;
}

function rowKey(row: SearchSelectRow, i: number) {
  return String(row[valueField.value] ?? i);
}

async function doSearch(kw: string) {
  if (!kw || !kw.trim()) {
    displayData.value = [];
    scrolledX.value = false;
    dropdownOpen.value = false;
    return;
  }
  loading.value = true;
  scrolledX.value = false;
  try {
    const data = await props.search(kw.trim());
    // 调用方返回的是具体行 interface，这里收窄为内部行类型 SearchSelectRow
    displayData.value = Array.isArray(data) ? (data as unknown as SearchSelectRow[]) : [];
    dropdownOpen.value = displayData.value.length > 0;
  } catch {
    displayData.value = [];
    dropdownOpen.value = false;
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = debounce(doSearch, props.debounceTime ?? 300);

function onSearch(kw: string) {
  emit('update:value', kw);
  dropdownOpen.value = false;
  debouncedSearch(kw);
}

/**
 * a-auto-complete 的 update:value 事件处理：
 * 1. 同步更新内部 inputValue（受控值）
 * 2. 向外 emit update:value 让父组件的 v-model:value 拿到值
 * 3. 触发防抖搜索
 *
 * 不能在这里用 v-model:value="inputValue"，因为父组件的 v-model:value 会被 SearchSelect 的 $attrs
 * 自动继承到根 a-auto-complete，导致 onUpdate:value 被合并为数组，触发 Vue prop 类型校验失败：
 *   "Invalid prop: type check failed for prop 'onUpdate:value'. Expected Function, got Array."
 */
function onAutoCompleteUpdate(v: string) {
  inputValue.value = v;
  emit('update:value', v);
  dropdownOpen.value = false;
  debouncedSearch(v);
}

function onBlur() {
  dropdownOpen.value = false;
}

function getPopupContainer() {
  return document.body;
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  scrolledX.value = el.scrollLeft > 0;
}

function applySelect(row: SearchSelectRow) {
  const val = String(row[valueField.value] ?? '');
  inputValue.value = val;
  emit('update:value', val);
  emit('select', row);
  // 选中后清空下拉数据，关闭面板
  displayData.value = [];
  scrolledX.value = false;
  dropdownOpen.value = false;
}

function onSelect(value: string) {
  const row = displayData.value.find((d) => String(d[valueField.value]) === String(value));
  if (row) applySelect(row);
}

function selectRow(row: SearchSelectRow) {
  applySelect(row);
}

onUnmounted(() => {
  debouncedSearch.cancel();
});
</script>

<!--
  注意：下拉面板通过 getPopupContainer 挂载到 document.body，
  scoped 样式无法作用到该节点，因此结构/布局样式放在全局 <style> 中。
  列宽、面板宽高、字体色等动态值通过组件内联 style 控制。
-->
<style>
.ss-search-dropdown.ant-select-dropdown {
  max-width: calc(100vw - 48px) !important;
}

.ss-search-dropdown .ant-select-dropdown-content {
  width: auto !important;
}

.ss-dropdown-scroll {
  overflow: auto;
}

.ss-dropdown-table {
  display: table;
  table-layout: auto;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.ss-dropdown-header,
.ss-option-row {
  display: table-row;
}

.ss-dropdown-header .ss-option-cell {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fafafa;
  font-weight: 600;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.ss-option-cell {
  display: table-cell;
  white-space: nowrap;
  vertical-align: middle;
  padding: 6px 12px;
  font-size: 13px;
  color: #434343;
}

.ss-option-row .ss-option-cell {
  border-bottom: 1px solid #f5f5f5;
}

.ss-option-row:hover .ss-option-cell {
  background-color: #e6f7ff;
  cursor: pointer;
}

.ss-option-fixed {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #fff;
  font-weight: 500;
}

.ss-dropdown-scroll.ss-scrolled-x .ss-option-fixed {
  box-shadow: 6px 0 8px -4px rgba(0, 0, 0, 0.15);
}

.ss-dropdown-header .ss-option-fixed {
  z-index: 2;
  background: #fafafa;
}

.ss-dropdown-empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>
