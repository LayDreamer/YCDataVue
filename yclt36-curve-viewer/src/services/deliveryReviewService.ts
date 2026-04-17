import { get, post, put, del } from '@/api'
import { Service, PMCRequestDto,PMCDeliveryReview } from '@/api-generated/api';
import { toCamelCase, ApiResponse } from "@/services/index.ts"
import { PMCProductInfo, ProductDataAssemblyList} from '@/views/PMC/DeliveryReview/types';
import { RequestDto } from '@/views/PMC/types';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const deliveryReviewService = { 
  // 获取产品信息列表
  async getPMCProductInfoList(requestDto: PMCRequestDto): Promise<PMCProductInfo[]> {
     try {
       const response = await service.productListInfo(requestDto);
        return response.data;
    } catch (error) {
      console.error('获取产品信息列表失败:', error)
      throw error
    }
  },
 
    // 获取资料装配清单
  async getProductDataAssemblyList(requestDto: PMCRequestDto): Promise<ProductDataAssemblyList[]> {
    try {
      const response = await service.productDataAssemblyList(requestDto);
      return response.data;
    } catch (error) {
      console.error('获取资料装配清单失败:', error)
      throw error
    }
  },
    // 检查装配清单是否存在线圈货号
  async checkIsExistInAssemblyList(requestDto: PMCRequestDto): Promise<any> {
    try {
      const response = await service.checkAssemblyList(requestDto);
      return response.data;
    } catch (error) {
      console.error('检查装配清单是否存在线圈货号失败:', error)
      throw error
    }
  },

  async getPMCDeliveryReviewList(): Promise<any> {
    try {
      const response = await service.pMCDeliveryReviewList();
      return response.data;
    } catch (error) {
      console.error('查询评审记录失败:', error);
      throw error;
    }
  },

  async addPMCDeliveryReview(reviewData: PMCDeliveryReview): Promise<any> {
    try {
      const response = await service.addPMCDeliveryReview(reviewData);
      return response.data;
    } catch (error) {
      console.error('保存评审记录失败:', error);
      throw error;
    }
  }
}