<template>
  <a-modal
    v-model:open="visible"
    title="个人信息"
    width="640px"
    :footer="null"
    :destroy-on-close="false"
    @cancel="handleCancel"
  >
    <a-tabs v-model:activeKey="activeKey" tab-position="left" class="account-tabs">
      <a-tab-pane key="profile" tab="个人信息">
        <a-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          layout="vertical"
          @finish="handleUpdateProfile"
        >
          <a-form-item label="用户名">
            <a-input :value="userName" disabled />
          </a-form-item>
          <a-form-item name="email" label="邮箱">
            <a-input
              v-model:value="profileForm.email"
              placeholder="请输入邮箱地址"
              allow-clear
              :max-length="100"
            />
          </a-form-item>
          <a-form-item name="phoneNumber" label="手机号">
            <a-input
              v-model:value="profileForm.phoneNumber"
              placeholder="请输入手机号"
              allow-clear
              :max-length="20"
            />
          </a-form-item>
          <a-form-item class="form-actions">
            <a-button type="primary" html-type="submit" :loading="profileLoading">
              保存资料
            </a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>

      <a-tab-pane key="password" tab="修改密码">
        <a-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          layout="vertical"
          @finish="handleChangePassword"
        >
          <a-form-item name="oldPassword" label="当前密码">
            <a-input-password
              v-model:value="passwordForm.oldPassword"
              placeholder="请输入当前密码"
              autocomplete="current-password"
            />
          </a-form-item>
          <a-form-item name="newPassword" label="新密码">
            <a-input-password
              v-model:value="passwordForm.newPassword"
              placeholder="请输入新密码"
              autocomplete="new-password"
            />
          </a-form-item>
          <a-form-item name="confirmPassword" label="确认新密码">
            <a-input-password
              v-model:value="passwordForm.confirmPassword"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
            />
          </a-form-item>
          <a-form-item class="form-actions">
            <a-button type="primary" html-type="submit" :loading="passwordLoading">
              修改密码
            </a-button>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { user, updateProfile, changePassword } = useAuth()

const visible = ref(props.open)
const activeKey = ref('profile')
const profileFormRef = ref()
const passwordFormRef = ref()
const profileLoading = ref(false)
const passwordLoading = ref(false)

const userName = ref(user.value?.userName || '')

const profileForm = reactive({
  email: '',
  phoneNumber: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

watch(() => props.open, (val) => {
  visible.value = val
  if (val) {
    resetProfileForm()
    activeKey.value = 'profile'
  }
})

watch(visible, (val) => {
  emit('update:open', val)
})

function resetProfileForm() {
  profileForm.email = user.value?.email || ''
  profileForm.phoneNumber = user.value?.phoneNumber || ''
  userName.value = user.value?.userName || ''
}

function handleCancel() {
  visible.value = false
  passwordFormRef.value?.resetFields()
}

const validateEmail = (_rule: any, value: string) => {
  if (!value) return Promise.resolve()
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailReg.test(value) ? Promise.resolve() : Promise.reject(new Error('邮箱格式不正确'))
}

const validatePhone = (_rule: any, value: string) => {
  if (!value) return Promise.resolve()
  const phoneReg = /^1[3-9]\d{9}$/
  return phoneReg.test(value) ? Promise.resolve() : Promise.reject(new Error('手机号格式不正确'))
}

const validateConfirmPassword = (_rule: any, value: string) => {
  if (!value) return Promise.reject(new Error('请再次输入新密码'))
  return value === passwordForm.newPassword ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致'))
}

const profileRules: Record<string, Rule[]> = {
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  phoneNumber: [
    { validator: validatePhone, trigger: 'blur' }
  ]
}

const passwordRules: Record<string, Rule[]> = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 4, max: 32, message: '密码长度需在 4-32 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 4, max: 32, message: '密码长度需在 4-32 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

/** 提交更新个人资料 */
async function handleUpdateProfile() {
  try {
    profileLoading.value = true
    await updateProfile({
      email: profileForm.email.trim() || undefined,
      phoneNumber: profileForm.phoneNumber.trim() || undefined
    })
    message.success('个人资料已更新')
  } catch (err: any) {
    const msg = err?.response?.data?.Message || err?.response?.data?.message || err?.message || '更新资料失败'
    message.error(msg)
  } finally {
    profileLoading.value = false
  }
}

/** 提交修改密码 */
async function handleChangePassword() {
  try {
    passwordLoading.value = true
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    message.success('密码修改成功')
    passwordFormRef.value?.resetFields()
    activeKey.value = 'profile'
  } catch (err: any) {
    const msg = err?.response?.data?.Message || err?.response?.data?.message || err?.message || '修改密码失败'
    message.error(msg)
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
.account-tabs :deep(.ant-tabs-content) {
  padding-left: 16px;
}

.form-actions {
  margin-bottom: 0;
  padding-top: 8px;
}
</style>
