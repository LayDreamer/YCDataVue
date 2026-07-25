<template>
  <div class="ep-test-container">
    <a-page-header title="PMC测试" sub-title="用于测试数据库表的新增、删除接口">
      <template #extra>
        <a-button danger :loading="clearAllTablesLoading" @click="clearAllTables">
          <ClearOutlined /> 一键清除全部数据
        </a-button>
      </template>
    </a-page-header>

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
              <a-button danger @click="clearAll('pick')" :loading="clearLoading.pick">
                <ClearOutlined /> 清空全部
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
              <a-button danger @click="clearAll('warehousing')" :loading="clearLoading.warehousing">
                <ClearOutlined /> 清空全部
              </a-button>
            </a-space>
          </template>
          <a-empty description="点击「新增」创建一条外产入库记录" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 外产BOM -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="外产BOM" :bordered="false">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="fetchBomList" :loading="bomLoading">
                <ReloadOutlined /> 获取外产BOM数据
              </a-button>
              <a-button danger @click="clearAllBom" :loading="clearBomLoading">
                <ClearOutlined /> 清除所有外产BOM
              </a-button>
            </a-space>
          </template>
          <a-table
            :columns="bomColumns"
            :data-source="bomList"
            :loading="bomLoading"
            row-key="编号"
            size="small"
            bordered
            :scroll="{ x: 'max-content' }"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 工单销控表查询 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :md="12">
        <a-card title="工单销控表" :bordered="false">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="fetchWorkOrderSalesControl" :loading="workOrderLoading">
                <ReloadOutlined /> 获取所有工单销控表
              </a-button>
              <a-button danger @click="openDelete('workOrder')">
                <DeleteOutlined /> 删除
              </a-button>
              <a-button danger @click="clearAllWorkOrder" :loading="clearLoading.workOrder">
                <ClearOutlined /> 清空全部
              </a-button>
            </a-space>
          </template>
          <a-table
            :columns="workOrderColumns"
            :data-source="workOrderList"
            :loading="workOrderLoading"
            row-key="编号"
            size="small"
            bordered
            :scroll="{ x: 'max-content' }"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
          />
        </a-card>
      </a-col>

      <a-col :xs="24" :md="12">
        <a-card title="工单销控表明细" :bordered="false">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="fetchWorkOrderSalesControlDetail" :loading="workOrderDetailLoading">
                <ReloadOutlined /> 获取所有工单销控表明细
              </a-button>
              <a-button danger @click="openDelete('workOrderDetail')">
                <DeleteOutlined /> 删除
              </a-button>
              <a-button danger @click="clearAllWorkOrderDetail" :loading="clearLoading.workOrderDetail">
                <ClearOutlined /> 清空全部
              </a-button>
            </a-space>
          </template>
          <a-table
            :columns="workOrderDetailColumns"
            :data-source="workOrderDetailList"
            :loading="workOrderDetailLoading"
            row-key="编号"
            size="small"
            bordered
            :scroll="{ x: 'max-content' }"
            :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增弹窗 -->
    <a-modal
      v-model:open="addVisible"
      :title="addType === 'pick' ? '新增外产领料' : '新增外产入库'"
      @ok="handleAdd"
      @cancel="addVisible = false"
      :confirm-loading="addLoading"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="编号" required>
          <a-input v-model:value="addForm.编号" placeholder="请输入编号" />
        </a-form-item>
        <a-form-item :label="addType === 'pick' ? '出库数量' : '入库数量'" required>
          <a-input v-model:value="addForm.qty" placeholder="请输入数量" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除弹窗 -->
    <a-modal
      v-model:open="deleteVisible"
      :title="deleteType === 'pick' ? '删除外产领料' : deleteType === 'warehousing' ? '删除外产入库' : deleteType === 'workOrder' ? '删除工单销控表' : '删除工单销控表明细'"
      @ok="handleDelete"
      @cancel="deleteVisible = false"
      :confirm-loading="deleteLoading"
      ok-text="删除"
      ok-type="danger"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="deleteType === 'pick' ? '领料编号' : deleteType === 'warehousing' ? '入库编号' : '记录编号'" required>
          <a-input v-model:value="deleteId" placeholder="请输入要删除的记录编号" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import {
  ExternalProductionPickMaterial,
  ExternalProductionWarehousing,
  ExternalProductionBOM,
  PMCRequestDto,
} from '@/api-generated/api'
import { externalProductionService } from '@/services/externalProductionService'
import { workOrderSalesControlService } from '@/services/workOrderSalesControlService'

type EpType = 'pick' | 'warehousing'
type DeleteType = 'pick' | 'warehousing' | 'workOrder' | 'workOrderDetail'

const addVisible = ref(false)
const addType = ref<EpType>('pick')
const addLoading = ref(false)
const addForm = reactive({
  编号: '',
  qty: '',
})

const deleteVisible = ref(false)
const deleteType = ref<DeleteType>('pick')
const deleteLoading = ref(false)
const deleteId = ref('')

const clearLoading = reactive({
  pick: false,
  warehousing: false,
  workOrder: false,
  workOrderDetail: false,
})
const clearAllTablesLoading = ref(false)

// ==================== 外产BOM ====================
const bomLoading = ref(false)
const clearBomLoading = ref(false)
const bomList = ref<ExternalProductionBOM[]>([])

const bomColumns = [
  { title: '编号', dataIndex: '编号', key: '编号', width: 160 },
  { title: '货号', dataIndex: '货号', key: '货号', width: 120 },
  { title: '层', dataIndex: '层', key: '层', width: 60 },
  { title: '品名', dataIndex: '品名', key: '品名', width: 140 },
  { title: '规格', dataIndex: '规格', key: '规格', width: 140 },
  { title: '用量', dataIndex: '用量', key: '用量', width: 80 },
  { title: '仓库名称', dataIndex: '仓库名称', key: '仓库名称', width: 120 },
  { title: '仓库数', dataIndex: '仓库数', key: '仓库数', width: 80 },
  { title: '生产数', dataIndex: '生产数', key: '生产数', width: 80 },
  { title: '关联编号', dataIndex: '关联编号', key: '关联编号', width: 140 },
  { title: '父级编号', dataIndex: '父级编号', key: '父级编号', width: 140 },
  { title: '分析单号', dataIndex: '分析单号', key: '分析单号', width: 140 },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期', width: 120 },
  { title: '创建时间', dataIndex: '创建时间', key: '创建时间', width: 160 },
]

async function fetchBomList() {
  bomLoading.value = true
  try {
    const list = await externalProductionService.getExternalProductionBOMList()
    bomList.value = list || []
    message.success(`获取外产BOM数据成功，共 ${bomList.value.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '获取外产BOM数据失败')
  } finally {
    bomLoading.value = false
  }
}

// 清除所有外产BOM：先查询列表拿到所有编号，再批量删除
async function clearAllBom() {
  clearBomLoading.value = true
  try {
    const list = await externalProductionService.getExternalProductionBOMList()
    const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
    if (ids.length === 0) {
      message.info('外产BOM暂无数据')
      return
    }
    await externalProductionService.deleteExternalProductionBOMList(ids)
    bomList.value = []
    message.success(`已清除外产BOM ${ids.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '清除外产BOM失败')
  } finally {
    clearBomLoading.value = false
  }
}

// ==================== 工单销控表 ====================
const workOrderLoading = ref(false)
const workOrderList = ref<any[]>([])

const workOrderColumns = [
  { title: '编号', dataIndex: '编号', key: '编号', width: 160 },
  { title: '货号', dataIndex: '货号', key: '货号', width: 120 },
  { title: '品名', dataIndex: '品名', key: '品名', width: 140 },
  { title: '规格', dataIndex: '规格', key: '规格', width: 140 },
  { title: '工单总数', dataIndex: '工单总数', key: '工单总数', width: 90 },
  { title: '已入库数', dataIndex: '已入库数', key: '已入库数', width: 90 },
  { title: '在产数量', dataIndex: '在产数量', key: '在产数量', width: 90 },
  { title: '分析单号', dataIndex: '分析单号', key: '分析单号', width: 160 },
]

async function fetchWorkOrderSalesControl() {
  workOrderLoading.value = true
  try {
    const list = await workOrderSalesControlService.getWorkOrderSalesControlList()
    workOrderList.value = list || []
    message.success(`获取工单销控表成功，共 ${workOrderList.value.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '获取工单销控表失败')
  } finally {
    workOrderLoading.value = false
  }
}

// ==================== 工单销控表明细 ====================
const workOrderDetailLoading = ref(false)
const workOrderDetailList = ref<any[]>([])

const workOrderDetailColumns = [
  { title: '编号', dataIndex: '编号', key: '编号', width: 160 },
  { title: '货号', dataIndex: '货号', key: '货号', width: 120 },
  { title: '工单单号', dataIndex: '工单单号', key: '工单单号', width: 140 },
  { title: '交货日期', dataIndex: '交货日期', key: '交货日期', width: 120 },
  { title: '生产数', dataIndex: '生产数', key: '生产数', width: 90 },
  { title: '入库数', dataIndex: '入库数', key: '入库数', width: 90 },
  { title: '待产数', dataIndex: '待产数', key: '待产数', width: 90 },
  { title: '关联编号', dataIndex: '关联编号', key: '关联编号', width: 140 },
]

async function fetchWorkOrderSalesControlDetail() {
  workOrderDetailLoading.value = true
  try {
    const list = await workOrderSalesControlService.getWorkOrderSalesControlDetailList(new PMCRequestDto())
    workOrderDetailList.value = list || []
    message.success(`获取工单销控表明细成功，共 ${workOrderDetailList.value.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '获取工单销控表明细失败')
  } finally {
    workOrderDetailLoading.value = false
  }
}

function resetAddForm() {
  Object.assign(addForm, {
    编号: '',
    qty: '',
  })
}

function openAdd(type: EpType) {
  addType.value = type
  resetAddForm()
  addVisible.value = true
}

function openDelete(type: DeleteType) {
  deleteType.value = type
  deleteId.value = ''
  deleteVisible.value = true
}

async function handleAdd() {
  if (!addForm.编号) {
    message.warning('请输入编号')
    return
  }
  if (!addForm.qty) {
    message.warning('请输入数量')
    return
  }
  addLoading.value = true
  try {
    if (addType.value === 'pick') {
      const item = new ExternalProductionPickMaterial({
        编号: addForm.编号,
        出库数量: addForm.qty,
      })
      await externalProductionService.addOrUpdateExternalProductionPickMaterialList([item])
      message.success('外产领料新增成功')
    } else {
      const item = new ExternalProductionWarehousing({
        编号: addForm.编号,
        入库数量: addForm.qty,
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
    } else if (deleteType.value === 'warehousing') {
      await externalProductionService.deleteExternalProductionWarehousingList(ids)
      message.success('外产入库删除成功')
    } else if (deleteType.value === 'workOrder') {
      await workOrderSalesControlService.deleteWorkOrderSalesControlList(ids)
      workOrderList.value = workOrderList.value.filter((i: any) => i.编号 !== deleteId.value)
      message.success('工单销控表删除成功')
    } else if (deleteType.value === 'workOrderDetail') {
      await workOrderSalesControlService.deleteWorkOrderSalesControlDetailList(ids)
      workOrderDetailList.value = workOrderDetailList.value.filter((i: any) => i.编号 !== deleteId.value)
      message.success('工单销控表明细删除成功')
    }
    deleteVisible.value = false
  } catch (error) {
    message.error((error as Error).message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 清空某类全部数据：先查询列表拿到所有编号，再批量删除
async function clearAll(type: EpType) {
  clearLoading[type] = true
  try {
    if (type === 'pick') {
      const list = await externalProductionService.getExternalProductionPickMaterialList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length === 0) {
        message.info('外产领料暂无数据')
        return
      }
      await externalProductionService.deleteExternalProductionPickMaterialList(ids)
      message.success(`已清空外产领料 ${ids.length} 条`)
    } else {
      const list = await externalProductionService.getExternalProductionWarehousingList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length === 0) {
        message.info('外产入库暂无数据')
        return
      }
      await externalProductionService.deleteExternalProductionWarehousingList(ids)
      message.success(`已清空外产入库 ${ids.length} 条`)
    }
  } catch (error) {
    message.error((error as Error).message || '清空失败')
  } finally {
    clearLoading[type] = false
  }
}

// 清空工单销控表：先查询列表拿到所有编号，再批量删除
async function clearAllWorkOrder() {
  clearLoading.workOrder = true
  try {
    const list = await workOrderSalesControlService.getWorkOrderSalesControlList()
    const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
    if (ids.length === 0) {
      message.info('工单销控表暂无数据')
      return
    }
    await workOrderSalesControlService.deleteWorkOrderSalesControlList(ids)
    workOrderList.value = []
    message.success(`已清空工单销控表 ${ids.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '清空工单销控表失败')
  } finally {
    clearLoading.workOrder = false
  }
}

// 清空工单销控表明细：先查询列表拿到所有编号，再批量删除
async function clearAllWorkOrderDetail() {
  clearLoading.workOrderDetail = true
  try {
    const list = await workOrderSalesControlService.getWorkOrderSalesControlDetailList(new PMCRequestDto())
    const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
    if (ids.length === 0) {
      message.info('工单销控表明细暂无数据')
      return
    }
    await workOrderSalesControlService.deleteWorkOrderSalesControlDetailList(ids)
    workOrderDetailList.value = []
    message.success(`已清空工单销控表明细 ${ids.length} 条`)
  } catch (error) {
    message.error((error as Error).message || '清空工单销控表明细失败')
  } finally {
    clearLoading.workOrderDetail = false
  }
}

// 一键清除全部5张表数据
async function clearAllTables() {
  clearAllTablesLoading.value = true
  try {
    let totalDeleted = 0
    const results: string[] = []

    // 1. 外产领料
    try {
      const list = await externalProductionService.getExternalProductionPickMaterialList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length > 0) {
        await externalProductionService.deleteExternalProductionPickMaterialList(ids)
        totalDeleted += ids.length
        results.push(`外产领料 ${ids.length} 条`)
      }
    } catch { /* 继续清理其他表 */ }

    // 2. 外产入库
    try {
      const list = await externalProductionService.getExternalProductionWarehousingList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length > 0) {
        await externalProductionService.deleteExternalProductionWarehousingList(ids)
        totalDeleted += ids.length
        results.push(`外产入库 ${ids.length} 条`)
      }
    } catch { /* 继续清理其他表 */ }

    // 3. 外产BOM
    try {
      const list = await externalProductionService.getExternalProductionBOMList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length > 0) {
        await externalProductionService.deleteExternalProductionBOMList(ids)
        totalDeleted += ids.length
        results.push(`外产BOM ${ids.length} 条`)
      }
    } catch { /* 继续清理其他表 */ }

    // 4. 工单销控表
    try {
      const list = await workOrderSalesControlService.getWorkOrderSalesControlList()
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length > 0) {
        await workOrderSalesControlService.deleteWorkOrderSalesControlList(ids)
        totalDeleted += ids.length
        results.push(`工单销控表 ${ids.length} 条`)
      }
    } catch { /* 继续清理其他表 */ }

    // 5. 工单销控表明细
    try {
      const list = await workOrderSalesControlService.getWorkOrderSalesControlDetailList(new PMCRequestDto())
      const ids = (list || []).map((i: any) => i.编号).filter(Boolean)
      if (ids.length > 0) {
        await workOrderSalesControlService.deleteWorkOrderSalesControlDetailList(ids)
        totalDeleted += ids.length
        results.push(`工单销控表明细 ${ids.length} 条`)
      }
    } catch { /* 完成 */ }

    // 清空本地列表
    bomList.value = []
    workOrderList.value = []
    workOrderDetailList.value = []

    if (totalDeleted === 0) {
      message.info('所有5张表暂无数据')
    } else {
      message.success(`已一键清除全部数据，共删除 ${totalDeleted} 条：${results.join('、')}`)
    }
  } catch (error) {
    message.error((error as Error).message || '一键清除失败，部分数据可能未清理完成')
  } finally {
    clearAllTablesLoading.value = false
  }
}
</script>

<style scoped>
.ep-test-container {
  padding: 16px;
}
</style>
