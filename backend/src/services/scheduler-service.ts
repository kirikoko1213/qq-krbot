import cron from 'node-cron';
import { Logger } from '../utils/logger.js';
import { holidayProcessor } from '../handlers/trigger/handlers/holiday.js';
import { botEngine } from '@/handlers/obt/onebot.js';

/**
 * 定时任务服务 - 管理所有定时任务
 */
export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * 初始化所有定时任务
   */
  public init(): void {
    Logger.info('正在初始化定时任务服务...');

    // 每天早上8点调用holidayProcessor
    this.scheduleHolidayReminder();

    Logger.info('定时任务服务初始化完成');
  }

  /**
   * 安排假期提醒任务 - 每天早上8点执行
   */
  private scheduleHolidayReminder(): void {
    const taskName = 'holiday-reminder';

    // cron表达式: 0 8 * * * 表示每天早上8点
    const task = cron.schedule(
      '0 14 06 * *',
      async () => {
        try {
          Logger.info('开始执行假期提醒任务');

          // 调用holidayProcessor，使用国庆节作为目标假期
          const holidayInfo = await holidayProcessor('2025-10-01');

          Logger.info('假期提醒任务执行完成', {
            targetDate: holidayInfo.targetDate,
            remainingDays: holidayInfo.remainingDays,
            remainingWorkDays: holidayInfo.remainingWorkDays,
            message: holidayInfo.message,
          });

          // 这里可以添加发送消息到QQ群的逻辑
          await botEngine.sendGroupMessage(815182520, holidayInfo.message);
        } catch (error) {
          Logger.error('假期提醒任务执行失败', error);
        }
      },
      {
        timezone: 'Asia/Shanghai', // 设置时区为中国时区
      }
    );

    // 先停止任务，等待手动启动
    // task.start();

    this.tasks.set(taskName, task);
    Logger.info(`已注册定时任务: ${taskName} (每天早上8点)`);
  }

  /**
   * 启动所有定时任务
   */
  public startAll(): void {
    Logger.info('正在启动所有定时任务...');

    this.tasks.forEach((task, name) => {
      task.start();
      Logger.info(`定时任务已启动: ${name}`);
    });

    Logger.info(`已启动 ${this.tasks.size} 个定时任务`);
  }

  /**
   * 停止所有定时任务
   */
  public stopAll(): void {
    Logger.info('正在停止所有定时任务...');

    this.tasks.forEach((task, name) => {
      task.stop();
      Logger.info(`定时任务已停止: ${name}`);
    });

    Logger.info('所有定时任务已停止');
  }

  /**
   * 启动指定的定时任务
   * @param taskName 任务名称
   */
  public startTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      Logger.info(`定时任务已启动: ${taskName}`);
      return true;
    }

    Logger.warn(`定时任务不存在: ${taskName}`);
    return false;
  }

  /**
   * 停止指定的定时任务
   * @param taskName 任务名称
   */
  public stopTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      Logger.info(`定时任务已停止: ${taskName}`);
      return true;
    }

    Logger.warn(`定时任务不存在: ${taskName}`);
    return false;
  }

  /**
   * 获取所有任务的状态
   */
  public getTasksStatus(): { name: string; running: boolean }[] {
    const status: { name: string; running: boolean }[] = [];

    this.tasks.forEach((task, name) => {
      status.push({
        name,
        running: task.getStatus() === 'scheduled',
      });
    });

    return status;
  }

  /**
   * 手动执行假期提醒任务（用于测试）
   */
  public async executeHolidayReminderNow(): Promise<void> {
    try {
      Logger.info('手动执行假期提醒任务');

      const holidayInfo = await holidayProcessor('2025-10-01');

      Logger.info('假期提醒任务手动执行完成', {
        targetDate: holidayInfo.targetDate,
        remainingDays: holidayInfo.remainingDays,
        remainingWorkDays: holidayInfo.remainingWorkDays,
        message: holidayInfo.message,
      });
    } catch (error) {
      Logger.error('假期提醒任务手动执行失败', error);
      throw error;
    }
  }
}

// 创建单例实例
export const schedulerService = new SchedulerService();
