import { AiRoleRepository } from './aiRoleRepository.js';
import { DynamicTriggerRepository } from './dynamicTriggerRepository.js';
import { MemberAliasRepository } from './memberAliasRepository.js';
import { MessageCountRepository } from './messageCountRepository.js';
import { MessageRecordRepository } from './messageRecordRepository.js';
import { dbService } from '../services/database.js';

// 使用单例的 Prisma 客户端实例
const prisma = dbService.prisma;

// 创建并导出所有 repository 实例
export const aiRoleRepository = new AiRoleRepository(prisma);
export const dynamicTriggerRepository = new DynamicTriggerRepository(prisma);
export const memberAliasRepository = new MemberAliasRepository(prisma);
export const messageCountRepository = new MessageCountRepository(prisma);
export const messageRecordRepository = new MessageRecordRepository(prisma);

// 导出 Prisma 客户端
export { prisma };

// 导出类型
export type {
  AiRoleRepository,
  DynamicTriggerRepository,
  MemberAliasRepository,
  MessageCountRepository,
  MessageRecordRepository,
};
