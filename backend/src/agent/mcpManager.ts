import {
  MCPConfig,
  MCPTool,
  ToolCall,
  ToolCallResult,
  defaultMCPConfig,
} from './types.js';
import { Logger } from '../utils/logger.js';

/**
 * MCP 管理器
 * 管理 MCP (Model Context Protocol) 连接和工具调用
 */
export class MCPManager {
  private config: MCPConfig;
  private connected: boolean = false;
  private tools: MCPTool[] = [];
  private lastPing: Date = new Date();
  private client: any; // MCP 客户端实例
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private retryCount: number = 0;

  /**
   * 创建 MCP 管理器
   */
  constructor(config: MCPConfig) {
    this.config = { ...defaultMCPConfig, ...config };

    if (!this.config.url) {
      throw new Error('MCP 服务器 URL 不能为空');
    }

    if (this.config.enableLogging) {
      Logger.info('MCP Manager 初始化', { config: this.config });
    }
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<void> {
    try {
      if (this.config.enableLogging) {
        Logger.info('正在连接到 MCP 服务器', { url: this.config.url });
      }

      // 这里应该使用实际的 MCP 客户端库
      // 暂时使用模拟实现
      await this.mockConnect();

      this.connected = true;
      this.lastPing = new Date();
      this.retryCount = 0;

      // 加载工具列表
      await this.loadTools();

      // 启动健康检查
      if (this.config.autoReconnect && this.config.pingInterval! > 0) {
        this.startHealthCheck();
      }

      if (this.config.enableLogging) {
        Logger.info('MCP 服务器连接成功', {
          toolCount: this.tools.length,
          serverName: this.config.serverName,
        });
      }
    } catch (error) {
      this.connected = false;
      const errorMsg = `连接 MCP 服务器失败: ${error instanceof Error ? error.message : error}`;

      if (this.config.enableLogging) {
        Logger.error(errorMsg, { url: this.config.url });
      }

      throw new Error(errorMsg);
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      // 清理定时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = undefined;
      }

      // 断开客户端连接
      if (this.client) {
        // await this.client.disconnect();
        this.client = null;
      }

      this.connected = false;
      this.tools = [];

      if (this.config.enableLogging) {
        Logger.info('MCP 连接已断开');
      }
    } catch (error) {
      if (this.config.enableLogging) {
        Logger.error('断开 MCP 连接时出错', error);
      }
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取工具列表
   */
  getTools(): MCPTool[] {
    return [...this.tools]; // 返回副本
  }

  /**
   * 获取工具名称列表
   */
  getToolNames(): string[] {
    return this.tools.map(tool => tool.name);
  }

  /**
   * 获取工具信息
   */
  getToolInfo(toolName: string): MCPTool | null {
    const tool = this.tools.find(t => t.name === toolName);
    return tool ? { ...tool } : null;
  }

  /**
   * 调用 MCP 工具
   */
  async callTool(
    toolName: string,
    args: Record<string, any> = {}
  ): Promise<ToolCallResult> {
    if (!this.connected) {
      throw new Error('MCP 客户端未连接');
    }

    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`工具 '${toolName}' 不存在`);
    }

    try {
      if (this.config.logToolCalls) {
        Logger.info('调用 MCP 工具', { toolName, args });
      }

      // 验证参数
      this.validateToolArgs(tool, args);

      // 创建调用超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`工具调用超时: ${toolName}`));
        }, this.config.toolCallTimeout);
      });

      // 实际的工具调用（这里使用模拟实现）
      const callPromise = this.mockToolCall(toolName, args);

      const result = await Promise.race([callPromise, timeoutPromise]);

      if (this.config.logToolCalls) {
        Logger.info('工具调用成功', {
          toolName,
          result: result.substring(0, 200),
        });
      }

      return {
        success: true,
        content: result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (this.config.logToolCalls) {
        Logger.error('工具调用失败', { toolName, args, error: errorMsg });
      }

      return {
        success: false,
        content: '',
        error: errorMsg,
      };
    }
  }

  /**
   * 获取最后 ping 时间
   */
  getLastPingTime(): Date {
    return new Date(this.lastPing);
  }

  /**
   * 获取连接统计信息
   */
  getStats() {
    return {
      connected: this.connected,
      toolCount: this.tools.length,
      lastPing: this.lastPing,
      retryCount: this.retryCount,
      serverUrl: this.config.url,
      autoReconnect: this.config.autoReconnect,
    };
  }

  /**
   * 手动重连
   */
  async reconnect(): Promise<void> {
    if (this.config.enableLogging) {
      Logger.info('手动重连 MCP 服务器');
    }

    await this.disconnect();
    await this.connect();
  }

  // 私有方法

  /**
   * 模拟连接（实际实现应该使用真实的 MCP 客户端）
   */
  private async mockConnect(): Promise<void> {
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟连接失败的情况
    if (Math.random() < 0.1) {
      // 10% 失败率
      throw new Error('连接超时');
    }

    this.client = { connected: true }; // 模拟客户端
  }

  /**
   * 加载工具列表
   */
  private async loadTools(): Promise<void> {
    try {
      // 模拟工具列表（实际实现应该从 MCP 服务器获取）
      this.tools = [
        {
          name: 'get_weather',
          description: '获取指定城市的天气信息',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称',
              },
              unit: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: '温度单位',
              },
            },
            required: ['city'],
          },
        },
        {
          name: 'search_web',
          description: '在网络上搜索信息',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询',
              },
              limit: {
                type: 'number',
                description: '结果数量限制',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'calculate',
          description: '执行数学计算',
          inputSchema: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: '数学表达式',
              },
            },
            required: ['expression'],
          },
        },
      ];

      if (this.config.enableLogging) {
        Logger.info('工具列表加载完成', { count: this.tools.length });
      }
    } catch (error) {
      if (this.config.enableLogging) {
        Logger.error('加载工具列表失败', error);
      }
      throw error;
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        if (this.config.enableLogging) {
          Logger.warn('健康检查失败', error);
        }

        if (this.config.autoReconnect) {
          this.scheduleReconnect();
        }
      }
    }, this.config.pingInterval);
  }

  /**
   * Ping 服务器
   */
  private async ping(): Promise<void> {
    if (!this.connected) {
      throw new Error('连接已断开');
    }

    // 模拟 ping
    await new Promise(resolve => setTimeout(resolve, 100));

    // 模拟 ping 失败
    if (Math.random() < 0.05) {
      // 5% 失败率
      throw new Error('Ping 超时');
    }

    this.lastPing = new Date();
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.retryCount >= this.config.maxRetries!) {
      return;
    }

    this.retryCount++;
    const delay = this.config.retryDelay! * this.retryCount;

    if (this.config.enableLogging) {
      Logger.info(`安排重连`, { retryCount: this.retryCount, delay });
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;

      try {
        await this.connect();
      } catch (error) {
        if (this.config.enableLogging) {
          Logger.error('重连失败', error);
        }

        if (this.retryCount < this.config.maxRetries!) {
          this.scheduleReconnect();
        }
      }
    }, delay);
  }

  /**
   * 验证工具参数
   */
  private validateToolArgs(tool: MCPTool, args: Record<string, any>): void {
    const { inputSchema } = tool;

    if (inputSchema.required) {
      for (const required of inputSchema.required) {
        if (!(required in args)) {
          throw new Error(`缺少必需参数: ${required}`);
        }
      }
    }

    // 这里可以添加更详细的参数验证
  }

  /**
   * 模拟工具调用
   */
  private async mockToolCall(
    toolName: string,
    args: Record<string, any>
  ): Promise<string> {
    // 模拟调用延迟
    await new Promise(resolve =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    switch (toolName) {
      case 'get_weather':
        return JSON.stringify({
          city: args.city || '未知城市',
          temperature: Math.round(15 + Math.random() * 20),
          condition: ['晴天', '多云', '小雨', '阴天'][
            Math.floor(Math.random() * 4)
          ],
          humidity: Math.round(40 + Math.random() * 40),
          unit: args.unit || 'celsius',
        });

      case 'search_web':
        return JSON.stringify({
          query: args.query,
          results: [
            {
              title: '搜索结果 1',
              url: 'https://example.com/1',
              snippet: '这是第一个搜索结果的摘要...',
            },
            {
              title: '搜索结果 2',
              url: 'https://example.com/2',
              snippet: '这是第二个搜索结果的摘要...',
            },
            {
              title: '搜索结果 3',
              url: 'https://example.com/3',
              snippet: '这是第三个搜索结果的摘要...',
            },
          ].slice(0, args.limit || 3),
        });

      case 'calculate':
        try {
          // 这里应该使用安全的表达式求值器
          // 暂时返回模拟结果
          const expression = args.expression;
          return JSON.stringify({
            expression,
            result: 42, // 模拟结果
            message: '计算完成',
          });
        } catch (error) {
          throw new Error(`计算错误: ${error}`);
        }

      default:
        throw new Error(`未知工具: ${toolName}`);
    }
  }
}

/**
 * 创建默认的 MCP 管理器
 */
export function createMCPManager(config: MCPConfig): MCPManager {
  return new MCPManager(config);
}
