export type GroupInfo = {
  groupId: number;
  groupName: string;
  groupMemo: string;
  groupCreateTime: number;
  memberCount: number;
  maxMemberCount: number;
  remarkName: string;
};

export type GroupMemberInfo = {
  groupId: number;
  userId: number;
  nickname: string;
  card: string;
  title?: string;
  sex?: string;
  age?: number;
  area?: string;
  level?: string;
  qqLevel?: number;
  joinTime?: number;
  lastSentTime?: number;
  titleExpireTime?: number;
  unfriendly?: boolean;
  cardChangeable?: boolean;
};
