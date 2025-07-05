import { Context } from 'koa';
import { botEngine } from '../handlers/obt/onebot.js';
import { groupService } from '../services/index.js';
import { success, error } from '../types/response.js';

export class GroupController {
  // 获取群组列表
  async getGroups(ctx: Context) {
    try {
      const groups = await botEngine.getGroupList();
      success(ctx, groups);
    } catch (err: any) {
      error(ctx, `获取群组列表失败: ${err.message}`);
    }
  }

  async getGroupMembers(ctx: Context) {
    try {
      const { groupId } = ctx.params;

      if (!groupId) {
        error(ctx, '群组ID不能为空');
        return;
      }

      const members = await groupService.getGroupMembers(groupId);

      success(ctx, {
        list: members,
        total: members.length,
      });
    } catch (err: any) {
      error(ctx, `获取群组成员失败: ${err.message}`);
    }
  }

  // 演示其他响应方式
  async updateGroupMemberAlias(ctx: Context) {
    const { groupId, qqAccount, alias } = ctx.request.body as {
      groupId: number;
      qqAccount: number;
      alias: string[];
    };

    await groupService.updateGroupMemberAlias(groupId, qqAccount, alias);

    success(ctx, '群组更新成功');
  }
}
