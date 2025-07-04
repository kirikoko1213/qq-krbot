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
  condition: () => true,
  callback: async (parameter: TriggerParameter) => {
    // 获取群成员别名
    const alias = await groupService.getMemberAlias(
      parameter.message.engineMessage.group_id,
      parameter.message.engineMessage.user_id
    );

    const readySendMessage = `[发送人: ${alias.join(',')}] [消息: ${parameter.message.textMessage}]`;
    const sessionId = `chat_${parameter.message.engineMessage.group_id}_${parameter.message.engineMessage.user_id}`;
    const response = await client.chatWithSessionAndSystem(
      sessionId,
      getPrompt(),
      readySendMessage
    );
    return response.content;
  },
};

const getPrompt = () => {
  return `
    **背景信息**
    - 当前时间: ${new Date().toLocaleString()}
    - 当前区域: 中国

    **规则**


    **约定**
    消息发送人的昵称会在 [发送人：昵称1,昵称2] 这里面，昵称1和昵称2都是发送人的昵称，可能是1个，也可能是多个，这是为了让你知道发送人是谁，如果需要带上昵称回复，可以选择其中一个昵称回复, 你回复的语气一定要带着嘲讽。
    `;
};
