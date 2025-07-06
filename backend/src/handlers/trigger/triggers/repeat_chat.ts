import { TriggerModel } from '../types.js';

export const repeatChatTrigger: TriggerModel = {
  desc: '重复消息',
  condition: parameter => {
    if (parameter.queue.length < 2) {
      return false;
    }
    const lastMessage = parameter.queue[parameter.queue.length - 1];
    const lastLastMessage = parameter.queue[parameter.queue.length - 2];
    return lastMessage.textMessage === lastLastMessage.textMessage;
  },
  callback: async parameter => {
    const lastMessage = parameter.queue[parameter.queue.length - 1];
    return {
      data: lastMessage.textMessage.trim(),
      type: 'text',
    };
  },
};
