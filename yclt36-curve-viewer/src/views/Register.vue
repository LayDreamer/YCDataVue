<template>
  <div class="register-page">
    <div class="bg-decor">
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
    </div>

    <div class="register-container">
      <a-card class="register-card" :bordered="false">
        <div class="form-header">
          <div class="header-icon">
            <UserAddOutlined />
          </div>
          <h2 class="form-title">注册新账号</h2>
          <p class="form-tip">完成以下信息以创建您的账号</p>
        </div>

        <a-form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
          class="register-form"
          @finish="handleRegister"
        >
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item name="userName" label="用户名">
                <a-input
                  v-model:value="formState.userName"
                  size="large"
                  placeholder="请输入用户名"
                  allow-clear
                >
                  <template #prefix>
                    <UserOutlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item name="displayName" label="显示名称">
                <a-input
                  v-model:value="formState.displayName"
                  size="large"
                  placeholder="请输入显示名称（选填）"
                  allow-clear
                >
                  <template #prefix>
                    <IdcardOutlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item name="password" label="密码">
            <a-input-password
              v-model:value="formState.password"
              size="large"
              placeholder="请输入密码（至少 6 位）"
            >
              <template #prefix>
                <LockOutlined class="input-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-form-item name="confirmPassword" label="确认密码">
            <a-input-password
              v-model:value="formState.confirmPassword"
              size="large"
              placeholder="请再次输入密码"
            >
              <template #prefix>
                <SafetyOutlined class="input-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item name="email" label="邮箱">
                <a-input
                  v-model:value="formState.email"
                  size="large"
                  placeholder="example@yc.com"
                  allow-clear
                >
                  <template #prefix>
                    <MailOutlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item name="phoneNumber" label="手机号">
                <a-input
                  v-model:value="formState.phoneNumber"
                  size="large"
                  placeholder="请输入手机号"
                  allow-clear
                >
                  <template #prefix>
                    <PhoneOutlined class="input-icon" />
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item>
            <a-button
              type="primary"
              size="large"
              html-type="submit"
              block
              :loading="loading"
              class="register-btn"
            >
              注 册
            </a-button>
          </a-form-item>

          <div class="form-footer">
            已有账号？
            <router-link to="/login" class="login-link">返回登录</router-link>
          </div>
        </a-form>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SafetyOutlined,
  UserAddOutlined
} from '@ant-design/icons-vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const formRef = ref()
const loading = ref(false)

const formState = reactive({
  userName: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  email: '',
  phoneNumber: ''
})

/** 二次密码校验 */
const validateConfirmPassword = async (_rule: Rule, value: string) => {
  if (value && value !== formState.password) {
    throw new Error('两次输入的密码不一致')
  }
}

const rules: Record<string, Rule[]> = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度需在 2-30 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需在 6-32 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phoneNumber: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

/** 提交注册 */
async function handleRegister() {
  try {
    loading.value = true
    await register({
      userName: formState.userName.trim(),
      password: formState.password,
      displayName: formState.displayName.trim() || undefined,
      email: formState.email.trim() || undefined,
      phoneNumber: formState.phoneNumber.trim() || undefined
    })

    message.success('注册成功，请登录')
    router.replace('/login')
  } catch (err: any) {
    const msg =
      err?.response?.data?.Message ||
      err?.response?.data?.message ||
      err?.message ||
      '注册失败，请稍后重试'
    message.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  overflow: hidden;
  padding: 24px 0;
}

/* 大面积蓝色径向光晕背景 */
.register-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 75% 25%, rgba(167, 199, 255, 0.55) 0%, rgba(200, 220, 255, 0.30) 30%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 20% 80%, rgba(190, 215, 255, 0.45) 0%, rgba(220, 235, 255, 0.20) 35%, transparent 65%),
    radial-gradient(ellipse 50% 40% at 50% 100%, rgba(180, 210, 255, 0.35) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: float 16s ease-in-out infinite;
}
.bg-blob-1 {
  width: 720px;
  height: 720px;
  background: radial-gradient(circle, #9bc1ff 0%, rgba(155, 193, 255, 0.4) 30%, transparent 65%);
  top: -200px;
  right: -150px;
  opacity: 0.7;
}
.bg-blob-2 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, #b5d2ff 0%, rgba(181, 210, 255, 0.35) 35%, transparent 70%);
  bottom: -180px;
  left: -120px;
  opacity: 0.65;
  animation-delay: -6s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}

.register-container {
  position: relative;
  z-index: 1;
  width: 560px;
  max-width: calc(100vw - 32px);
}

.register-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(31, 78, 162, 0.12),
    0 4px 12px rgba(31, 78, 162, 0.06);
  padding: 8px;
}
.register-card :deep(.ant-card-body) {
  padding: 36px 40px;
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}
.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.35);
}
.form-title {
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}
.form-tip {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.register-form :deep(.ant-form-item-label > label) {
  color: #334155;
  font-weight: 500;
}
.input-icon {
  color: #94a3b8;
}
.register-btn {
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #3b82f6, #0ea5e9);
  border: none;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
  transition: all 0.25s ease;
}
.register-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.45);
  background: linear-gradient(90deg, #2563eb, #0284c7);
}
.form-footer {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}
.login-link {
  color: #2563eb;
  font-weight: 500;
  margin-left: 4px;
}

@media (max-width: 576px) {
  .register-card :deep(.ant-card-body) {
    padding: 24px 20px;
  }
}
</style>
