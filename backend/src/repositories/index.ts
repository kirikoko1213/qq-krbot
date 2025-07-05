import AiRoleModel from './models/ai-role.js';
import MemberAliasModel from './models/member-alias.js';
import MessageCountModel from './models/message-count.js';
import MessageRecordModel from './models/message-record.js';
import DynamicTriggerModel from './models/dynamic-trigger.js';

// 导出所有模型类
export {
  AiRoleModel,
  MemberAliasModel,
  MessageCountModel,
  MessageRecordModel,
  DynamicTriggerModel,
};

// 为了向后兼容，提供简化的导出别名
export const aiRoleRepository = AiRoleModel;
export const memberAliasRepository = MemberAliasModel;
export const messageCountRepository = MessageCountModel;
export const messageRecordRepository = MessageRecordModel;
export const dynamicTriggerRepository = DynamicTriggerModel;
