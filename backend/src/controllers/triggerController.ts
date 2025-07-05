import { Context } from 'koa';
import DynamicTriggerModel from '../repositories/models/dynamic-trigger.js';
import { success } from '../types/response.js';
import { snakeToCamel } from '../utils/snake-convert.js';
import { dynamicTriggerService } from '../services/dynamic-trigger-service.js';

export class TriggerController {
  getTriggers = async (ctx: Context) => {
    const triggers = await DynamicTriggerModel.findAll();
    success(
      ctx,
      triggers.map(trigger => trigger.getData())
    );
  };
  saveTrigger = async (ctx: Context) => {
    const reqBody = ctx.request.body as any;
    await dynamicTriggerService.saveDynamicTrigger(reqBody);
    success(ctx, {});
  };
  deleteTrigger = async (ctx: Context) => {
    const { id } = ctx.request.body as { id: number };
    DynamicTriggerModel.delete([id]);
    success(ctx, {});
  };
  getTrigger = async (ctx: Context) => {
    const { id } = ctx.params as { id: number };
    const trigger = (await DynamicTriggerModel.findOne(id))?.getData() || {};
    success(ctx, trigger);
  };
  moveUpTrigger = async (ctx: Context) => {
    const { id } = ctx.request.body as { id: number };
    await dynamicTriggerService.moveUpDynamicTrigger(id);
    success(ctx, {});
  };
  moveDownTrigger = async (ctx: Context) => {
    const { id } = ctx.request.body as { id: number };
    await dynamicTriggerService.moveDownDynamicTrigger(id);
    success(ctx, {});
  };
}
