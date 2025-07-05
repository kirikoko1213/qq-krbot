export type MemberAliasData = {
  id?: number;
  groupId: number;
  qqAccount: number;
  alias?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type AiRoleData = {
  id?: number;
  qqAccount: number | null;
  qqNickname: string | null;
  groupId: number | null;
  groupName: string | null;
  setting: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};
