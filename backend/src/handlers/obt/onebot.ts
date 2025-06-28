import conf from '../config/config';
import request from './request';
import { GroupInfo, GroupMemberInfo } from './types';

const baseUrl = conf.get('QQ_ENGINE_URL');

export const botEngine = {
  /**
   * 发送群消息
   * @param groupId 群组ID
   * @param message 消息
   */
  sendGroupMessage: async (groupId: number, message: string) => {
    await request.post(`${baseUrl}/send_group_msg`, {
      group_id: groupId,
      message: message,
    });
  },
  /**
   * 发送私聊消息
   * @param userId 用户ID
   * @param message 消息
   */
  sendPrivateMessage: async (userId: number, message: string) => {
    await request.post(`${baseUrl}/send_private_msg`, {
      user_id: userId,
      message: message,
    });
  },
  /**
   * 发送@消息
   * @param groupId 群组ID
   * @param userId 用户ID
   * @param message 消息
   */
  sendAtMessage: async (groupId: number, userId: number, message: string) => {
    await request.post(`${baseUrl}/send_group_msg`, {
      group_id: groupId,
      message: message,
      at_user_id: userId,
    });
  },
  /**
   * 获取群成员信息
   * @param groupId 群组ID
   * @param userId 用户ID
   * @returns 群成员信息
   */
  getGroupMemberInfo: async (
    groupId: number,
    userId: number
  ): Promise<GroupMemberInfo> => {
    const response = await request.post(`${baseUrl}/get_group_member_info`, {
      group_id: groupId,
      user_id: userId,
      no_cache: 'true',
    });
    return {
      nickname: response.data.nickname as string,
      card: response.data.card as string,
      title: response.data.title as string,
    };
  },
  /**
   * 获取群列表
   * @returns 群列表
   */
  getGroupList: async (): Promise<GroupInfo[]> => {
    const response = await request.post(`${baseUrl}/get_group_list`);
    return response.data as GroupInfo[];
  },
};
