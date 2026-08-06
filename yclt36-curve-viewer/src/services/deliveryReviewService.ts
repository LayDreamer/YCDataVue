import {
  ApiException,
  PMCDeliveryReview,
  PMCRequestDto,
  ProductionTypeOverride,
  ReturnDeliveryReviewRequestDto,
  ReturnDeliveryReviewResultDto,
  Service
} from '@/api-generated/api';
import { ProductDataAssemblyList } from '@/views/PMC/DeliveryReview/types';
import { normalizePagedResult, type PagedResult, toServiceError, withPaging } from './paging';
import { apiHttp } from '@/api/http';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl, apiHttp);

export const deliveryReviewService = {
  // 根据外销合同用户产品表->获取评审记录列表
  async convertToPMCDeliveryReviewList(requestDto: PMCRequestDto): Promise<PagedResult<PMCDeliveryReview>> {
    try {
      const pagedRequest = withPaging(requestDto);
      const response = await service.convertToPMCDeliveryReviewList(pagedRequest);
      return normalizePagedResult<PMCDeliveryReview>(response.data, pagedRequest);
    } catch (error) {
      throw toServiceError(error, '获取评审记录列表失败:');
    }
  },

  // 获取资料装配清单
  async getProductDataAssemblyList(requestDto: PMCRequestDto): Promise<ProductDataAssemblyList[]> {
    try {
      const response = await service.productDataAssemblyList(requestDto);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '获取资料装配清单失败:');
    }
  },

  // 检查装配清单是否存在线圈货号
  async checkIsExistInAssemblyList(requestDto: PMCRequestDto): Promise<unknown> {
    try {
      const response = await service.checkAssemblyList(requestDto);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '检查装配清单是否存在线圈货号失败:');
    }
  },

  async getPMCDeliveryReviewList(requestDto: PMCRequestDto): Promise<PagedResult<PMCDeliveryReview>> {
    try {
      const pagedRequest = withPaging(requestDto);
      const response = await service.pMCDeliveryReviewList(pagedRequest);
      return normalizePagedResult<PMCDeliveryReview>(response.data, pagedRequest);
    } catch (error) {
      throw toServiceError(error, '查询评审记录失败');
    }
  },

  async addPMCDeliveryReview(reviewData: PMCDeliveryReview): Promise<unknown> {
    try {
      const response = await service.addPMCDeliveryReview(reviewData);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '保存评审记录失败');
    }
  },

  // 根据关键字模糊查询线圈货号
  async searchCoilsByKeyword(requestDto: PMCRequestDto): Promise<unknown> {
    try {
      const response = await service.searchCoilsByKeyword(requestDto);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '模糊查询线圈货号失败:');
    }
  },

  async returnDeliveryReview(reviewId: string): Promise<ReturnDeliveryReviewResultDto> {
    try {
      const response = await service.returnDeliveryReview(new ReturnDeliveryReviewRequestDto({ reviewId }));
      if (!response.success || !response.data) {
        throw new Error(response.message || '退回待评审失败');
      }
      return response.data;
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : '退回待评审失败，请稍后重试';
      let status: number | undefined;

      if (error instanceof ApiException) {
        status = error.status;
        try {
          const responseData = JSON.parse(error.response || '{}');
          errorMessage = responseData.Message || responseData.message || errorMessage;
        } catch {
          // 保留 NSwag 返回的原始错误信息
        }
      }

      const serviceError = new Error(errorMessage) as Error & { status?: number };
      serviceError.status = status;
      throw serviceError;
    }
  },

  // 新增或修改生产类型覆盖（按合同号+排产编号+货号匹配）
  async saveProductionTypeOverride(override: ProductionTypeOverride): Promise<unknown> {
    try {
      const response = await service.saveProductionTypeOverride(override);
      if (!response.success) {
        throw new Error(response.message || '修改生产类型失败');
      }
      return response.data;
    } catch (error) {
      throw toServiceError(error, '修改生产类型失败');
    }
  },

  // 根据关键字模糊查询产品资料（不限线圈）
  async searchProductDataByKeyword(requestDto: PMCRequestDto): Promise<unknown> {
    try {
      const response = await service.searchProductDataByKeyword(requestDto);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '模糊查询产品资料失败:');
    }
  }
};
