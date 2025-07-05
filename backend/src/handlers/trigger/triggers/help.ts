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
    return (
      '🌸使用方法🌸\n' +
      '1. 报时: @我并发送 报时，显示下班时间' +
      '\n' +
      '2. 设定: 设置以当前群组和发送者为单位的AI角色 @我并发送 设定, 你是一个xxxxx' +
      '\n' +
      '3. 群角色设定: 设置以群组为单位的AI角色, @我并发送 群角色设定 你是一个xxxxx' +
      '\n' +
      '4. AI回复: @我输入任意内容即可与AI对话' +
      '\n' +
      '5. 群吹水排名: @我并发送 排名' +
      '\n' +
      '6. 人格分析: @我并发送 人格分析' +
      '\n' +
      '7. 假期倒计时: @我并发送 假期' +
      '\n' +
      '......' +
      '\n' +
      '\n开源地址: https://github.com/kirikoko1213/qq-krbot'
    );
  },
};
