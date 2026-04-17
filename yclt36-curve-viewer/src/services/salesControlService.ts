import { get, post, put, del } from '@/api'
import { Service, PMCRequestDto } from '@/api-generated/api';
import { toCamelCase, ApiResponse } from "@/services/index.ts"
import { PMCSalesControl } from '@/views/PMC/types';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const salesControlService = {
  // 获取销售控制列表
  async addPMCSalesControlList(): Promise<PMCSalesControl[]> {
    try {
      const response = await service.addPMCSalesControlList();
      return response.data;
    } catch (error) {
      console.error('添加销售控制列表失败:', error);
      throw error;
    }
  },

  // async getPMCSalesControlList(requestDto: PMCRequestDto): Promise<PMCSalesControl[]> {
  //   try {
  //     const response =await service.getPMCSalesControlList(requestDto);
  //     return response.data;
  //     } catch (error) {
  //       console.error('查询销售控制列表失败:', error);
  //       throw error;
  //     }
  //   },

  async getSchedulingAnalysisList(requestDto: PMCRequestDto): Promise<any[]> {
    try {
      //const response = await post<ApiResponse<any[]>>('/api/PMC/SchedulingAnalysisList',requestDto);
      const response = await service.schedulingAnalysisList(requestDto);
      return response.data;
    } catch (error) {
      console.error('查询调度分析列表失败:', error);
      throw error;
    }
  },


  // async getPMCProductData(requestDto: PMCRequestDto): Promise<any> {
  //   try {
  //     // const response = await post<ApiResponse<any>>('/api/PMC/GetPMCProductData',requestDto);
  //     const response = await service.getPMCProductData(requestDto);
  //     return response.data;
  //   } catch (error) {
  //     console.error('查询产品资料失败:', error);
  //     throw error;
  //   }
  // },
}

