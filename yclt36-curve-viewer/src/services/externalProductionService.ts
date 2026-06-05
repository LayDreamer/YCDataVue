import {
  Service,
  PMCRequestDto,
  ExternalProduction,
  ExternalProductionPickMaterial,
  ExternalProductionWarehousing,
} from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const externalProductionService = {
  // ==================== 外产_生产 ====================
  async getExternalProductionList(requestDto?: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.getExternalProductionList(requestDto || new PMCRequestDto());
      return response.data || [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询外产生产列表失败:' + errorMessage);
    }
  },

  async addOrUpdateExternalProductionList(list: ExternalProduction[]): Promise<any> {
    try {
      const response = await service.addOrUpdateExternalProductionList(list);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('新增或更新外产生产数据失败:' + errorMessage);
    }
  },

  async deleteExternalProductionList(ids: string[]): Promise<any> {
    try {
      const response = await service.deleteExternalProductionList(ids);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('删除外产生产数据失败:' + errorMessage);
    }
  },

  // ==================== 外产_领料 ====================
  async getExternalProductionPickMaterialList(requestDto?: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.getExternalProductionPickMaterialList(requestDto || new PMCRequestDto());
      return response.data || [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询外产领料列表失败:' + errorMessage);
    }
  },

  async addOrUpdateExternalProductionPickMaterialList(list: ExternalProductionPickMaterial[]): Promise<any> {
    try {
      const response = await service.addOrUpdateExternalProductionPickMaterialList(list);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('新增或更新外产领料数据失败:' + errorMessage);
    }
  },

  async deleteExternalProductionPickMaterialList(ids: string[]): Promise<any> {
    try {
      const response = await service.deleteExternalProductionPickMaterialList(ids);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('删除外产领料数据失败:' + errorMessage);
    }
  },

  // ==================== 外产_入库 ====================
  async getExternalProductionWarehousingList(requestDto?: PMCRequestDto): Promise<any[]> {
    try {
      const response = await service.getExternalProductionWarehousingList(requestDto || new PMCRequestDto());
      return response.data || [];
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询外产入库列表失败:' + errorMessage);
    }
  },

  async addOrUpdateExternalProductionWarehousingList(list: ExternalProductionWarehousing[]): Promise<any> {
    try {
      const response = await service.addOrUpdateExternalProductionWarehousingList(list);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('新增或更新外产入库数据失败:' + errorMessage);
    }
  },

  async deleteExternalProductionWarehousingList(ids: string[]): Promise<any> {
    try {
      const response = await service.deleteExternalProductionWarehousingList(ids);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('删除外产入库数据失败:' + errorMessage);
    }
  },
};
