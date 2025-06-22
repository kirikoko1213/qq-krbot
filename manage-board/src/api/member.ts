import { request } from '@/utils/request'

// 群组信息类型
export interface GroupInfo {
  groupId: string
  groupName: string
}

// 群员信息类型
export interface MemberInfo {
  groupId: string
  qqAccount: string
  nickname: string
  alias: string[]
}

// 获取群组列表
export const getGroupList = () => {
  return request.get<GroupInfo[]>('/group/list')
}

// 获取群员列表
export const getMemberList = (groupId: string) => {
  return request.get<{ list: MemberInfo[], total: number }>(`/group/${groupId}/members`)
}

// 更新群员别名
export const updateMemberAlias = (groupId: string, qqAccount: string, alias: string[]) => {
  return request.post('/group/member/alias', {
    groupId,
    qqAccount,
    alias
  })
} 