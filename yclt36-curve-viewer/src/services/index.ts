import { camelCase } from 'lodash';

export interface ApiResponse<T> {
  Success: boolean
  Message: string
  Data: T
  Timestamp: string
}

// 安全的递归转换函数 - 带有深度限制和类型检查
export function toCamelCase(obj: any, depth = 0, maxDepth = 50): any {
  // 深度保护 - 防止无限递归
  if (depth > maxDepth) {
    console.warn('toCamelCase: 达到最大递归深度，数据可能存在循环引用')
    return obj
  }
  
  // 处理 null 和 undefined
  if (obj === null || obj === undefined) {
    return obj
  }
  
  // 处理基本类型 - 直接返回
  if (typeof obj !== 'object') {
    return obj
  }
  
  // 处理日期对象 - 保持原样
  if (obj instanceof Date) {
    return obj
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item, depth + 1, maxDepth))
  }
  
  // 处理普通对象
  if (typeof obj === 'object') {
    const result: Record<string, any> = {}
    
    for (const key of Object.keys(obj)) {
      // 跳过原型链属性
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue
      }
      
      // 跳过函数和 Symbol
      if (typeof obj[key] === 'function' || typeof obj[key] === 'symbol') {
        continue
      }
      
      // 转换键名
      try {
        const camelKey = camelCase(key)
        result[camelKey] = toCamelCase(obj[key], depth + 1, maxDepth)
      } catch (error) {
        // 如果转换失败，保留原键名
        result[key] = obj[key]
      }
    }
    
    return result
  }
  
  return obj
}