import {
  Service,
  PMCRequestDto,
  ExternalProduction,
  ExternalProductionPickMaterial,
  ExternalProductionWarehousing,
  ExternalProductionBOM,
  ExternalProductionShipment
} from '@/api-generated/api';
import { collectAllPagedItems, normalizePagedResult, type PagedResult, toServiceError, withPaging } from './paging';
import { apiHttp } from '@/api/http';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl, apiHttp);

export const externalProductionService = {
  // ==================== 外产_生产 ====================
  async getExternalProductionPage(requestDto?: PMCRequestDto): Promise<PagedResult<ExternalProduction>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getExternalProductionList(request);
      return normalizePagedResult<ExternalProduction>(response.data, request);
    } catch (error) {
      throw toServiceError(error, '查询外产生产列表失败:');
    }
  },

  async getExternalProductionList(requestDto?: PMCRequestDto): Promise<ExternalProduction[]> {
    return collectAllPagedItems((request) => this.getExternalProductionPage(request), requestDto);
  },

  async addOrUpdateExternalProductionList(list: ExternalProduction[]): Promise<unknown> {
    try {
      const response = await service.addOrUpdateExternalProductionList(list);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '新增或更新外产生产数据失败');
    }
  },

  async deleteExternalProductionList(ids: string[]): Promise<unknown> {
    try {
      const response = await service.deleteExternalProductionList(ids);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '删除外产生产数据失败:');
    }
  },

  // 根据编号查询单条外产生产数据
  async getExternalProductionByNo(no: string | undefined): Promise<ExternalProduction | null> {
    try {
      if (!no) return null;
      const response = await service.getExternalProductionByNo(no);
      return response.data || null;
    } catch (error) {
      throw toServiceError(error, '查询外产生产数据失败:');
    }
  },

  // ==================== 外产_BOM 保存 ====================
  async saveExternalProductionBOM(
    username: string | undefined,
    schedulingNo: string | undefined,
    bomList: ExternalProductionBOM[]
  ): Promise<unknown> {
    try {
      const response = await service.saveExternalProductionBOM(username, schedulingNo, bomList);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '保存外产BOM失败:');
    }
  },

  // 按货号保存BOM
  async saveExternalProductionBOMByPartNo(
    username: string | undefined,
    schedulingNo: string | undefined,
    partNo: string
  ): Promise<unknown> {
    try {
      if (!partNo) {
        throw new Error('货号不能为空');
      }
      const bomList = [new ExternalProductionBOM({ 货号: partNo })];
      const response = await service.saveExternalProductionBOM(username, schedulingNo, bomList);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '保存外产BOM失败:');
    }
  },

  // 删除外产BOM
  async deleteExternalProductionBOMList(ids: string[]): Promise<unknown> {
    try {
      const response = await service.deleteExternalProductionBOMList(ids);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '删除外产BOM失败:');
    }
  },

  // ==================== 外产_BOM 查询 ====================
  async getExternalProductionBOMPage(requestDto?: PMCRequestDto): Promise<PagedResult<ExternalProductionBOM>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getExternalProductionBOMList(request);
      return normalizePagedResult<ExternalProductionBOM>(response.data, request);
    } catch (error) {
      throw toServiceError(error, '查询外产BOM列表失败:');
    }
  },

  async getExternalProductionBOMList(requestDto?: PMCRequestDto): Promise<ExternalProductionBOM[]> {
    return collectAllPagedItems((request) => this.getExternalProductionBOMPage(request), requestDto);
  },

  // ==================== 外产_领料 ====================
  async getExternalProductionPickMaterialPage(
    requestDto?: PMCRequestDto
  ): Promise<PagedResult<ExternalProductionPickMaterial>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getExternalProductionPickMaterialList(request);
      return normalizePagedResult<ExternalProductionPickMaterial>(response.data, request);
    } catch (error) {
      throw toServiceError(error, '查询外产领料列表失败:');
    }
  },

  async getExternalProductionPickMaterialList(requestDto?: PMCRequestDto): Promise<ExternalProductionPickMaterial[]> {
    return collectAllPagedItems((request) => this.getExternalProductionPickMaterialPage(request), requestDto);
  },

  async addOrUpdateExternalProductionPickMaterialList(list: ExternalProductionPickMaterial[]): Promise<unknown> {
    try {
      const response = await service.addOrUpdateExternalProductionPickMaterialList(list);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '新增或更新外产领料数据失败');
    }
  },

  async deleteExternalProductionPickMaterialList(ids: string[]): Promise<unknown> {
    try {
      const response = await service.deleteExternalProductionPickMaterialList(ids);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '删除外产领料数据失败:');
    }
  },

  // ==================== 外产_入库 ====================
  async getExternalProductionWarehousingPage(
    requestDto?: PMCRequestDto
  ): Promise<PagedResult<ExternalProductionWarehousing>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getExternalProductionWarehousingList(request);
      return normalizePagedResult<ExternalProductionWarehousing>(response.data, request);
    } catch (error) {
      throw toServiceError(error, '查询外产入库列表失败:');
    }
  },

  async getExternalProductionWarehousingList(requestDto?: PMCRequestDto): Promise<ExternalProductionWarehousing[]> {
    return collectAllPagedItems((request) => this.getExternalProductionWarehousingPage(request), requestDto);
  },

  async addOrUpdateExternalProductionWarehousingList(list: ExternalProductionWarehousing[]): Promise<unknown> {
    try {
      const response = await service.addOrUpdateExternalProductionWarehousingList(list);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '新增或更新外产入库数据失败');
    }
  },

  async deleteExternalProductionWarehousingList(ids: string[]): Promise<unknown> {
    try {
      const response = await service.deleteExternalProductionWarehousingList(ids);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '删除外产入库数据失败:');
    }
  },

  // ==================== 外产_发运 ====================
  async getExternalProductionShipmentPage(
    requestDto?: PMCRequestDto
  ): Promise<PagedResult<ExternalProductionShipment>> {
    try {
      const request = withPaging(requestDto);
      const response = await service.getExternalProductionShipmentList(request);
      return normalizePagedResult<ExternalProductionShipment>(response.data, request);
    } catch (error) {
      throw toServiceError(error, '查询外产发运列表失败:');
    }
  },

  async getExternalProductionShipmentList(requestDto?: PMCRequestDto): Promise<ExternalProductionShipment[]> {
    return collectAllPagedItems((request) => this.getExternalProductionShipmentPage(request), requestDto);
  },

  async addOrUpdateExternalProductionShipmentList(list: ExternalProductionShipment[]): Promise<unknown> {
    try {
      const response = await service.addOrUpdateExternalProductionShipmentList(list);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '新增或更新外产发运数据失败');
    }
  },

  async deleteExternalProductionShipmentList(ids: string[]): Promise<unknown> {
    try {
      const response = await service.deleteExternalProductionShipmentList(ids);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '删除外产发运数据失败:');
    }
  }
};
