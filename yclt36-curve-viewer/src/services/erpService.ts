import { get, post } from '@/api';
import { toCamelCase, ApiResponse } from '@/utils/api';

/** ERP 用户信息 */
export interface ERPUser {
  username?: string;
  displayName?: string;
}

/** ERP 登录请求参数 */
export interface ERPLoginRequest {
  username: string;
  password: string;
}

/**
 * ERP 相关 API 服务
 * 后端对应接口：API.Controllers.ERPController
 *   - GET  /api/ERP/users
 *   - POST /api/ERP/validate
 */
export const erpService = {
  /**
   * 获取所有 ERP 用户名列表
   */
  async getAllUsernames(): Promise<string[]> {
    const response = await get<ApiResponse<string[]>>('/api/ERP/users');

    if (!response.Success) {
      throw new Error(response.Message || '获取用户列表失败');
    }

    return toCamelCase(response.Data) as string[];
  },

  /**
   * 校验 ERP 用户账号密码
   * @param params 用户名、密码
   */
  async validateUser(params: ERPLoginRequest): Promise<ERPUser> {
    const response = await post<ApiResponse<ERPUser>>('/api/ERP/validate', {
      Username: params.username,
      Upwd: params.password
    });

    if (!response.Success) {
      throw new Error(response.Message || '登录失败');
    }

    return toCamelCase(response.Data) as ERPUser;
  }
};

export default erpService;
