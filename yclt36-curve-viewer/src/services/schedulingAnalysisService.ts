import { get, post, put, del } from '@/api'
import { Service, PMCRequestDto } from '@/api-generated/api';
import { toCamelCase, ApiResponse } from "@/services/index.ts"
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const schedulingAnalysisService = {
  async getSchedulingAnalysisList(requestDto: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.schedulingAnalysisList(requestDto);
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
