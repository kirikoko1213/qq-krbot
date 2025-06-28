import { repositories } from '.';
import { botEngine } from '../handlers/obt/onebot';
import { GroupMemberInfo } from '../handlers/obt/types';

type GroupMember = GroupMemberInfo & {
  alias: string[];
  qqAccount: number;
};

class GroupService {
  getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
    // 获取引擎里的群成员列表
    const members = await botEngine.getGroupMemberList(groupId);

    // 获取数据库里的群成员别名
    const memberAliases =
      await repositories.memberAliasRepository.findAliasByGroupId(groupId);
    const memberAliasesMap = new Map<number, string[]>(
      memberAliases.map((alias: any) => {
        return [Number(alias.qqAccount), alias.alias as string[]];
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
    await repositories.memberAliasRepository.updateAlias(
      BigInt(groupId),
      BigInt(qqAccount),
      alias
    );
  };

  getMemberAlias = async (
    groupId: number,
    qqAccount: number
  ): Promise<string[]> => {
    const alias =
      await repositories.memberAliasRepository.findAliasByGroupIdAndQQAccount(
        BigInt(groupId),
        BigInt(qqAccount)
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
