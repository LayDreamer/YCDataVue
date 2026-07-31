import { post } from '@/api'
import { toCamelCase, ApiResponse } from '@/services'

/** 登录请求参数 */
export interface LoginRequest {
  userName: string
  password: string
  rememberMe?: boolean
}

/** 登录成功返回的用户信息 */
export interface UserInfo {
  id?: string
  userName?: string
  displayName?: string
  role?: string
  email?: string
  phoneNumber?: string
}

/** 登录结果 */
export interface LoginResult {
  success?: boolean
  message?: string
  token?: string
  user?: UserInfo
}

/** 注册请求参数 */
export interface RegisterRequest {
  userName: string
  password: string
  displayName?: string
  email?: string
  phoneNumber?: string
  role?: string
}

/** 修改密码请求参数 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/** 更新个人资料请求参数 */
export interface UpdateProfileRequest {
  displayName?: string
  email?: string
  phoneNumber?: string
}

/**
 * 鉴权相关 API 服务
 * 后端对应接口：API.Controllers.AuthController
 *   - POST /api/Auth/login
 *   - POST /api/Auth/register
 *   - POST /api/Auth/change-password
 *   - POST /api/Auth/update-profile
 */
export const authService = {
  /**
   * 用户登录
   * @param params 登录参数（用户名、密码、是否记住我）
   */
  async login(params: LoginRequest): Promise<LoginResult> {
    const response = await post<ApiResponse<LoginResult>>('/api/Auth/login', {
      UserName: params.userName,
      Password: params.password,
      RememberMe: !!params.rememberMe
    })

    if (!response.Success) {
      throw new Error(response.Message || '登录失败')
    }

    // 后端 PascalCase -> 前端 camelCase
    return toCamelCase(response.Data)
  },

  /**
   * 用户注册
   * @param params 注册参数
   */
  async register(params: RegisterRequest): Promise<void> {
    const response = await post<ApiResponse<unknown>>('/api/Auth/register', {
      UserName: params.userName,
      Password: params.password,
      DisplayName: params.displayName,
      Email: params.email,
      PhoneNumber: params.phoneNumber,
      Role: params.role
    })

    if (!response.Success) {
      throw new Error(response.Message || '注册失败')
    }
  },

  /**
   * 修改密码
   * @param params 旧密码、新密码
   */
  async changePassword(params: ChangePasswordRequest): Promise<void> {
    const response = await post<ApiResponse<unknown>>('/api/Auth/change-password', {
      OldPassword: params.oldPassword,
      NewPassword: params.newPassword
    })

    if (!response.Success) {
      throw new Error(response.Message || '修改密码失败')
    }
  },

  /**
   * 更新个人资料（仅传需要修改的字段）
   * @param params 显示名、邮箱、手机号
   */
  async updateProfile(params: UpdateProfileRequest): Promise<UserInfo> {
    const response = await post<ApiResponse<UserInfo>>('/api/Auth/update-profile', {
      DisplayName: params.displayName,
      Email: params.email,
      PhoneNumber: params.phoneNumber
    })

    if (!response.Success) {
      throw new Error(response.Message || '更新资料失败')
    }

    return toCamelCase(response.Data) as UserInfo
  }
}

export default authService
