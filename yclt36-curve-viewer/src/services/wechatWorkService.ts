/**
 * 企业微信消息服务
 * 用于发送消息到企业微信的个人或群聊
 */
import { toCamelCase, ApiResponse } from "@/services/index.ts"
import { Service, SendMessageDto, DepartmentRequestDto } from '@/api-generated/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl);

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


const mockChats: WeChatChat[] = [
  { chatid: 'chat001', name: '技术部群', owner: 'zhangsan', memberList: [{ userid: 'zhangsan', name: '张三' }, { userid: 'lisi', name: '李四' }] },
  { chatid: 'chat002', name: '产品群', owner: 'lisi', memberList: [{ userid: 'lisi', name: '李四' }, { userid: 'wangwu', name: '王五' }] },
  { chatid: 'chat003', name: '测试群', owner: 'zhaoliu', memberList: [{ userid: 'zhaoliu', name: '赵六' }, { userid: 'zhangsan', name: '张三' }] }
]

class WeChatWorkService {
  // 获取组织结构
  async getDepartmentList(): Promise<WeChatDepartment[]> {
    try {
      const response = await service.departments();
      if (!response.success) {
        throw new Error(response.message || '请求失败')
      }
      const data = toCamelCase(response.data);
      return data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error("获取部门列表失败:" + errorMessage);
    }
  }

  // 获取用户列表
  async getUserList(deptId: number): Promise<WeChatUser[]> {
    try {
      const response = await service.users(new DepartmentRequestDto({
        departmentId: deptId }));
      if (!response.success) {
        throw new Error(response.message || '请求失败')
      }
      const data = toCamelCase(response.data);
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
  async sendMessage(sendMessageDto: SendMessageDto) {
    try {
      const response = await service.send(sendMessageDto);
      if (!response.success) {
        throw new Error(response.message || '发送失败')
      }
      return response.data;
    } catch (error: any) {
      let errorMessage = '';

      if (error.response) {
        const responseData = error.response.data || error.response;
        errorMessage = responseData;
      }
      throw new Error("发送失败:" + errorMessage);
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