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
         
      // 返回数据（空列表也正常返回）
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      } 
      throw new Error("获取销售控制列表失败:"+errorMessage);
    }
  },

  async getSchedulingAnalysisList(requestDto: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.schedulingAnalysisList(requestDto);
      console.log(response.data);
      // 返回数据
      return response.data ;
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      } 
      throw new Error("查询排产分析列表失败"+errorMessage);
    }
  },
}