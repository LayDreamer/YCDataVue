import { post } from '@/api'
import { ApiResponse } from "@/services/index.ts"
import { PMCRequestDto, PMCWorkOrder, Service } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const workOrderService = {
  // 获取工单列表
  async getPMCWorkOrderList(): Promise<any[]> {
    try {
      const response =await service.getPMCWorkOrderList();
      return response.data;
    } catch (error: any) {    
      // 尝试从错误响应中提取后端返回的错误信息
      let errorMessage = '';
      
      // 处理 HTTP 错误响应（如 BadRequest）
      if (error.response) {
        // 尝试获取响应数据，支持多种嵌套层级
        const responseData = error.response.data || error.response;                 
          // 响应数据可能是纯字符串
        errorMessage = responseData;       
      }
      throw new Error("查询工单列表失败:"+errorMessage);
    }
  },
   async addPMCWorkOrder(requestDto: PMCRequestDto): Promise<any> {
    try { 
      const response = await service.addPMCWorkOrder(requestDto);
      return response.data;
    } catch (error: any) {      
  
      // 尝试从错误响应中提取后端返回的错误信息
      let errorMessage = '';
      
      // 处理 HTTP 错误响应（如 BadRequest）
      if (error.response) {
        // 尝试获取响应数据，支持多种嵌套层级
        const responseData = error.response.data || error.response;                 
          // 响应数据可能是纯字符串
        errorMessage = responseData;       
      }
      throw new Error("添加工单失败:"+errorMessage);
    }
  },
  // 添加工单
  async addPMCWorkOrderByRequest(requestDto: PMCWorkOrder): Promise<any> {
    try { 
      const response = await service.addPMCWorkOrderByRequest(requestDto);
      return response.data;
    } catch (error: any) {      
  
      // 尝试从错误响应中提取后端返回的错误信息
      let errorMessage = '';
      
      // 处理 HTTP 错误响应（如 BadRequest）
      if (error.response) {
        // 尝试获取响应数据，支持多种嵌套层级
        const responseData = error.response.data || error.response;                 
          // 响应数据可能是纯字符串
        errorMessage = responseData;       
      }
      throw new Error("添加工单失败:"+errorMessage);
    }
  },
  
  // 更新工单
  async updatePMCWorkOrder(requestDto: PMCWorkOrder): Promise<any> {
    try {
       var response=await service.updatePMCWorkOrder(requestDto);
      return response.data;
    } catch (error: any) {
      // 尝试从错误响应中提取后端返回的错误信息
      let errorMessage = '';
      
      // 处理 HTTP 错误响应（如 BadRequest）
      if (error.response) {
        // 尝试获取响应数据，支持多种嵌套层级
        const responseData = error.response.data || error.response;                 
          // 响应数据可能是纯字符串
        errorMessage = responseData;       
      }
      throw new Error("更新工单失败:"+errorMessage);
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