import { Context } from 'koa';

import { messageService } from '../services';
import { EngineMessageType } from '../types/message';

export class MessageController {
  receiveMessage = async (ctx: Context) => {
    const body = (ctx.request.body || {}) as EngineMessageType;
    await messageService.handleReceiveMessage(body);
    ctx.body = { success: true, message: '消息已接收' };
  };
}
