# QQ 机器人 AI Agent 工具库

这是一个简洁易用的 OpenAI API 封装库，专为 QQ 机器人项目设计，支持会话管理、MCP 工具调用和流式响应。

## 🚀 特性

- **简单易用** - 只需提供 API Key 即可开始使用
- **会话管理** - 支持多用户会话上下文记忆
- **工具调用** - 通过 MCP 协议集成外部工具
- **流式响应** - 支持实时流式输出
- **类型安全** - 完整的 TypeScript 类型定义
- **高度可配置** - 支持自定义模型、温度、Token 限制等
- **错误处理** - 完善的错误处理和日志记录

## 📦 安装

```bash
# 此库已内置在项目中，无需单独安装
```

## 🚀 快速开始

### 基础使用

```typescript
import { createOpenAIClient } from './agent/index.js';

// 创建客户端
const client = createOpenAIClient({
  apiKey: process.env.OPENAI_API_KEY!, // 从环境变量读取 API 密钥
});

// 简单对话
const response = await client.simpleChat('你好，请介绍一下你自己');
console.log('AI回复:', response.content);
```

### 带系统提示的对话

```typescript
const systemPrompt = '你是一个专业的编程助手，请用简洁明了的语言回答问题。';
const userQuestion = '如何在TypeScript中创建一个HTTP服务器？';

const response = await client.chatWithSystem(systemPrompt, userQuestion);
console.log('AI回复:', response.content);
```

## 📋 核心组件

### 1. OpenAI 客户端 (OpenAIClient)

主要的 AI 对话客户端，提供多种对话模式：

```typescript
import { OpenAIClient, OpenAIConfig } from './agent/index.js';

const config: OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY!,   // 从环境变量读取
  baseURL: 'https://api.openai.com/v1', // 可选：自定义端点
  model: 'gpt-3.5-turbo',                // 可选：指定模型
  maxTokens: 1000,                       // 可选：最大Token数
  temperature: 0.7,                      // 可选：温度参数
  timeout: 30000,                        // 可选：超时时间(毫秒)
};

const client = new OpenAIClient(config);
```

#### 主要方法

- `simpleChat(message)` - 简单对话
- `chatWithSystem(systemPrompt, userMessage)` - 带系统提示的对话
- `chatWithMessages(messages)` - 多轮对话
- `chatStream(messages, callback)` - 流式对话
- `chatWithSession(sessionId, message)` - 会话对话
- `chatWithTools(messages)` - 工具调用对话

### 2. 上下文存储 (ContextStorage)

管理用户会话和消息历史：

```typescript
import { MemoryContextStorage, createOpenAIClientWithStorage } from './agent/index.js';

// 创建内存存储（最多存储50条消息）
const storage = new MemoryContextStorage(50);

// 创建带存储的客户端
const client = createOpenAIClientWithStorage(config, storage);

// 开始会话
const sessionId = 'user-123';
const response = await client.chatWithSession(sessionId, '我叫小明');

// 继续会话（会记住之前的对话）
const response2 = await client.chatWithSession(sessionId, '我的名字是什么？');
```

#### 会话管理方法

- `saveMessage(sessionId, message)` - 保存消息
- `loadMessages(sessionId)` - 加载消息历史
- `clearSession(sessionId)` - 清空会话
- `deleteSession(sessionId)` - 删除会话
- `listSessions()` - 列出所有会话
- `getSessionInfo(sessionId)` - 获取会话信息

### 3. MCP 管理器 (MCPManager)

管理 MCP (Model Context Protocol) 工具调用：

```typescript
import { MCPManager, createOpenAIClientWithMCP } from './agent/index.js';

// 创建 MCP 管理器
const mcpManager = new MCPManager({
  url: 'http://localhost:3001/mcp',
  enableLogging: true,
  logToolCalls: true,
});

// 连接到 MCP 服务器
await mcpManager.connect();

// 创建带 MCP 功能的客户端
const client = createOpenAIClientWithMCP(config, mcpManager);

// 使用工具对话
const response = await client.chatWithTools([
  { role: 'user', content: '请帮我查询北京的天气' }
]);
```

#### MCP 方法

- `connect()` - 连接到 MCP 服务器
- `disconnect()` - 断开连接
- `isConnected()` - 检查连接状态
- `getTools()` - 获取可用工具列表
- `callTool(name, args)` - 调用指定工具
- `getStats()` - 获取连接统计信息

## 🔧 完整功能示例

结合所有功能的完整示例：

```typescript
import { 
  createOpenAIClientWithAll, 
  MemoryContextStorage, 
  MCPManager 
} from './agent/index.js';

// 创建存储和 MCP 管理器
const storage = new MemoryContextStorage(50);
const mcpManager = new MCPManager({
  url: 'http://localhost:3001/mcp',
  enableLogging: true,
});

await mcpManager.connect();

// 创建完整功能的客户端
const client = createOpenAIClientWithAll(config, storage, mcpManager);

const sessionId = 'user-session';
const systemPrompt = '你是一个智能助手，可以使用各种工具来帮助用户。';

// 第一轮对话 - 建立上下文
const response1 = await client.chatWithSessionAndSystem(
  sessionId, 
  systemPrompt, 
  '我想了解北京的天气情况'
);

// 第二轮对话 - 利用上下文和工具
const response2 = await client.chatWithToolsAndSession(
  sessionId, 
  '那上海的天气怎么样？请比较一下'
);

// 查看对话历史
const messages = await client.getSessionMessages(sessionId);
console.log('对话历史:', messages);
```

## 🌊 流式响应

支持实时流式输出：

```typescript
await client.chatStream([
  { role: 'user', content: '请写一个 TypeScript 示例' }
], async (chunk) => {
  process.stdout.write(chunk); // 实时输出每个字符
});
```

流式会话对话：

```typescript
await client.chatStreamWithSession(sessionId, '继续刚才的话题', async (chunk) => {
  // 处理流式输出
  console.log(chunk);
});
```

## 📊 API 参考

### OpenAIConfig 接口

```typescript
interface OpenAIConfig {
  apiKey: string;           // OpenAI API 密钥
  baseURL?: string;         // API 基础 URL
  model?: string;           // 使用的模型
  maxTokens?: number;       // 最大令牌数
  temperature?: number;     // 温度参数 (0-2)
  topP?: number;           // Top-p 参数 (0-1)
  timeout?: number;        // 请求超时时间（毫秒）
  proxyURL?: string;       // 代理 URL
}
```

### Message 接口

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### ChatResponse 接口

```typescript
interface ChatResponse {
  content: string;          // AI 回复内容
  finishReason: string;     // 完成原因
  usage: {
    promptTokens: number;     // 输入令牌数
    completionTokens: number; // 输出令牌数
    totalTokens: number;      // 总令牌数
  };
}
```

## 🔧 工厂函数

提供便捷的创建函数：

```typescript
// 基础客户端
const client = createOpenAIClient({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 带存储的客户端
const clientWithStorage = createOpenAIClientWithStorage({
  apiKey: process.env.OPENAI_API_KEY!,
}, storage);

// 带 MCP 的客户端
const clientWithMCP = createOpenAIClientWithMCP({
  apiKey: process.env.OPENAI_API_KEY!,
}, mcpManager);

// 完整功能的客户端
const fullClient = createOpenAIClientWithAll({
  apiKey: process.env.OPENAI_API_KEY!,
}, storage, mcpManager);

// 创建内存存储
const storage = createMemoryStorage(100);

// 创建 MCP 管理器
const mcpManager = createMCPManager(mcpConfig);
```

## 📝 使用示例

查看 `examples.ts` 文件中的完整示例：

```typescript
import { runAllExamples } from './agent/examples.js';

// 运行所有示例
await runAllExamples();
```

## ⚠️ 注意事项

1. **API Key 安全** - 请妥善保管您的 OpenAI API Key，使用环境变量而不是硬编码
   ```bash
   # 在 .env 文件中设置
   OPENAI_API_KEY=your-actual-api-key-here
   ```

2. **错误处理** - 建议在生产环境中添加适当的错误处理
3. **会话管理** - 内存存储仅适用于开发和测试，生产环境建议实现数据库存储
4. **MCP 服务器** - 使用 MCP 功能前需要确保 MCP 服务器正在运行

## 🔗 集成到 QQ 机器人

在触发器中使用：

```typescript
// 在 triggers 中使用
import { createOpenAIClient } from '../../../agent/index.js';

const client = createOpenAIClient({
  apiKey: process.env.OPENAI_API_KEY!, // 确保在 .env 文件中设置了此变量
});

export const aiChatTrigger: TriggerModel = {
  condition: parameter => {
    return parameter.message.textMessage.startsWith('/ai');
  },
  callback: async parameter => {
    const question = parameter.message.textMessage.replace('/ai', '').trim();
    const response = await client.simpleChat(question);
    return response.content;
  },
};
```

## 📄 许可证

此库是 QQ 机器人项目的一部分，遵循项目的许可证条款。 