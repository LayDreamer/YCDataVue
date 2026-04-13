<template>
  <div class="config-container">
    <a-card title="系统配置">
      <a-form layout="vertical">
        <a-form-item label="系统名称">
          <a-input placeholder="请输入系统名称" />
        </a-form-item>
        <a-form-item label="系统版本">
          <a-input placeholder="请输入系统版本" />
        </a-form-item>
        <a-form-item label="API地址">
          <a-input placeholder="请输入API地址" />
        </a-form-item>
        <a-form-item label="超时设置">
          <a-input-number placeholder="请输入超时时间（秒）" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary">保存配置</a-button>
          <a-button style="margin-left: 8px">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
// 系统配置页面逻辑
</script>

<style scoped>
.config-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
</style>