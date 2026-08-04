import { Service, PMCRequestDto, WorkOrderSalesControl, WorkOrderSalesControlDetail } from '@/api-generated/api';
import { collectAllPagedItems, normalizePagedResult, type PagedResult, toServiceError, withPaging } from './paging';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const workOrderSalesControlService = {
  // ==================== 工单销控表 ====================
  // 获取工单销控表列表
  async getWorkOrderSalesControlPage(requestDto?: PMCRequestDto): Promise<PagedResult<WorkOrderSalesControl>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getWorkOrderSalesControlList(request);
      return normalizePagedResult<WorkOrderSalesControl>(response.data, request);
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询工单销控表列表失败:' + errorMessage);
    }
  },

  async getWorkOrderSalesControlList(requestDto?: PMCRequestDto): Promise<WorkOrderSalesControl[]> {
    return collectAllPagedItems(
      (request) => this.getWorkOrderSalesControlPage(request),
      requestDto,
    );
  },

  // 新增或更新工单销控表数据
  async addOrUpdateWorkOrderSalesControlList(list: WorkOrderSalesControl[]): Promise<any> {
    try {
      const response = await service.addOrUpdateWorkOrderSalesControlList(list);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw toServiceError(error, '新增或更新工单销控表数据失败');
    }
  },

  // 删除工单销控表数据
  async deleteWorkOrderSalesControlList(ids: string[]): Promise<any> {
    try {
      const response = await service.deleteWorkOrderSalesControlList(ids);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('删除工单销控表数据失败:' + errorMessage);
    }
  },

  // ==================== 工单销控表明细 ====================
  // 获取工单销控表明细列表
  async getWorkOrderSalesControlDetailPage(requestDto?: PMCRequestDto): Promise<PagedResult<WorkOrderSalesControlDetail>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getWorkOrderSalesControlDetailList(request);
      return normalizePagedResult<WorkOrderSalesControlDetail>(response.data, request);
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询工单销控表明细列表失败:' + errorMessage);
    }
  },

  async getWorkOrderSalesControlDetailList(requestDto?: PMCRequestDto): Promise<WorkOrderSalesControlDetail[]> {
    return collectAllPagedItems(
      (request) => this.getWorkOrderSalesControlDetailPage(request),
      requestDto,
    );
  },

  // 新增或更新工单销控表明细数据
  async addOrUpdateWorkOrderSalesControlDetailList(list: WorkOrderSalesControlDetail[]): Promise<any> {
    try {
      const response = await service.addOrUpdateWorkOrderSalesControlDetailList(list);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw toServiceError(error, '新增或更新工单销控表明细数据失败');
    }
  },

  // 删除工单销控表明细数据
  async deleteWorkOrderSalesControlDetailList(ids: string[]): Promise<any> {
    try {
      const response = await service.deleteWorkOrderSalesControlDetailList(ids);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('删除工单销控表明细数据失败:' + errorMessage);
    }
  }
};
