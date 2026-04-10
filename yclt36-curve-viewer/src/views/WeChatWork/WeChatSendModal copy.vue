<template>
  <a-modal
    v-model:open="localVisible"
    title="发送企业微信"
    :width="600"
    :footer="null"
    :maskClosable="false"
    class="wecom-modal"
    @cancel="handleCancel"
  >
    <a-form
      ref="wechatFormRef"
      :model="wechatForm"
      :rules="wechatRules"
      layout="vertical"
      class="wecom-form"
    >
      <!-- 发送类型选择 -->
      <a-form-item label="发送类型" name="sendType">
        <a-radio-group v-model:value="wechatForm.sendType" button-style="solid" @change="handleTypeChange">
          <a-radio-button value="user">
            <UserOutlined /> 发送给个人
          </a-radio-button>
          <a-radio-button value="chat">
            <TeamOutlined /> 发送给群聊
          </a-radio-button>
        </a-radio-group>
      </a-form-item>

      <!-- 收件人选择 -->
      <a-form-item
        :label="wechatForm.sendType === 'user' ? '选择接收人' : '选择群聊'"
        name="targets"
      >
        <a-select
          v-model:value="wechatForm.targets"
          :mode="wechatForm.sendType === 'user' ? 'multiple' : 'combobox'" 
          :placeholder="wechatForm.sendType === 'user' ? '请选择接收人' : '请选择群聊'"
          :loading="loadingRecipients"
          show-search
          allow-clear
          :filter-option="false" 
          :not-found-content="loadingRecipients ? undefined : '暂无匹配数据'"
          style="width: 100%"
          @search="handleRecipientSearch"
        >
          <!-- 注意：这里改用 v-for 循环过滤后的数据 -->
          <a-select-option
            v-for="item in filteredRecipients"
            :key="wechatForm.sendType === 'user' ? item.userid : item.chatid"
            :value="wechatForm.sendType === 'user' ? item.userid : item.chatid"
          >
            <div class="recipient-option">
              <a-avatar v-if="wechatForm.sendType === 'user'" :size="20" :src="item.avatar">
                {{ item.name?.charAt(0) }}
              </a-avatar>
              <span class="recipient-name" style="margin-left: 8px">{{ item.name }}</span>
              <span class="recipient-id" style="color: #ccc; font-size: 12px; margin-left: 8px">
                ({{ wechatForm.sendType === 'user' ? item.userid : item.chatid }})
              </span>
            </div>
          </a-select-option>
        </a-select>
        <div class="form-tip">
          <template v-if="wechatForm.sendType === 'user'">
            支持多选，最多选择20人
          </template>
          <template v-else>
            请选择要发送的一个群聊
          </template>
        </div>
      </a-form-item>

      <!-- 消息内容 -->
      <a-form-item label="消息内容" name="content">
        <a-textarea
          v-model:value="wechatForm.content"
          :rows="6"
          :maxlength="2048"
          show-count
          placeholder="请输入要发送的消息内容..."
        />
      </a-form-item>

      <!-- 快速模板 -->
      <a-form-item label="快速模板" v-if="wechatForm.content === ''">
        <div class="template-list">
          <a-tag
            v-for="template in messageTemplates"
            :key="template.id"
            class="template-tag"
            style="cursor: pointer; margin-bottom: 8px"
            @click="applyTemplate(template.content)"
          >
            {{ template.name }}
          </a-tag>
        </div>
      </a-form-item>

      <!-- 提交按钮 -->
      <a-form-item class="form-actions">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button
            type="primary"
            :loading="sendingWechat"
            @click="handleSendWeChat"
          >
            <template #icon><WechatOutlined /></template>
            发送消息
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, FormRules } from 'ant-design-vue'
import { UserOutlined, TeamOutlined, WechatOutlined } from '@ant-design/icons-vue'
// 假设服务已定义
import { weChatWorkService, type WeChatUser, type WeChatChat, WeChatMessage } from '@/services/wechatWorkService'

// 为了演示，如果没有 service 则定义 Mock 数据或接口
const props = defineProps<{
  visible: boolean
  defaultContent?: string
}>()

const emit = defineEmits(['update:visible', 'sendSuccess'])

const localVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const wechatFormRef = ref<FormInstance>()
const sendingWechat = ref(false)
const loadingRecipients = ref(false)
const recipientSearchText = ref('')

const wechatForm = reactive({
  sendType: 'user' as 'user' | 'chat',
  targets: [] as any, // 这里如果是群聊通常是字符串，个人是数组，逻辑在 handleSend 统一处理
  content: props.defaultContent || ''
})

const wechatRules: FormRules = {
  sendType: [{ required: true, message: '请选择发送类型' }],
  targets: [{ required: true, message: '请选择接收目标', type: 'any' }],
  content: [{ required: true, message: '请输入内容' }]
}

const allUsers = ref<any[]>([])
const allChats = ref<any[]>([])

// 核心优化：过滤逻辑
const filteredRecipients = computed(() => {
  const keyword = recipientSearchText.value.toLowerCase().trim()
  const sourceList = wechatForm.sendType === 'user' ? allUsers.value : allChats.value
  
  if (!keyword) return sourceList

  return sourceList.filter(item => {
    const name = item.name?.toLowerCase() || ''
    const id = (wechatForm.sendType === 'user' ? item.userid : item.chatid)?.toLowerCase() || ''
    const mobile = item.mobile || ''
    return name.includes(keyword) || id.includes(keyword) || mobile.includes(keyword)
  })
})

const loadRecipients = async () => {
  loadingRecipients.value = true
  try {
    // 模拟 API 调用
    if (wechatForm.sendType === 'user') {
      allUsers.value = await weChatWorkService.getUserList();  
    } else {
      // allChats.value = await weChatWorkService.getChatList()
      // Mock:
      allChats.value = [
        { name: '技术交流群', chatid: 'chat_tech' },
        { name: '产品讨论组', chatid: 'chat_prod' }
      ]
    }
  } catch (error) {
    message.error('加载列表失败')
  } finally {
    loadingRecipients.value = false
  }
}

// 搜索回调：这是实时搜索生效的关键
const handleRecipientSearch = (val: string) => {
  recipientSearchText.value = val
}

// 类型切换处理
const handleTypeChange = () => {
  wechatForm.targets = wechatForm.sendType === 'user' ? [] : undefined
  recipientSearchText.value = ''
  loadRecipients()
}

// 消息模板
const messageTemplates = [
  { id: 1, name: '系统通知', content: '【系统通知】您好，系统将于今晚进行维护升级。' },
  { id: 2, name: '会议提醒', content: '【会议提醒】您好，明天上午9:00将召开部门例会。' }
]

const applyTemplate = (content: string) => {
  wechatForm.content = content
}

// 定义表单初始状态
const initialFormState = {
  sendType: 'user' as 'user' | 'chat',
  targets: [] as any,
  content: ''
}

const handleCancel = () => {
  // 重置表单到初始状态
  wechatForm.sendType = initialFormState.sendType
  wechatForm.targets = initialFormState.targets
  wechatForm.content = initialFormState.content
  
  // 同时清除搜索文本
  recipientSearchText.value = ''
  
  // 清除表单验证状态
  wechatFormRef.value?.resetFields()
  
  // 关闭弹窗
  localVisible.value = false
}

// 发送逻辑
const handleSendWeChat = async () => {
  try {
    await wechatFormRef.value?.validate()
    sendingWechat.value = true
    
    // 适配后端：如果是个人则发数组，如果是群聊则根据后端要求封装
    const targets = Array.isArray(wechatForm.targets) ? wechatForm.targets : [wechatForm.targets]
    
    const message: WeChatMessage = {  
        type:"user",
        targets:targets,
        content:wechatForm.content
    }

    console.log('Sending:', message);
    await weChatWorkService.sendMessage(message);    
    handleCancel()
  } catch (error) {
    console.error(error)
  } finally {
    sendingWechat.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    recipientSearchText.value = ''
    loadRecipients()
  }
})
</script>

<style scoped>
.wecom-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-bottom: none;
}
.wecom-modal :deep(.ant-modal-title) {
  font-weight: 600;
  color: #52c41a;
}
.wecom-form {
  padding: 8px 0;
}
.wecom-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
.form-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}
.recipient-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
.recipient-name {
  font-weight: 500;
}
.recipient-id {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
.template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.template-tag {
  cursor: pointer;
  transition: all 0.3s ease;
}
.template-tag:hover {
  transform: scale(1.05);
  background: #07c160;
  color: white;
  border-color: #07c160;
}
.form-actions {
  margin-bottom: 0;
  margin-top: 24px;
}
.send-btn {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  border-color: #07c160;
}
.send-btn:hover {
  background: linear-gradient(135deg, #06ad56 0%, #05a14d 100%);
  border-color: #06ad56;
}
</style>