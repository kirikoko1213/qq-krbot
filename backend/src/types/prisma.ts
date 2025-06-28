// 从生成的 Prisma 客户端导入类型
import {
  User,
  Group,
  Message,
  DynamicTrigger,
  MemberAlias,
  Prisma,
} from '@prisma/client';

// 1. 基础模型类型（对应数据库表）
export type UserType = User;
export type GroupType = Group;
export type MessageType = Message;
export type TriggerType = DynamicTrigger;
export type MemberAliasType = MemberAlias;

// 2. 输入类型（用于创建和更新）
export type UserCreateInput = Prisma.UserCreateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type GroupCreateInput = Prisma.GroupCreateInput;
export type MessageCreateInput = Prisma.MessageCreateInput;

// 3. 查询条件类型
export type UserWhereInput = Prisma.UserWhereInput;
export type GroupWhereInput = Prisma.GroupWhereInput;
export type MessageWhereInput = Prisma.MessageWhereInput;

// 4. 排序类型
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput;
export type MessageOrderByInput = Prisma.MessageOrderByWithRelationInput;

// 5. 包含关联数据的类型
export type UserWithMessages = Prisma.UserGetPayload<{
  include: { messages: true };
}>;

export type GroupWithDetails = Prisma.GroupGetPayload<{
  include: {
    messages: true;
    dynamicTriggers: true;
    memberAliases: true;
  };
}>;

export type MessageWithRelations = Prisma.MessageGetPayload<{
  include: {
    user: true;
    group: true;
  };
}>;

// 6. 选择特定字段的类型
export type UserBasicInfo = Prisma.UserGetPayload<{
  select: {
    id: true;
    qqId: true;
    nickname: true;
    level: true;
    exp: true;
  };
}>;

// 7. 分页查询结果类型
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 8. API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// 9. 自定义查询参数类型
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  groupQQId?: string;
  userQQId?: string;
  type?: string;
}
