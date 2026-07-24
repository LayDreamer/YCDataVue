<template>
  <a-auto-complete
    v-model:value="inputValue"
    :options="options"
    :filter-option="false"
    :placeholder="placeholder"
    :disabled="disabled"
    :dropdown-class-name="dropdownClassName"
    :dropdown-style="dropdownStyle"
    :dropdown-match-select-width="false"
    :get-popup-container="getPopupContainer"
    @search="onSearch"
    @select="onSelect"
  >
    <a-input :placeholder="placeholder" :disabled="disabled">
      <template #suffix>
        <LoadingOutlined v-if="loading" spin />
      </template>
    </a-input>

    <template #dropdownRender>
      <div
        class="ss-dropdown-scroll"
        :class="{ 'ss-scrolled-x': scrolledX }"
        :style="scrollStyle"
        @scroll="onScroll"
      >
        <div class="ss-dropdown-table">
          <div class="ss-dropdown-header">
            <span
              v-for="col in columns"
              :key="'h-' + col.dataIndex"
              class="ss-option-cell"
              :class="{ 'ss-option-fixed': col.fixed }"
              :style="cellStyle(col)"
            >{{ col.title }}</span>
          </div>
          <div
            v-for="(row, i) in displayData"
            :key="rowKey(row, i)"
            class="ss-option-row"
            @click="selectRow(row)"
          >
            <span
              v-for="col in columns"
              :key="col.dataIndex"
              class="ss-option-cell"
              :class="{ 'ss-option-fixed': col.fixed }"
              :title="String(row[col.dataIndex] ?? '')"
              :style="cellStyle(col)"
            >{{ row[col.dataIndex] }}</span>
          </div>
          <div v-if="displayData.length === 0" class="ss-dropdown-empty">{{ emptyText }}</div>
        </div>
      </div>
    </template>
  </a-auto-complete>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { debounce } from 'lodash';
import { LoadingOutlined } from '@ant-design/icons-vue';

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

const props = defineProps<{
  /** 当前选中值（v-model） */
  modelValue?: string;
  /** 列定义 */
  columns: SearchSelectColumn[];
  /** 远程搜索函数：传入关键字，返回数据源数组（对象 key 对应 columns.dataIndex） */
  search: (keyword: string) => Promise<Record<string, any>[]>;
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
  (e: 'update:modelValue', val: string): void;
  (e: 'select', record: Record<string, any>): void;
}>();

const inputValue = ref(props.modelValue ?? '');
watch(
  () => props.modelValue,
  (v) => {
    if (v !== inputValue.value) inputValue.value = v ?? '';
  }
);

const valueField = computed(() => props.valueField || props.columns[0]?.dataIndex || '');
const displayData = ref<Record<string, any>[]>([]);
const loading = ref(false);
const scrolledX = ref(false);

// a-auto-complete 需要非空 options 才会渲染下拉，这里用显示数据同步生成
const options = computed(() =>
  displayData.value.map((d) => ({
    value: String(d[valueField.value] ?? ''),
    label: String(d[valueField.value] ?? ''),
  }))
);

const dropdownClassName = 'ss-search-dropdown';
const dropdownStyle = computed(() => ({ width: `${props.dropdownWidth ?? 560}px` }));
const scrollStyle = computed(() => ({
  width: `${props.dropdownWidth ?? 560}px`,
  maxWidth: 'calc(100vw - 48px)',
  maxHeight: `${props.maxHeight ?? 380}px`,
}));

function cellStyle(col: SearchSelectColumn) {
  const style: Record<string, string> = { minWidth: `${(col.width ?? 120)}px` };
  if (col.color) style.color = col.color;
  return style;
}

function rowKey(row: Record<string, any>, i: number) {
  return String(row[valueField.value] ?? i);
}

async function doSearch(kw: string) {
  if (!kw || !kw.trim()) {
    displayData.value = [];
    scrolledX.value = false;
    return;
  }
  loading.value = true;
  scrolledX.value = false;
  try {
    const data = await props.search(kw.trim());
    displayData.value = Array.isArray(data) ? data : [];
  } catch {
    displayData.value = [];
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = debounce(doSearch, props.debounceTime ?? 300);

function onSearch(kw: string) {
  emit('update:modelValue', kw);
  debouncedSearch(kw);
}

function getPopupContainer() {
  return document.body;
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  scrolledX.value = el.scrollLeft > 0;
}

function applySelect(row: Record<string, any>) {
  const val = String(row[valueField.value] ?? '');
  inputValue.value = val;
  emit('update:modelValue', val);
  emit('select', row);
  // 选中后清空下拉数据，关闭面板
  displayData.value = [];
  scrolledX.value = false;
}

function onSelect(value: string) {
  const row = displayData.value.find((d) => String(d[valueField.value]) === String(value));
  if (row) applySelect(row);
}

function selectRow(row: Record<string, any>) {
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
