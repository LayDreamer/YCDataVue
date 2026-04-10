<template>
  <div class="control-panel">
    <h3 class="panel-title">
      <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      曲线控制
    </h3>
    
    <div class="curve-toggles">
      <label 
        v-for="curve in curves" 
        :key="curve.pressure"
        class="curve-toggle"
        :class="{ 'is-active': isVisible(curve.pressure) }"
      >
        <input 
          type="checkbox" 
          :checked="isVisible(curve.pressure)"
          @change="toggle(curve.pressure)"
          class="toggle-input"
        />
        <span 
          class="color-indicator" 
          :style="{ background: curve.color }"
        ></span>
        <span class="curve-name">{{ curve.name }}</span>
      </label>
    </div>
    
    <div class="panel-tips">
      <h4>使用提示</h4>
      <ul>
        <li>点击曲线可显示/隐藏对应压力数据</li>
        <li>使用鼠标滚轮缩放查看细节</li>
        <li>拖拽图表可平移视图</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PressureCurve } from '@/types'

/**
 * 控制面板组件属性
 */
interface Props {
  curves: PressureCurve[]
  isVisible: (pressure: number) => boolean
  toggle: (pressure: number) => void
}

defineProps<Props>()
</script>

<style scoped>
.control-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.title-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  color: #3b82f6;
}

.curve-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.curve-toggle {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.curve-toggle:hover {
  background: #f8fafc;
}

.curve-toggle.is-active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.toggle-input {
  display: none;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 12px;
  transition: transform 0.2s ease;
}

.curve-toggle:hover .color-indicator {
  transform: scale(1.1);
}

.curve-name {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.panel-tips {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
}

.panel-tips h4 {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.panel-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.panel-tips li {
  font-size: 12px;
  color: #64748b;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.panel-tips li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .control-panel {
    padding: 16px;
  }
}
</style>
