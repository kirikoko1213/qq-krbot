// Repository 实例导出
export { default as MemberAliasRepository } from './memberAliasRepository';
export { default as DynamicTriggerRepository } from './dynamicTriggerRepository';
export { default as MessageRecordRepository } from './messageRecordRepository';
export { default as AiRoleRepository } from './aiRoleRepository';
export { default as MessageCountRepository } from './messageCountRepository';

// Repository 接口导出
export type { IMemberAliasRepository } from './memberAliasRepository';
export type { IDynamicTriggerRepository } from './dynamicTriggerRepository';
export type {
  IMessageRecordRepository,
  RankResult,
} from './messageRecordRepository';
export type { IAiRoleRepository } from './aiRoleRepository';
export type { IMessageCountRepository } from './messageCountRepository';

// Repository 工厂类
import MemberAliasRepository from './memberAliasRepository';
import DynamicTriggerRepository from './dynamicTriggerRepository';
import MessageRecordRepository from './messageRecordRepository';
import AiRoleRepository from './aiRoleRepository';
import MessageCountRepository from './messageCountRepository';

export class RepositoryFactory {
  private static memberAliasRepo: MemberAliasRepository;
  private static dynamicTriggerRepo: DynamicTriggerRepository;
  private static messageRecordRepo: MessageRecordRepository;
  private static aiRoleRepo: AiRoleRepository;
  private static messageCountRepo: MessageCountRepository;

  static getMemberAliasRepository(): MemberAliasRepository {
    if (!this.memberAliasRepo) {
      this.memberAliasRepo = new MemberAliasRepository();
    }
    return this.memberAliasRepo;
  }

  static getDynamicTriggerRepository(): DynamicTriggerRepository {
    if (!this.dynamicTriggerRepo) {
      this.dynamicTriggerRepo = new DynamicTriggerRepository();
    }
    return this.dynamicTriggerRepo;
  }

  static getMessageRecordRepository(): MessageRecordRepository {
    if (!this.messageRecordRepo) {
      this.messageRecordRepo = new MessageRecordRepository();
    }
    return this.messageRecordRepo;
  }

  static getAiRoleRepository(): AiRoleRepository {
    if (!this.aiRoleRepo) {
      this.aiRoleRepo = new AiRoleRepository();
    }
    return this.aiRoleRepo;
  }

  static getMessageCountRepository(): MessageCountRepository {
    if (!this.messageCountRepo) {
      this.messageCountRepo = new MessageCountRepository();
    }
    return this.messageCountRepo;
  }

  // 获取所有Repository实例
  static getAllRepositories() {
    return {
      memberAlias: this.getMemberAliasRepository(),
      dynamicTrigger: this.getDynamicTriggerRepository(),
      messageRecord: this.getMessageRecordRepository(),
      aiRole: this.getAiRoleRepository(),
      messageCount: this.getMessageCountRepository(),
    };
  }
}

// 默认导出工厂实例
export default RepositoryFactory;
