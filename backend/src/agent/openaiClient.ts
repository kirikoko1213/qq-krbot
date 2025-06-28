import OpenAI from 'openai';
import {
  OpenAIConfig,
  Message,
  ChatResponse,
  StreamCallback,
  SessionInfo,
  ContextStorage,
  defaultOpenAIConfig,
} from './types.js';
import { MCPManager } from './mcpManager.js';
import { Logger } from '../utils/logger.js';

/**
 * OpenAI 客户端封装
 * 提供简洁易用的 OpenAI API 接口
 */
export class OpenAIClient {
  private config: OpenAIConfig;
  private openai: OpenAI;
  private storage?: ContextStorage;
  private mcpManager?: MCPManager;

  /**
   * 创建 OpenAI 客户端
   */
  constructor(
    config: OpenAIConfig,
    storage?: ContextStorage,
    mcpManager?: MCPManager
  ) {
    this.config = { ...defaultOpenAIConfig, ...config };
    this.storage = storage;
    this.mcpManager = mcpManager;

    if (!this.config.apiKey) {
      throw new Error('API Key 不能为空');
    }

    // 初始化 OpenAI 客户端
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  /**
   * 简单对话接口
   */
  async simpleChat(message: string): Promise<ChatResponse> {
    return this.chatWithMessages([{ role: 'user', content: message }]);
  }

  /**
   * 带系统提示的对话
   */
  async chatWithSystem(
    systemPrompt: string,
    userMessage: string
  ): Promise<ChatResponse> {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];
    return this.chatWithMessages(messages);
  }

  /**
   * 使用消息数组进行对话
   */
  async chatWithMessages(messages: Message[]): Promise<ChatResponse> {
    try {
      // 转换消息格式
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // 调用 OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: openaiMessages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error('OpenAI API 返回了空的响应');
      }

      return {
        content: choice.message.content,
        finishReason: choice.finish_reason || 'stop',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      Logger.error('OpenAI API 调用失败', error);
      throw error;
    }
  }

  /**
   * 流式对话接口
   */
  async chatStream(
    messages: Message[],
    callback: StreamCallback
  ): Promise<void> {
    try {
      // 转换消息格式
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // 创建流式请求
      const stream = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: openaiMessages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        stream: true,
      });

      // 处理流式响应
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          await callback(content);
        }
      }
    } catch (error) {
      Logger.error('流式对话失败', error);
      throw error;
    }
  }

  /**
   * 带会话的对话
   */
  async chatWithSession(
    sessionId: string,
    message: string
  ): Promise<ChatResponse> {
    if (!this.storage) {
      throw new Error('需要配置 ContextStorage 才能使用会话功能');
    }

    // 加载历史消息
    const history = await this.storage.loadMessages(sessionId);

    // 添加新消息
    const newMessage: Message = { role: 'user', content: message };
    history.push(newMessage);

    // 获取响应
    const response = await this.chatWithMessages(history);

    // 保存消息
    await this.storage.saveMessage(sessionId, newMessage);
    await this.storage.saveMessage(sessionId, {
      role: 'assistant',
      content: response.content,
    });

    return response;
  }

  /**
   * 带会话和系统提示的对话
   */
  async chatWithSessionAndSystem(
    sessionId: string,
    systemPrompt: string,
    message: string
  ): Promise<ChatResponse> {
    if (!this.storage) {
      throw new Error('需要配置 ContextStorage 才能使用会话功能');
    }

    // 加载历史消息
    const history = await this.storage.loadMessages(sessionId);

    // 如果没有系统消息，添加系统消息
    if (history.length === 0 || history[0].role !== 'system') {
      history.unshift({ role: 'system', content: systemPrompt });
      await this.storage.saveMessage(sessionId, {
        role: 'system',
        content: systemPrompt,
      });
    }

    // 添加用户消息
    const userMessage: Message = { role: 'user', content: message };
    history.push(userMessage);

    // 获取响应
    const response = await this.chatWithMessages(history);

    // 保存消息
    await this.storage.saveMessage(sessionId, userMessage);
    await this.storage.saveMessage(sessionId, {
      role: 'assistant',
      content: response.content,
    });

    return response;
  }

  /**
   * 流式会话对话
   */
  async chatStreamWithSession(
    sessionId: string,
    message: string,
    callback: StreamCallback
  ): Promise<void> {
    if (!this.storage) {
      throw new Error('需要配置 ContextStorage 才能使用会话功能');
    }

    const history = await this.storage.loadMessages(sessionId);
    const userMessage: Message = { role: 'user', content: message };
    history.push(userMessage);

    let responseContent = '';
    await this.chatStream(history, async chunk => {
      responseContent += chunk;
      await callback(chunk);
    });

    // 保存消息
    await this.storage.saveMessage(sessionId, userMessage);
    await this.storage.saveMessage(sessionId, {
      role: 'assistant',
      content: responseContent,
    });
  }

  /**
   * 带工具调用的对话
   */
  async chatWithTools(messages: Message[]): Promise<ChatResponse> {
    if (!this.mcpManager || !this.mcpManager.isConnected()) {
      return this.chatWithMessages(messages);
    }

    try {
      const tools = this.mcpManager.getTools();
      if (tools.length === 0) {
        return this.chatWithMessages(messages);
      }

      // 智能分析是否需要使用工具
      const needsTools = this.shouldUseTools(
        messages[messages.length - 1].content
      );

      if (!needsTools) {
        return this.chatWithMessages(messages);
      }

      // 智能工具调用决策
      const toolCalls = this.analyzeToolCallDecision(
        messages[messages.length - 1].content
      );
      let toolResults = '';

      for (const toolCall of toolCalls) {
        const result = await this.mcpManager.callTool(
          toolCall.name,
          toolCall.arguments
        );
        if (result.success) {
          toolResults += `工具 ${toolCall.name} 的结果: ${result.content}\n`;
        } else {
          toolResults += `工具 ${toolCall.name} 调用失败: ${result.error}\n`;
        }
      }

      // 将工具结果加入对话
      messages.push({
        role: 'assistant',
        content: `我使用了以下工具来获取信息：\n${toolResults}\n基于这些信息，我的回答是：`,
      });

      return this.chatWithMessages(messages);
    } catch (error) {
      Logger.error('工具调用对话失败', error);
      return this.chatWithMessages(messages);
    }
  }

  /**
   * 带工具和会话的对话
   */
  async chatWithToolsAndSession(
    sessionId: string,
    message: string
  ): Promise<ChatResponse> {
    if (!this.storage) {
      throw new Error('需要配置 ContextStorage 才能使用会话功能');
    }

    const history = await this.storage.loadMessages(sessionId);
    const userMessage: Message = { role: 'user', content: message };
    history.push(userMessage);

    const response = await this.chatWithTools(history);

    // 保存消息
    await this.storage.saveMessage(sessionId, userMessage);
    await this.storage.saveMessage(sessionId, {
      role: 'assistant',
      content: response.content,
    });

    return response;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config };

    // 重新创建 OpenAI 客户端
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  /**
   * 获取当前配置
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * 设置存储
   */
  setStorage(storage: ContextStorage): void {
    this.storage = storage;
  }

  /**
   * 获取存储
   */
  getStorage(): ContextStorage | undefined {
    return this.storage;
  }

  /**
   * 设置 MCP 管理器
   */
  setMCPManager(manager: MCPManager): void {
    this.mcpManager = manager;
  }

  /**
   * 获取 MCP 管理器
   */
  getMCPManager(): MCPManager | undefined {
    return this.mcpManager;
  }

  /**
   * 会话管理方法
   */
  async clearSession(sessionId: string): Promise<void> {
    if (!this.storage) {
      throw new Error('未配置存储');
    }
    return this.storage.clearSession(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.storage) {
      throw new Error('未配置存储');
    }
    return this.storage.deleteSession(sessionId);
  }

  async listSessions(): Promise<string[]> {
    if (!this.storage) {
      throw new Error('未配置存储');
    }
    return this.storage.listSessions();
  }

  async getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
    if (!this.storage) {
      throw new Error('未配置存储');
    }
    return this.storage.getSessionInfo(sessionId);
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    if (!this.storage) {
      throw new Error('未配置存储');
    }
    return this.storage.loadMessages(sessionId);
  }

  // 私有方法

  /**
   * 判断是否需要使用工具
   */
  private shouldUseTools(message: string): boolean {
    const toolKeywords = ['天气', '搜索', '查询', '计算', '查找', '获取'];
    return toolKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * 分析并决策工具调用
   */
  private analyzeToolCallDecision(
    message: string
  ): Array<{ name: string; arguments: Record<string, any> }> {
    const calls: Array<{ name: string; arguments: Record<string, any> }> = [];

    if (message.includes('天气')) {
      const cityMatch = message.match(/([^的]*?)(?:的)?天气/);
      const city = cityMatch ? cityMatch[1] : '北京';
      calls.push({
        name: 'get_weather',
        arguments: { city, unit: 'celsius' },
      });
    }

    if (message.includes('搜索') || message.includes('查找')) {
      calls.push({
        name: 'search_web',
        arguments: { query: message, limit: 3 },
      });
    }

    if (message.includes('计算')) {
      const mathMatch = message.match(/计算\s*(.+)/);
      const expression = mathMatch ? mathMatch[1] : '1+1';
      calls.push({
        name: 'calculate',
        arguments: { expression },
      });
    }

    return calls;
  }
}

/**
 * 创建 OpenAI 客户端的工厂方法
 */
export function createOpenAIClient(
  config: OpenAIConfig,
  storage?: ContextStorage,
  mcpManager?: MCPManager
): OpenAIClient {
  return new OpenAIClient(config, storage, mcpManager);
}

/**
 * 创建带存储的 OpenAI 客户端
 */
export function createOpenAIClientWithStorage(
  config: OpenAIConfig,
  storage: ContextStorage
): OpenAIClient {
  return new OpenAIClient(config, storage);
}

/**
 * 创建带 MCP 的 OpenAI 客户端
 */
export function createOpenAIClientWithMCP(
  config: OpenAIConfig,
  mcpManager: MCPManager
): OpenAIClient {
  return new OpenAIClient(config, undefined, mcpManager);
}

/**
 * 创建完整功能的 OpenAI 客户端
 */
export function createOpenAIClientWithAll(
  config: OpenAIConfig,
  storage: ContextStorage,
  mcpManager: MCPManager
): OpenAIClient {
  return new OpenAIClient(config, storage, mcpManager);
}
