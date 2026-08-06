import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TOKEN_KEY } from '@/constants/storage';

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// ========== 请求拦截器：自动附加 Token ==========
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 直接读取，避免循环依赖 useAuth
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== 响应拦截器：处理 401 等业务错误 ==========
import { handleUnauthorized } from './unauthorized';

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 未授权：同步登录态并跳转登录页
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// GET请求
export const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
};

// POST请求
export const post = async <T>(url: string, data?: unknown) => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};

// PUT请求
export const put = async <T>(url: string, data?: unknown) => {
  const response = await apiClient.put<T>(url, data);
  return response.data;
};

// DELETE请求
export const del = async <T>(url: string) => {
  const response = await apiClient.delete<T>(url);
  return response.data;
};

export default apiClient;
