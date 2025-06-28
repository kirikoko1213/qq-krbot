/**
 * Prisma 类型使用示例
 * 展示如何在实际代码中使用生成的类型
 */

import { prisma } from '../index';
import {
  UserType,
  GroupType,
  UserCreateInput,
  UserUpdateInput,
  UserWithMessages,
  GroupWithDetails,
  MessageWithRelations,
  PaginatedResult,
  ApiResponse,
} from '../types/prisma';

export class PrismaUsageExample {
  // 示例 1: 创建用户（使用 CreateInput 类型）
  async createUser(userData: UserCreateInput): Promise<UserType> {
    const user = await prisma.user.create({
      data: userData, // TypeScript 会检查 userData 是否符合 UserCreateInput 类型
    });
    return user; // 返回类型是 UserType
  }

  // 示例 2: 获取用户及其消息（使用 include 类型）
  async getUserWithMessages(qqId: string): Promise<UserWithMessages | null> {
    const user = await prisma.user.findUnique({
      where: { qqId },
      include: {
        messages: true, // 包含关联的消息
      },
    });

    // user 的类型是 UserWithMessages，包含 messages 数组
    if (user) {
      console.log(`用户 ${user.nickname} 有 ${user.messages.length} 条消息`);
    }

    return user;
  }

  // 示例 3: 更新用户（使用 UpdateInput 类型）
  async updateUser(
    qqId: string,
    updateData: UserUpdateInput
  ): Promise<UserType> {
    const updatedUser = await prisma.user.update({
      where: { qqId },
      data: updateData, // TypeScript 会验证 updateData 结构
    });
    return updatedUser;
  }

  // 示例 4: 复杂查询，获取群组详情
  async getGroupWithDetails(qqId: string): Promise<GroupWithDetails | null> {
    const group = await prisma.group.findUnique({
      where: { qqId },
      include: {
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: true }, // 嵌套 include
        },
        dynamicTriggers: {
          where: { isActive: true },
        },
        memberAliases: true,
      },
    });

    // group 包含所有相关数据，且有完整的类型支持
    if (group) {
      console.log(`群组 ${group.name}:`);
      console.log(`- 消息数: ${group.messages.length}`);
      console.log(`- 触发器数: ${group.dynamicTriggers.length}`);
      console.log(`- 成员别名数: ${group.memberAliases.length}`);
    }

    return group;
  }

  // 示例 5: 使用事务，确保数据一致性
  async createUserAndMessage(
    userQQId: string,
    groupQQId: string,
    messageContent: string
  ): Promise<{ user: UserType; message: MessageWithRelations }> {
    return await prisma.$transaction(async tx => {
      // 创建用户
      const user = await tx.user.upsert({
        where: { qqId: userQQId },
        update: {},
        create: { qqId: userQQId },
      });

      // 创建群组
      const group = await tx.group.upsert({
        where: { qqId: groupQQId },
        update: {},
        create: { qqId: groupQQId },
      });

      // 创建消息
      const message = await tx.message.create({
        data: {
          messageId: `msg_${Date.now()}`,
          content: messageContent,
          userId: user.id,
          groupId: group.id,
        },
        include: {
          user: true,
          group: true,
        },
      });

      return { user, message };
    });
  }

  // 示例 6: 分页查询
  async getUsersPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<UserType>> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // 示例 7: 原生 SQL 查询（带类型）
  async getTopActiveUsers(): Promise<
    Array<{ qqId: string; messageCount: number }>
  > {
    const result = await prisma.$queryRaw<
      Array<{ qq_id: string; message_count: bigint }>
    >`
      SELECT u.qq_id, COUNT(m.id) as message_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.user_id
      GROUP BY u.id, u.qq_id
      ORDER BY message_count DESC
      LIMIT 10
    `;

    // 转换 bigint 为 number
    return result.map(row => ({
      qqId: row.qq_id,
      messageCount: Number(row.message_count),
    }));
  }

  // 示例 8: 错误处理和类型安全的 API 响应
  async safeGetUser(qqId: string): Promise<ApiResponse<UserType>> {
    try {
      const user = await prisma.user.findUnique({
        where: { qqId },
      });

      if (!user) {
        return {
          success: false,
          message: '用户不存在',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: '查询用户失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

// 使用示例
export async function demonstrateUsage() {
  const example = new PrismaUsageExample();

  // 类型安全的函数调用
  const createData: UserCreateInput = {
    qqId: '123456789',
    nickname: '测试用户',
  };

  const user = await example.createUser(createData);
  console.log('创建的用户:', user.qqId, user.nickname);

  // 获取用户及消息，返回类型自动推导
  const userWithMessages = await example.getUserWithMessages('123456789');
  if (userWithMessages) {
    // TypeScript 知道 userWithMessages.messages 存在
    userWithMessages.messages.forEach(msg => {
      console.log('消息:', msg.content);
    });
  }
}
