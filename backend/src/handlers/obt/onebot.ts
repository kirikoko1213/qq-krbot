import conf from '../config/config.js';
import request from './request.js';
import { GroupInfo, GroupMemberInfo } from './types.js';

const baseUrl = await conf.get('QQ_ENGINE_URL');

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
      groupId: groupId,
      userId: userId,
      nickname: response.data.nickname,
      card: response.data.card,
      title: response.data.title,
      sex: response.data.sex,
      age: response.data.age,
      area: response.data.area,
      level: response.data.level,
      qqLevel: response.data.qq_level,
      joinTime: response.data.join_time,
      lastSentTime: response.data.last_sent_time,
      titleExpireTime: response.data.title_expire_time,
      unfriendly: response.data.unfriendly,
      cardChangeable: response.data.card_changeable,
    };
  },
  /**
   * 获取群列表
   * @returns 群列表
   */
  getGroupList: async (): Promise<GroupInfo[]> => {
    const response = await request.post(`${baseUrl}/get_group_list`);
    return response.data.map((group: any) => ({
      groupId: group.group_id,
      groupName: group.group_name,
      groupMemo: group.group_memo,
      groupCreateTime: group.group_create_time,
      memberCount: group.member_count,
      maxMemberCount: group.max_member_count,
      remarkName: group.remark_name,
    }));
  },
  /**
   * 获取群成员列表
   * @param groupId 群组ID
   * @returns 群成员列表
   */
  getGroupMemberList: async (groupId: number): Promise<GroupMemberInfo[]> => {
    const response = await request.post(`${baseUrl}/get_group_member_list`, {
      group_id: groupId,
      no_cache: 'true',
    });
    return response.data.map((member: any) => ({
      groupId: member.user_id,
      userId: member.user_id,
      nickname: member.nickname,
      card: member.card,
      title: member.title,
      sex: member.sex,
      age: member.age,
      area: member.area,
      level: member.level,
      qqLevel: member.qq_level,
      joinTime: member.join_time,
      lastSentTime: member.last_sent_time,
      titleExpireTime: member.title_expire_time,
      unfriendly: member.unfriendly,
      cardChangeable: member.card_changeable,
    }));
  },
};
