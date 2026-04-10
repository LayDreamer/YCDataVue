<template>
  <div class="product-header">
    <!-- 顶部标题区域 -->
    <div class="header-top">
      <div class="title-section">
        <div class="title-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 8H8V16H16V8Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 8L16 16" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 8L8 16" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="title-content">
          <h1 class="main-title">电磁阀测试数据</h1>
          <p class="sub-title">Current-Flow Characteristics</p>
        </div>
      </div>
      
      <!-- 右侧状态指示器 -->
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="status-text">实时数据</span>
      </div>
    </div>
    
    <!-- 关键信息展示 -->
    <div class="info-grid">
      <!-- 工单号卡片 -->
      <div class="info-card primary">
        <div class="info-card-header">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-card-label">工单号</span>
        </div>
        <div class="info-card-value">{{ workOrderNumber || 'N/A' }}</div>
        <div class="info-card-footer">
          <span class="info-card-badge">生产批次</span>
        </div>
      </div>
      
      <!-- 比例阀编号卡片 -->
      <div class="info-card secondary">
        <div class="info-card-header">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 8H19C20.1046 8 21 8.89543 21 10V14C21 15.1046 20.1046 16 19 16H17M17 8L7 8M17 8V16M17 16L7 16M7 8V16M7 8L5 8C3.89543 8 3 8.89543 3 10V14C3 15.1046 3.89543 16 5 16H7M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-card-label">比例阀编号</span>
        </div>
        <div class="info-card-value">{{ blfNumber || 'N/A' }}</div>
        <div class="info-card-footer">
          <span class="info-card-badge">设备标识</span>
        </div>
      </div>
      
      <!-- 数据统计卡片 -->
      <div class="info-card accent">
        <div class="info-card-header">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21H6.2C5.07989 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V3M7 11L11 7M11 7L15 11M11 7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-card-label">数据点数</span>
        </div>
        <div class="info-card-value">{{ dataPoints || '--' }}</div>
        <div class="info-card-footer">
          <span class="info-card-badge">测试记录</span>
        </div>
      </div>
      
      <!-- 测试时间卡片 -->
      <div class="info-card dark">
        <div class="info-card-header">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-card-label">测试时间</span>
        </div>
        <div class="info-card-value">{{ testTime || formatDate(new Date()) }}</div>
        <div class="info-card-footer">
          <span class="info-card-badge">最后更新</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  workOrderNumber?: string
  blfNumber?: string
  dataPoints?: number
  testTime?: string
}>()

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '')
}
</script>

<style scoped>
.product-header {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  padding: 32px 28px;
  border-radius: 16px;
  margin-bottom: 28px;
  box-shadow: 
    0 20px 40px rgba(30, 60, 114, 0.3),
    0 10px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

/* 背景装饰效果 */
.product-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

/* 顶部标题区域 */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
  background: linear-gradient(to right, #ffffff, #dbeafe);
  /* -webkit-background-clip: text; */
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sub-title {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.9;
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
}

/* 信息卡片通用样式 */
.info-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 24px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.info-card.primary::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.info-card.secondary::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.info-card.accent::before { background: linear-gradient(90deg, #10b981, #34d399); }
.info-card.dark::before { background: linear-gradient(90deg, #6b7280, #9ca3af); }

.info-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.info-card-icon {
  color: white;
  opacity: 0.9;
}

.info-card-label {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.info-card-value {
  font-size: 28px;
  font-weight: 700;
  margin: 8px 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.info-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-card-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  letter-spacing: 0.5px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .product-header {
    padding: 24px 20px;
    margin-bottom: 20px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .status-indicator {
    align-self: flex-end;
  }
  
  .main-title {
    font-size: 20px;
  }
  
  .sub-title {
    font-size: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-card {
    padding: 16px;
  }
  
  .info-card-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .product-header {
    padding: 20px 16px;
  }
  
  .title-section {
    gap: 12px;
  }
  
  .title-icon {
    padding: 10px;
  }
  
  .main-title {
    font-size: 18px;
  }
  
  .info-card-value {
    font-size: 20px;
  }
}
</style>