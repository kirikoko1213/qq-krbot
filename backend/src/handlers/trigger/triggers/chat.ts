import { TriggerModel, TriggerParameter } from '../types.js';
import { createOpenAIClient } from '../../../agent/openaiClient.js';
import conf from '../../config/config.js';
import { groupService } from '../../../services/index.js';
import { MemoryContextStorage } from '../../../agent/contextStorage.js';

const storage = new MemoryContextStorage();
const client = createOpenAIClient(
  {
    apiKey: (await conf.get('OPENAI_API_KEY')) || '',
    baseURL: (await conf.get('OPENAI_BASE_URL')) || '',
    model: (await conf.get('OPENAI_MODEL')) || '',
  },
  storage
);

export const ChatTrigger: TriggerModel = {
  desc: 'AI聊天',
  condition: (parameter: TriggerParameter) => {
    return parameter.message.textMessage.trim() !== '';
  },
  callback: async (parameter: TriggerParameter) => {
    const groupId = parameter.message.engineMessage.group_id;
    const qqAccount = parameter.message.engineMessage.user_id;
    // 获取群成员别名
    const alias = await groupService.getMemberAlias(groupId, qqAccount);

    const readySendMessage = `[发送人: ${alias.join(',')}] [消息: ${parameter.message.textMessage}]`;
    const sessionId = `chat_${groupId}_${qqAccount}`;
    const prompt = await getPrompt(groupId, qqAccount);
    const response = await client.chatWithSessionAndSystem(
      sessionId,
      prompt,
      readySendMessage
    );
    return {
      data: response.content,
      type: 'text',
    };
  },
};

const getPrompt = async (groupId: number, qqAccount: number) => {
  const level1 = await conf.get(`ai_talk.prompts`);
  const level2 = await conf.get(`ai_talk.prompts.group-${groupId}`);
  const level3 = await conf.get(
    `ai_talk.prompts.group-${groupId}.user-${qqAccount}`
  );
  return `
    **角色设定**
    你是一个活跃的QQ群成员，你经常使用贴吧老哥的语气跟群员对话。

    **基本信息**
    - 当前时间: ${new Date().toLocaleString()}
    - 所在地区: 中国
    - 你知道常见的中国网络文化、梗和流行词汇

    **交流规则**
    - 全局规则: ${level1 || '无'}
    - 当前群规则: ${level2 || '无'}
    - 针对该用户规则: ${level3 || '无'}

    **聊天指南**
    - 消息发送人的昵称会以[发送人：昵称1,昵称2]格式显示，这些都是同一个人的不同昵称，[]只是一个标记，不要把[]也带上
    - 回复时可随意选择其中一个昵称称呼对方
    - 回复要简短自然，像真人聊天，不要太正式
    - 语气要带着调侃和轻微嘲讽，但要保持友善的底线
    - 可以使用"哈哈哈"、"笑死"、"绝了"、"难绷"等表达情绪

    记住，你是群里的活跃成员，说话要有群聊氛围感。
    `;
};
