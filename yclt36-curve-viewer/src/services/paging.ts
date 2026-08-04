import { ApiException, PMCRequestDto } from '@/api-generated/api';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function withPaging(request?: PMCRequestDto, defaultPageSize = 10): PMCRequestDto {
  const result = new PMCRequestDto(request?.toJSON ? request.toJSON() : request);
  result.page = Math.max(1, request?.page || 1);
  result.pageSize = Math.min(100, Math.max(1, request?.pageSize || defaultPageSize));
  return result;
}

export function normalizePagedResult<T>(data: any, request?: PMCRequestDto): PagedResult<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: request?.page || 1,
      pageSize: request?.pageSize || data.length || 20,
    };
  }

  const items = data?.items ?? data?.Items ?? [];
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(data?.total ?? data?.Total ?? items.length ?? 0),
    page: Number(data?.page ?? data?.Page ?? request?.page ?? 1),
    pageSize: Number(data?.pageSize ?? data?.PageSize ?? request?.pageSize ?? 20),
  };
}

export async function collectAllPagedItems<T>(
  loadPage: (request: PMCRequestDto) => Promise<PagedResult<T>>,
  request?: PMCRequestDto,
  maxItems = 10_000,
): Promise<T[]> {
  const baseRequest = withPaging(request, 100);
  const items: T[] = [];
  let page = 1;

  while (items.length < maxItems) {
    const pageRequest = withPaging(baseRequest, 100);
    pageRequest.page = page;
    pageRequest.pageSize = 100;
    const result = await loadPage(pageRequest);
    items.push(...result.items);

    if (result.items.length === 0 || items.length >= result.total) break;
    page += 1;
  }

  return items.slice(0, maxItems);
}

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
