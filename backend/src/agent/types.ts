// Agent 库的类型定义

/**
 * OpenAI 配置
 */
export interface OpenAIConfig {
  /** OpenAI API 密钥 */
  apiKey: string;
  /** API 基础 URL，默认为 https://api.openai.com/v1 */
  baseURL?: string;
  /** 使用的模型，默认为 gpt-3.5-turbo */
  model?: string;
  /** 最大令牌数，默认为 4096 */
  maxTokens?: number;
  /** 温度参数，控制随机性，默认为 0.7 */
  temperature?: number;
  /** Top-p 参数，默认为 1.0 */
  topP?: number;
  /** 请求超时时间（毫秒），默认为 30000 */
  timeout?: number;
  /** 代理 URL（可选） */
  proxyURL?: string;
}

/**
 * 消息结构
 */
export interface Message {
  /** 消息角色：system, user, assistant */
  role: 'system' | 'user' | 'assistant';
  /** 消息内容 */
  content: string;
}

/**
 * 聊天响应
 */
export interface ChatResponse {
  /** 回复内容 */
  content: string;
  /** 完成原因 */
  finishReason: string;
  /** 令牌使用情况 */
  usage: {
    /** 输入令牌数 */
    promptTokens: number;
    /** 输出令牌数 */
    completionTokens: number;
    /** 总令牌数 */
    totalTokens: number;
  };
}

/**
 * 会话信息
 */
export interface SessionInfo {
  /** 会话 ID */
  sessionId: string;
  /** 消息数量 */
  messageCount: number;
  /** 创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
  /** 第一条消息内容（用于显示） */
  firstMessage: string;
}

/**
 * 上下文存储接口
 */
export interface ContextStorage {
  /** 保存单条消息到指定会话 */
  saveMessage(sessionId: string, message: Message): Promise<void>;
  /** 加载指定会话的所有消息 */
  loadMessages(sessionId: string): Promise<Message[]>;
  /** 清空指定会话的所有消息 */
  clearSession(sessionId: string): Promise<void>;
  /** 删除指定会话 */
  deleteSession(sessionId: string): Promise<void>;
  /** 列出所有会话 ID */
  listSessions(): Promise<string[]>;
  /** 获取会话信息 */
  getSessionInfo(sessionId: string): Promise<SessionInfo | null>;
}

/**
 * MCP 配置
 */
export interface MCPConfig {
  /** MCP 服务器 URL */
  url: string;
  /** 期望的服务器名称 */
  serverName?: string;
  /** 客户端名称 */
  clientName?: string;
  /** 客户端版本 */
  clientVersion?: string;
  /** 连接超时时间（毫秒） */
  connectTimeout?: number;
  /** Ping 间隔时间（毫秒） */
  pingInterval?: number;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 最大工具调用次数（防止无限循环） */
  maxToolCalls?: number;
  /** 工具调用超时时间（毫秒） */
  toolCallTimeout?: number;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 是否记录工具调用日志 */
  logToolCalls?: boolean;
}

/**
 * MCP 工具信息
 */
export interface MCPTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 输入参数 schema */
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * 工具调用参数
 */
export interface ToolCall {
  /** 工具名称 */
  name: string;
  /** 工具参数 */
  arguments: Record<string, any>;
}

/**
 * 工具调用结果
 */
export interface ToolCallResult {
  /** 调用是否成功 */
  success: boolean;
  /** 结果内容 */
  content: string;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 流式回调函数类型
 */
export type StreamCallback = (content: string) => Promise<void> | void;

/**
 * 默认 OpenAI 配置
 */
export const defaultOpenAIConfig: Partial<OpenAIConfig> = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
  timeout: 30000,
};

/**
 * 默认 MCP 配置
 */
export const defaultMCPConfig: Partial<MCPConfig> = {
  serverName: 'mcp-server',
  clientName: 'agent-client',
  clientVersion: '1.0.0',
  connectTimeout: 30000,
  pingInterval: 10000,
  autoReconnect: true,
  maxRetries: 3,
  retryDelay: 2000,
  maxToolCalls: 10,
  toolCallTimeout: 30000,
  enableLogging: true,
  logToolCalls: true,
};
