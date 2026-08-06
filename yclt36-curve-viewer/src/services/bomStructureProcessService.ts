import { Service } from '@/api-generated/api';
import { apiHttp } from '@/api/http';
import { toServiceError } from '@/services/error';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl, apiHttp);

export const bomStructureProcessService = {
  // ==================== BOM结构工序 ====================
  // 获取BOM结构工序列表
  // 返回动态行：调用方按多种字段名（执行车间/工序车间/workshop 等）兜底取值，且可能返回纯字符串数组，
  // 无法用固定接口安全收敛，保留 any[]（与 schedulingAnalysisService 同类数据一致）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getBOMStructureProcessList(): Promise<any[]> {
    try {
      const response = await service.getBOMStructureProcessList();
      return response.data;
    } catch (error) {
      throw toServiceError(error, '查询BOM结构工序列表失败:');
    }
  }
};
