<template>
  <div class="ep-test-container">
    <a-page-header title="外产领料 / 入库 测试" sub-title="用于测试外产领料与外产入库的新增、删除接口" />

    <a-row :gutter="[16, 16]">
      <!-- 外产领料 -->
      <a-col :xs="24" :md="12">
        <a-card title="外产领料" :bordered="false">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="openAdd('pick')">
                <PlusOutlined /> 新增
              </a-button>
              <a-button danger @click="openDelete('pick')">
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
          <a-empty description="点击「新增」创建一条外产领料记录" />
        </a-card>
      </a-col>

      <!-- 外产入库 -->
      <a-col :xs="24" :md="12">
        <a-card title="外产入库" :bordered="false">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="openAdd('warehousing')">
                <PlusOutlined /> 新增
              </a-button>
              <a-button danger @click="openDelete('warehousing')">
                <DeleteOutlined /> 删除
              </a-button>
            </a-space>
          </template>
          <a-empty description="点击「新增」创建一条外产入库记录" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增弹窗 -->
    <a-modal
      v-model:visible="addVisible"
      :title="addType === 'pick' ? '新增外产领料' : '新增外产入库'"
      @ok="handleAdd"
      @cancel="addVisible = false"
      :confirm-loading="addLoading"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="合同号">
          <a-input v-model:value="addForm.合同号" placeholder="请输入合同号" />
        </a-form-item>
        <a-form-item label="货号">
          <a-input v-model:value="addForm.货号" placeholder="请输入货号" />
        </a-form-item>
        <a-form-item label="排产编号">
          <a-input v-model:value="addForm.排产编号" placeholder="请输入排产编号" />
        </a-form-item>
        <a-form-item label="需求量">
          <a-input v-model:value="addForm.需求量" placeholder="请输入需求量" />
        </a-form-item>
        <a-form-item :label="addType === 'pick' ? '出库数量' : '入库数量'">
          <a-input v-model:value="addForm.qty" placeholder="请输入数量" />
        </a-form-item>
        <a-form-item label="关联编号">
          <a-input v-model:value="addForm.关联编号" placeholder="请输入关联编号" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除弹窗 -->
    <a-modal
      v-model:visible="deleteVisible"
      :title="deleteType === 'pick' ? '删除外产领料' : '删除外产入库'"
      @ok="handleDelete"
      @cancel="deleteVisible = false"
      :confirm-loading="deleteLoading"
      ok-text="删除"
      ok-type="danger"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="deleteType === 'pick' ? '领料编号' : '入库编号'" required>
          <a-input v-model:value="deleteId" placeholder="请输入要删除的记录编号" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import {
  ExternalProductionPickMaterial,
  ExternalProductionWarehousing,
} from '@/api-generated/api'
import { externalProductionService } from '@/services/externalProductionService'

type EpType = 'pick' | 'warehousing'

const addVisible = ref(false)
const addType = ref<EpType>('pick')
const addLoading = ref(false)
const addForm = reactive({
  合同号: '',
  货号: '',
  排产编号: '',
  需求量: '',
  qty: '',
  关联编号: '',
})

const deleteVisible = ref(false)
const deleteType = ref<EpType>('pick')
const deleteLoading = ref(false)
const deleteId = ref('')

function resetAddForm() {
  Object.assign(addForm, {
    合同号: '',
    货号: '',
    排产编号: '',
    需求量: '',
    qty: '',
    关联编号: '',
  })
}

function openAdd(type: EpType) {
  addType.value = type
  resetAddForm()
  addVisible.value = true
}

function openDelete(type: EpType) {
  deleteType.value = type
  deleteId.value = ''
  deleteVisible.value = true
}

async function handleAdd() {
  addLoading.value = true
  try {
    if (addType.value === 'pick') {
      const item = new ExternalProductionPickMaterial({
        合同号: addForm.合同号,
        货号: addForm.货号,
        排产编号: addForm.排产编号,
        需求量: addForm.需求量,
        出库数量: addForm.qty,
        关联编号: addForm.关联编号,
      })
      await externalProductionService.addOrUpdateExternalProductionPickMaterialList([item])
      message.success('外产领料新增成功')
    } else {
      const item = new ExternalProductionWarehousing({
        合同号: addForm.合同号,
        货号: addForm.货号,
        排产编号: addForm.排产编号,
        需求量: addForm.需求量,
        入库数量: addForm.qty,
        关联编号: addForm.关联编号,
      })
      await externalProductionService.addOrUpdateExternalProductionWarehousingList([item])
      message.success('外产入库新增成功')
    }
    addVisible.value = false
  } catch (error) {
    message.error((error as Error).message || '新增失败')
  } finally {
    addLoading.value = false
  }
}

async function handleDelete() {
  if (!deleteId.value) {
    message.warning('请输入要删除的记录编号')
    return
  }
  deleteLoading.value = true
  try {
    const ids = [deleteId.value]
    if (deleteType.value === 'pick') {
      await externalProductionService.deleteExternalProductionPickMaterialList(ids)
      message.success('外产领料删除成功')
    } else {
      await externalProductionService.deleteExternalProductionWarehousingList(ids)
      message.success('外产入库删除成功')
    }
    deleteVisible.value = false
  } catch (error) {
    message.error((error as Error).message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
.ep-test-container {
  padding: 16px;
}
</style>
