export type GroupInfo = {
  group_id: number;
  group_name: string;
  group_memo: string;
  group_create_time: number;
  member_count: number;
  max_member_count: number;
  remark_name: string;
};

export type GroupMemberInfo = {
  nickname: string;
  card: string;
  title: string;
};
