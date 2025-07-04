import { MemberAlias } from '@prisma/client';
import { dbService } from '../services/database.js';
import { Logger } from '../utils/logger.js';

export class MemberAliasRepository {
  constructor(private prisma = dbService.prisma) {}

  /**
   * 根据群组ID和QQ账号查找别名列表
   */
  async findAliasByGroupIdAndQQAccount(
    groupId: bigint,
    qqAccount: bigint
  ): Promise<string[]> {
    try {
      const result = await this.prisma.memberAlias.findFirst({
        where: {
          groupId: groupId,
          qqAccount: qqAccount,
          deletedAt: null,
        },
        select: {
          alias: true,
        },
      });

      if (!result || !result.alias) {
        return [];
      }

      // 解析JSON数组
      const aliasData = result.alias as any;
      if (Array.isArray(aliasData)) {
        return aliasData.filter(item => typeof item === 'string');
      }

      return [];
    } catch (error) {
      Logger.error('Failed to find alias by groupId and qqAccount:', error);
      throw error;
    }
  }

  /**
   * 根据群组ID查找所有别名
   */
  async findAliasByGroupId(groupId: number): Promise<MemberAlias[]> {
    try {
      return await this.prisma.memberAlias.findMany({
        where: {
          groupId: groupId,
          deletedAt: null,
        },
        orderBy: {
          qqAccount: 'asc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find alias by groupId:', error);
      throw error;
    }
  }

  /**
   * 根据群组ID和QQ账号查找成员别名记录
   */
  async findByGroupIdAndQQAccount(
    groupId: bigint,
    qqAccount: bigint
  ): Promise<MemberAlias | null> {
    try {
      return await this.prisma.memberAlias.findFirst({
        where: {
          groupId: groupId,
          qqAccount: qqAccount,
          deletedAt: null,
        },
      });
    } catch (error) {
      Logger.error(
        'Failed to find member alias by groupId and qqAccount:',
        error
      );
      throw error;
    }
  }

  /**
   * 更新或创建成员别名
   */
  async updateAlias(
    groupId: bigint,
    qqAccount: bigint,
    alias: string[]
  ): Promise<void> {
    try {
      const existingRecord = await this.findByGroupIdAndQQAccount(
        groupId,
        qqAccount
      );

      if (existingRecord) {
        // 更新现有记录
        await this.prisma.memberAlias.update({
          where: {
            id: existingRecord.id,
          },
          data: {
            alias: alias as any, // Prisma会自动处理JSON序列化
            updatedAt: new Date(),
          },
        });
      } else {
        // 创建新记录
        await this.prisma.memberAlias.create({
          data: {
            groupId: groupId,
            qqAccount: qqAccount,
            alias: alias as any,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      Logger.error('Failed to update alias:', error);
      throw error;
    }
  }

  /**
   * 删除成员别名（软删除）
   */
  async deleteAlias(groupId: bigint, qqAccount: bigint): Promise<void> {
    try {
      const existingRecord = await this.findByGroupIdAndQQAccount(
        groupId,
        qqAccount
      );

      if (existingRecord) {
        await this.prisma.memberAlias.update({
          where: {
            id: existingRecord.id,
          },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      Logger.error('Failed to delete alias:', error);
      throw error;
    }
  }
}

export default MemberAliasRepository;
