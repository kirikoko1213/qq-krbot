import { Logger } from '../../utils/logger.js';
import { MCPServer } from './mcpServer.js';
import { MCPClient, MCPClientConfig } from './mcpClient.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface MCPConnectionStatus {
  isConnected: boolean;
  serverUrl?: string;
  lastConnected?: Date;
  error?: string;
}

export class MCPManager {
  private server?: MCPServer;
  private clients: Map<string, MCPClient> = new Map();
  private tools: MCPTool[] = [];
  private connectionStatus: MCPConnectionStatus = { isConnected: false };
  private isServerMode: boolean = false;

  constructor() {
    Logger.info('MCP Manager 已初始化');
  }

  // Server 模式方法
  async startServer(): Promise<void> {
    if (this.server) {
      throw new Error('MCP Server 已经在运行中');
    }

    try {
      this.server = new MCPServer();
      await this.server.start();
      this.isServerMode = true;
      this.connectionStatus = {
        isConnected: true,
        serverUrl: 'stdio://localhost',
        lastConnected: new Date(),
      };
      Logger.info('MCP Server 模式启动成功');
    } catch (error) {
      Logger.error('启动 MCP Server 失败:', error);
      this.connectionStatus = {
        isConnected: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
      throw error;
    }
  }

  async stopServer(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = undefined;
      this.isServerMode = false;
      this.connectionStatus = { isConnected: false };
      Logger.info('MCP Server 已停止');
    }
  }

  // Client 模式方法
  async addClient(name: string, config: MCPClientConfig): Promise<void> {
    if (this.clients.has(name)) {
      throw new Error(`Client '${name}' 已存在`);
    }

    try {
      const client = new MCPClient(config);
      await client.connect();
      this.clients.set(name, client);

      // 更新工具列表
      await this.updateToolsFromClients();

      Logger.info(`MCP Client '${name}' 连接成功`);
    } catch (error) {
      Logger.error(`连接 MCP Client '${name}' 失败:`, error);
      throw error;
    }
  }

  async removeClient(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
      await this.updateToolsFromClients();
      Logger.info(`MCP Client '${name}' 已断开连接`);
    }
  }

  async removeAllClients(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([name, client]) => {
        try {
          await client.disconnect();
          Logger.info(`MCP Client '${name}' 已断开连接`);
        } catch (error) {
          Logger.error(`断开 MCP Client '${name}' 失败:`, error);
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.tools = [];
  }

  private async updateToolsFromClients(): Promise<void> {
    this.tools = [];

    for (const [clientName, client] of this.clients.entries()) {
      try {
        if (client.connected) {
          const clientTools = await client.listTools();
          const convertedTools = clientTools.map((tool: Tool) => ({
            name: `${clientName}.${tool.name}`,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {},
            clientName,
            originalName: tool.name,
          }));
          this.tools.push(...convertedTools);
        }
      } catch (error) {
        Logger.error(`从 Client '${clientName}' 获取工具列表失败:`, error);
      }
    }

    // 更新连接状态
    const connectedClients = Array.from(this.clients.values()).filter(
      client => client.connected
    );
    this.connectionStatus = {
      isConnected: connectedClients.length > 0 || this.isServerMode,
      lastConnected: new Date(),
    };
  }

  // 公共接口方法
  async getAvailableTools(): Promise<MCPTool[]> {
    if (this.isServerMode) {
      // Server 模式下返回内置工具
      return [
        {
          name: 'get_user_info',
          description: '获取 QQ 用户信息',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'number', description: 'QQ 用户 ID' },
              groupId: { type: 'number', description: '群组 ID (可选)' },
            },
            required: ['userId'],
          },
        },
        {
          name: 'get_group_list',
          description: '获取机器人所在的群组列表',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'get_group_member_list',
          description: '获取群成员列表',
          inputSchema: {
            type: 'object',
            properties: {
              groupId: { type: 'number', description: '群组 ID' },
            },
            required: ['groupId'],
          },
        },
        {
          name: 'send_group_message',
          description: '发送群消息',
          inputSchema: {
            type: 'object',
            properties: {
              groupId: { type: 'number', description: '群组 ID' },
              message: { type: 'string', description: '消息内容' },
            },
            required: ['groupId', 'message'],
          },
        },
        {
          name: 'send_private_message',
          description: '发送私聊消息',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'number', description: '用户 ID' },
              message: { type: 'string', description: '消息内容' },
            },
            required: ['userId', 'message'],
          },
        },
        {
          name: 'get_message_history',
          description: '获取消息历史记录',
          inputSchema: {
            type: 'object',
            properties: {
              groupId: { type: 'number', description: '群组 ID (可选)' },
              limit: { type: 'number', description: '限制条数', default: 20 },
              offset: { type: 'number', description: '偏移量', default: 0 },
            },
          },
        },
      ];
    }
    return this.tools;
  }

  async invokeTool(toolName: string, args: any): Promise<any> {
    try {
      if (this.isServerMode) {
        throw new Error('Server 模式下不支持调用工具，请使用 Client 模式');
      }

      // 解析工具名称 (格式: clientName.toolName)
      const parts = toolName.split('.');
      if (parts.length !== 2) {
        throw new Error(`无效的工具名称格式: ${toolName}`);
      }

      const [clientName, originalToolName] = parts;
      const client = this.clients.get(clientName);

      if (!client) {
        throw new Error(`Client '${clientName}' 不存在`);
      }

      if (!client.connected) {
        throw new Error(`Client '${clientName}' 未连接`);
      }

      const result = await client.callTool(originalToolName, args);
      return result;
    } catch (error) {
      Logger.error(`调用工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<MCPConnectionStatus> {
    return this.connectionStatus;
  }

  async reconnect(): Promise<void> {
    if (this.isServerMode) {
      // Server 模式重启
      if (this.server) {
        await this.stopServer();
      }
      await this.startServer();
    } else {
      // Client 模式重连所有客户端
      const clientConfigs: Array<[string, MCPClientConfig]> = [];

      // 保存配置并断开连接
      for (const [name, client] of this.clients.entries()) {
        // 这里需要保存客户端配置，但由于我们没有存储原始配置，暂时跳过
        await client.disconnect();
      }

      this.clients.clear();

      // 重新连接（这里需要实际的配置管理）
      Logger.info('MCP 重连完成（需要手动重新添加客户端）');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isServerMode) {
      await this.stopServer();
    } else {
      await this.removeAllClients();
    }

    this.connectionStatus = { isConnected: false };
    Logger.info('MCP Manager 已断开所有连接');
  }

  // 获取状态信息
  getStatus() {
    return {
      isServerMode: this.isServerMode,
      serverRunning: !!this.server,
      clientCount: this.clients.size,
      connectedClients: Array.from(this.clients.entries())
        .filter(([, client]) => client.connected)
        .map(([name]) => name),
      toolCount: this.tools.length,
      connectionStatus: this.connectionStatus,
    };
  }
}
