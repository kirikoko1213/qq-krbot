import { Context } from 'koa';
import { prisma } from '../index';
import { Logger } from '../utils/logger';
import Joi from 'joi';

export class GroupController {
  // 获取群组列表
  async getGroups(ctx: Context) {
    try {
      const { page = 1, limit = 20, search, isActive } = ctx.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (search) {
        where.OR = [
          { qqId: { contains: String(search) } },
          { name: { contains: String(search) } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const [groups, total] = await Promise.all([
        prisma.group.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                messages: true,
                dynamicTriggers: true,
              },
            },
          },
        }),
        prisma.group.count({ where }),
      ]);

      ctx.body = {
        success: true,
        data: {
          groups,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (error) {
      Logger.error('获取群组列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 根据 QQ 群 ID 获取群组
  async getGroupByQQId(ctx: Context) {
    try {
      const { qqId } = ctx.params;

      const group = await prisma.group.findUnique({
        where: { qqId },
        include: {
          messages: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: true,
            },
          },
          dynamicTriggers: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              messages: true,
              dynamicTriggers: true,
              memberAliases: true,
            },
          },
        },
      });

      if (!group) {
        ctx.status = 404;
        ctx.body = { success: false, message: '群组不存在' };
        return;
      }

      ctx.body = { success: true, data: group };
    } catch (error) {
      Logger.error('获取群组信息失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 创建或更新群组
  async createOrUpdateGroup(ctx: Context) {
    try {
      const schema = Joi.object({
        qqId: Joi.string().required(),
        name: Joi.string().optional(),
        avatar: Joi.string().uri().optional(),
        isActive: Joi.boolean().optional().default(true),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const group = await prisma.group.upsert({
        where: { qqId: value.qqId },
        update: {
          name: value.name,
          avatar: value.avatar,
          isActive: value.isActive,
        },
        create: {
          qqId: value.qqId,
          name: value.name,
          avatar: value.avatar,
          isActive: value.isActive,
        },
      });

      ctx.body = { success: true, data: group };
    } catch (error) {
      Logger.error('创建或更新群组失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 更新群组信息
  async updateGroup(ctx: Context) {
    try {
      const { qqId } = ctx.params;
      const schema = Joi.object({
        name: Joi.string().optional(),
        avatar: Joi.string().uri().optional(),
        isActive: Joi.boolean().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const group = await prisma.group.update({
        where: { qqId },
        data: value,
      });

      ctx.body = { success: true, data: group };
    } catch (error) {
      Logger.error('更新群组信息失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 设置群组状态
  async setGroupStatus(ctx: Context) {
    try {
      const { qqId } = ctx.params;
      const schema = Joi.object({
        isActive: Joi.boolean().required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const group = await prisma.group.update({
        where: { qqId },
        data: { isActive: value.isActive },
      });

      ctx.body = { success: true, data: group };
    } catch (error) {
      Logger.error('设置群组状态失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }
}
