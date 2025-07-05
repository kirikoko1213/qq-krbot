import { MemberAliasModel } from '../repositories/index.js';
import { botEngine } from '../handlers/obt/onebot.js';
import { GroupMemberInfo } from '../handlers/obt/types.js';

type GroupMember = GroupMemberInfo & {
  alias: string[];
  qqAccount: number;
};

class GroupService {
  getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
    // 获取引擎里的群成员列表
    const members = await botEngine.getGroupMemberList(groupId);

    // 获取数据库里的群成员别名
    const memberAliases = await MemberAliasModel.findByGroupId(groupId);
    const memberAliasesMap = new Map<number, string[]>(
      memberAliases.map((alias: MemberAliasModel) => {
        const data = alias.getData();
        return [Number(data.qqAccount), JSON.parse(data.alias as string)];
      })
    );

    return (
      members
        // 排序
        .sort((a: any, b: any) => {
          // 如果一样，就按照user_id 排序
          if (a.level === b.level) {
            return Number(a.joinTime) - Number(b.joinTime);
          }
          return Number(b.level) - Number(a.level);
        })
        .map(member => ({
          ...member,
          alias: memberAliasesMap.get(member.userId) || [],
          qqAccount: member.userId,
        }))
    );
  };

  updateGroupMemberAlias = async (
    groupId: number,
    qqAccount: number,
    alias: string[]
  ) => {
    await MemberAliasModel.updateAlias(groupId, qqAccount, alias);
  };

  getMemberAlias = async (
    groupId: number,
    qqAccount: number
  ): Promise<string[]> => {
    const alias = await MemberAliasModel.findAliasByGroupIdAndQQAccount(
      groupId,
      qqAccount
    );
    if (alias.length === 0) {
      const member = await botEngine.getGroupMemberInfo(groupId, qqAccount);
      if (member) {
        return [member.nickname];
      }
    }
    return alias;
  };
}

export default GroupService;
