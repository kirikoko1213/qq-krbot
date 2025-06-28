// Agent 库入口文件 - QQ 机器人 AI Agent 工具库
// 这是一个简洁易用的 OpenAI API 封装库，支持会话管理和 MCP 工具调用

// 导出主要类和接口
export * from './types.js';
export * from './contextStorage.js';
export * from './mcpManager.js';
export * from './openaiClient.js';
export * from './examples.js';

// 导出便捷的创建函数
export {
  createOpenAIClient,
  createOpenAIClientWithStorage,
  createOpenAIClientWithMCP,
  createOpenAIClientWithAll,
} from './openaiClient.js';

export { createMemoryStorage } from './contextStorage.js';
export { createMCPManager } from './mcpManager.js';
