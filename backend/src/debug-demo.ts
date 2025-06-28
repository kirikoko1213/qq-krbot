import { Logger } from './utils/logger';

export function debugDemo() {
  Logger.info('开始调试演示');

  // 示例 1: 简单的变量和计算
  const numbers = [1, 2, 3, 4, 5];
  let sum = 0;

  for (const num of numbers) {
    sum += num; // 👈 在这里设置断点
    Logger.info(`当前数字: ${num}, 当前总和: ${sum}`);
  }

  // 示例 2: 对象操作
  const user = {
    id: 123,
    name: '测试用户',
    email: 'test@example.com',
  };

  const userInfo = processUser(user); // 👈 在这里设置断点
  Logger.info('处理后的用户信息:', userInfo);

  // 示例 3: 异步操作
  setTimeout(() => {
    Logger.info('异步操作完成'); // 👈 在这里设置断点
  }, 1000);

  return { sum, userInfo };
}

function processUser(user: any) {
  const processed = {
    ...user,
    fullName: user.name.toUpperCase(),
    domain: user.email.split('@')[1],
    timestamp: new Date().toISOString(),
  };

  return processed; // 👈 在这里设置断点
}

// 导出供其他地方调用
export default debugDemo;
