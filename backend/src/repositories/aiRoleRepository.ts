import { AiRole } from '@prisma/client';
import { dbService } from '../services/database.js';
import { Logger } from '../utils/logger.js';

export class AiRoleRepository {
  constructor(private prisma = dbService.prisma) {}

  /**
   * 根据QQ账号和群组ID查找AI角色
   */
  async findByQQAccountAndGroupId(
    qqAccount: bigint,
    groupId: bigint
  ): Promise<AiRole | null> {
    try {
      return await this.prisma.aiRole.findFirst({
        where: {
          qqAccount: qqAccount,
          groupId: groupId,
          deletedAt: null,
        },
      });
    } catch (error) {
      Logger.error('Failed to find AI role by QQ account and group ID:', error);
      throw error;
    }
  }

  /**
   * 根据QQ账号查找AI角色列表
   */
  async findByQQAccount(qqAccount: bigint): Promise<AiRole[]> {
    try {
      return await this.prisma.aiRole.findMany({
        where: {
          qqAccount: qqAccount,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find AI roles by QQ account:', error);
      throw error;
    }
  }

  /**
   * 根据群组ID查找AI角色列表
   */
  async findByGroupId(groupId: bigint): Promise<AiRole[]> {
    try {
      return await this.prisma.aiRole.findMany({
        where: {
          groupId: groupId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find AI roles by group ID:', error);
      throw error;
    }
  }

  /**
   * 创建AI角色
   */
  async save(model: Partial<AiRole>): Promise<AiRole> {
    try {
      return await this.prisma.aiRole.create({
        data: {
          qqAccount: model.qqAccount,
          qqNickname: model.qqNickname,
          groupId: model.groupId,
          groupName: model.groupName,
          setting: model.setting,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to save AI role:', error);
      throw error;
    }
  }

  /**
   * 更新AI角色
   */
  async update(id: bigint, data: Partial<AiRole>): Promise<AiRole> {
    try {
      return await this.prisma.aiRole.update({
        where: {
          id: id,
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to update AI role:', error);
      throw error;
    }
  }

  /**
   * 删除AI角色（软删除）
   */
  async delete(id: bigint): Promise<void> {
    try {
      await this.prisma.aiRole.update({
        where: {
          id: id,
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to delete AI role:', error);
      throw error;
    }
  }

  /**
   * 查找所有AI角色
   */
  async findAll(): Promise<AiRole[]> {
    try {
      return await this.prisma.aiRole.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find all AI roles:', error);
      throw error;
    }
  }

  /**
   * 根据设置查找AI角色
   */
  async findBySetting(setting: string): Promise<AiRole[]> {
    try {
      return await this.prisma.aiRole.findMany({
        where: {
          setting: {
            contains: setting,
          },
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find AI roles by setting:', error);
      throw error;
    }
  }

  /**
   * 批量更新AI角色设置
   */
  async batchUpdateSetting(
    qqAccounts: bigint[],
    setting: string
  ): Promise<void> {
    try {
      await this.prisma.aiRole.updateMany({
        where: {
          qqAccount: {
            in: qqAccounts,
          },
          deletedAt: null,
        },
        data: {
          setting: setting,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to batch update AI role settings:', error);
      throw error;
    }
  }
}

export default AiRoleRepository;
