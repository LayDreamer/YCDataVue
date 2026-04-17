import { post } from '@/api'
import { ApiResponse } from "@/services/index.ts"
import { PMCWorkOrder, Service } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const workOrderService = {
  // 获取工单列表
  async getPMCWorkOrderList(): Promise<any[]> {
    try {
      const response =await service.getPMCWorkOrderList();
      return response.data;
    } catch (error) {
      console.error('查询工单列表失败:', error);
      throw error;
    }
  },
  
  // 添加工单
  async addPMCWorkOrder(requestDto: PMCWorkOrder): Promise<any> {
    debugger;
    try { 
      var response=await service.addPMCWorkOrder(requestDto);
      return response.data; // 成功时返回 true
    } catch (error) {
      console.error('添加工单失败:', error);
      throw error;
    }
  },
  
  // 更新工单
  async updatePMCWorkOrder(requestDto: PMCWorkOrder): Promise<any> {
    try {
       var response=await service.updatePMCWorkOrder(requestDto);
      return response.data;
    } catch (error) {
      console.error('更新工单失败:', error);
      throw error;
    }
  },
  
// 删除工单
//   async deleteWorkOrder(requestDto: RequestDto): Promise<any> {
//     try {
//       const response = await post<ApiResponse<any>>('/PMC/DeleteWorkOrder', requestDto);
//       return response.Data;
//     } catch (error) {
//       console.error('删除工单失败:', error);
//       throw error;
//     }
//   },
  
  // 获取工单详情
//   async getWorkOrderDetail(requestDto: RequestDto): Promise<any> {
//     try {
//       const response = await post<ApiResponse<any>>('/PMC/GetWorkOrderDetail', requestDto);
//       return response.Data;
//     } catch (error) {
//       console.error('查询工单详情失败:', error);
//       throw error;
//     }
//   },
}