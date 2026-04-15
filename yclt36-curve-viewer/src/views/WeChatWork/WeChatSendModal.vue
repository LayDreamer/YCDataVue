<template>
  <a-modal
    v-model:open="localVisible"
    title="发送企业微信"
    :width="1000"
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
  <!-- 群聊模式：保持下拉选择器 -->
  <a-select
    v-if="wechatForm.sendType === 'chat'"
    v-model:value="wechatForm.targets"
    placeholder="请选择群聊"
    :loading="loadingRecipients"
    show-search
    allow-clear
    :filter-option="false"
    style="width: 100%"
    @search="handleRecipientSearch"
  >
    <!-- <a-select-option
      v-for="item in filteredRecipients"
      :key="item.chatid"
      :value="item.chatid"
    >
      <span>{{ item.name }}</span>
      <span style="color: #ccc; font-size: 12px; margin-left: 8px">({{ item.chatid }})</span>
    </a-select-option> -->
  </a-select>

  <!-- 个人模式：左侧部门树 + 右侧人员列表 -->
  <div v-else class="user-selector-container">
    <div class="dept-tree">
      <a-tree
        v-model:selectedKeys="selectedDeptKeys"
        :tree-data="departments"
        :fieldNames="{ key: 'id', title: 'name', parentid: 'parentid' }"
        :loading="loadingDepts"
        @select="handleDeptSelect"
      />
    </div>
    <div class="user-list">
        <!-- 个人模式：已选用户标签 -->
       <div v-if="selectedUserInfos.length" class="selected-users" style="margin-bottom: 12px; display: flex; align-items: center; flex-wrap: wrap;">
  <span style="margin-right: 8px; color: rgba(0,0,0,0.45);">已选：</span>
  <a-button type="link" size="small" @click="clearAllSelected" style="margin-right: 8px; padding: 0;">
    清空
  </a-button>
  <a-tag
    v-for="user in selectedUserInfos"
    :key="user.userid"
    :closable="true"
    @close="removeSelectedUser(user.userid)"
  >
    <a-avatar v-if="user.avatar" :size="16" :src="user.avatar" style="margin-right: 4px;" />
    <span v-else style="margin-right: 4px;"></span> <!-- 留空占位，保持对齐 -->
    {{ user.name }}
  </a-tag>
</div>
      <a-input
        v-model:value="userSearchText"
        placeholder="搜索姓名、账号id"
        allow-clear
        style="margin-bottom: 12px"
        @change="handleUserSearch"
      />
      <a-table
        :row-selection="{
          selectedRowKeys: selectedUserIds,
          onChange: handleUserSelectionChange,
          preserveSelectedRowKeys: true, // 切换部门时保留已选
        }"
        :columns="userColumns"
        :data-source="filteredDeptUsers"
        :loading="loadingUsers"
         :pagination="{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10'],
                showTotal: (total:number) => `共 ${total} 条`,
              }"
        size="small"
        row-key="userid"
        :scroll="{ y: 'calc(100vh - 320px)' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-avatar :size="20" :src="record.avatar" style="margin-right: 8px">
              {{ record.name?.charAt(0) }}
            </a-avatar>
            {{ record.name }}
          </template>
        </template>
      </a-table>
    </div>
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
import { message, } from 'ant-design-vue'
import type{  FormInstance, Rule  } from 'ant-design-vue/es/form'
import { UserOutlined, TeamOutlined, WechatOutlined } from '@ant-design/icons-vue'
import { weChatWorkService, type WeChatUser, type WeChatChat, WeChatMessage } from '@/services/wechatWorkService'

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

// 新增状态
const departments = ref<any[]>([])
const selectedDeptKeys = ref<string[]>([])
const deptUsers = ref<any[]>([])
const selectedUserIds = ref<string[]>([])
const loadingDepts = ref(false)
const loadingUsers = ref(false)
const userSearchText = ref('')


// 人员表格列定义
const userColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '账号id', dataIndex: 'userid', key: 'userid' }
]
const wechatForm = reactive({
  sendType: 'user' as 'user' | 'chat',
  targets: [] as any, // 这里如果是群聊通常是字符串，个人是数组，逻辑在 handleSend 统一处理
  content: props.defaultContent || ''
})

const wechatRules: Record<string, Rule[]>  = {
  sendType: [{ required: true, message: '请选择发送类型' }],
  targets: [{ required: true, message: '请选择接收目标', type: 'array' }],
  content: [{ required: true, message: '请输入内容' }]
}

// 分页配置（响应式）
const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total:any) => `共 ${total} 条`,
})

const allUsers = ref<any[]>([])
const allChats = ref<any[]>([])

const loadAllUsers = async () => {
  // 检查是否有必要加载（比如缓存里已经有了）
  if (allUsers.value.length > 0) return;
  try {
    // 建议：如果根部门 ID 不确定，可以先从 loadDepartments 获取到的第一个部门 ID 试试
    const data = await weChatWorkService.getUserList(1);
    allUsers.value = data || [];
  } catch (error) {
    console.warn('全量用户加载失败，可能会影响已选标签显示', error);
    // 这里可以不弹 message.error，或者根据实际情况处理
  }
}

//数据量大的话需要加缓存
// 已选用户详情（计算属性）
const selectedUserInfos = computed(() => {
  return allUsers.value.filter(user => selectedUserIds.value.includes(user.userid))
})

// 移除已选用户
const removeSelectedUser = (userId: string) => {
  selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
  wechatForm.targets = selectedUserIds.value
  // 表格选中状态会自动更新，因为 selectedRowKeys 绑定了 selectedUserIds
}

// 清空所有已选用户
const clearAllSelected = () => {
  selectedUserIds.value = []
  wechatForm.targets = []
  // 表格的选中状态会自动更新，因为 selectedRowKeys 绑定了 selectedUserIds
}

const loadChatData = async () => {
  loadingRecipients.value = true
  try {
    // 模拟 API 调用
    if (wechatForm.sendType === 'chat') {
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

// 获取部门树
const loadDepartments = async () => {
  loadingDepts.value = true
  try {
    departments.value =await weChatWorkService.getDepartmentList();   
  } catch (error) {
    message.error('加载部门失败')
  } finally {
    loadingDepts.value = false
  }
}

// 点击部门加载人员
const handleDeptSelect = async (selectedKeys: any[]) => {
  if (!selectedKeys.length) return

  const deptId = selectedKeys[0]
  selectedDeptKeys.value = [deptId]
  loadingUsers.value = true
  try {
    // const departmentId:number =deptId as number;
     console.log(deptId);
   deptUsers.value = await weChatWorkService.getUserList(deptId);
  } catch (error) {
    message.error('加载人员失败')
  } finally {
    loadingUsers.value = false
  }
}

// 人员多选变化
const handleUserSelectionChange = (selectedRowKeys: string[]) => {
  selectedUserIds.value = selectedRowKeys
  wechatForm.targets = selectedRowKeys // 同步到表单字段
}

// 人员搜索过滤（基于当前部门人员）
const filteredDeptUsers = computed(() => {
  const keyword = userSearchText.value.toLowerCase().trim()
  if (!keyword) return deptUsers.value
  return deptUsers.value.filter(user =>
    user.name.toLowerCase().includes(keyword) ||
    user.userid.toLowerCase().includes(keyword) ||
    (user.mobile && user.mobile.includes(keyword))
  )
})

const handleTypeChange = async () => {
  wechatForm.targets = wechatForm.sendType === 'user' ? [] : undefined
  recipientSearchText.value = ''
  if (wechatForm.sendType === 'user') {
    await loadDepartments()
    await loadAllUsers()  // 加载所有用户
    // 清空选中部门与人员
    selectedDeptKeys.value = []
    deptUsers.value = []
    selectedUserIds.value = []
  } else {
    loadChatData() // 加载群聊列表
  }
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
    userSearchText.value = ''
    selectedDeptKeys.value = []
 deptUsers.value = []
  selectedUserIds.value = []
  allUsers.value = []          // 清空全量用户
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

// 处理搜索输入
const handleUserSearch = () => {
  // 已通过 computed 自动过滤，无需额外操作
}


watch(() => props.visible, (val) => {
 if (val) {
    if (wechatForm.sendType === 'user') {
      loadDepartments()
      loadAllUsers()
      // 重置已选
      selectedDeptKeys.value = []
      deptUsers.value = []
      selectedUserIds.value = []
      wechatForm.targets = []
    } else {
      loadChatData()
    }
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
.user-selector-container {
  display: flex;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}
.dept-tree {
  width: 180px;
  padding: 8px;
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
}
.user-list {
  flex: 1;
  padding: 12px;
}
</style>