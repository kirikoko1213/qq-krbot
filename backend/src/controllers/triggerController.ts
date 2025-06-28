import { Context } from 'koa';
import { prisma } from '../index';
import { Logger } from '../utils/logger';
import Joi from 'joi';

export class TriggerController {
  // 获取触发器列表
  async getTriggers(ctx: Context) {
    try {
      const { page = 1, limit = 20, groupQQId, isActive } = ctx.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (groupQQId) {
        const group = await prisma.group.findUnique({
          where: { qqId: String(groupQQId) },
        });
        if (group) {
          where.groupId = group.id;
        }
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const [triggers, total] = await Promise.all([
        prisma.dynamicTrigger.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            group: true,
          },
        }),
        prisma.dynamicTrigger.count({ where }),
      ]);

      ctx.body = {
        success: true,
        data: {
          triggers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (error) {
      Logger.error('获取触发器列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 根据群组获取触发器
  async getTriggersByGroup(ctx: Context) {
    try {
      const { groupQQId } = ctx.params;
      const { isActive } = ctx.query;

      const group = await prisma.group.findUnique({
        where: { qqId: groupQQId },
      });

      if (!group) {
        ctx.status = 404;
        ctx.body = { success: false, message: '群组不存在' };
        return;
      }

      const where: any = { groupId: group.id };
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const triggers = await prisma.dynamicTrigger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      ctx.body = {
        success: true,
        data: {
          triggers,
          group,
        },
      };
    } catch (error) {
      Logger.error('获取群组触发器失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 创建触发器
  async createTrigger(ctx: Context) {
    try {
      const schema = Joi.object({
        keyword: Joi.string().required(),
        response: Joi.string().required(),
        triggerType: Joi.string()
          .valid('exact', 'contain', 'regex')
          .default('exact'),
        groupQQId: Joi.string().required(),
        createdBy: Joi.string().required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      // 查找群组
      const group = await prisma.group.findUnique({
        where: { qqId: value.groupQQId },
      });

      if (!group) {
        ctx.status = 404;
        ctx.body = { success: false, message: '群组不存在' };
        return;
      }

      // 检查是否已存在相同的触发器
      const existingTrigger = await prisma.dynamicTrigger.findFirst({
        where: {
          keyword: value.keyword,
          groupId: group.id,
          triggerType: value.triggerType,
        },
      });

      if (existingTrigger) {
        ctx.status = 400;
        ctx.body = { success: false, message: '该触发器已存在' };
        return;
      }

      const trigger = await prisma.dynamicTrigger.create({
        data: {
          keyword: value.keyword,
          response: value.response,
          triggerType: value.triggerType,
          groupId: group.id,
          createdBy: value.createdBy,
        },
        include: {
          group: true,
        },
      });

      ctx.body = { success: true, data: trigger };
    } catch (error) {
      Logger.error('创建触发器失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 更新触发器
  async updateTrigger(ctx: Context) {
    try {
      const { id } = ctx.params;
      const schema = Joi.object({
        keyword: Joi.string().optional(),
        response: Joi.string().optional(),
        triggerType: Joi.string().valid('exact', 'contain', 'regex').optional(),
        isActive: Joi.boolean().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const trigger = await prisma.dynamicTrigger.update({
        where: { id: Number(id) },
        data: value,
        include: {
          group: true,
        },
      });

      ctx.body = { success: true, data: trigger };
    } catch (error) {
      Logger.error('更新触发器失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 删除触发器
  async deleteTrigger(ctx: Context) {
    try {
      const { id } = ctx.params;

      await prisma.dynamicTrigger.delete({
        where: { id: Number(id) },
      });

      ctx.body = { success: true, message: '触发器删除成功' };
    } catch (error) {
      Logger.error('删除触发器失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 设置触发器状态
  async setTriggerStatus(ctx: Context) {
    try {
      const { id } = ctx.params;
      const schema = Joi.object({
        isActive: Joi.boolean().required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const trigger = await prisma.dynamicTrigger.update({
        where: { id: Number(id) },
        data: { isActive: value.isActive },
        include: {
          group: true,
        },
      });

      ctx.body = { success: true, data: trigger };
    } catch (error) {
      Logger.error('设置触发器状态失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 测试触发器匹配
  async testTrigger(ctx: Context) {
    try {
      const schema = Joi.object({
        keyword: Joi.string().required(),
        triggerType: Joi.string().valid('exact', 'contain', 'regex').required(),
        testMessage: Joi.string().required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      let isMatch = false;
      try {
        switch (value.triggerType) {
          case 'exact':
            isMatch = value.testMessage === value.keyword;
            break;
          case 'contain':
            isMatch = value.testMessage.includes(value.keyword);
            break;
          case 'regex':
            const regex = new RegExp(value.keyword);
            isMatch = regex.test(value.testMessage);
            break;
        }
      } catch (regexError) {
        ctx.status = 400;
        ctx.body = { success: false, message: '正则表达式无效' };
        return;
      }

      ctx.body = {
        success: true,
        data: {
          isMatch,
          keyword: value.keyword,
          triggerType: value.triggerType,
          testMessage: value.testMessage,
        },
      };
    } catch (error) {
      Logger.error('测试触发器失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }
}
