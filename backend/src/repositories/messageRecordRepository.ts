import { MessageRecord } from '@prisma/client';
import { dbService } from '../services/database';
import { Logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

export interface RankResult {
  qqAccount: bigint;
  count: bigint;
}

export class MessageRecordRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 保存消息记录
   */
  async save(
    qqAccount: bigint,
    groupId: bigint,
    message: string
  ): Promise<void> {
    try {
      await this.prisma.messageRecord.create({
        data: {
          qqAccount: qqAccount,
          qqNickname: '',
          groupId: groupId,
          groupName: '',
          message: message,
          messageType: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to save message record:', error);
      throw error;
    }
  }

  /**
   * 查询今日群聊排行
   */
  async rankWithGroupAndToday(groupId: bigint): Promise<RankResult[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const results = await this.prisma.messageRecord.groupBy({
        by: ['qqAccount'],
        where: {
          groupId: groupId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          deletedAt: null,
        },
        _count: {
          qqAccount: true,
        },
        orderBy: {
          _count: {
            qqAccount: 'desc',
          },
        },
      });

      return results.map(result => ({
        qqAccount: result.qqAccount,
        count: BigInt(result._count.qqAccount),
      }));
    } catch (error) {
      Logger.error('Failed to get today rank:', error);
      throw error;
    }
  }

  /**
   * 查询昨日群聊排行
   */
  async rankWithGroupAndYesterday(groupId: bigint): Promise<RankResult[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      const results = await this.prisma.messageRecord.groupBy({
        by: ['qqAccount'],
        where: {
          groupId: groupId,
          createdAt: {
            gte: yesterday,
            lt: today,
          },
          deletedAt: null,
        },
        _count: {
          qqAccount: true,
        },
        orderBy: {
          _count: {
            qqAccount: 'desc',
          },
        },
      });

      return results.map(result => ({
        qqAccount: result.qqAccount,
        count: BigInt(result._count.qqAccount),
      }));
    } catch (error) {
      Logger.error('Failed to get yesterday rank:', error);
      throw error;
    }
  }

  /**
   * 根据群id查询指定时间区间的qq号
   */
  async findQQAccountsByDateAndGroupId(
    groupId: bigint,
    startDateTime: Date,
    endDateTime: Date
  ): Promise<bigint[]> {
    try {
      const results = await this.prisma.messageRecord.findMany({
        where: {
          groupId: groupId,
          createdAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
          deletedAt: null,
        },
        select: {
          qqAccount: true,
        },
        distinct: ['qqAccount'],
      });

      return results.map(result => result.qqAccount);
    } catch (error) {
      Logger.error('Failed to find QQ accounts by date and groupId:', error);
      throw error;
    }
  }

  /**
   * 查询文字消息的最后limit条, 当文字超出100字符时, 不参与统计
   */
  async findTextMessageByQQAccountAndGroupId(
    groupId: bigint,
    qqAccount: bigint,
    limit: number
  ): Promise<string[]> {
    try {
      const results = await this.prisma.messageRecord.findMany({
        where: {
          groupId: groupId,
          qqAccount: qqAccount,
          message: {
            not: {
              startsWith: '[CQ',
            },
          },
          deletedAt: null,
        },
        select: {
          message: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      // 过滤掉超过100字符的消息，并反转数组（最新的在后面）
      const messages = results
        .map(result => result.message || '')
        .filter(message => message.length <= 100)
        .reverse();

      return messages;
    } catch (error) {
      Logger.error(
        'Failed to find text messages by QQ account and groupId:',
        error
      );
      throw error;
    }
  }

  /**
   * 根据QQ账号查询消息记录
   */
  async findByQQAccount(
    qqAccount: bigint,
    limit: number = 100
  ): Promise<MessageRecord[]> {
    try {
      return await this.prisma.messageRecord.findMany({
        where: {
          qqAccount: qqAccount,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      Logger.error('Failed to find messages by QQ account:', error);
      throw error;
    }
  }

  /**
   * 根据群组ID查询消息记录
   */
  async findByGroupId(
    groupId: bigint,
    limit: number = 100
  ): Promise<MessageRecord[]> {
    try {
      return await this.prisma.messageRecord.findMany({
        where: {
          groupId: groupId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      Logger.error('Failed to find messages by group ID:', error);
      throw error;
    }
  }

  /**
   * 删除消息记录（软删除）
   */
  async deleteById(id: bigint): Promise<void> {
    try {
      await this.prisma.messageRecord.update({
        where: {
          id: id,
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to delete message record:', error);
      throw error;
    }
  }

  /**
   * 获取今日群消息排行榜
   */
  async getRankWithGroupAndToday(groupId: string, limit: number = 5) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const groupIdBigInt = BigInt(groupId);

      const result = await this.prisma.messageRecord.groupBy({
        by: ['qqAccount'],
        where: {
          groupId: groupIdBigInt,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      // 获取成员别名信息
      const qqAccounts = result.map(r => r.qqAccount);
      const memberAliases = await this.prisma.memberAlias.findMany({
        where: {
          qqAccount: { in: qqAccounts },
          groupId: groupIdBigInt,
        },
      });

      const aliasMap = new Map(
        memberAliases.map(alias => [alias.qqAccount.toString(), alias.alias])
      );

      return result.map(record => ({
        memberId: record.qqAccount.toString(),
        memberAlias: aliasMap.get(record.qqAccount.toString()) || null,
        messageCount: record._count?.id || 0,
      }));
    } catch (error) {
      Logger.error('获取消息排行榜失败', { groupId, error });
      throw error;
    }
  }

  /**
   * 记录消息
   */
  async createRecord(data: {
    groupId: string;
    memberId: string;
    messageContent: string;
    messageType?: string;
  }) {
    try {
      return await this.prisma.messageRecord.create({
        data: {
          groupId: BigInt(data.groupId),
          qqAccount: BigInt(data.memberId),
          message: data.messageContent,
          messageType: data.messageType,
        },
      });
    } catch (error) {
      Logger.error('创建消息记录失败', { data, error });
      throw error;
    }
  }

  /**
   * 获取群消息统计
   */
  async getGroupMessageStats(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const where: any = { groupId: BigInt(groupId) };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const total = await this.prisma.messageRecord.count({ where });

      const memberStats = await this.prisma.messageRecord.groupBy({
        by: ['qqAccount'],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return {
        total,
        memberCount: memberStats.length,
        memberStats,
      };
    } catch (error) {
      Logger.error('获取群消息统计失败', { groupId, error });
      throw error;
    }
  }
}

export default MessageRecordRepository;
