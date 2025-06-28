import { MessageCount } from '@prisma/client';
import { dbService } from '../services/database';
import { Logger } from '../utils/logger';

export class MessageCountRepository {
  constructor(private prisma = dbService.prisma) {}

  /**
   * 根据群组ID查找消息计数
   */
  async findByGroupId(groupId: string): Promise<MessageCount | null> {
    try {
      return await this.prisma.messageCount.findFirst({
        where: {
          groupId: groupId,
          deletedAt: null,
        },
      });
    } catch (error) {
      Logger.error('Failed to find message count by group ID:', error);
      throw error;
    }
  }

  /**
   * 更新消息计数
   */
  async updateCount(groupId: string, quantity: bigint): Promise<MessageCount> {
    try {
      const existing = await this.findByGroupId(groupId);

      if (existing) {
        return await this.prisma.messageCount.update({
          where: {
            id: existing.id,
          },
          data: {
            quantity: quantity,
            updatedAt: new Date(),
          },
        });
      } else {
        return await this.prisma.messageCount.create({
          data: {
            groupId: groupId,
            quantity: quantity,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      Logger.error('Failed to update message count:', error);
      throw error;
    }
  }

  /**
   * 增加消息计数
   */
  async incrementCount(groupId: string): Promise<MessageCount> {
    try {
      const existing = await this.findByGroupId(groupId);
      const currentCount = existing?.quantity ?? BigInt(0);
      return await this.updateCount(groupId, currentCount + BigInt(1));
    } catch (error) {
      Logger.error('Failed to increment message count:', error);
      throw error;
    }
  }

  /**
   * 减少消息计数
   */
  async decrementCount(groupId: string): Promise<MessageCount> {
    try {
      const existing = await this.findByGroupId(groupId);
      const currentCount = existing?.quantity ?? BigInt(0);
      const newCount =
        currentCount > BigInt(0) ? currentCount - BigInt(1) : BigInt(0);
      return await this.updateCount(groupId, newCount);
    } catch (error) {
      Logger.error('Failed to decrement message count:', error);
      throw error;
    }
  }

  /**
   * 重置消息计数
   */
  async resetCount(groupId: string): Promise<MessageCount> {
    try {
      return await this.updateCount(groupId, BigInt(0));
    } catch (error) {
      Logger.error('Failed to reset message count:', error);
      throw error;
    }
  }

  /**
   * 获取所有消息计数
   */
  async getAllCounts(): Promise<MessageCount[]> {
    try {
      return await this.prisma.messageCount.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          quantity: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to get all message counts:', error);
      throw error;
    }
  }

  /**
   * 删除消息计数（软删除）
   */
  async delete(id: bigint): Promise<void> {
    try {
      await this.prisma.messageCount.update({
        where: {
          id: id,
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to delete message count:', error);
      throw error;
    }
  }

  /**
   * 批量重置所有群组的消息计数
   */
  async batchResetAllCounts(): Promise<void> {
    try {
      await this.prisma.messageCount.updateMany({
        where: {
          deletedAt: null,
        },
        data: {
          quantity: BigInt(0),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to batch reset all message counts:', error);
      throw error;
    }
  }

  /**
   * 根据群组ID数组批量查询消息计数
   */
  async findByGroupIds(groupIds: string[]): Promise<MessageCount[]> {
    try {
      return await this.prisma.messageCount.findMany({
        where: {
          groupId: {
            in: groupIds,
          },
          deletedAt: null,
        },
        orderBy: {
          quantity: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find message counts by group IDs:', error);
      throw error;
    }
  }

  /**
   * 获取消息计数排名前N的群组
   */
  async getTopGroups(limit: number = 10): Promise<MessageCount[]> {
    try {
      return await this.prisma.messageCount.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          quantity: 'desc',
        },
        take: limit,
      });
    } catch (error) {
      Logger.error('Failed to get top groups by message count:', error);
      throw error;
    }
  }
}

export default MessageCountRepository;
