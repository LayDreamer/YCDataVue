import { camelCase } from 'lodash';

export interface ApiResponse<T> {
  Success: boolean;
  Message: string;
  Data: T;
  Timestamp: string;
}

// 安全的递归转换函数 - 带有深度限制和类型检查
// 泛型 T 保持原形状：运行时仅转换对象键为 camelCase，不改数据类型
export function toCamelCase<T>(obj: T, depth = 0, maxDepth = 50): T {
  // 深度保护 - 防止无限递归
  if (depth > maxDepth) {
    console.warn('toCamelCase: 达到最大递归深度，数据可能存在循环引用');
    return obj;
  }

  // 处理 null 和 undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 处理基本类型 - 直接返回
  if (typeof obj !== 'object') {
    return obj;
  }

  // 处理日期对象 - 保持原样
  if (obj instanceof Date) {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item, depth + 1, maxDepth)) as T;
  }

  // 处理普通对象
  if (typeof obj === 'object') {
    const source = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(source)) {
      // 跳过原型链属性
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue;
      }

      // 跳过函数和 Symbol
      const value = source[key];
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }

      // 转换键名
      try {
        const camelKey = camelCase(key);
        result[camelKey] = toCamelCase(value, depth + 1, maxDepth);
      } catch {
        // 如果转换失败，保留原键名
        result[key] = value;
      }
    }

    return result as T;
  }

  return obj;
}
