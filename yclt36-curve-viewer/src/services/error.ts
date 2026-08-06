import { ApiException } from '@/api-generated/api';

/**
 * 将任意异常统一为带状态码的 Error，便于上层统一提示。
 * - ApiException：解析响应体提取服务端 message
 * - 普通 Error：沿用其 message
 */
export function toServiceError(error: unknown, fallback: string): Error & { status?: number } {
  let message = fallback;
  let status: number | undefined;

  if (error instanceof ApiException) {
    status = error.status;
    try {
      const body = JSON.parse(error.response || '{}');
      message = body.message || body.Message || body.title || message;
    } catch {
      message = error.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message || message;
  }

  if (status === 409 && message === fallback) {
    message = '数据已被其他用户修改，请刷新后重试';
  }

  const result = new Error(message) as Error & { status?: number };
  result.status = status;
  return result;
}
