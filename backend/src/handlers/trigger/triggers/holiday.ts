import { holidayProcessor } from '../handlers/holiday.js';
import { TriggerModel } from '../types.js';

export const holidayTrigger: TriggerModel = {
  desc: '节假日倒计时',
  condition: parameter => {
    const message = parameter.message.textMessage.trim();
    return message.includes('假期') || message.includes('倒计时');
  },
  callback: async parameter => {
    const holidayInfo = await holidayProcessor('2025-10-01');
    return {
      type: 'text',
      data: `距离国庆节还有${holidayInfo.remainingDays}天，还需要上${holidayInfo.remainingWorkDays}天班`,
    };
  },
};
