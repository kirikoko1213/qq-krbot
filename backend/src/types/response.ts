import { Context } from 'koa';

// 导出统一的API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code: number;
  timestamp: string;
}

// Controller 响应帮助方法
export class ResponseHelper {
  /**
   * 设置成功响应数据
   * @param ctx Koa Context
   * @param data 响应数据
   * @param message 响应消息
   */
  static success<T>(ctx: Context, data: T, message?: string) {
    ctx.body = {
      status: 'success',
      data,
      message,
      code: 0,
    };
    ctx.status = 200;
  }

  /**
   * 设置错误响应
   * @param ctx Koa Context
   * @param error 错误信息
   * @param status HTTP状态码
   */
  static error(ctx: Context, message: string, code: number = 10000) {
    ctx.status = 200;
    ctx.body = ResponseHelper.getErrorResponse(message, code);
  }

  static getErrorResponse(message: string, code: number = 10000) {
    return {
      status: 'failure',
      message,
      code,
    };
  }

  /**
   * 设置无内容响应
   * @param ctx Koa Context
   * @param message 响应消息
   */
  static noContent(ctx: Context, message?: string) {
    ctx.status = 204;
    if (message) {
      ctx.message = message;
    }
  }
}

// 便捷函数
export const success = ResponseHelper.success;
export const error = ResponseHelper.error;
export const getErrorResponse = ResponseHelper.getErrorResponse;
export const noContent = ResponseHelper.noContent;
