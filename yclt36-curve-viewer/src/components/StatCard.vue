<template>
  <a-card :class="['stat-card', `stat-card-${type}`]" :bordered="false" hoverable>
    <a-statistic 
      :title="title" 
      :value="value" 
      :prefix="prefix" 
      :value-style="{ color: '#ffffff' }"
      :title-style="{ color: 'rgba(255, 255, 255, 0.9)' }"
      animation
    />
    <div class="stat-card-icon">{{ prefix }}</div>
  </a-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  prefix: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.stat-card {
  text-align: center;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  padding: 32px 24px;
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
}
.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0,0,0,0.18);
}
.stat-card-user {
  background: linear-gradient(135deg, #1890ff, #69c0ff);
}
.stat-card-order {
  background: linear-gradient(135deg, #52c41a, #95de64);
}
.stat-card-income {
  background: linear-gradient(135deg, #faad14, #ffd666);
}
.stat-card-visit {
  background: linear-gradient(135deg, #722ed1, #b37feb);
}
.stat-card-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 48px;
  opacity: 0.2;
  transition: all 0.3s ease;
}
.stat-card:hover .stat-card-icon {
  transform: scale(1.1) rotate(5deg);
  opacity: 0.3;
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>