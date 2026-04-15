import { post,get } from '@/api'
import{toCamelCase,ApiResponse} from "@/services/index.ts"
/**
 * 企业微信消息服务
 * 用于发送消息到企业微信的个人或群聊
 */
import axios from 'axios'
import { ok } from 'node:assert'

// 企业微信消息类型
export interface WeChatMessage {
  type: 'user' | 'chat'  // 发送类型：个人或群聊
  targets: string[]      // 目标用户ID或群聊ID
  content: string       // 消息内容
}

// 发送响应
export interface SendResponse {
  code: number
  msg: string
  invaliduser?: string   // 无效的用户ID
  invalidparty?: string // 无效的部门ID
  invalidtag?: string   // 无效的标签ID
  unlicenseduser?: string // 未授权的用户ID
}

// 组织结构
export interface WeChatDepartment {
  id: number
  name: string
  parentid: number
  order: number
 department_leader: number[]
}

// 用户类型
export interface WeChatUser {
  userid: string
  name: string
  department: number[]
  status: number
}

// 群聊类型
export interface WeChatChat {
  chatid: string
  name: string
  owner: string
  memberList: Array<{
    userid: string
    name: string
  }>
}

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 模拟数据 - 实际项目中应该从企业微信获取
// const mockUsers: WeChatUser[] = [
//   { userid: 'zhangsan', name: '张三', department: [1], position: '工程师', mobile: '13800138000', email: 'zhangsan@company.com', avatar: '', status: 1 },
//   { userid: 'lisi', name: '李四', department: [1], position: '产品经理', mobile: '13800138001', email: 'lisi@company.com', avatar: '', status: 1 },
//   { userid: 'wangwu', name: '王五', department: [2], position: '设计师', mobile: '13800138002', email: 'wangwu@company.com', avatar: '', status: 1 },
//   { userid: 'zhaoliu', name: '赵六', department: [2], position: '测试工程师', mobile: '13800138003', email: 'zhaoliu@company.com', avatar: '', status: 1 }
// ]

const mockChats: WeChatChat[] = [
  { chatid: 'chat001', name: '技术部群', owner: 'zhangsan', memberList: [{ userid: 'zhangsan', name: '张三' }, { userid: 'lisi', name: '李四' }] },
  { chatid: 'chat002', name: '产品群', owner: 'lisi', memberList: [{ userid: 'lisi', name: '李四' }, { userid: 'wangwu', name: '王五' }] },
  { chatid: 'chat003', name: '测试群', owner: 'zhaoliu', memberList: [{ userid: 'zhaoliu', name: '赵六' }, { userid: 'zhangsan', name: '张三' }] }
]

class WeChatWorkService {

//获取组织结构

 async getDepartmentList(): Promise<WeChatDepartment[]> {
    try {
       const response = await get<ApiResponse<WeChatDepartment[]>>('/api/WechatWork/departments')
       if (!response.Success) {
        throw new Error(response.Message || '请求失败')
    }
        const data = toCamelCase(response.Data);
        return data;
    } catch (error) {
      console.error('获取部门列表失败:', error)
      throw error
    }
  }

  //获取用户列表  
  async getUserList(deptId:number): Promise<WeChatUser[]> {
     try {
       const response = await post<ApiResponse<WeChatUser[]>>('/api/WechatWork/users', {departmentId:deptId})
       if (!response.Success) {
        throw new Error(response.Message || '请求失败')
    }
        const data = toCamelCase(response.Data);
        return data;
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    }
  }

  // 获取群聊列表  
  async getChatList(): Promise<WeChatChat[]> {
    try {
      // 实际项目中应该调用企业微信API获取群聊列表
      // const response = await api.get('/wecom/chats')
      // return response.data
      
      // 模拟API调用
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockChats), 300)
      })
    } catch (error) {
      console.error('获取群聊列表失败:', error)
      throw error
    }
  }

  // 发送消息到企业微信
   
async sendMessage(message: WeChatMessage) {
    try {
     const response = await post<ApiResponse<WeChatDepartment[]>>('/WechatWork/send',
        {users:message.targets,content:message.content})
       if (!response.Success) {
        throw new Error(response.Message || '请求失败')
    }
    } catch (error) {
      console.error('发送失败:', error)
      throw error
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword: string): Promise<WeChatUser[]> {
    const allUsers = await this.getUserList(1)
    if (!keyword) return allUsers
    
    return allUsers.filter(user => 
      user.name.includes(keyword) || 
      user.userid.includes(keyword)
    )
  }

  /**
   * 搜索群聊
   */
  async searchChats(keyword: string): Promise<WeChatChat[]> {
    const allChats = await this.getChatList()
    if (!keyword) return allChats
    
    return allChats.filter(chat => 
      chat.name.includes(keyword) || 
      chat.chatid.includes(keyword)
    )
  }
}

// 导出服务实例
export const weChatWorkService = new WeChatWorkService()
export default weChatWorkService
