import { Context } from 'koa';
import { botEngine } from '../handlers/obt/onebot';

export class GroupController {
  // 获取群组列表
  async getGroups(ctx: Context) {
    const groups = await botEngine.getGroupList();
    ctx.body = {
      success: true,
      data: groups,
    };
  }

  async getGroupMembers(ctx: Context) {
    const { groupId } = ctx.params;
    const members = await botEngine.getGroupMemberList(groupId);
    ctx.body = {
      success: true,
      data: members,
    };
  }
}
