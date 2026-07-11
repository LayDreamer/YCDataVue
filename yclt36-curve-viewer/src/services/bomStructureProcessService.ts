import { Service } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

export const bomStructureProcessService = {
  // ==================== BOM结构工序 ====================
  // 获取BOM结构工序列表
  async getBOMStructureProcessList(): Promise<any> {
    try {
      const response = await service.getBOMStructureProcessList();
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error('查询BOM结构工序列表失败:' + errorMessage);
    }
  }
};
