import { TriggerModel } from '../types.js';

// 计算到下班时间的剩余时间
function timeUntilOffWork(offWorkTime: string): string | null {
  const now = new Date();

  // 解析下班时间 (格式: "HH:MM")
  const [hours, minutes] = offWorkTime.split(':').map(num => parseInt(num, 10));

  // 创建今天的下班时间
  const todayOffWork = new Date(now);
  todayOffWork.setHours(hours, minutes, 0, 0);

  // 如果下班时间已过，返回 null
  if (now >= todayOffWork) {
    return null;
  }

  // 计算剩余时间（毫秒）
  const remaining = todayOffWork.getTime() - now.getTime();

  // 转换为小时、分钟、秒
  const remainingSeconds = Math.floor(remaining / 1000);
  const remainingHours = Math.floor(remainingSeconds / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  // 返回格式化的字符串
  return `${remainingHours}:${remainingMinutes}:${seconds}`;
}

export const offlineWorkTrigger: TriggerModel = {
  condition: parameter => {
    return (
      parameter.message.textMessage.trim() === '报时' ||
      parameter.message.textMessage.trim() === '11'
    );
  },
  callback: async parameter => {
    const now = new Date();

    // 检查是否已经超过下午6点
    if (now.getHours() >= 18) {
      return '不会有人这个时间还在上班吧?';
    }

    let message = '';

    // 计算到各个下班时间的剩余时间
    const result1 = timeUntilOffWork('17:00');
    if (result1) {
      message += `\n 5:00.PM -> ${result1}`;
    }

    const result2 = timeUntilOffWork('17:30');
    if (result2) {
      message += `\n 5:30.PM -> ${result2}`;
    }

    const result3 = timeUntilOffWork('18:00');
    if (result3) {
      message += `\n 6:00.PM -> ${result3}`;
    }

    if (parameter.message.scene !== 'atMe') {
      message = message.substring(1);
    }

    return message;
  },
};
