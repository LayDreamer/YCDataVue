import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// ========== 请求拦截器：自动附加 Token ==========
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 直接读取，避免循环依赖 useAuth
    const token = localStorage.getItem('V_AUTH_TOKEN')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ========== 响应拦截器：处理 401 等业务错误 ==========
let isRedirectingToLogin = false

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 未授权：清空登录态并跳转登录页
    if (error.response?.status === 401) {
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        localStorage.removeItem('V_AUTH_TOKEN')
        localStorage.removeItem('V_AUTH_USER')
        // 使用 hash 模式路由
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login'
        }
        // 短延迟后重置标志位，允许后续请求再次处理
        setTimeout(() => {
          isRedirectingToLogin = false
        }, 1000)
      }
    }
    return Promise.reject(error)
  }
)

// GET请求
export const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get<T>(url, { params })
  return response.data
}

// POST请求
export const post = async <T>(url: string, data?: unknown) => {
  const response = await apiClient.post<T>(url, data)
  return response.data
}

// PUT请求
export const put = async <T>(url: string, data?: unknown) => {
  const response = await apiClient.put<T>(url, data)
  return response.data
}

// DELETE请求
export const del = async <T>(url: string) => {
  const response = await apiClient.delete<T>(url)
  return response.data
}

export default apiClient
