import { TOKEN_KEY } from '@/constants/storage';
import { handleUnauthorized } from './unauthorized';

/**
 * 带鉴权头的 fetch 适配器，供 NSwag 生成的 Service 复用。
 * 与 axios 实例共用同一套 localStorage[TOKEN_KEY] 读取逻辑，
 * 使得手写 axios 与 NSwag Service 两套 HTTP 通道的鉴权行为一致。
 *
 * 注意：401 时不要吞掉响应——NSwag 依赖原始 Response 抛出 ApiException，
 * 这里仅做副作用（登出 + 跳登录页）。
 */
export const authenticatedFetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await window.fetch(url, { ...init, headers });
  if (res.status === 401) {
    handleUnauthorized();
  }
  return res;
};

// NSwag Service 构造参数 { fetch } 的形状
export const apiHttp = { fetch: authenticatedFetch };
