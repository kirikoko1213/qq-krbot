import Joi from 'joi';
import { Context } from 'koa';
import { prisma } from '../index';
import { ApiResponse, UserWithMessages } from '../types/prisma';
import { Logger } from '../utils/logger';

export class UserController {
  // 获取用户列表
  async getUsers(ctx: Context) {
    try {
      const { page = 1, limit = 20, search } = ctx.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = search
        ? {
            OR: [
              { qqId: { contains: String(search) } },
              { nickname: { contains: String(search) } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      ctx.body = {
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (error) {
      Logger.error('获取用户列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 根据 QQ ID 获取用户
  async getUserByQQId(ctx: Context) {
    try {
      const { qqId } = ctx.params;

      // 使用 TypeScript 类型，获得完整的类型提示
      const user: UserWithMessages | null = await prisma.user.findUnique({
        where: { qqId },
        include: {
          messages: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        ctx.status = 404;
        const response: ApiResponse = { success: false, message: '用户不存在' };
        ctx.body = response;
        return;
      }

      const response: ApiResponse<UserWithMessages> = {
        success: true,
        data: user,
      };
      ctx.body = response;
    } catch (error) {
      Logger.error('获取用户信息失败:', error);
      ctx.status = 500;
      const response: ApiResponse = {
        success: false,
        message: '服务器内部错误',
      };
      ctx.body = response;
    }
  }

  // 创建或更新用户
  async createOrUpdateUser(ctx: Context) {
    try {
      const schema = Joi.object({
        qqId: Joi.string().required(),
        nickname: Joi.string().optional(),
        avatar: Joi.string().uri().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const user = await prisma.user.upsert({
        where: { qqId: value.qqId },
        update: {
          nickname: value.nickname,
          avatar: value.avatar,
        },
        create: {
          qqId: value.qqId,
          nickname: value.nickname,
          avatar: value.avatar,
        },
      });

      ctx.body = { success: true, data: user };
    } catch (error) {
      Logger.error('创建或更新用户失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 更新用户信息
  async updateUser(ctx: Context) {
    try {
      const { qqId } = ctx.params;
      const schema = Joi.object({
        nickname: Joi.string().optional(),
        avatar: Joi.string().uri().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const user = await prisma.user.update({
        where: { qqId },
        data: value,
      });

      ctx.body = { success: true, data: user };
    } catch (error) {
      Logger.error('更新用户信息失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 增加用户经验值
  async addExp(ctx: Context) {
    try {
      const { qqId } = ctx.params;
      const schema = Joi.object({
        exp: Joi.number().integer().min(0).required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const user = await prisma.user.update({
        where: { qqId },
        data: { exp: { increment: value.exp } },
      });

      // 检查是否升级
      const newLevel = Math.floor(user.exp / 100) + 1;
      if (newLevel > user.level) {
        await prisma.user.update({
          where: { qqId },
          data: { level: newLevel },
        });
      }

      ctx.body = { success: true, data: user };
    } catch (error) {
      Logger.error('增加用户经验值失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }

  // 增加用户金币
  async addCoins(ctx: Context) {
    try {
      const { qqId } = ctx.params;
      const schema = Joi.object({
        coins: Joi.number().integer().required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        ctx.status = 400;
        ctx.body = { success: false, message: error.details[0].message };
        return;
      }

      const user = await prisma.user.update({
        where: { qqId },
        data: { coins: { increment: value.coins } },
      });

      ctx.body = { success: true, data: user };
    } catch (error) {
      Logger.error('增加用户金币失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '服务器内部错误' };
    }
  }
}
