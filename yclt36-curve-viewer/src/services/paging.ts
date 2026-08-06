import { PMCRequestDto } from '@/api-generated/api';

export { toServiceError } from './error';

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

export function normalizePagedResult<T>(data: unknown, request?: PMCRequestDto): PagedResult<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: data.length,
      page: request?.page || 1,
      pageSize: request?.pageSize || data.length || 20
    };
  }

  // 后端分页响应（可能为 PascalCase 或 camelCase），字段形状不确定
  const record = data as Record<string, unknown> | null | undefined;
  const items = record?.items ?? record?.Items ?? [];
  return {
    items: Array.isArray(items) ? (items as T[]) : [],
    total: Number(record?.total ?? record?.Total ?? (Array.isArray(items) ? items.length : 0) ?? 0),
    page: Number(record?.page ?? record?.Page ?? request?.page ?? 1),
    pageSize: Number(record?.pageSize ?? record?.PageSize ?? request?.pageSize ?? 20)
  };
}

export async function collectAllPagedItems<T>(
  loadPage: (request: PMCRequestDto) => Promise<PagedResult<T>>,
  request?: PMCRequestDto,
  maxItems = 10_000
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
