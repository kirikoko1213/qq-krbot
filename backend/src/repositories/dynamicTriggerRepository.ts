import { DynamicTriggerModel, Prisma } from '@prisma/client';
import { dbService } from '../services/database.js';
import { Logger } from '../utils/logger.js';

export class DynamicTriggerRepository {
  constructor(private prisma = dbService.prisma) {}

  /**
   * 根据条件查找触发器列表
   */
  async findList(
    filter: Partial<DynamicTriggerModel>
  ): Promise<DynamicTriggerModel[]> {
    try {
      const where: Prisma.DynamicTriggerModelWhereInput = {
        deletedAt: null,
      };

      if (filter.scene) {
        where.scene = filter.scene;
      }
      if (filter.conditionType) {
        where.conditionType = filter.conditionType;
      }
      if (filter.triggerContentType) {
        where.triggerContentType = filter.triggerContentType;
      }
      if (filter.triggerContent) {
        where.triggerContent = filter.triggerContent;
      }

      return await this.prisma.dynamicTriggerModel.findMany({
        where,
        orderBy: {
          sequence: 'asc',
        },
      });
    } catch (error) {
      Logger.error('Failed to find dynamic trigger list:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找单个触发器
   */
  async findOne(id: bigint): Promise<DynamicTriggerModel | null> {
    try {
      return await this.prisma.dynamicTriggerModel.findFirst({
        where: {
          id: id,
          deletedAt: null,
        },
      });
    } catch (error) {
      Logger.error('Failed to find dynamic trigger by id:', error);
      throw error;
    }
  }

  /**
   * 删除触发器（软删除）
   */
  async delete(id: bigint): Promise<void> {
    try {
      await this.prisma.dynamicTriggerModel.update({
        where: {
          id: id,
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      Logger.error('Failed to delete dynamic trigger:', error);
      throw error;
    }
  }

  /**
   * 获取最大序列号
   */
  async getMaxSequence(): Promise<bigint> {
    try {
      const result = await this.prisma.dynamicTriggerModel.aggregate({
        _max: {
          sequence: true,
        },
        where: {
          deletedAt: null,
        },
      });

      return result._max.sequence ?? BigInt(0);
    } catch (error) {
      Logger.error('Failed to get max sequence:', error);
      throw error;
    }
  }

  /**
   * 保存或更新触发器
   */
  async save(
    model: Partial<DynamicTriggerModel>
  ): Promise<DynamicTriggerModel> {
    try {
      if (model.id) {
        // 更新现有记录
        const existingModel = await this.findOne(model.id);
        if (!existingModel) {
          throw new Error('Dynamic trigger not found');
        }

        return await this.prisma.dynamicTriggerModel.update({
          where: {
            id: model.id,
          },
          data: {
            ...model,
            updatedAt: new Date(),
          },
        });
      } else {
        // 创建新记录
        const maxSequence = await this.getMaxSequence();

        return await this.prisma.dynamicTriggerModel.create({
          data: {
            triggerType: model.triggerType,
            conditionType: model.conditionType,
            conditionValue: model.conditionValue,
            triggerContentType: model.triggerContentType,
            triggerContent: model.triggerContent,
            sequence: maxSequence + BigInt(1),
            scene: model.scene,
            description: model.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      Logger.error('Failed to save dynamic trigger:', error);
      throw error;
    }
  }

  /**
   * 上移触发器（降低sequence值）
   */
  async moveUp(id: bigint): Promise<void> {
    try {
      await dbService.transaction(async prisma => {
        // 获取当前记录
        const currentModel = await prisma.dynamicTriggerModel.findFirst({
          where: { id: id, deletedAt: null },
        });

        if (!currentModel) {
          throw new Error('Dynamic trigger not found');
        }

        // 查找前一个记录（sequence更小的）
        const prevModel = await prisma.dynamicTriggerModel.findFirst({
          where: {
            sequence: { lt: currentModel.sequence! },
            deletedAt: null,
          },
          orderBy: {
            sequence: 'desc',
          },
        });

        if (!prevModel) {
          throw new Error('Already at the top');
        }

        // 交换sequence值
        const currentSeq = currentModel.sequence!;
        const prevSeq = prevModel.sequence!;

        await prisma.dynamicTriggerModel.update({
          where: { id: currentModel.id },
          data: { sequence: prevSeq, updatedAt: new Date() },
        });

        await prisma.dynamicTriggerModel.update({
          where: { id: prevModel.id },
          data: { sequence: currentSeq, updatedAt: new Date() },
        });
      });
    } catch (error) {
      Logger.error('Failed to move up dynamic trigger:', error);
      throw error;
    }
  }

  /**
   * 下移触发器（增加sequence值）
   */
  async moveDown(id: bigint): Promise<void> {
    try {
      await dbService.transaction(async prisma => {
        // 获取当前记录
        const currentModel = await prisma.dynamicTriggerModel.findFirst({
          where: { id: id, deletedAt: null },
        });

        if (!currentModel) {
          throw new Error('Dynamic trigger not found');
        }

        // 查找后一个记录（sequence更大的）
        const nextModel = await prisma.dynamicTriggerModel.findFirst({
          where: {
            sequence: { gt: currentModel.sequence! },
            deletedAt: null,
          },
          orderBy: {
            sequence: 'asc',
          },
        });

        if (!nextModel) {
          throw new Error('Already at the bottom');
        }

        // 交换sequence值
        const currentSeq = currentModel.sequence!;
        const nextSeq = nextModel.sequence!;

        await prisma.dynamicTriggerModel.update({
          where: { id: currentModel.id },
          data: { sequence: nextSeq, updatedAt: new Date() },
        });

        await prisma.dynamicTriggerModel.update({
          where: { id: nextModel.id },
          data: { sequence: currentSeq, updatedAt: new Date() },
        });
      });
    } catch (error) {
      Logger.error('Failed to move down dynamic trigger:', error);
      throw error;
    }
  }
}

export default DynamicTriggerRepository;
