import BaseModel from './base-model.js';
import MemberAliasModel from './member-alias.js';

export type MessageRecordData = {
  id: number;
  qqAccount: number;
  qqNickname?: string;
  groupId: number;
  groupName?: string;
  cqMessage?: string;
  textMessage?: string;
  engineMessage?: string;
  messageType?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export interface MessageRecordCreateData {
  qqAccount: number;
  qqNickname?: string;
  groupId: number;
  groupName?: string;
  cqMessage?: string;
  textMessage?: string;
  engineMessage?: string;
  messageType?: string;
}

class MessageRecordModel extends BaseModel<MessageRecordData> {
  table = 'message_record';

  /**
   * 实现字段映射，定义 TypeScript 类型属性与数据库字段的对应关系
   */
  getFieldMapping(): Record<string, string> {
    return {
      id: 'id',
      qqAccount: 'qq_account',
      qqNickname: 'qq_nickname',
      groupId: 'group_id',
      groupName: 'group_name',
      cqMessage: 'cq_message',
      textMessage: 'text_message',
      engineMessage: 'engine_message',
      messageType: 'message_type',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    };
  }

  static async findAll() {
    const result = await this.query().whereNull('deleted_at').get();
    return result.all();
  }

  static delete(id: number[]) {
    return this.query().destroy(id);
  }

  static findOne(id: number) {
    return this.query().where('id', '=', id).first();
  }

  static async findByGroupId(groupId: number) {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .get();
    return result.all();
  }

  static async findByQqAccount(qqAccount: number) {
    const result = await this.query()
      .where('qq_account', '=', qqAccount)
      .whereNull('deleted_at')
      .get();
    return result.all();
  }

  static async softDelete(id: number) {
    return await this.query()
      .where('id', '=', id)
      .update({ deleted_at: new Date().toISOString() });
  }

  /**
   * 创建消息记录
   */
  static async createRecord(
    recordData: MessageRecordCreateData
  ): Promise<MessageRecordModel> {
    const data: MessageRecordData = {
      id: 0,
      qqAccount: recordData.qqAccount,
      qqNickname: recordData.qqNickname,
      groupId: recordData.groupId,
      groupName: recordData.groupName,
      cqMessage: recordData.cqMessage,
      textMessage: recordData.textMessage,
      engineMessage: recordData.engineMessage,
      messageType: recordData.messageType,
    };

    const messageRecord = new MessageRecordModel();
    messageRecord.setCreateData(data);
    await messageRecord.save();
    return messageRecord;
  }

  /**
   * 统计每日消息数量
   */
  static async getMessageStatsByDay(
    groupId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ day: string; count: number }[]> {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereBetween('created_at', [
        startDate.toISOString(),
        endDate.toISOString(),
      ])
      .whereNull('deleted_at')
      .select('created_at')
      .get();

    const records = result.all();
    const dayStats: { [key: string]: number } = {};

    records.forEach(record => {
      const data = record.getData();
      const day = data.createdAt!.split('T')[0];
      dayStats[day] = (dayStats[day] || 0) + 1;
    });

    return Object.entries(dayStats).map(([day, count]) => ({ day, count }));
  }

  /**
   * 统计每小时消息数量
   */
  static async getMessageStatsByHour(
    groupId: number,
    date: Date
  ): Promise<{ hour: number; count: number }[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereBetween('created_at', [
        startOfDay.toISOString(),
        endOfDay.toISOString(),
      ])
      .whereNull('deleted_at')
      .select('created_at')
      .get();

    const records = result.all();
    const hourStats: { [key: number]: number } = {};

    // 初始化24小时
    for (let i = 0; i < 24; i++) {
      hourStats[i] = 0;
    }

    records.forEach(record => {
      const data = record.getData();
      const hour = new Date(data.createdAt!).getHours();
      hourStats[hour] = (hourStats[hour] || 0) + 1;
    });

    return Object.entries(hourStats).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));
  }

  /**
   * 获取群组消息记录
   */
  static async getGroupMessages(
    groupId: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<MessageRecordModel[]> {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return result.all();
  }

  /**
   * 获取用户消息记录
   */
  static async getUserMessages(
    qqAccount: number,
    groupId?: number,
    limit: number = 100,
    offset: number = 0
  ): Promise<MessageRecordModel[]> {
    let query = this.query()
      .where('qq_account', '=', qqAccount)
      .whereNull('deleted_at');

    if (groupId) {
      query = query.where('group_id', '=', groupId);
    }

    const result = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return result.all();
  }

  /**
   * 搜索消息记录
   */
  static async searchMessages(
    groupId: number,
    keyword: string,
    limit: number = 50
  ): Promise<MessageRecordModel[]> {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .where('cq_message', 'like', `%${keyword}%`)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return result.all();
  }

  /**
   * 获取最近的消息记录
   */
  static async getRecentMessages(
    groupId: number,
    limit: number = 20
  ): Promise<MessageRecordModel[]> {
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return result.all();
  }

  /**
   * 获取群组活跃度统计
   */
  static async getGroupActivityStats(
    groupId: number,
    days: number = 30
  ): Promise<{
    totalMessages: number;
    activeUsers: number;
    avgMessagesPerDay: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.query()
      .where('group_id', '=', groupId)
      .where('created_at', '>=', startDate.toISOString())
      .whereNull('deleted_at')
      .select(['qq_account', 'created_at'])
      .get();

    const records = result.all();
    const uniqueUsers = new Set(
      records.map(record => record.getData().qqAccount)
    );

    return {
      totalMessages: records.length,
      activeUsers: uniqueUsers.size,
      avgMessagesPerDay: Math.round(records.length / days),
    };
  }

  /**
   * 获取成员别名映射
   */
  static async getMemberAliasMap(
    groupId: number
  ): Promise<Map<number, string[]>> {
    const result = await MemberAliasModel.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .get();

    const aliasMap = new Map<number, string[]>();
    result.all().forEach(record => {
      const data = record.getData();
      if (data.alias && Array.isArray(data.alias)) {
        aliasMap.set(data.qqAccount, data.alias);
      }
    });

    return aliasMap;
  }

  /**
   * 获取成员统计信息
   */
  static async getMemberStats(
    groupId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ total: number; members: any[] }> {
    // 获取总数
    const totalResult = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .select('qq_account')
      .distinct()
      .get();

    const total = totalResult.all().length;

    // 获取成员统计
    const result = await this.query()
      .where('group_id', '=', groupId)
      .whereNull('deleted_at')
      .select(['qq_account', 'qq_nickname'])
      .get();

    const records = result.all();
    const memberStats: {
      [key: number]: {
        qqAccount: number;
        qqNickname: string | null;
        messageCount: number;
      };
    } = {};

    records.forEach(record => {
      const data = record.getData();
      if (!memberStats[data.qqAccount]) {
        memberStats[data.qqAccount] = {
          qqAccount: data.qqAccount,
          qqNickname: data.qqNickname!,
          messageCount: 0,
        };
      }
      memberStats[data.qqAccount].messageCount++;
    });

    const members = Object.values(memberStats)
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(offset, offset + limit);

    return { total, members };
  }

  /**
   * 获取群组消息排行榜（用于 MCP 工具）
   */
  static async getRankWithGroupAndToday(
    groupId: string,
    limit: number = 5
  ): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.query()
      .where('group_id', '=', parseInt(groupId))
      .whereBetween('created_at', [today.toISOString(), tomorrow.toISOString()])
      .whereNull('deleted_at')
      .select(['qq_account', 'qq_nickname'])
      .get();

    const records = result.all();
    const memberStats: {
      [key: number]: {
        memberId: number;
        memberAlias: string | null;
        messageCount: number;
      };
    } = {};

    records.forEach(record => {
      const data = record.getData();
      if (!memberStats[data.qqAccount]) {
        memberStats[data.qqAccount] = {
          memberId: data.qqAccount,
          memberAlias: data.qqNickname!,
          messageCount: 0,
        };
      }
      memberStats[data.qqAccount].messageCount++;
    });

    return Object.values(memberStats)
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, limit);
  }
}

export default MessageRecordModel;
