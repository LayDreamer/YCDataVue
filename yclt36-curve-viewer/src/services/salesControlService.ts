import { get, post, put, del } from '@/api'
import{toCamelCase,ApiResponse} from "@/services/index.ts"
import { PMCSalesControl, RequestDto } from '@/views/PMC/types';

export const salesControlService = {
  // 获取销售控制列表
async addPMCSalesControlList(requestDto: RequestDto): Promise<PMCSalesControl[]> {
  try {
    const response = await post<ApiResponse<PMCSalesControl[]>>('/PMC/AddPMCSalesControlList',requestDto);
    return response.Data;
    } catch (error) {
      console.error('查询销售控制列表失败:', error);
      throw error;
    }
  },

async getPMCSalesControlList(requestDto: RequestDto): Promise<PMCSalesControl[]> {
  try {
    const response = await post<ApiResponse<PMCSalesControl[]>>('/PMC/GetPMCSalesControlList',requestDto);
    return response.Data;
    } catch (error) {
      console.error('查询销售控制列表失败:', error);
      throw error;
    }
  },
async getSchedulingAnalysisList(requestDto: RequestDto): Promise<any[]> {
  try {
    const response = await post<ApiResponse<any[]>>('/PMC/SchedulingAnalysisList',requestDto);
    return response.Data;
    } catch (error) {
      console.error('查询调度分析列表失败:', error);
      throw error;
    }
  },



async getPMCProductData(requestDto: RequestDto): Promise<any> {
  try {
    const response = await post<ApiResponse<any>>('/PMC/GetPMCProductData',requestDto);
    return response.Data;
    } catch (error) {
      console.error('查询产品资料失败:', error);
      throw error;
    }
  },
}

