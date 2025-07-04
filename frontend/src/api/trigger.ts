import { request } from '@/utils/request'

// 动态触发器数据类型
export interface DynamicTrigger {
  ID?: number
  scene: string        // at_me pr gr
  conditionType: string      // equal contains startWith endWith handler  
  conditionValue: string     // 条件值
  triggerContentType: string // text image ai api func
  triggerContent: string     // 触发内容
  sequence: number           // 执行顺序
  description: string        // 描述
  CreatedAt?: string
  UpdatedAt?: string
}

// 获取动态触发器列表
export const getTriggerList = () => {
  return request.get<DynamicTrigger[]>('/dynamic-trigger/list')
}

// 保存动态触发器
export const saveTrigger = (data: DynamicTrigger) => {
  return request.post('/dynamic-trigger/save', data)
}

// 删除动态触发器
export const deleteTrigger = (id: number) => {
  return request.post('/dynamic-trigger/delete', { id })
}

// 获取单个动态触发器
export const getTrigger = (id: number) => {
  return request.get<DynamicTrigger>(`/dynamic-trigger/find?id=${id}`)
}

// 获取函数列表
export const getFunctions = () => {
  return request.get<string[]>('/dynamic-trigger/get-functions')
}

// 上移触发器
export const moveTriggerUp = (id: number) => {
  return request.post('/dynamic-trigger/move-up', { id })
}

// 下移触发器
export const moveTriggerDown = (id: number) => {
  return request.post('/dynamic-trigger/move-down', { id })
} 