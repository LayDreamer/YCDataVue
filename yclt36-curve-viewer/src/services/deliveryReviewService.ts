import { get, post, put, del } from '@/api'
import{toCamelCase,ApiResponse} from "@/services/index.ts"
import { PMCProductInfo, ProductDataAssemblyList,PMCDeliveryReview} from '@/views/PMC/DeliveryReview/types';
import { RequestDto } from '@/views/PMC/types';

export const deliveryReviewService = { 
  // 获取产品信息列表
  async getPMCProductInfoList(requestDto: RequestDto): Promise<PMCProductInfo[]> {
     try {
       const response = await post<ApiResponse<PMCProductInfo[]>>('/PMC/ProductListInfo', requestDto)
        // const data = toCamelCase(response.Data);
        return response.Data;
    } catch (error) {
      console.error('获取产品信息列表失败:', error)
      throw error
    }
  },
 
    // 获取资料装配清单
  async getProductDataAssemblyList(requestDto: RequestDto): Promise<ProductDataAssemblyList[]> {
    try {
      const response = await post<ApiResponse<ProductDataAssemblyList[]>>('/PMC/ProductDataAssemblyList', requestDto)
      // 将返回数据中的下划线字段转为驼峰（注意中文键不会被转换）
      return response.Data
    } catch (error) {
      console.error('获取资料装配清单失败:', error)
      throw error
    }
  }
,
    // 检查装配清单是否存在线圈货号
  async checkIsExistInAssemblyList(requestDto: RequestDto): Promise<any> {
    try {
      const response = await post<ApiResponse<any>>('/PMC/CheckAssemblyList', requestDto)
      return response.Data
    } catch (error) {
      console.error('检查装配清单是否存在线圈货号失败:', error)
      throw error
    }
  },

async getPMCDeliveryReviewList(): Promise<any> {
  try {
    const response = await post<ApiResponse<any>>('/PMC/PMCDeliveryReviewList');
    return response.Data;
    } catch (error) {
      console.error('查询评审记录失败:', error);
      throw error;
    }
  },

  async addPMCDeliveryReview(reviewData: PMCDeliveryReview): Promise<any> {
  try {
    const response = await post<ApiResponse<PMCDeliveryReview>>('/PMC/AddPMCDeliveryReview', reviewData);
    return response.Data;
    } catch (error) {
      console.error('保存评审记录失败:', error);
      throw error;
    }
  }
}

