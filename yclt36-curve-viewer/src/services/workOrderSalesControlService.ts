import { Service, PMCRequestDto, WorkOrderSalesControl, WorkOrderSalesControlDetail } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const workOrderSalesControlService = {
  // ==================== 工单销控表 ====================
  // 获取工单销控表列表
  async getWorkOrderSalesControlList(requestDto?: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.getWorkOrderSalesControlList(requestDto || new PMCRequestDto());
      return response.data || [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询工单销控表列表失败:' + errorMessage);
    }
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
      throw new Error('新增或更新工单销控表数据失败:' + errorMessage);
    }
  },

  // ==================== 工单销控表明细 ====================
  // 获取工单销控表明细列表
  async getWorkOrderSalesControlDetailList(requestDto?: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.getWorkOrderSalesControlDetailList(requestDto || new PMCRequestDto());
      return response.data || [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询工单销控表明细列表失败:' + errorMessage);
    }
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
      throw new Error('新增或更新工单销控表明细数据失败:' + errorMessage);
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
