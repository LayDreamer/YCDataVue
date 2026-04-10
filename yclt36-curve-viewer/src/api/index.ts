import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

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