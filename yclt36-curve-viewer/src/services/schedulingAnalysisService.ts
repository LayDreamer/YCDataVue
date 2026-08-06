import { Service, PMCRequestDto } from '@/api-generated/api';
import { apiHttp } from '@/api/http';
import { toServiceError } from '@/services/error';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl, apiHttp);

export const schedulingAnalysisService = {
  // 排产分析返回动态 BOM 行；调用方以 `|| {}` 兜底并访问任意字段，无法用固定接口安全收敛，保留 any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getSchedulingAnalysisList(requestDto: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.schedulingAnalysisList(requestDto);
      // 返回数据
      return response.data;
    } catch (error) {
      throw toServiceError(error, '查询排产分析列表失败');
    }
  }
};
