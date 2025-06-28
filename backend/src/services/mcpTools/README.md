# MCP 工具模块

这个模块包含了从 Go 版本迁移过来的 MCP (Model Context Protocol) 工具实现。

## 🚀 包含的工具

### 1. 天气工具 (weather)
- **功能**: 获取指定城市的实时天气信息
- **参数**: `city` (string) - 中文城市名称
- **数据源**: 聚合数据天气API
- **环境变量**: `JUHE_KEY_SIMPLE_WEATHER` - 聚合数据API密钥

**使用示例**:
```typescript
const result = await toolRegistry.callTool('weather', { city: '北京' });
```

### 2. QQ群排行榜工具 (qq_group_message_rank)
- **功能**: 获取QQ群今日消息发言排行榜（前5名）
- **参数**: `groupId` (string) - QQ群ID
- **数据源**: 本地数据库消息记录

**使用示例**:
```typescript
const result = await toolRegistry.callTool('qq_group_message_rank', { groupId: '123456789' });
```

### 3. DNF金币价格工具 (dnf_gold)
- **功能**: 获取地下城与勇士游戏的金币价格信息
- **参数**: 无
- **数据源**: UU898网站

**使用示例**:
```typescript
const result = await toolRegistry.callTool('dnf_gold', {});
```

## 📁 文件结构

```
mcpTools/
├── index.ts           # 模块入口
├── types.ts           # 类型定义
├── toolRegistry.ts    # 工具注册中心
├── weatherTool.ts     # 天气工具实现
├── qqTool.ts         # QQ群排行榜工具实现
├── dnfGoldTool.ts    # DNF金币价格工具实现
└── README.md         # 本文档
```

## 🔧 工具注册中心 (ToolRegistry)

`MCPToolRegistry` 类负责管理所有的 MCP 工具：

- **注册工具**: `registerTool(tool)`
- **获取工具**: `getTool(name)`
- **调用工具**: `callTool(name, args)`
- **获取统计**: `getStats()`

## 🌐 HTTP API 接口

通过 `/api/mcp` 路由提供 HTTP 接口：

- `GET /api/mcp/tools` - 获取所有工具列表
- `GET /api/mcp/tools/:name` - 获取指定工具信息
- `POST /api/mcp/tools/:name/call` - 调用指定工具
- `POST /api/mcp/tools/batch` - 批量调用工具
- `GET /api/mcp/stats` - 获取统计信息
- `GET /api/mcp/health` - 健康检查

## 📝 工具调用示例

### 获取工具列表
```bash
curl http://localhost:3000/api/mcp/tools
```

### 调用天气工具
```bash
curl -X POST http://localhost:3000/api/mcp/tools/weather/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"city": "北京"}}'
```

### 调用QQ排行榜工具
```bash
curl -X POST http://localhost:3000/api/mcp/tools/qq_group_message_rank/call \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"groupId": "123456789"}}'
```

### 批量调用工具
```bash
curl -X POST http://localhost:3000/api/mcp/tools/batch \
  -H "Content-Type: application/json" \
  -d '{
    "calls": [
      {"name": "weather", "arguments": {"city": "北京"}},
      {"name": "dnf_gold", "arguments": {}}
    ]
  }'
```

## 🔑 环境变量配置

在 `.env` 文件中添加必要的环境变量：

```bash
# 聚合数据天气API密钥
JUHE_KEY_SIMPLE_WEATHER=your-juhe-api-key

# 数据库连接字符串
DATABASE_URL="mysql://username:password@localhost:3306/database"
```

## 🎯 在 Agent 中使用

这些工具已经集成到 Agent 库中，可以通过 AI 对话自动调用：

```typescript
import { createOpenAIClientWithMCP } from '../agent/index.js';
import { MCPManager } from '../agent/mcpManager.js';

// 创建 MCP 管理器（连接到本地工具）
const mcpManager = new MCPManager({
  url: 'http://localhost:3000/api/mcp',
});

await mcpManager.connect();

// 创建带工具的 AI 客户端
const client = createOpenAIClientWithMCP({
  apiKey: process.env.OPENAI_API_KEY!,
}, mcpManager);

// AI 会自动判断并调用相应工具
const response = await client.chatWithTools([
  { role: 'user', content: '请帮我查询北京的天气' }
]);
```

## 🔧 扩展自定义工具

要添加新的工具，请按照以下步骤：

1. **定义工具类型**（在 `types.ts` 中）
2. **实现工具逻辑**（创建新的工具文件）
3. **注册工具**（在 `toolRegistry.ts` 中）
4. **更新导出**（在 `index.ts` 中）

示例：
```typescript
// myCustomTool.ts
export const myCustomTool: MCPTool = {
  definition: {
    name: 'my_custom_tool',
    description: '我的自定义工具',
    inputSchema: {
      type: 'object',
      properties: {
        param: { type: 'string', description: '参数描述' }
      },
      required: ['param']
    }
  },
  handler: async (args) => {
    // 工具逻辑实现
    return {
      success: true,
      content: '工具执行结果'
    };
  }
};
```

## 📊 监控和日志

所有工具调用都会产生详细的日志记录，包括：
- 工具调用开始和结束时间
- 传入参数
- 执行结果
- 错误信息（如果有）

可以通过查看应用日志来监控工具的使用情况和性能。 