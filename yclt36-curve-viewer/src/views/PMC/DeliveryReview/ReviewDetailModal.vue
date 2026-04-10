<template>
  <a-modal
    :visible="visible"
    @update:visible="handleVisibleUpdate"
    title="交期详细评审"
    :width="modalWidth"
    wrapClassName="review-detail-modal-wrap"
    :style="modalStyle"
    @ok="submitReview"
    :confirm-loading="confirmLoading"
    ok-text="提交评审结果"
    cancel-text="取消"
  >
    <a-row :gutter="[16, 16]">
      <!-- 左侧区域：基础资料 + BOM核对 -->
      <a-col :xs="24" :lg="16">
        <!-- 基础资料卡片 -->
        <a-card title="基础资料" :bordered="false" class="mb-16">
          <a-descriptions :column="{ xs: 1, sm: 2 }" bordered size="small">
            <!-- 字段名改为中文字段 -->
            <a-descriptions-item label="排产编号">
              <span class="copyable-text">{{ record?.排产编号 || '--' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="分析单号">{{ record?.分析单号 || '--' }}</a-descriptions-item>
            <a-descriptions-item label="货号">{{ record?.货号 || '--' }}</a-descriptions-item>
            <a-descriptions-item label="线圈货号">{{ record?.线圈货号 || '--' }}</a-descriptions-item>
            <a-descriptions-item label="中文品名">{{ record?.中文品名 || '--' }}</a-descriptions-item>
            <a-descriptions-item label="电压">{{ record?.电压 || '--' }}</a-descriptions-item>
            <a-descriptions-item label="交货日期">
              {{ record?.交货日期 || '--' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- BOM 表单核对卡片 -->
        <a-card title="BOM一级物料确认" :bordered="false" class="mb-16">
          <div class="bom-table-wrap">
            <a-table 
              :columns="bomColumns" 
              :data-source="bomData" 
              :pagination="false" 
              :size="bomTableSize"
              row-key="partNo"
              :loading="bomLoading"
              :scroll="{ x: 'max-content' }"
            >
               <!--<template #bodyCell="{ column, record }">
            <template v-if="column.key === 'confirm'">
                <a-checkbox v-model:checked="record.isConfirmed"></a-checkbox>
              </template> 
            </template>-->
            </a-table>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧区域：核心校验 + 评审结论 -->
      <a-col :xs="24" :lg="8">
        <!-- 核心要素校验卡片 -->
        <a-card title="核心要素校验" :bordered="false" class="mb-16 shadow-card">
          <a-form layout="vertical">
            <a-form-item label="线圈货号确认" required>
              <a-input-search
                v-model:value="reviewForm.coilItemNo"
                placeholder="请输入线圈货号进行系统反查"
                enter-button="校验"
                :loading="validatingCoil"
                @search="validateCoil"
              />
              <div v-if="verifyStatus !== 'none'" class="verify-result">
                <a-alert 
                  v-if="verifyStatus === 'success'" 
                  message="校验通过：该线圈货号匹配正确" 
                  type="success" 
                  show-icon 
                  size="small"
                />
                <a-alert
                  v-if="verifyStatus === 'error'" 
                  message="匹配失败：未匹配到相关线圈货号" 
                  type="error" 
                  show-icon 
                  size="small"
                />
              </div>
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 评审结论卡片 -->
        <a-card title="评审结论" :bordered="false" class="shadow-card">
          <a-form layout="vertical">
            <a-form-item label="最终生产交期" required>
              <a-date-picker v-model:value="reviewForm.finalDate" style="width: 100%" size="large" />
            </a-form-item>
            
            <a-form-item label="评审结果">
            <a-radio-group v-model:value="reviewForm.resultStatus" button-style="solid" class="w-full">
              <a-radio-button value="pass" class="half-width pass-radio">通过</a-radio-button>
              <a-radio-button value="reject" class="half-width reject-radio">驳回</a-radio-button>
            </a-radio-group>
            </a-form-item>

            <a-form-item label="评审备注">
              <a-textarea 
                v-model:value="reviewForm.remark" 
                placeholder="请输入评审意见或异常说明..." 
                :rows="4" 
              />
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed } from 'vue';
import { message, Grid } from 'ant-design-vue';
import dayjs from 'dayjs';
import { deliveryReviewService } from '@/services/deliveryReviewService';
// 修改类型导入：ReviewRecord 替换为 DeliveryReviewData
import type { PMCDeliveryReview, ProductDataAssemblyList } from '../DeliveryReview/types';

const props = defineProps<{
  visible: boolean;
  record: PMCDeliveryReview | null; // 类型修改
}>();

const screens = Grid.useBreakpoint();
const modalWidth = computed(() =>
  screens.value?.md ? 1000 : 'min(calc(100vw - 16px), 1000px)'
);
const modalStyle = computed(() =>
  screens.value?.md ? {} : { top: 8, maxWidth: '100vw', paddingBottom: 0 }
);
const bomTableSize = computed(() => (screens.value?.md ? 'middle' : 'small'));

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'confirm', payload: { id: string; status: string }): void;
}>();

// BOM表格列定义（保持不变）
const bomColumns = [
  { title: '编号', dataIndex: 'partNo', key: 'partNo' },
  { title: '货号', dataIndex: 'itemNo', key: 'itemNo' },
  { title: '用户铭', dataIndex: 'name', key: 'name' },
  // { title: '确认', key: 'confirm', width: 100 },
];

// BOM数据（动态加载）
const bomData = ref<any[]>([]);
const bomLoading = ref(false);

// 评审表单数据
const reviewForm = reactive({
  coilItemNo: '',
  finalDate: null as any,
  resultStatus: 'pass',
  remark: ''
});

const validatingCoil = ref(false);
const verifyStatus = ref<'none' | 'success' | 'error'>('none');
const confirmLoading = ref(false);

// 加载BOM数据（从API获取装配清单）
const loadBomData = async () => {
  // 使用中文字段名获取货号
  const itemNo = props.record?.货号;
  if (!itemNo) {
    bomData.value = [];
    return;
  }

  bomLoading.value = true;
  try {
    const assemblyList = await deliveryReviewService.getProductDataAssemblyList({货号: itemNo});
    if (!assemblyList || assemblyList.length === 0) {
      message.warning('未获取到BOM清单数据');
      bomData.value = [];
      return;
    }

    // 将装配清单转换为表格所需格式（保持不变）
    const mappedData = assemblyList.slice(0, 1).map((item: ProductDataAssemblyList, index: number) => {
      const partNo = item.主编号 || `UNKNOWN_${index}`;
      const itemNo = item.主货号 || `UNKNOWN_${index}`;
      const name = item.用户铭 || '--';
      return {
        partNo,
        itemNo,
        name,
        // isConfirmed: false,
      };
    });
    bomData.value = mappedData;
  } catch (error) {
    console.error('加载BOM失败:', error);
    message.error('加载BOM清单失败，请稍后重试');
    bomData.value = [];
  } finally {
    bomLoading.value = false;
  }
};

// 处理弹窗关闭
const handleVisibleUpdate = (val: boolean) => {
  emit('update:visible', val);
};

// 监听弹窗打开，初始化所有数据
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.record) {
      // 线圈货号从 record.线圈 获取
      reviewForm.coilItemNo = props.record.线圈货号 || '';
      verifyStatus.value = 'none';
      validatingCoil.value = false;
      
      // 最终交期从 record.交货日期 获取
      reviewForm.finalDate = dayjs(props.record.交货日期);
      reviewForm.resultStatus = 'pass';
      reviewForm.remark = '';
      
      loadBomData();
    }
  }
);

// 线圈货号校验
const validateCoil = async () => {
  if (!reviewForm.coilItemNo) {
    message.warning('请输入线圈货号');
    return;
  }

  validatingCoil.value = true;
  verifyStatus.value = 'none';

  try {
    const result = await deliveryReviewService.checkIsExistInAssemblyList({线圈货号: reviewForm.coilItemNo });
    if (result) {
      verifyStatus.value = 'success';
    } else {
      verifyStatus.value = 'error';
    }
  } catch (error) {
    verifyStatus.value = 'error';
  } finally {
    validatingCoil.value = false;
  }
};

// 提交评审
const submitReview = async () => {
  // 校验线圈货号
  if (verifyStatus.value !== 'success') {
    message.error('线圈货号未经验证或验证不通过，无法提交评审！');
    return;
  }
  
  // 校验BOM确认状态
  // const unconfirmedBOM = bomData.value.find(item => !item.isConfirmed);
  // if (unconfirmedBOM) {
  //   message.warning(`BOM项 [${unconfirmedBOM.itemNo}] 尚未点击确认`);
  //   return;
  // }

  // 状态映射
  const mappedStatus = reviewForm.resultStatus === 'pass' ? '评审通过' : '评审驳回';

  const {
  编号, 用户编号, 合同号, 排产编号, 层, 货号, 中文品名,中文规格,
  分析单号, 来源编号, 来源, 工单单号, 排产用户, 电压
} = props.record!;


 // 构造提交数据：基于原始记录，更新线圈、状态、最终交期、评审备注
  const reviewData : PMCDeliveryReview  = {
    编号,用户编号,合同号,排产编号,层,货号,中文品名,中文规格,分析单号,来源编号,来源 ,工单单号,排产用户,电压,
    物料货号: bomData.value[0].itemNo,
    状态: mappedStatus==='评审通过'?'评审通过' : '评审驳回',   
    线圈货号: reviewForm.coilItemNo,               
    交货日期: dayjs(reviewForm.finalDate).format('YYYY-MM-DD'), // 最终生产交期
    备注: reviewForm.remark,          // 评审备注
  };

  confirmLoading.value = true;
   try {
    await deliveryReviewService.addPMCDeliveryReview(reviewData);
    // 提交成功，关闭弹窗并触发父组件事件
    emit('update:visible', false);
    emit('confirm', { id: props.record!.编号, status: mappedStatus });
    message.success('评审结果提交成功!');
  } catch (error) {
    console.error('提交评审失败:', error);
    message.error('提交评审失败，请稍后重试');
  } finally {
    confirmLoading.value = false;
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.review-section {
  margin-top: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}
.query-box {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}
.match-res {
  margin-top: 8px;
  font-size: 13px;
}
.match-res.success { color: #52c41a; }
.match-res.error { color: #ff4d4f; }
.mb-16 {
  margin-bottom: 16px;
}
.w-full {
  width: 100%;
}
.half-width {
  width: 50%;
  text-align: center;
}
.shadow-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.copyable-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  color: #1890ff;
}
.verify-result {
  margin-top: 12px;
}
.bom-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
:deep(.reject-radio.ant-radio-button-wrapper-checked) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}
:deep(.reject-radio.ant-radio-button-wrapper-checked):hover {
  background-color: #ff7875;
  border-color: #ff7875;
}
</style>