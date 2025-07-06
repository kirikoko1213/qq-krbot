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
      data: `🌸使用方法🌸
              1. 报时: @我并发送 报时，显示下班时间
              2. 来点涩图：随机发送一张全年龄向二次元美图
              3. AI回复: @我输入任意内容即可与AI对话
              ......
              开源地址: https://github.com/kirikoko1213/qq-krbot`,
      type: 'text',
    };
  },
};
