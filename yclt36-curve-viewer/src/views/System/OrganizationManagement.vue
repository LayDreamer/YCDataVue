<template>
  <div class="org-management-page">
    <a-card class="org-card" :bordered="false">
      <OrgUserSelector
        v-model:selectedUserIds="selectedRowKeys"
        :showSelectedTags="false"
        maxTableHeight="calc(100vh - 330px)"
        class="org-selector"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OrgUserSelector from '@/components/OrgUserSelector.vue'

const selectedRowKeys = ref<string[]>([])
</script>

<style scoped>
.org-management-page {
  min-height: 100%;
  padding: 16px;
  background-color: #f0f2f5;
  box-sizing: border-box;
}

.org-card {
  min-height: calc(100vh - 130px);
  border-radius: 4px;
}

.org-selector {
  height: calc(100vh - 210px);
  min-height: 500px;
}
</style>
