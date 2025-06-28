import {
  OpenAIClient,
  createOpenAIClient,
  createOpenAIClientWithStorage,
  createOpenAIClientWithMCP,
  createOpenAIClientWithAll,
} from './openaiClient.js';
import { MemoryContextStorage } from './contextStorage.js';
import { MCPManager } from './mcpManager.js';
import { OpenAIConfig, MCPConfig } from './types.js';
import { Logger } from '../utils/logger.js';

/**
 * 基础使用示例
 */
export async function basicExample() {
  console.log('=== 基础使用示例 ===');

  // 1. 创建配置
  const config: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here', // 从环境变量读取 API 密钥
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000,
  };

  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  请设置环境变量 OPENAI_API_KEY 来运行此示例');
    return;
  }

  // 2. 创建客户端
  const client = createOpenAIClient(config);

  try {
    // 3. 简单对话
    console.log('\n--- 简单对话 ---');
    const response1 = await client.simpleChat('你好，请介绍一下你自己');
    console.log('用户: 你好，请介绍一下你自己');
    console.log('AI:', response1.content);
    console.log('使用令牌:', response1.usage.totalTokens);

    // 4. 带系统提示的对话
    console.log('\n--- 系统提示对话 ---');
    const systemPrompt = '你是一个专业的编程助手，请用简洁明了的语言回答问题。';
    const userQuestion = '如何在TypeScript中创建一个HTTP服务器？';

    const response2 = await client.chatWithSystem(systemPrompt, userQuestion);
    console.log('系统提示:', systemPrompt);
    console.log('用户:', userQuestion);
    console.log('AI:', response2.content);

    // 5. 多轮对话
    console.log('\n--- 多轮对话 ---');
    const messages = [
      { role: 'system' as const, content: '你是一个友好的助手' },
      { role: 'user' as const, content: '今天天气怎么样？' },
      { role: 'assistant' as const, content: '抱歉，我无法获取实时天气信息。' },
      { role: 'user' as const, content: '那请告诉我一些关于天气的有趣知识吧' },
    ];

    const response3 = await client.chatWithMessages(messages);
    console.log('多轮对话最后回复:', response3.content);

    // 6. 流式对话示例
    console.log('\n--- 流式对话 ---');
    console.log('AI: ');
    await client.chatStream(
      [{ role: 'user', content: '请写一个简短的TypeScript Hello World程序' }],
      async content => {
        process.stdout.write(content);
      }
    );
    console.log('\n');
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

/**
 * 上下文管理示例
 */
export async function contextExample() {
  console.log('\n=== 上下文管理示例 ===');

  // 1. 创建带内存存储的客户端
  const storage = new MemoryContextStorage(50); // 最多存储50条消息
  const config: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  };

  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  请设置环境变量 OPENAI_API_KEY 来运行此示例');
    return;
  }

  const client = createOpenAIClientWithStorage(config, storage);

  try {
    // 2. 开始一个新会话
    const sessionId = 'user-123'; // 通常使用用户ID或其他唯一标识
    const systemPrompt = '你是一个友好的助手，请记住我们的对话内容。';

    // 第一轮对话
    console.log('\n--- 第一轮对话 ---');
    const response1 = await client.chatWithSessionAndSystem(
      sessionId,
      systemPrompt,
      '我叫小明，今年25岁'
    );
    console.log('用户: 我叫小明，今年25岁');
    console.log('AI:', response1.content);

    // 第二轮对话（应该记住之前的信息）
    console.log('\n--- 第二轮对话 ---');
    const response2 = await client.chatWithSession(
      sessionId,
      '我的名字是什么？'
    );
    console.log('用户: 我的名字是什么？');
    console.log('AI:', response2.content);

    // 第三轮对话
    console.log('\n--- 第三轮对话 ---');
    const response3 = await client.chatWithSession(sessionId, '我今年几岁了？');
    console.log('用户: 我今年几岁了？');
    console.log('AI:', response3.content);

    // 3. 查看会话信息
    console.log('\n--- 会话信息 ---');
    const sessionInfo = await client.getSessionInfo(sessionId);
    if (sessionInfo) {
      console.log('会话ID:', sessionInfo.sessionId);
      console.log('消息数量:', sessionInfo.messageCount);
      console.log('创建时间:', sessionInfo.createdAt.toLocaleString());
      console.log('更新时间:', sessionInfo.updatedAt.toLocaleString());
      console.log('首条消息:', sessionInfo.firstMessage);
    }

    // 4. 查看会话历史
    console.log('\n--- 会话历史 ---');
    const messages = await client.getSessionMessages(sessionId);
    messages.forEach((msg, index) => {
      console.log(
        `${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}...`
      );
    });
  } catch (error) {
    console.error('上下文示例执行失败:', error);
  }
}

/**
 * MCP 功能示例
 */
export async function mcpExample() {
  console.log('\n=== MCP 功能示例 ===');

  try {
    // 1. 创建 MCP 配置
    const mcpConfig: MCPConfig = {
      url: 'http://localhost:3001/mcp', // 您的 MCP 服务器地址
      serverName: 'qq-mcp-server',
      clientName: 'agent-client',
      clientVersion: '1.0.0',
      enableLogging: true,
      logToolCalls: true,
    };

    // 2. 创建 MCP 管理器
    const mcpManager = new MCPManager(mcpConfig);

    // 3. 连接到 MCP 服务器
    console.log('连接到 MCP 服务器...');
    await mcpManager.connect();
    console.log('MCP 服务器连接成功！');

    // 4. 创建带 MCP 功能的 OpenAI 客户端
    const config: OpenAIConfig = {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    };

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  请设置环境变量 OPENAI_API_KEY 来运行此示例');
      return;
    }
    const client = createOpenAIClientWithMCP(config, mcpManager);

    // 5. 查看可用工具
    const tools = mcpManager.getToolNames();
    console.log('可用工具数量:', tools.length);
    tools.forEach((toolName, index) => {
      console.log(`${index + 1}. ${toolName}`);
      const toolInfo = mcpManager.getToolInfo(toolName);
      if (toolInfo) {
        console.log(`   描述: ${toolInfo.description}`);
      }
    });

    // 6. 简单的工具调用对话
    console.log('\n--- 天气查询示例 ---');
    const response1 = await client.chatWithTools([
      { role: 'user', content: '请帮我查询北京的天气' },
    ]);
    console.log('用户: 请帮我查询北京的天气');
    console.log('AI:', response1.content);

    // 7. 多工具调用示例
    console.log('\n--- 多工具调用示例 ---');
    const response2 = await client.chatWithTools([
      { role: 'user', content: '请帮我搜索TypeScript的相关信息，然后计算1+1' },
    ]);
    console.log('用户: 请帮我搜索TypeScript的相关信息，然后计算1+1');
    console.log('AI:', response2.content);

    // 清理
    await mcpManager.disconnect();
  } catch (error) {
    console.error('MCP 示例执行失败:', error);
  }
}

/**
 * 完整功能示例（MCP + 上下文管理）
 */
export async function fullFeaturesExample() {
  console.log('\n=== 完整功能示例 ===');

  try {
    // 1. 创建存储和 MCP 管理器
    const storage = new MemoryContextStorage(50);
    const mcpManager = new MCPManager({
      url: 'http://localhost:3001/mcp',
      enableLogging: true,
      logToolCalls: true,
    });

    // 2. 连接 MCP
    await mcpManager.connect();

    // 3. 创建完整功能的客户端
    const config: OpenAIConfig = {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    };

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  请设置环境变量 OPENAI_API_KEY 来运行此示例');
      return;
    }
    const client = createOpenAIClientWithAll(config, storage, mcpManager);

    const sessionId = 'full-demo-session';
    const systemPrompt =
      '你是一个智能助手，可以使用各种工具来帮助用户获取信息。';

    // 4. 第一轮对话 - 建立上下文
    console.log('\n--- 第一轮对话 ---');
    const response1 = await client.chatWithToolsAndSession(
      sessionId,
      '我想了解北京的天气情况'
    );
    console.log('用户: 我想了解北京的天气情况');
    console.log('AI:', response1.content);

    // 5. 第二轮对话 - 利用上下文
    console.log('\n--- 第二轮对话 ---');
    const response2 = await client.chatWithToolsAndSession(
      sessionId,
      '那上海呢？'
    );
    console.log('用户: 那上海呢？');
    console.log('AI:', response2.content);

    // 6. 第三轮对话 - 复杂查询
    console.log('\n--- 第三轮对话 ---');
    const response3 = await client.chatWithToolsAndSession(
      sessionId,
      '请比较这两个城市的天气，哪个更适合旅游？'
    );
    console.log('用户: 请比较这两个城市的天气，哪个更适合旅游？');
    console.log('AI:', response3.content);

    // 7. 查看对话历史
    console.log('\n--- 对话历史 ---');
    const messages = await client.getSessionMessages(sessionId);
    messages.forEach((msg, index) => {
      const content =
        msg.content.length > 100
          ? msg.content.substring(0, 100) + '...'
          : msg.content;
      console.log(`${index + 1}. [${msg.role}] ${content}`);
    });

    // 清理
    await mcpManager.disconnect();
  } catch (error) {
    console.error('完整功能示例执行失败:', error);
  }
}

/**
 * 快速开始示例
 */
export async function quickStart() {
  console.log('\n=== 快速开始 ===');

  try {
    // 最简单的使用方式
    const client = createOpenAIClient({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    });

    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  请设置环境变量 OPENAI_API_KEY 来运行此示例');
      return;
    }

    const response = await client.simpleChat('Hello, World!');
    console.log('AI回复:', response.content);
  } catch (error) {
    console.error('快速开始示例失败:', error);
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  try {
    await quickStart();
    await basicExample();
    await contextExample();
    // await mcpExample(); // 需要 MCP 服务器运行
    // await fullFeaturesExample(); // 需要 MCP 服务器运行

    console.log('\n=== 所有示例运行完成 ===');
  } catch (error) {
    console.error('运行示例时出错:', error);
  }
}

// 如果直接运行此文件，则执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
