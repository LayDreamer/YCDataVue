/**
 * 企业微信消息服务
 * 用于发送消息到企业微信的个人或群聊
 */
import { toCamelCase } from '@/utils/api';
import { Service, SendMessageDto, GroupChatMessageDto, DepartmentRequestDto } from '@/api-generated/api';
import { apiHttp } from '@/api/http';
import { toServiceError } from '@/services/error';

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const service = new Service(baseUrl, apiHttp);

// 组织结构
export interface WeChatDepartment {
  id: number;
  name: string;
  parentid: number;
  order: number;
  department_leader: number[];
}

// 用户类型
export interface WeChatUser {
  userid: string;
  name: string;
  department: number[];
  status: number;
}

// 群聊类型
export interface WeChatChat {
  chatid: string;
  chatId?: string;
  name: string;
  owner?: string;
  memberList?: Array<{
    userid: string;
    name: string;
  }>;
}

// 群聊原始数据（后端字段不固定，兼容多种字段来源）
interface RawChatItem {
  id?: string;
  chatid?: string;
  chatId?: string;
  chatName?: string;
  groupName?: string;
  name?: string;
  owner?: string;
  memberList?: Array<{
    userid: string;
    name: string;
  }>;
}

class WeChatWorkService {
  // 获取组织结构
  async getDepartmentList(): Promise<WeChatDepartment[]> {
    try {
      const response = await service.departments();
      if (!response.success) {
        throw new Error(response.message || '请求失败');
      }
      const data = toCamelCase(response.data);
      return data;
    } catch (error) {
      throw toServiceError(error, '获取部门列表失败:');
    }
  }

  // 获取用户列表
  async getUserList(deptId: number): Promise<WeChatUser[]> {
    try {
      const response = await service.usersPOST(
        new DepartmentRequestDto({
          departmentId: deptId
        })
      );
      if (!response.success) {
        throw new Error(response.message || '请求失败');
      }
      const data = toCamelCase(response.data);
      return data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 获取群聊列表（从数据库查询所有已创建的群聊）
  async getChatList(): Promise<WeChatChat[]> {
    try {
      const response = await service.groupChats();
      if (!response.success) {
        throw new Error(response.message || '请求失败');
      }
      const list = toCamelCase(response.data) as RawChatItem[];
      const data = (list || []).map((item) => ({
        ...item,
        chatid: item.chatid || item.chatId || item.id,
        name: item.name || item.chatName || item.groupName || ''
      })) as WeChatChat[];
      return data;
    } catch (error) {
      throw toServiceError(error, '获取群聊列表失败:');
    }
  }

  // 发送消息到企业微信
  async sendMessage(sendMessageDto: SendMessageDto) {
    try {
      const response = await service.send(sendMessageDto);
      if (!response.success) {
        throw new Error(response.message || '发送失败');
      }
      return response.data;
    } catch (error) {
      throw toServiceError(error, '发送失败:');
    }
  }

  // 发送卡片消息到企业微信
  async sendCardMessage(sendMessageDto: SendMessageDto) {
    try {
      const response = await service.sendCardMessage(sendMessageDto);
      if (!response.success) {
        throw new Error(response.message || '发送卡片失败');
      }
      return response.data;
    } catch (error) {
      throw toServiceError(error, '发送卡片失败:');
    }
  }

  // 创建群聊并发送消息
  async createChatAndSend(dto: GroupChatMessageDto) {
    try {
      const response = await service.createChatAndSend(dto);
      if (!response.success) {
        throw new Error(response.message || '创建群聊并发送失败');
      }
      return response.data;
    } catch (error) {
      throw toServiceError(error, '创建群聊并发送失败:');
    }
  }

  // 发送消息到已有群聊
  async sendToGroupChat(dto: GroupChatMessageDto) {
    try {
      debugger;
      const response = await service.sendToGroupChat(dto);
      if (!response.success) {
        throw new Error(response.message || '发送群聊消息失败');
      }
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw toServiceError(error, '发送群聊消息失败:');
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword: string): Promise<WeChatUser[]> {
    const allUsers = await this.getUserList(1);
    if (!keyword) return allUsers;

    return allUsers.filter((user) => user.name.includes(keyword) || user.userid.includes(keyword));
  }

  /**
   * 搜索群聊
   */
  async searchChats(keyword: string): Promise<WeChatChat[]> {
    const allChats = await this.getChatList();
    if (!keyword) return allChats;

    return allChats.filter((chat) => chat.name.includes(keyword) || chat.chatid.includes(keyword));
  }
}

// 导出服务实例
export const weChatWorkService = new WeChatWorkService();
export default weChatWorkService;
