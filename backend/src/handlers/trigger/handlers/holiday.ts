/**
 * 假期处理器 - 计算假期倒计时和工作日信息
 * @param targetHoliday 目标假期日期，格式为 yyyy-MM-dd
 * @returns 包含剩余天数和剩余工作日的结构化数据
 */
export async function holidayProcessor(targetHoliday: string) {
  const now = new Date();
  const targetDate = new Date(targetHoliday);

  // 计算剩余天数
  const timeDiff = targetDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // 计算剩余工作日
  const remainingWorkDays = calculateWorkDays(now, targetDate);

  return {
    targetDate: targetHoliday,
    remainingDays: remainingDays,
    remainingWorkDays: remainingWorkDays,
    message: `距离假期还有 ${remainingDays} 天，其中工作日 ${remainingWorkDays} 天`,
  };
}

/**
 * 计算两个日期之间的工作日数量
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 工作日数量
 */
function calculateWorkDays(startDate: Date, endDate: Date): number {
  let workDays = 0;
  const currentDate = new Date(startDate);

  // 从明天开始计算到目标日期前一天
  currentDate.setDate(currentDate.getDate() + 1);

  while (currentDate < endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD格式

    if (isWorkDay(dateStr)) {
      workDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workDays;
}

/**
 * 判断某一天是否为工作日
 * @param dateStr 日期字符串 (YYYY-MM-DD格式)
 * @returns 是否为工作日
 */
function isWorkDay(dateStr: string): boolean {
  // 首先从holidayList中查找
  for (const holiday of holidayList) {
    if (holiday.dateRange.includes(dateStr)) {
      return holiday.type === 'line'; // line表示上班，offline表示放假
    }
  }

  // 如果holidayList中没有找到，判断是否为周末
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0=周日, 6=周六

  // 周六(6)和周日(0)不是工作日
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

type HolidayType = {
  name: string;
  // offline 放假
  // line 上班
  type: 'offline' | 'line';
  dateRange: string[];
};

export const holidayList: HolidayType[] = [
  {
    name: '国庆节',
    type: 'offline',
    dateRange: ['2025-10-01', '2025-10-08'],
  },
  {
    name: '调休',
    type: 'line',
    dateRange: ['2025-09-28'],
  },
  {
    name: '调休',
    type: 'line',
    dateRange: ['2025-10-11'],
  },
];
