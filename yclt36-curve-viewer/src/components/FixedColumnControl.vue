<template>
  <div class="fixed-column-control">
    <a-tooltip title="固定列" placement="top">
      <PushpinOutlined class="pin-icon" />
    </a-tooltip>
    <a-select
      :value="modelValue"
      @update:value="handleChange"
      mode="multiple"
      :placeholder="placeholder"
      :options="columnOptions"
      :max-tag-count="maxTagCount"
      :style="{ minWidth: width }"
      :size="size"
      allow-clear
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PushpinOutlined } from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';

interface Props {
  /** 原始列配置 */
  columns: TableColumnsType;
  /** 当前选中的固定列 key 列表（v-model） */
  modelValue: string[];
  /** 占位提示文字 */
  placeholder?: string;
  /** Select 最小宽度 */
  width?: string;
  /** 标签最大显示数量 */
  maxTagCount?: number;
  /** 组件尺寸 */
  size?: 'small' | 'middle' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '选择左侧固定列',
  width: '200px',
  maxTagCount: 2,
  size: 'small',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

/** 从原始列配置提取选项列表 */
const columnOptions = computed(() =>
  props.columns.map((col) => ({
    label: (col.title as string) || '',
    value: ((col.key || (col as any).dataIndex) as string) || '',
  }))
);

function handleChange(value: string[]) {
  emit('update:modelValue', value);
}
</script>

<style scoped>
.fixed-column-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: #f0f5ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
}

.pin-icon {
  color: #1890ff;
  font-size: 14px;
}
</style>
