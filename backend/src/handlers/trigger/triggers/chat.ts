import { TriggerModel, TriggerParameter } from '../types';
import { createOpenAIClient } from '../../../agent/openaiClient';
import conf from '../../config/config';

const client = createOpenAIClient({
  apiKey: conf.get('OPENAI_API_KEY')!,
  baseURL: conf.get('OPENAI_BASE_URL')!,
  model: conf.get('OPENAI_MODEL')!,
});

export const ChatTrigger: TriggerModel = {
  condition: () => true,
  callback: async (parameter: TriggerParameter) => {
    const response = await client.simpleChat(parameter.message.textMessage);
    return response.content;
  },
};
