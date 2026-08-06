<template>
  <div class="login-page">
    <!-- 背景动画层 -->
    <div class="bg-decor">
      <div class="bg-blob bg-blob-1"></div>
      <div class="bg-blob bg-blob-2"></div>
      <div class="bg-blob bg-blob-3"></div>
    </div>

    <div class="login-container">
      <!-- 左侧品牌展示区 -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <AntCloudOutlined />
          </div>
          <h1 class="brand-title">永创数据管理系统</h1>
          <p class="brand-subtitle">智能制造 · 数据驱动 · 全流程协同</p>
        </div>
        <div class="brand-footer">© 2026 永创数据管理系统 v1.1.0</div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-wrap">
        <div class="login-card">
          <div class="form-header">
            <h2 class="form-title">欢迎登录</h2>
            <p class="form-tip">请使用您的账号登录系统</p>
          </div>

          <a-form
            ref="formRef"
            :model="formState"
            :rules="rules"
            layout="vertical"
            class="login-form"
            @finish="handleLogin"
          >
            <a-form-item name="userName" label="用户名">
              <a-input
                v-model:value="formState.userName"
                size="large"
                placeholder="请输入用户名"
                allow-clear
                autocomplete="username"
              >
                <template #prefix>
                  <UserOutlined class="input-icon" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item name="password" label="密码">
              <a-input-password
                v-model:value="formState.password"
                size="large"
                placeholder="请输入密码"
                autocomplete="current-password"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <div class="form-options">
              <a-checkbox v-model:checked="formState.rememberMe">记住我</a-checkbox>
              <a class="forgot-link" @click="onForgot">忘记密码？</a>
            </div>

            <a-form-item class="submit-item">
              <a-button type="primary" size="large" html-type="submit" block :loading="loading" class="login-btn">
                登 录
              </a-button>
            </a-form-item>

            <div class="quick-login">
              <a-divider plain class="quick-divider">或</a-divider>
              <div class="quick-actions">
                <a-button size="large" class="quick-btn" :loading="quickLoading" @click="handleQuickLogin">
                  <ThunderboltOutlined />
                  临时登录
                </a-button>
                <router-link to="/erp-login" class="quick-btn erp-login-link">
                  <ClusterOutlined />
                  ERP 账号登录
                </router-link>
              </div>
            </div>

            <div class="form-footer">
              还没有账号？
              <router-link to="/register" class="register-link">立即注册</router-link>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  UserOutlined,
  LockOutlined,
  AntCloudOutlined,
  ThunderboltOutlined,
  ClusterOutlined
} from '@ant-design/icons-vue';
import type { Rule } from 'ant-design-vue/es/form';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { login, quickLogin } = useAuth();

const formRef = ref();
const loading = ref(false);
const quickLoading = ref(false);

const formState = reactive({
  userName: '',
  password: '',
  rememberMe: false
});

const rules: Record<string, Rule[]> = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度需在 2-30 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 32, message: '密码长度需在 4-32 个字符', trigger: 'blur' }
  ]
};

/** 从任意异常中提取可读错误信息：axios 响应体优先，其次 Error.message，最后兜底文案 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { Message?: string; message?: string } } }).response?.data;
    const serverMsg = data?.Message || data?.message;
    if (serverMsg) return serverMsg;
  }
  return err instanceof Error ? err.message || fallback : fallback;
}

/** 提交登录 */
async function handleLogin() {
  try {
    loading.value = true;
    const result = await login({
      userName: formState.userName.trim(),
      password: formState.password,
      rememberMe: formState.rememberMe
    });

    if (result.success === false) {
      message.error(result.message || '登录失败');
      return;
    }

    message.success(result.message || '登录成功');

    // 跳转到来源页或首页
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (err) {
    message.error(getErrorMessage(err, '登录失败，请检查用户名或密码'));
  } finally {
    loading.value = false;
  }
}

/** 忘记密码（占位） */
function onForgot() {
  message.info('请联系系统管理员重置密码');
}

/** 临时登录：无需账号密码直接进入系统 */
async function handleQuickLogin() {
  try {
    quickLoading.value = true;
    quickLogin();
    message.success('已临时登录，正在进入系统...');
    const redirect = (route.query.redirect as string) || '/';
    router.replace(redirect);
  } catch (err) {
    message.error(err instanceof Error ? err.message : '临时登录失败');
  } finally {
    quickLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      ellipse 80% 70% at 70% 20%,
      rgba(191, 219, 254, 0.55) 0%,
      rgba(219, 234, 254, 0.25) 40%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 70% 60% at 15% 85%,
      rgba(191, 219, 254, 0.45) 0%,
      rgba(219, 234, 254, 0.18) 45%,
      transparent 75%
    ),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 50%, #e6f0ff 100%);
  overflow: hidden;
}

/* 背景装饰：更明显的蓝色光斑 */
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
  filter: blur(100px);
  animation: float 18s ease-in-out infinite;
}
.bg-blob-1 {
  width: 760px;
  height: 760px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.55) 0%, rgba(96, 165, 250, 0.2) 35%, transparent 70%);
  top: -220px;
  right: -180px;
  opacity: 0.75;
}
.bg-blob-2 {
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgba(125, 211, 252, 0.5) 0%, rgba(125, 211, 252, 0.18) 40%, transparent 75%);
  bottom: -200px;
  left: -160px;
  opacity: 0.7;
  animation-delay: -7s;
}
.bg-blob-3 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.45) 0%, rgba(147, 197, 253, 0.15) 45%, transparent 75%);
  top: 55%;
  left: 28%;
  opacity: 0.55;
  animation-delay: -12s;
}
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, -35px) scale(1.12);
  }
}

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  width: 980px;
  max-width: calc(100vw - 32px);
  height: 580px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 20px;
  box-shadow:
    0 24px 70px rgba(30, 64, 175, 0.14),
    0 8px 24px rgba(30, 64, 175, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

/* 左侧品牌区 */
.login-brand {
  flex: 1;
  padding: 52px 44px;
  color: #1e293b;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(239, 246, 255, 0.55) 55%,
    rgba(219, 234, 254, 0.55) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.login-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 25%, rgba(147, 197, 253, 0.35) 0, transparent 55%),
    radial-gradient(circle at 85% 80%, rgba(191, 219, 254, 0.3) 0, transparent 55%);
  pointer-events: none;
}
.login-brand::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(147, 197, 253, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 197, 253, 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}
.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
}
.brand-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-bottom: 30px;
  box-shadow:
    0 12px 28px rgba(59, 130, 246, 0.45),
    0 0 0 8px rgba(59, 130, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  animation: logoPulse 4s ease-in-out infinite;
}
@keyframes logoPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 12px 28px rgba(59, 130, 246, 0.45),
      0 0 0 8px rgba(59, 130, 246, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
  50% {
    transform: scale(1.03);
    box-shadow:
      0 16px 34px rgba(59, 130, 246, 0.5),
      0 0 0 12px rgba(59, 130, 246, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
}
.brand-title {
  font-size: 30px;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: 1.5px;
  color: #0f172a;
  text-align: center;
}
.brand-subtitle {
  font-size: 14px;
  color: #475569;
  margin: 0;
  letter-spacing: 1px;
  text-align: center;
}
.brand-footer {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

/* 右侧表单区 */
.login-form-wrap {
  flex: 1.05;
  padding: 52px 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.login-card {
  width: 100%;
  background: transparent;
}
.form-header {
  margin-bottom: 30px;
}
.login-form :deep(.submit-item) {
  margin-bottom: 12px;
}
.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}
.form-tip {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.login-form :deep(.ant-form-item-label > label) {
  color: #334155;
  font-weight: 500;
}
.login-form :deep(.ant-input-affix-wrapper) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #dbeafe;
  transition: all 0.25s ease;
}
.login-form :deep(.ant-input-affix-wrapper:hover) {
  border-color: #93c5fd;
  background: #ffffff;
}
.login-form :deep(.ant-input-affix-wrapper-focused) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background: #ffffff;
}
.login-form :deep(.ant-input) {
  background: transparent;
}
.input-icon {
  color: #94a3b8;
}
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -4px 0 20px 0;
}
.forgot-link {
  font-size: 13px;
  color: #2563eb;
  cursor: pointer;
  transition: color 0.2s ease;
}
.forgot-link:hover {
  color: #1d4ed8;
}
.login-btn {
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #0ea5e9 100%);
  background-size: 200% auto;
  border: none;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
  transition: all 0.3s ease;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.45);
  background-position: right center;
}
.form-footer {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  margin-top: 10px;
}

/* 临时登录区 */
.quick-login {
  margin-top: 6px;
}
.quick-divider {
  font-size: 12px;
  color: #94a3b8;
  margin: 6px 0 14px 0 !important;
}
.quick-actions {
  display: flex;
  gap: 12px;
}
.quick-btn {
  flex: 1;
  height: 42px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed #93c5fd;
  color: #2563eb;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.25s ease;
}
.quick-btn:hover:not(:disabled) {
  color: #1d4ed8;
  border-color: #3b82f6;
  background: rgba(219, 234, 254, 0.75);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.2);
}
.erp-login-link {
  text-decoration: none;
}
.erp-login-link:hover {
  color: #1d4ed8;
}
.register-link {
  color: #2563eb;
  font-weight: 600;
  margin-left: 4px;
  transition: color 0.2s ease;
}
.register-link:hover {
  color: #1d4ed8;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: calc(100vw - 24px);
    height: auto;
    min-height: auto;
  }
  .login-brand {
    padding: 32px 24px;
  }
  .brand-title {
    font-size: 24px;
  }
  .brand-logo {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
  .login-form-wrap {
    padding: 32px 24px;
  }
}
</style>
