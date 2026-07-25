<template>
  <div class="wechat-send-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">企业微信发送</h1>
        <p class="page-description">向企业微信用户或群聊发送消息</p>
      </div>
    </div>

    <a-card class="form-card" :body-style="{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }">
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
            <a-radio-button value="chat" >
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

            <a-form-item label="消息类型" name="groupMsgType">
              <a-radio-group v-model:value="wechatForm.groupMsgType" button-style="solid">
                <a-radio-button value="text">文本消息</a-radio-button>
                <a-radio-button value="card">卡片消息</a-radio-button>
              </a-radio-group>
            </a-form-item>
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

            <a-form-item label="消息类型" name="groupMsgType">
              <a-radio-group v-model:value="wechatForm.groupMsgType" button-style="solid">
                <a-radio-button value="text">文本消息</a-radio-button>
                <a-radio-button value="card">卡片消息</a-radio-button>
              </a-radio-group>
            </a-form-item>
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

          <a-form-item label="消息类型" name="userMsgType">
            <a-radio-group v-model:value="wechatForm.userMsgType" button-style="solid">
              <a-radio-button value="text"><FileTextOutlined /> 文本消息</a-radio-button>
              <a-radio-button value="card"><IdcardOutlined /> 卡片消息</a-radio-button>
            </a-radio-group>
          </a-form-item>
        </template>

        <!-- 提交按钮 -->
        <a-form-item class="form-actions">
          <a-space>
            <a-button @click="handleReset">重置</a-button>
            <a-button @click="openDebugModal">
              <template #icon><BugOutlined /></template>
              调试
            </a-button>
            <a-button
              type="primary"
              :loading="sendingWechat"
              @click="handleSend"
            >
              <template #icon><SendOutlined /></template>
              {{ sendButtonText }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 调试弹窗 -->
    <a-modal
      v-model:open="debugVisible"
      title="调试面板"
      width="680px"
      :footer="null"
      @cancel="closeDebugModal"
    >
      <a-space direction="vertical" style="width: 100%;" :size="16">
        <!-- 卡片预览 -->
        <a-card
          class="debug-card-preview"
          :class="{ 'debug-card-error': urlTooLong || titleTooLong || descTooLong }"
          :bordered="false"
        >
          <template #title>
            <span class="debug-card-title">
              <MessageOutlined /> 待发送消息预览
            </span>
          </template>
          <template #extra>
            <a-tag
              :color="urlTooLong ? 'red' : (titleTooLong || descTooLong ? 'orange' : 'green')"
            >
              {{ urlTooLong ? '链接过长' : (titleTooLong ? '标题过长' : (descTooLong ? '描述过长' : '参数正常')) }}
            </a-tag>
          </template>

          <a-descriptions
            :column="1"
            size="small"
            :colon="false"
            :labelStyle="{ color: 'rgba(0,0,0,0.45)', width: '56px' }"
          >
            <a-descriptions-item label="标题">
              <a-typography-text
                :class="{ 'text-danger': titleTooLong }"
                :content="cardData.title || '（未设置）'"
                :ellipsis="{ rows: 2, tooltip: true }"
              />
              <a-typography-text v-if="titleTooLong" type="danger" class="text-tip">
                超过 {{ MAX_TITLE }} 字，发送时将截断
              </a-typography-text>
            </a-descriptions-item>

            <a-descriptions-item label="描述">
              <a-typography-text
                :class="{ 'text-danger': descTooLong }"
                :content="cardData.description || '（未设置）'"
                :ellipsis="{ rows: 3, tooltip: true }"
              />
              <a-typography-text v-if="descTooLong" type="danger" class="text-tip">
                超过 {{ MAX_DESC }} 字，发送时将截断
              </a-typography-text>
            </a-descriptions-item>

            <a-descriptions-item label="群聊名称">
              <a-typography-text :content="cardData.chatName || '（使用标题）'" :ellipsis="{ rows: 1, tooltip: true }" />
            </a-descriptions-item>

            <a-descriptions-item label="链接">
              <a-typography-text
                :class="['debug-url', { 'text-danger': urlTooLong }]"
                :content="cardData.url || '（未设置）'"
                style="max-width: 100%;"
              />
              <a-typography-text v-if="urlTooLong" type="danger" class="text-tip">
                超过 {{ MAX_URL }} 字，发送时将截断
              </a-typography-text>
            </a-descriptions-item>

            <a-descriptions-item label="消息内容">
              <a-typography-text
                :content="cardData.content || '（未设置，将自动拼接标题+描述+链接）'"
                :ellipsis="{ rows: 3, tooltip: true }"
              />
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 生成分享链接 -->
        <a-card class="debug-link-card" title="🔗 生成分享链接" :bordered="false">
          <a-form layout="vertical" class="debug-link-form">
            <a-form-item label="链接类型">
              <a-radio-group v-model:value="linkForm.linkType" button-style="solid">
                <a-radio-button value="user"><UserOutlined /> 发送给个人</a-radio-button>
                <a-radio-button value="chatText"><FileTextOutlined /> 群聊文本消息</a-radio-button>
                <a-radio-button value="chatCard"><CreditCardOutlined /> 群聊卡片消息</a-radio-button>
              </a-radio-group>
            </a-form-item>

            <a-form-item v-if="linkForm.linkType.startsWith('chat')" label="群聊方式">
              <a-radio-group v-model:value="linkForm.chatMode" button-style="solid">
                <a-radio-button value="existing"><CommentOutlined /> 选择已有群聊</a-radio-button>
                <a-radio-button value="new"><UsergroupAddOutlined /> 创建新群聊</a-radio-button>
              </a-radio-group>
            </a-form-item>

            <!-- 个人模式：先选消息类型 -->
            <template v-if="linkForm.linkType === 'user'">
              <a-form-item label="消息类型">
                <a-radio-group v-model:value="linkForm.userMsgType" button-style="solid">
                  <a-radio-button value="text"><FileTextOutlined /> 文本消息</a-radio-button>
                  <a-radio-button value="card"><IdcardOutlined /> 卡片消息</a-radio-button>
                </a-radio-group>
              </a-form-item>
            </template>

            <!-- 个人文本 / 群聊文本 → 消息内容 -->
            <template v-if="(linkForm.linkType === 'user' && linkForm.userMsgType === 'text') || linkForm.linkType === 'chatText'">
              <a-form-item label="消息内容">
                <a-textarea v-model:value="linkForm.content" placeholder="输入消息内容" :rows="3" allow-clear />
              </a-form-item>
            </template>

            <!-- 个人卡片 / 群聊卡片 → 标题+描述+链接 -->
            <template v-if="(linkForm.linkType === 'user' && linkForm.userMsgType === 'card') || linkForm.linkType === 'chatCard'">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="标题">
                    <a-input v-model:value="linkForm.title" placeholder="输入卡片标题" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="描述">
                    <a-input v-model:value="linkForm.description" placeholder="输入卡片描述" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="链接">
                <a-input v-model:value="linkForm.url" placeholder="输入跳转链接" allow-clear />
              </a-form-item>
            </template>

            <!-- 群聊新建 → 群聊名称 -->
            <template v-if="linkForm.linkType.startsWith('chat') && linkForm.chatMode === 'new'">
              <a-form-item label="群聊名称">
                <a-input v-model:value="linkForm.chatName" placeholder="输入新建群聊名称" allow-clear />
              </a-form-item>
            </template>

            <a-form-item>
              <a-button type="primary" @click="generateLink">
                <template #icon><LinkOutlined /></template>
                生成链接
              </a-button>
            </a-form-item>
          </a-form>

          <a-collapse
            v-if="generatedLink"
            :bordered="false"
            :active-key="['1']"
            class="debug-result-collapse"
          >
            <a-collapse-panel key="1" header="已生成的链接">
              <a-input-group compact>
                <a-input
                  v-model:value="generatedLink"
                  readonly
                  style="width: calc(100% - 76px);"
                />
                <a-button type="primary" @click="copyLink">复制</a-button>
              </a-input-group>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue/es/form'
import { UserOutlined, TeamOutlined, SendOutlined, LinkOutlined, BugOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { weChatWorkService } from '@/services/wechatWorkService'
import { SendMessageDto, GroupChatMessageDto, WechatWorkMessageType } from '@/api-generated/api'
import OrgUserSelector from '@/components/OrgUserSelector.vue'

// 长度限制
const MAX_TITLE = 128
const MAX_DESC = 512
const MAX_URL = 2048

/** 安全解码 URL 参数 */
function safeDecode(val: unknown): string {
  if (!val) return ''
  try {
    return decodeURIComponent(decodeURIComponent(val as string))
  } catch {
    try {
      // 已经是解码后的，直接返回
      const s = val as string
      // 尝试再解码一次
      const d = decodeURIComponent(s)
      return d === s ? s : d
    } catch {
      return val as string
    }
  }
}

/** 从 query 读取参数，安全回退 */
const route = useRoute()
const cardData = reactive({
  title: safeDecode(route.query.title) || '系统通知',
  description: safeDecode(route.query.description) || '您好，请及时查看最新信息。',
  url: safeDecode(route.query.url) || 'https://www.example.com',
  chatName: safeDecode(route.query.chatName) || (safeDecode(route.query.title) || '新建群聊'),
  content: safeDecode(route.query.content) || ''
})

// 长度检查
const titleTooLong = computed(() => cardData.title.length > MAX_TITLE)
const descTooLong = computed(() => cardData.description.length > MAX_DESC)
const urlTooLong = computed(() => cardData.url.length > MAX_URL)

/** 按限制截断 */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) : str
}

const wechatFormRef = ref<FormInstance>()
const sendingWechat = ref(false)
const loadingRecipients = ref(false)
const recipientSearchText = ref('')
const debugVisible = ref(false)

const openDebugModal = () => {
  debugVisible.value = true
}

const closeDebugModal = () => {
  debugVisible.value = false
}

const selectedUserIds = ref<string[]>([])
const allUsers = ref<any[]>([])
const allChats = ref<any[]>([])

const orgSelectorRef = ref<InstanceType<typeof OrgUserSelector>>()

/**
 * 统一 URL 参数规则（最简设计）：
 *   sendType = user | chat  → 发送目标类型，默认 user
 *   chatMode = existing | new → 群聊方式，默认 existing（仅 sendType=chat 有效）
 *   msgMode  = text  | card → 消息类型，默认 card
 * 内容参数：content / title / description / url / chatName
 *
 * 6种场景示例：
 *   个人·文本: ?sendType=user&msgMode=text&content=你好
 *   个人·卡片: ?sendType=user&msgMode=card&title=标题&url=https://...
 *   已有群聊·文本: ?sendType=chat&chatMode=existing&msgMode=text&content=你好
 *   已有群聊·卡片: ?sendType=chat&chatMode=existing&msgMode=card&title=标题&url=https://...
 *   新建群聊·文本: ?sendType=chat&chatMode=new&msgMode=text&content=你好&chatName=群名
 *   新建群聊·卡片: ?sendType=chat&chatMode=new&msgMode=card&title=标题&url=https://...&chatName=群名
 */
const sendTypeParam = route.query.sendType as string | undefined
const chatModeParam = route.query.chatMode as string | undefined
const msgModeParam = route.query.msgMode as string | undefined
const initialSendType: 'user' | 'chat' =
  sendTypeParam === 'chat' ? 'chat' : 'user'
const initialChatMode: 'existing' | 'new' =
  chatModeParam === 'new' ? 'new' : 'existing'
const msgType: 'text' | 'card' =
  msgModeParam === 'text' ? 'text' : 'card'

const initialGroupMsgType = msgType
const initialUserMsgType = msgType

const wechatForm = reactive({
  sendType: initialSendType,
  chatMode: initialChatMode,
  groupMsgType: initialGroupMsgType,
  userMsgType: initialUserMsgType,
  targets: [] as any,
  ownerUserId: undefined as string | undefined,
  memberUserIds: [] as string[]
})

/** 根据当前消息类型动态计算 msgType：文本=1，卡片=5 */
const currentMsgType = computed(() => {
  if (wechatForm.sendType === 'chat') {
    return wechatForm.groupMsgType === 'card' ? 5 : 1
  }
  return wechatForm.userMsgType === 'card' ? 5 : 1
})

const wechatRules = computed(() => {
  const base = {
    sendType: [{ required: true, message: '请选择发送类型' }],
    chatMode: [{ required: true, message: '请选择群聊方式' }]
  }
  if (wechatForm.sendType === 'chat') {
    if (wechatForm.chatMode === 'existing') {
      return {
        ...base,
        targets: [{ required: true, message: '请选择群聊', trigger: 'change' }]
      }
    }
    return {
      ...base,
      ownerUserId: [{ required: true, message: '请选择群主', trigger: 'change' }],
      memberUserIds: [
        { required: true, message: '请选择群成员', type: 'array', trigger: 'change' },
        { type: 'array', min: 2, message: '群成员至少2人', trigger: 'change' }
      ]
    }
  }
  return {
    ...base,
    targets: [{ required: true, message: '请选择接收目标', type: 'array' }]
  }
})

// 链接生成相关
const linkForm = reactive({
  linkType: 'user' as 'user' | 'chatText' | 'chatCard',
  chatMode: 'existing' as 'existing' | 'new',
  userMsgType: 'card' as 'text' | 'card',
  title: '', description: '', url: '', chatName: '', content: ''
})
const generatedLink = ref('')

function generateLink() {
  const base = window.location.origin + '/#/test/wechatSend'
  const params = new URLSearchParams()

  if (linkForm.linkType === 'user') {
    params.set('sendType', 'user')
    params.set('msgMode', linkForm.userMsgType)
  } else {
    params.set('sendType', 'chat')
    params.set('chatMode', linkForm.chatMode)
    params.set('msgMode', linkForm.linkType === 'chatText' ? 'text' : 'card')
    if (linkForm.chatMode === 'new' && linkForm.chatName) {
      params.set('chatName', linkForm.chatName)
    }
  }

  // 内容参数
  const isText = (linkForm.linkType === 'user' && linkForm.userMsgType === 'text') || linkForm.linkType === 'chatText'
  if (isText) {
    if (linkForm.content) params.set('content', linkForm.content)
  } else {
    if (linkForm.title) params.set('title', linkForm.title)
    if (linkForm.description) params.set('description', linkForm.description)
    if (linkForm.url) params.set('url', linkForm.url)
  }

  generatedLink.value = base + '?' + params.toString()
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    message.success('链接已复制')
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = generatedLink.value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      message.success('链接已复制')
    } catch {
      message.error('复制失败，请手动复制')
    }
  }
}

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
  } catch (error: any) {
    message.error(error.message || '加载群聊列表失败')
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
  return wechatForm.userMsgType === 'card' ? '发送卡片' : '发送消息'
})

const handleTypeChange = async () => {
  wechatForm.targets = wechatForm.sendType === 'user' ? [] : undefined
  wechatForm.chatMode = 'existing'
  wechatForm.groupMsgType = 'text'
  wechatForm.userMsgType = 'card'
  wechatForm.ownerUserId = undefined
  wechatForm.memberUserIds = []
  recipientSearchText.value = ''
  wechatFormRef.value?.clearValidate()
  if (wechatForm.sendType === 'user') {
    selectedUserIds.value = []
  } else {
    loadChatData()
  }
}

const initialFormState = {
  sendType: initialSendType,
  chatMode: initialChatMode,
  groupMsgType: initialGroupMsgType,
  userMsgType: initialUserMsgType,
  targets: [] as any,
  ownerUserId: undefined as string | undefined,
  memberUserIds: [] as string[]
}

const handleReset = () => {
  wechatForm.sendType = initialFormState.sendType
  wechatForm.chatMode = initialFormState.chatMode
  wechatForm.groupMsgType = initialFormState.groupMsgType
  wechatForm.userMsgType = initialFormState.userMsgType
  wechatForm.targets = initialFormState.targets
  wechatForm.ownerUserId = initialFormState.ownerUserId
  wechatForm.memberUserIds = initialFormState.memberUserIds
  selectedUserIds.value = []
  orgSelectorRef.value?.clearSelection()
  wechatFormRef.value?.resetFields()
}

const handleSend = async () => {
  // 发送给个人：先预判接收人，避免被表单必填校验拦截
  if (wechatForm.sendType === 'user') {
    const targets = Array.isArray(wechatForm.targets)
      ? wechatForm.targets.filter(Boolean)
      : (wechatForm.targets ? [wechatForm.targets] : [])
    if (!targets.length) {
      message.warning('请选择接收人')
      return
    }
  }

  try {
    await wechatFormRef.value?.validate()
    sendingWechat.value = true

    if (wechatForm.sendType === 'chat') {
      const isCard = wechatForm.groupMsgType === 'card'
      // 消息内容：卡片模式用标题+描述+链接拼接，文本模式直接取 content 参数
      const title = truncate(cardData.title, MAX_TITLE)
      const description = truncate(cardData.description, MAX_DESC)
      const url = truncate(cardData.url, MAX_URL)
      const content = isCard
        ? `【${title}】\n${description}\n详情链接: ${url}`
        : (cardData.content || `【${title}】\n${description}\n详情链接: ${url}`)

      if (wechatForm.chatMode === 'existing') {
        const chatId = Array.isArray(wechatForm.targets) ? wechatForm.targets[0] : wechatForm.targets
        const dto = new GroupChatMessageDto({
          chatId,
          content,
          msgType: currentMsgType.value as WechatWorkMessageType,
          ...(isCard ? { title, description, url } : {})
        })
        await weChatWorkService.sendToGroupChat(dto)
        message.success('发送群聊消息成功')
      } else {
        const chatName = cardData.chatName
        const dto = new GroupChatMessageDto({
          chatName,
          ownerUserId: wechatForm.ownerUserId,
          userIds: wechatForm.memberUserIds,
          content,
          msgType: currentMsgType.value as WechatWorkMessageType,
          ...(isCard ? { title, description, url } : {})
        })
        await weChatWorkService.createChatAndSend(dto)
        message.success('创建群聊并发送成功')
      }
    } else {
      // 发送给个人：上面已校验过接收人
      const targets = (Array.isArray(wechatForm.targets) ? wechatForm.targets : [wechatForm.targets]).filter(Boolean)

      // 发送前对超长内容截断
      const title = truncate(cardData.title, MAX_TITLE)
      const description = truncate(cardData.description, MAX_DESC)
      const url = truncate(cardData.url, MAX_URL)

      if (wechatForm.userMsgType === 'text') {
        const content = cardData.content || `【${title}】\n${description}\n详情链接: ${url}`
        const sendMessageDto = new SendMessageDto({
          users: targets,
          content,
          msgType: currentMsgType.value as WechatWorkMessageType
        })
        await weChatWorkService.sendMessage(sendMessageDto)
        message.success('发送消息成功')
      } else {
        const sendMessageDto = new SendMessageDto({
          users: targets,
          title,
          description,
          url,
          msgType: currentMsgType.value as WechatWorkMessageType
        })
        console.log('Sending card:', { targets, title, description, url })
        await weChatWorkService.sendCardMessage(sendMessageDto)
        message.success('发送卡片成功')
      }
    }
    handleReset()
  } catch (error) {
    console.error(error)
    // 表单校验失败（validate reject）时不显示"发送失败"
    if (error && (error as any).errorFields) {
      return
    }
    message.error('发送失败，请重试')
  } finally {
    sendingWechat.value = false
  }
}

onMounted(() => {
  if (wechatForm.sendType !== 'user') {
    loadChatData()
  }
})
</script>

<style scoped>
.wechat-send-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left .page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2f3d;
}

.page-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.form-card {
  border-radius: 12px;
  padding: 8px 0;
}

.hidden-form-item {
  display: none;
}

.wecom-form {
  padding: 8px 0;
}

.wecom-form :deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.form-actions {
  margin-bottom: 0;
  margin-top: 24px;
}

.text-danger {
  color: #ff4d4f !important;
}

.text-tip {
  font-size: 12px;
  display: block;
  margin-top: 4px;
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

/* 调试弹窗 */
.debug-card-preview {
  border-radius: 12px;
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.debug-card-preview.debug-card-error {
  background: linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%);
}

.debug-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  color: #262626;
}

.debug-card-preview :deep(.ant-card-head) {
  border-bottom: none;
  padding: 0 20px;
  min-height: 48px;
}

.debug-card-preview :deep(.ant-card-body) {
  padding: 0 20px 20px;
}

.debug-url {
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #595959;
  font-size: 13px;
  word-break: break-all;
  display: inline-block;
  max-width: 100%;
}

.debug-card-preview :deep(.ant-descriptions-item-label) {
  white-space: nowrap;
  vertical-align: top;
  padding-right: 12px;
}

.debug-card-preview :deep(.ant-descriptions-item-content) {
  vertical-align: top;
  overflow: hidden;
}

.debug-card-preview :deep(.ant-typography) {
  margin-bottom: 0;
}

.debug-link-card {
  border-radius: 12px;
  background: #fafafa;
  box-shadow: none;
}

.debug-link-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  min-height: 48px;
}

.debug-link-card :deep(.ant-card-body) {
  padding: 20px;
}

.debug-link-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.debug-link-form :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.debug-result-collapse {
  margin-top: 8px;
}

.debug-result-collapse :deep(.ant-collapse-content) {
  background: #fff;
  border-radius: 8px;
}

.debug-result-collapse :deep(.ant-collapse-content-box) {
  padding: 12px;
}

</style>
