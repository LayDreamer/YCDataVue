import { Service, PMCRequestDto, WorkOrderSalesControl } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const workOrderSalesControlService = {
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
  }
};
