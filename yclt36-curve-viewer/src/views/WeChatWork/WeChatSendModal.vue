<template>
  <a-modal
    v-model:open="localVisible"
    title="发送企业微信"
    :width="1000"
    :footer="null"
    :maskClosable="false"
    :body-style="{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }"
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

      <!-- 群聊模式 -->
      <template v-if="wechatForm.sendType === 'chat'">
        <a-form-item label="群聊方式" name="chatMode">
          <a-radio-group v-model:value="wechatForm.chatMode" button-style="solid">
            <a-radio-button value="existing">选择已有群聊</a-radio-button>
            <a-radio-button value="new">创建新群聊</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- 选择已有群聊 -->
        <template v-if="wechatForm.chatMode === 'existing'">
          <a-form-item label="选择群聊" name="targets">
            <a-select
              v-model:value="wechatForm.targets"
              placeholder="请选择群聊"
              :loading="loadingRecipients"
              show-search
              allow-clear
              :options="filteredChats"
              :filter-option="false"
              style="width: 100%"
              @search="handleRecipientSearch"
            />
          </a-form-item>

          <!-- 消息类型 -->
          <a-form-item label="消息类型" name="groupMsgType">
            <a-radio-group v-model:value="wechatForm.groupMsgType" button-style="solid">
              <a-radio-button value="text">文本消息</a-radio-button>
              <a-radio-button value="card">卡片消息</a-radio-button>
            </a-radio-group>
          </a-form-item>

          <!-- 文本内容 -->
          <a-form-item v-if="wechatForm.groupMsgType === 'text'" label="消息内容" name="content">
            <a-textarea
              v-model:value="wechatForm.content"
              :rows="6"
              :maxlength="2048"
              show-count
              placeholder="请输入要发送的消息内容..."
            />
          </a-form-item>

          <!-- 卡片内容 -->
          <template v-else>
            <a-form-item label="卡片标题" name="title">
              <a-input
                v-model:value="wechatForm.title"
                :maxlength="128"
                placeholder="请输入卡片标题"
              />
            </a-form-item>
            <a-form-item label="卡片描述" name="description">
              <a-textarea
                v-model:value="wechatForm.description"
                :rows="4"
                :maxlength="512"
                show-count
                placeholder="请输入卡片描述"
              />
            </a-form-item>
            <a-form-item label="跳转链接" name="url">
              <a-input
                v-model:value="wechatForm.url"
                placeholder="请输入卡片点击后跳转的链接"
              />
            </a-form-item>
          </template>
        </template>

        <!-- 创建新群聊 -->
        <template v-else>
          <a-form-item label="群主" name="ownerUserId">
            <a-select
              v-model:value="wechatForm.ownerUserId"
              placeholder="请选择群主"
              show-search
              allow-clear
              :options="userOptions"
              :filter-option="filterUserByLabel"
              style="width: 100%"
            />
          </a-form-item>

          <a-form-item label="群成员" name="memberUserIds">
            <a-select
              v-model:value="wechatForm.memberUserIds"
              mode="multiple"
              placeholder="请选择群成员"
              show-search
              allow-clear
              :options="userOptions"
              :filter-option="filterUserByLabel"
              style="width: 100%"
            />
          </a-form-item>

          <!-- 消息类型 -->
          <a-form-item label="消息类型" name="groupMsgType">
            <a-radio-group v-model:value="wechatForm.groupMsgType" button-style="solid">
              <a-radio-button value="text">文本消息</a-radio-button>
              <a-radio-button value="card">卡片消息</a-radio-button>
            </a-radio-group>
          </a-form-item>

          <!-- 文本内容 -->
          <a-form-item v-if="wechatForm.groupMsgType === 'text'" label="消息内容" name="content">
            <a-textarea
              v-model:value="wechatForm.content"
              :rows="6"
              :maxlength="2048"
              show-count
              placeholder="请输入要发送的消息内容..."
            />
          </a-form-item>

          <!-- 卡片内容 -->
          <template v-else>
            <a-form-item label="群聊名称" name="chatName">
              <a-input v-model:value="wechatForm.chatName" placeholder="请输入群聊名称" />
            </a-form-item>
            <a-form-item label="卡片标题" name="title">
              <a-input
                v-model:value="wechatForm.title"
                :maxlength="128"
                placeholder="请输入卡片标题"
              />
            </a-form-item>
            <a-form-item label="卡片描述" name="description">
              <a-textarea
                v-model:value="wechatForm.description"
                :rows="4"
                :maxlength="512"
                show-count
                placeholder="请输入卡片描述"
              />
            </a-form-item>
            <a-form-item label="跳转链接" name="url">
              <a-input
                v-model:value="wechatForm.url"
                placeholder="请输入卡片点击后跳转的链接"
              />
            </a-form-item>
          </template>
        </template>
      </template>

      <!-- 个人模式 -->
      <template v-else>
        <a-form-item name="targets" class="hidden-form-item">
          <a-select
            v-model:value="wechatForm.targets"
            mode="multiple"
            :open="false"
            style="width: 100%"
          >
            <template #suffixIcon></template>
          </a-select>
        </a-form-item>

        <a-form-item label="选择接收人">
          <div class="user-selector-wrap">
            <OrgUserSelector
              ref="orgSelectorRef"
              v-model:selectedUserIds="selectedUserIds"
              maxTableHeight="340px"
              @userSelect="onUserSelect"
            />
          </div>
        </a-form-item>
      </template>

      <template v-if="wechatForm.sendType === 'user'">
        <!-- 消息类型选择 -->
        <a-form-item label="消息类型" name="cardMode">
          <a-radio-group v-model:value="wechatForm.cardMode" button-style="solid">
            <a-radio-button value="message">
              <WechatOutlined /> 发送消息
            </a-radio-button>
            <a-radio-button value="card">
              <CreditCardOutlined /> 发送卡片
            </a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- 消息内容 -->
        <a-form-item v-if="wechatForm.cardMode === 'message'" label="消息内容" name="content">
          <a-textarea
            v-model:value="wechatForm.content"
            :rows="6"
            :maxlength="2048"
            show-count
            placeholder="请输入要发送的消息内容..."
          />
        </a-form-item>

        <!-- 卡片内容 -->
        <template v-if="wechatForm.cardMode === 'card'">
          <a-form-item label="卡片标题" name="title">
            <a-input
              v-model:value="wechatForm.title"
              :maxlength="128"
              placeholder="请输入卡片标题"
            />
          </a-form-item>

          <a-form-item label="卡片描述" name="description">
            <a-textarea
              v-model:value="wechatForm.description"
              :rows="4"
              :maxlength="512"
              show-count
              placeholder="请输入卡片描述"
            />
          </a-form-item>

          <a-form-item label="跳转链接" name="url">
            <a-input
              v-model:value="wechatForm.url"
              placeholder="请输入卡片点击后跳转的链接"
            />
          </a-form-item>
        </template>

        <!-- 快速模板 -->
        <a-form-item label="快速模板" v-if="wechatForm.cardMode === 'message' && wechatForm.content === ''">
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
      </template>

      <!-- 提交按钮 -->
      <a-form-item class="form-actions">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button
            type="primary"
            :loading="sendingWechat"
            @click="handleSendWeChat"
          >
            <template #icon>
              <WechatOutlined v-if="wechatForm.sendType === 'user' && wechatForm.cardMode === 'message'" />
              <CreditCardOutlined v-else-if="wechatForm.sendType === 'user' && wechatForm.cardMode === 'card'" />
              <TeamOutlined v-else />
            </template>
            {{ sendButtonText }}
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue/es/form'
import { UserOutlined, TeamOutlined, WechatOutlined, CreditCardOutlined } from '@ant-design/icons-vue'
import { weChatWorkService } from '@/services/wechatWorkService'
import { SendMessageDto, GroupChatMessageDto, WechatWorkMessageType } from '@/api-generated/api'
import OrgUserSelector from '@/components/OrgUserSelector.vue'

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

const selectedUserIds = ref<string[]>([])
const orgSelectorRef = ref<InstanceType<typeof OrgUserSelector>>()

const wechatForm = reactive({
  sendType: 'user' as 'user' | 'chat',
  cardMode: 'message' as 'message' | 'card',
  chatMode: 'existing' as 'existing' | 'new',
  groupMsgType: 'text' as 'text' | 'card',
  targets: [] as any,
  chatName: '',
  ownerUserId: undefined as string | undefined,
  memberUserIds: [] as string[],
  content: props.defaultContent || '',
  title: '',
  description: '',
  url: '',
  msgType: 1 as number
})

const wechatRules = computed(() => {
  if (wechatForm.sendType === 'chat') {
    const base = {
      sendType: [{ required: true, message: '请选择发送类型' }],
      chatMode: [{ required: true, message: '请选择群聊方式' }]
    }
    if (wechatForm.chatMode === 'existing') {
      if (wechatForm.groupMsgType === 'card') {
        return {
          ...base,
          targets: [{ required: true, message: '请选择群聊', trigger: 'change' }],
          title: [{ required: true, message: '请输入卡片标题', trigger: 'change' }],
          url: [{ required: true, message: '请输入跳转链接', trigger: 'change' }]
        }
      }
      return {
        ...base,
        targets: [{ required: true, message: '请选择群聊', trigger: 'change' }],
        content: [{ required: true, message: '请输入消息内容', trigger: 'change' }]
      }
    }
    // new chat
    if (wechatForm.groupMsgType === 'card') {
      return {
        ...base,
        ownerUserId: [{ required: true, message: '请选择群主', trigger: 'change' }],
        memberUserIds: [
          { required: true, message: '请选择群成员', type: 'array', trigger: 'change' },
          { type: 'array', min: 2, message: '群成员至少2人', trigger: 'change' }
        ],
        chatName: [{ required: true, message: '请输入群聊名称', trigger: 'change' }],
        title: [{ required: true, message: '请输入卡片标题', trigger: 'change' }],
        url: [{ required: true, message: '请输入跳转链接', trigger: 'change' }]
      }
    }
    return {
      ...base,
      ownerUserId: [{ required: true, message: '请选择群主', trigger: 'change' }],
      memberUserIds: [
        { required: true, message: '请选择群成员', type: 'array', trigger: 'change' },
        { type: 'array', min: 2, message: '群成员至少2人', trigger: 'change' }
      ],
      content: [{ required: true, message: '请输入消息内容', trigger: 'change' }]
    }
  }
  return wechatForm.cardMode === 'card'
    ? {
        sendType: [{ required: true, message: '请选择发送类型' }],
        cardMode: [{ required: true, message: '请选择消息类型' }],
        targets: [{ required: true, message: '请选择接收目标', type: 'array' }],
        title: [{ required: true, message: '请输入卡片标题', trigger: 'change' }],
        url: [{ required: true, message: '请输入跳转链接', trigger: 'change' }]
      }
    : {
        sendType: [{ required: true, message: '请选择发送类型' }],
        cardMode: [{ required: true, message: '请选择消息类型' }],
        targets: [{ required: true, message: '请选择接收目标', type: 'array' }],
        content: [{ required: true, message: '请输入内容', trigger: 'change' }]
      }
})

watch(() => wechatForm.cardMode, () => {
  wechatFormRef.value?.clearValidate(['content', 'title', 'description', 'url'])
})

const allUsers = ref<any[]>([])
const allChats = ref<any[]>([])

/** 用户选择变化时的回调，同步到 form.targets */
function onUserSelect(userIds: string[]) {
  wechatForm.targets = userIds
}

const loadChatData = async () => {
  loadingRecipients.value = true
  try {
    allChats.value = await weChatWorkService.getChatList()
    if (allUsers.value.length === 0) {
      allUsers.value = await weChatWorkService.getUserList(1)
    }
  } catch (error) {
    message.error('加载群聊列表失败')
  } finally {
    loadingRecipients.value = false
  }
}

const handleRecipientSearch = (val: string) => {
  recipientSearchText.value = val
}

const filteredChats = computed(() => {
  const keyword = recipientSearchText.value.toLowerCase().trim()
  const chats = allChats.value.map(chat => ({ label: chat.name, value: chat.chatid }))
  if (!keyword) return chats
  return chats.filter(chat =>
    chat.label.toLowerCase().includes(keyword) ||
    chat.value.toLowerCase().includes(keyword)
  )
})

const userOptions = computed(() => allUsers.value.map(user => ({ label: `${user.name} (${user.userid})`, value: user.userid })))

const filterUserByLabel = (inputValue: string, option: any) => {
  return (option?.label || '').toLowerCase().includes(inputValue.toLowerCase())
}

const sendButtonText = computed(() => {
  if (wechatForm.sendType === 'chat') {
    if (wechatForm.chatMode === 'new') {
      return wechatForm.groupMsgType === 'card' ? '创建群聊并发送卡片' : '创建群聊并发送消息'
    }
    return wechatForm.groupMsgType === 'card' ? '发送卡片' : '发送消息'
  }
  return wechatForm.cardMode === 'card' ? '发送卡片' : '发送消息'
})

const handleTypeChange = async () => {
  wechatForm.targets = wechatForm.sendType === 'user' ? [] : undefined
  wechatForm.chatMode = 'existing'
  wechatForm.groupMsgType = 'text'
  wechatForm.chatName = ''
  wechatForm.ownerUserId = undefined
  wechatForm.memberUserIds = []
  wechatForm.content = ''
  recipientSearchText.value = ''
  wechatFormRef.value?.clearValidate()
  if (wechatForm.sendType === 'user') {
    selectedUserIds.value = []
  } else {
    loadChatData()
  }
}

const messageTemplates = [
  { id: 1, name: '系统通知', content: '【系统通知】您好，系统将于今晚进行维护升级。' },
  { id: 2, name: '会议提醒', content: '【会议提醒】您好，明天上午9:00将召开部门例会。' }
]

const applyTemplate = (content: string) => {
  wechatForm.content = content
}

const initialFormState = {
  sendType: 'user' as 'user' | 'chat',
  cardMode: 'message' as 'message' | 'card',
  chatMode: 'existing' as 'existing' | 'new',
  groupMsgType: 'text' as 'text' | 'card',
  targets: [] as any,
  chatName: '',
  ownerUserId: undefined as string | undefined,
  memberUserIds: [] as string[],
  content: '',
  title: '',
  description: '',
  url: '',
  msgType: 1 as number
}

const handleCancel = () => {
  wechatForm.sendType = initialFormState.sendType
  wechatForm.cardMode = initialFormState.cardMode
  wechatForm.chatMode = initialFormState.chatMode
  wechatForm.groupMsgType = initialFormState.groupMsgType
  wechatForm.targets = initialFormState.targets
  wechatForm.chatName = initialFormState.chatName
  wechatForm.ownerUserId = initialFormState.ownerUserId
  wechatForm.memberUserIds = initialFormState.memberUserIds
  wechatForm.content = initialFormState.content
  wechatForm.title = initialFormState.title
  wechatForm.description = initialFormState.description
  wechatForm.url = initialFormState.url
  wechatForm.msgType = initialFormState.msgType
  selectedUserIds.value = []
  orgSelectorRef.value?.clearSelection()
  wechatFormRef.value?.resetFields()
  localVisible.value = false
}

const handleSendWeChat = async () => {
  try {
    await wechatFormRef.value?.validate()
    sendingWechat.value = true

    if (wechatForm.sendType === 'chat') {
      const isCard = wechatForm.groupMsgType === 'card'
      // 卡片模式用标题+描述+链接拼接内容，文本模式直接取 content
      const content = isCard
        ? `【${wechatForm.title}】\n${wechatForm.description}\n详情链接: ${wechatForm.url}`
        : wechatForm.content

      if (wechatForm.chatMode === 'existing') {
        const chatId = Array.isArray(wechatForm.targets) ? wechatForm.targets[0] : wechatForm.targets
        const dto = new GroupChatMessageDto({
          chatId,
          content,
          msgType: wechatForm.msgType as WechatWorkMessageType
        })
        await weChatWorkService.sendToGroupChat(dto)
        message.success('发送群聊消息成功')
      } else {
        const dto = new GroupChatMessageDto({
          chatName: isCard ? (wechatForm.chatName || wechatForm.title) : wechatForm.chatName,
          ownerUserId: wechatForm.ownerUserId,
          userIds: wechatForm.memberUserIds,
          content,
          msgType: wechatForm.msgType as WechatWorkMessageType
        })
        await weChatWorkService.createChatAndSend(dto)
        message.success(isCard ? '创建群聊并发送卡片成功' : '创建群聊并发送消息成功')
      }
      emit('sendSuccess')
      handleCancel()
      return
    }

    const targets = Array.isArray(wechatForm.targets) ? wechatForm.targets : [wechatForm.targets]

    if (wechatForm.cardMode === 'card') {
      const sendMessageDto = new SendMessageDto({
        users: targets,
        title: wechatForm.title,
        description: wechatForm.description,
        url: wechatForm.url
      })
      await weChatWorkService.sendCardMessage(sendMessageDto)
      message.success('发送卡片成功')
    } else {
      const sendMessageDto = new SendMessageDto({ users: targets, content: wechatForm.content, msgType: wechatForm.msgType as WechatWorkMessageType });
      await weChatWorkService.sendMessage(sendMessageDto);
      message.success('发送成功')
    }
    emit('sendSuccess')
    handleCancel()
  } catch (error) {
    console.error(error)
    if (error && (error as any).errorFields) {
      return
    }
    message.error('发送失败，请重试')
  } finally {
    sendingWechat.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    if (wechatForm.sendType !== 'user') {
      loadChatData()
    }
  }
})
</script>

<style scoped>
.hidden-form-item {
  display: none;
}

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
/* OrgUserSelector 高度限制容器 */
.user-selector-wrap {
  height: 420px;
  overflow: hidden;
}

.user-selector-wrap :deep(.org-user-selector) {
  height: 100%;
}

.user-selector-wrap :deep(.dept-sidebar) {
  max-height: 100%;
  overflow-y: auto;
}
</style>
