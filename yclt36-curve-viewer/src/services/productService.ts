import { get, post, put, del } from '@/api'

export interface Product {
  id: number
  name: string
  price: number
  category: string
}


export const productService = {
  // 获取所有产品
  getAll: () => get<Product[]>('/products'),
  
  // 获取单个产品
  getById: (id: number) => get<Product>(`/products/${id}`),
  
  // 创建产品
  create: (product: Partial<Product>) => post<Product>('/products', product),
  
  // 更新产品
  update: (id: number, product: Partial<Product>) => put<Product>(`/products/${id}`, product),
  
  // 删除产品
  delete: (id: number) => del(`/products/${id}`)
}