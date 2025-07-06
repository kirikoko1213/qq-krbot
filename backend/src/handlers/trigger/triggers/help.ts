import conf from '@/handlers/config/config.js';
import { TriggerModel } from '../types.js';

export const helpTrigger: TriggerModel = {
  desc: '帮助',
  condition: parameter => {
    return (
      parameter.message.textMessage.trim() === '?' ||
      parameter.message.textMessage.trim() === '？' ||
      parameter.message.textMessage.trim() === ''
    );
  },
  callback: async () => {
    return {
      data: await conf.get('help.message'),
      type: 'text',
    };
  },
};
