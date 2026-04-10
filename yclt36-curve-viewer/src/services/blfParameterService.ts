
import { post } from '@/api'
import{toCamelCase,ApiResponse} from "@/services/index.ts"
export interface BLFParameter {
  id: string
  workOrderNumber: string
  blfNumber: string
  coilResistance: string
  insulationResistance: string
  insulationStrength: string
  withstandVoltageStrength: string
  internalLeakage: string
  externalLeakage: string
  currentFlowRateCurve: CurrentFlowRate[]
  startingCurrent: string
  maximumFlowRate: string
  hysteresis: string
  pressureFlowRateCurve: PressureFlowRate[]
  closedLoopFluctuation1: string
  closedLoopFluctuation2: string
  closedLoopFluctuation3: string
  closedLoopFluctuation4: string
  createDate: Date
  modifyDate: Date
}
/**
 * 电流流量
 */
export interface CurrentFlowRate {
  id: string
  current: number
  flowRate: number
}

/**
 * 压力流量
 */
export interface PressureFlowRate {
  id: string
  pressure: number
  flowRate: number
}
// 响应包装类型


export const blfParameterService = {
  // 获取所有产品
  getAll: async (): Promise<BLFParameter[]> => {
    const response = await post<ApiResponse<BLFParameter[]>>('/blfParameter/list')
    if (!response.Success) {
      throw new Error(response.Message || '请求失败')
    }
    const data = toCamelCase(response.Data);
    return data;
  },
  
  // 获取单个产品
  getByNumber: async (id: string): Promise<BLFParameter> => {
     const response = await post<ApiResponse<BLFParameter>>('/blfParameter/detail', {
      number: id  // 改为 number 字段
    })
     if (!response.Success) {
      throw new Error(response.Message || '请求失败')
    }
    const data = toCamelCase(response.Data);
    return data;
  }
}