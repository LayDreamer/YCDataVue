import { get, post, put, del } from '@/api'
import { Service, PMCRequestDto,PMCDeliveryReview } from '@/api-generated/api';
import { toCamelCase, ApiResponse } from "@/services/index.ts"
import { PMCProductInfo, ProductDataAssemblyList} from '@/views/PMC/DeliveryReview/types';
import { RequestDto } from '@/views/PMC/types';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const deliveryReviewService = { 
  // 根据外销合同用户产品表->获取评审记录列表
  async convertToPMCDeliveryReviewList(requestDto: PMCRequestDto): Promise<PMCDeliveryReview[]> {
     try {
       const response = await service.convertToPMCDeliveryReviewList(requestDto);
        return response.data ?? [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('获取评审记录列表失败:'+errorMessage);
    }
  },
 
    // 获取资料装配清单
  async getProductDataAssemblyList(requestDto: PMCRequestDto): Promise<ProductDataAssemblyList[]> {
    try {
      const response = await service.productDataAssemblyList(requestDto);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('获取资料装配清单失败:'+errorMessage);
    }
  },
  
    // 检查装配清单是否存在线圈货号
  async checkIsExistInAssemblyList(requestDto: PMCRequestDto): Promise<any> 
  {
    try {
      const response = await service.checkAssemblyList(requestDto);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error("检查装配清单是否存在线圈货号失败:"+errorMessage);
    }
  },

  async  getPMCDeliveryReviewList(requestDto: PMCRequestDto): Promise<any> {
    try {
      const response = await service.pMCDeliveryReviewList(requestDto);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error("查询评审记录失败"+errorMessage);
    }
  },

  async addPMCDeliveryReview(reviewData: PMCDeliveryReview): Promise<any> {
    try {
      const response = await service.addPMCDeliveryReview(reviewData);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error("保存评审记录失败"+errorMessage);
    }
  }
}