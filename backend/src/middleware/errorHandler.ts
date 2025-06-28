import { Context, Next } from 'koa';
import { Logger } from '../utils/logger';

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error: any) {
    // 记录错误日志
    Logger.error('请求处理错误:', {
      method: ctx.method,
      url: ctx.url,
      error: error.message,
      stack: error.stack,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
    });

    // 设置错误响应
    ctx.status = error.status || 500;

    // 根据环境决定是否暴露错误详情
    const isDevelopment = process.env.NODE_ENV === 'development';

    ctx.body = {
      success: false,
      message: isDevelopment ? error.message : '服务器内部错误',
      ...(isDevelopment && {
        error: error.message,
        stack: error.stack,
      }),
    };

    // 确保响应头正确设置
    ctx.set('Content-Type', 'application/json');
  }
}
