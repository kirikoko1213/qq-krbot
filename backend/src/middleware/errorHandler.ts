import { Context, Next } from 'koa';
import { Logger } from '../utils/logger';
import { error as errorResponse, getErrorResponse } from '../types/response';

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error: any) {
    // 记录错误日志
    Logger.error('请求处理错误:', {
      method: ctx.method,
      url: ctx.url,
      error: error.message,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
    });

    // 单独输出堆栈信息，确保换行显示
    if (error.stack) {
      console.error('错误堆栈信息:\n', error.stack);
    }

    ctx.status = 200;

    // 根据环境决定是否暴露错误详情
    const isDevelopment = process.env.NODE_ENV === 'development';

    // 构建统一错误响应格式
    const response = getErrorResponse(error.message) as any;

    // 开发环境下添加更多错误信息
    if (isDevelopment) {
      response.data = {
        stack: error.stack,
        details: error,
      };
    }

    ctx.body = response;
    ctx.set('Content-Type', 'application/json');
  }
}
