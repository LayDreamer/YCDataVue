<template>
  <div class="table-column-settings">
    <a-tooltip title="刷新">
      <a-button
        type="text"
        size="small"
        class="settings-trigger"
        aria-label="刷新表格"
        :loading="loading"
        @click="handleRefresh"
      >
        <template #icon>
          <ReloadOutlined />
        </template>
      </a-button>
    </a-tooltip>
    <a-tooltip :title="fullscreenTooltip">
      <a-button
        type="text"
        size="small"
        class="settings-trigger"
        :aria-label="fullscreenTooltip"
        @click="handleFullscreen"
      >
        <template #icon>
          <FullscreenExitOutlined v-if="fullscreen" />
          <FullscreenOutlined v-else />
        </template>
      </a-button>
    </a-tooltip>
    <a-popover
      v-model:open="visible"
      placement="bottomRight"
      trigger="click"
      overlay-class-name="column-settings-popover"
      :overlay-style="{ width: '280px' }"
    >
      <template #content>
        <div class="column-settings-panel">
          <div class="settings-header">
            <a-checkbox v-model:checked="allChecked" :indeterminate="isIndeterminate"> 全部 </a-checkbox>
          </div>
          <div class="settings-list">
            <div
              v-for="(item, index) in draftList"
              :key="item.key"
              class="settings-item"
              :class="{
                dragging: dragIndex === index,
                'drag-over': dragOverIndex === index,
                disabled: !item.visible
              }"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent="handleDragOver($event, index)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, index)"
              @dragend="handleDragEnd"
            >
              <MenuOutlined class="drag-handle" />
              <a-checkbox v-model:checked="item.visible" class="item-checkbox" />
              <span class="item-title" :title="item.title">{{ item.title }}</span>
              <div class="item-actions">
                <PushpinOutlined
                  class="pin-btn pin-left"
                  :class="{ active: item.fixed === 'left' }"
                  title="固定在左侧"
                  @click="setFixed(item, 'left')"
                />
                <PushpinOutlined
                  class="pin-btn pin-right"
                  :class="{ active: item.fixed === 'right' }"
                  title="固定在右侧"
                  @click="setFixed(item, 'right')"
                />
              </div>
            </div>
          </div>
          <div class="settings-footer">
            <a-button type="link" danger size="small" @click="clearCache">恢复默认</a-button>
            <a-button size="small" @click="cancel">取消</a-button>
            <a-button type="primary" size="small" @click="confirm">确认</a-button>
          </div>
        </div>
      </template>
      <a-tooltip title="列设置">
        <a-button type="text" size="small" class="settings-trigger">
          <template #icon>
            <SettingOutlined />
          </template>
        </a-button>
      </a-tooltip>
    </a-popover>
  </div>

  <!-- 全屏遮罩：统一模糊背景效果，由 fullscreen 状态控制 -->
  <teleport to="body">
    <div v-if="fullscreen && overlay" class="table-fullscreen-overlay"></div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  SettingOutlined,
  MenuOutlined,
  PushpinOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

export interface ColumnSetting {
  key: string;
  title: string;
  visible: boolean;
  fixed?: 'left' | 'right';
}

interface Props {
  /** 原始列配置 */
  columns: TableColumnType[];
  /** 当前列设置（v-model） */
  modelValue?: ColumnSetting[];
  /** localStorage 缓存 key，为空则不持久化 */
  storageKey?: string;
  /** 刷新按钮 loading 状态 */
  loading?: boolean;
  /** 全屏状态（v-model:fullscreen），控制全屏切换与遮罩 */
  fullscreen?: boolean;
  /** 是否渲染全屏遮罩，默认 true；抽屉内等场景可关闭以使用自身遮罩 */
  overlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  loading: false,
  fullscreen: false,
  overlay: true
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: ColumnSetting[]): void;
  (e: 'change', value: ColumnSetting[]): void;
  (e: 'refresh'): void;
  (e: 'update:fullscreen', value: boolean): void;
}>();

const fullscreenTooltip = computed(() => (props.fullscreen ? '退出全屏（Esc）' : '全屏'));

const visible = ref(false);
const draftList = ref<ColumnSetting[]>([]);
const dragIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

/** 根据原始列生成默认设置 */
function buildDefaultSettings(columns: TableColumnType[]): ColumnSetting[] {
  return columns.map((col) => {
    const key = (col.key as string) || (typeof col.dataIndex === 'string' ? col.dataIndex : '') || '';
    const title = (col.title as string) || key;
    const fixed = (col.fixed as 'left' | 'right' | undefined) || undefined;
    return { key, title, visible: true, fixed };
  });
}

/** 读取本地持久化配置 */
function readStorage(): ColumnSetting[] | null {
  if (!props.storageKey) return null;
  try {
    const raw = localStorage.getItem(props.storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 写入本地持久化配置 */
function writeStorage(value: ColumnSetting[]) {
  if (!props.storageKey) return;
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** 合并默认设置与已保存设置（兼容列增删） */
function mergeSettings(defaults: ColumnSetting[], saved: ColumnSetting[] | null): ColumnSetting[] {
  if (!saved || saved.length === 0) return defaults;
  const savedMap = new Map(saved.map((s) => [s.key, s]));
  const result: ColumnSetting[] = [];

  // 按保存顺序遍历，只保留仍存在的列
  saved.forEach((s) => {
    const def = defaults.find((d) => d.key === s.key);
    if (def) {
      result.push({
        ...def,
        visible: s.visible !== undefined ? s.visible : def.visible,
        fixed: s.fixed !== undefined ? s.fixed : def.fixed
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

function getInitialSettings(): ColumnSetting[] {
  const defaults = buildDefaultSettings(props.columns);
  const saved = readStorage();
  return mergeSettings(defaults, saved);
}

/** 弹窗打开时初始化草稿 */
watch(visible, (val) => {
  if (val) {
    draftList.value = JSON.parse(JSON.stringify(props.modelValue?.length ? props.modelValue : getInitialSettings()));
  }
});

const isIndeterminate = computed(
  () => draftList.value.some((i) => i.visible) && draftList.value.some((i) => !i.visible)
);

// “全部”复选框：get 跟随草稿状态，set 只在用户点击时统一切换所有列
const allChecked = computed({
  get: () => draftList.value.length > 0 && draftList.value.every((i) => i.visible),
  set: (val: boolean) => {
    draftList.value.forEach((item) => (item.visible = val));
  }
});

function setFixed(item: ColumnSetting, direction: 'left' | 'right') {
  item.fixed = item.fixed === direction ? undefined : direction;
}

function handleDragStart(e: DragEvent, index: number) {
  dragIndex.value = index;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }
}

function handleDragOver(_e: DragEvent, index: number) {
  dragOverIndex.value = index;
}

function handleDragLeave() {
  dragOverIndex.value = null;
}

function handleDrop(e: DragEvent, index: number) {
  e.preventDefault();
  const fromIndex = dragIndex.value;
  if (fromIndex === null || fromIndex === index) return;
  const item = draftList.value.splice(fromIndex, 1)[0];
  draftList.value.splice(index, 0, item);
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

function confirm() {
  const result = JSON.parse(JSON.stringify(draftList.value));
  emit('update:modelValue', result);
  emit('change', result);
  writeStorage(result);
  visible.value = false;
}

function handleRefresh() {
  emit('refresh');
}

function handleFullscreen() {
  emit('update:fullscreen', !props.fullscreen);
}

function cancel() {
  visible.value = false;
}

function clearCache() {
  if (props.storageKey) {
    try {
      localStorage.removeItem(props.storageKey);
    } catch {
      // ignore
    }
  }
  draftList.value = buildDefaultSettings(props.columns);
}
</script>

<style scoped>
.table-column-settings {
  display: inline-flex;
  gap: 8px;
}

.settings-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #595959;
}

.settings-trigger:hover {
  color: #1890ff;
  background: #f0f5ff;
}

/* 全屏统一遮罩：半透明黑色 + 背景模糊，覆盖整个视口 */
.table-fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 998;
  pointer-events: none;
}

.settings-header {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.settings-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 0;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: move;
  transition: background 0.15s;
}

.settings-item:hover {
  background: #f5f5f5;
}

.settings-item.dragging {
  opacity: 0.5;
}

.settings-item.drag-over {
  background: #e6f7ff;
  border-top: 2px solid #1890ff;
}

.settings-item.disabled .item-title {
  color: #bfbfbf;
}

.drag-handle {
  color: #bfbfbf;
  font-size: 12px;
  cursor: grab;
}

.settings-item:hover .drag-handle {
  color: #8c8c8c;
}

.item-checkbox {
  flex-shrink: 0;
}

.item-title {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #262626;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pin-btn {
  font-size: 14px;
  color: #bfbfbf;
  cursor: pointer;
  transition: color 0.2s;
}

.pin-btn:hover {
  color: #1890ff;
}

.pin-btn.active {
  color: #1890ff;
}

.pin-left {
  transform: rotate(-45deg);
}

.pin-right {
  transform: rotate(45deg);
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
