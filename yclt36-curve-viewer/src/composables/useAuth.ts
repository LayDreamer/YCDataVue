import { ref, computed, readonly } from 'vue'
import { authService, LoginRequest, RegisterRequest, LoginResult, UserInfo, ChangePasswordRequest, UpdateProfileRequest } from '@/services/authService'
import { erpService, ERPLoginRequest } from '@/services/erpService'

// ========== 本地存储 Key ==========
const TOKEN_KEY = 'V_AUTH_TOKEN'
const USER_KEY = 'V_AUTH_USER'

// ========== 全局响应式状态（单例） ==========
const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
const user = ref<UserInfo | null>(loadUser())

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToken(t: string) {
  token.value = t
  if (t) {
    localStorage.setItem(TOKEN_KEY, t)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function saveUser(u: UserInfo | null) {
  user.value = u
  if (u) {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * 鉴权相关的组合式函数
 * 整个应用共享同一份登录状态（基于 ref 单例）
 */
export function useAuth() {
  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => {
    if (!user.value) return ''
    return user.value.displayName || user.value.userName || ''
  })
  const role = computed(() => user.value?.role || '')

  /**
   * 登录
   */
  async function login(params: LoginRequest): Promise<LoginResult> {
    const result = await authService.login(params)
    if (result.token) {
      saveToken(result.token)
    }
    if (result.user) {
      saveUser(result.user)
    }
    return result
  }

  /**
   * 注册
   */
  async function register(params: RegisterRequest): Promise<void> {
    await authService.register(params)
  }

  /**
   * ERP 账号登录：校验账号密码后写入本地登录态
   */
  async function erpLogin(params: ERPLoginRequest): Promise<void> {
    const erpUser = await erpService.validateUser(params)

    const fakeToken = 'ERP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
    saveToken(fakeToken)
    saveUser({
      id: erpUser.username,
      userName: erpUser.username,
      displayName: erpUser.displayName || erpUser.username,
      role: 'ERPUser'
    })
  }

  /**
   * 临时登录（无需账号密码，直接写入本地 token 与用户信息进入系统）
   * 仅供本地调试/演示使用
   */
  function quickLogin() {
    const fakeToken = 'TEMP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
    saveToken(fakeToken)
    saveUser({
      id: 'guest',
      userName: 'guest',
      displayName: '临时访客',
      role: 'Guest',
      email: 'guest@local'
    })
  }

  /**
   * 退出登录
   */
  function logout() {
    saveToken('')
    saveUser(null)
  }

  /**
   * 修改密码
   */
  async function changePassword(params: ChangePasswordRequest): Promise<void> {
    await authService.changePassword(params)
  }

  /**
   * 更新个人资料，并同步本地登录态
   */
  async function updateProfile(params: UpdateProfileRequest): Promise<UserInfo> {
    const updated = await authService.updateProfile(params)
    saveUser({ ...user.value, ...updated } as UserInfo)
    return updated
  }

  /**
   * 获取当前 Token（供 axios 拦截器使用）
   */
  function getToken(): string {
    return token.value
  }

  return {
    // 状态（只读暴露，防止外部直接修改）
    isLoggedIn: readonly(isLoggedIn),
    displayName: readonly(displayName),
    role: readonly(role),
    user: readonly(user),
    token: readonly(token),
    // 方法
    login,
    register,
    erpLogin,
    quickLogin,
    logout,
    changePassword,
    updateProfile,
    getToken
  }
}
