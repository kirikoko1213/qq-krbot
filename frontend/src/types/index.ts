// 通用API响应类型
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 群组信息类型
export interface GroupInfo {
  groupId: string
}

// 群员信息类型
export interface MemberInfo {
  groupId: string
  qq: string
  nickname: string
  alias: string[]
} 