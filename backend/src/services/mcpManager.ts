import { Logger } from '../utils/logger';

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
  private isConnected: boolean = false;
  private tools: MCPTool[] = [];
  private connectionStatus: MCPConnectionStatus = { isConnected: false };

  constructor() {
    // 暂时禁用 MCP，保持接口兼容性
    this.connectionStatus = {
      isConnected: false,
      error: 'MCP 功能暂时禁用，等待 SDK 兼容性更新',
    };

    // 设置模拟工具列表
    this.setupMockTools();
    Logger.info('MCP Manager 已初始化（模拟模式）');
  }

  private setupMockTools() {
    this.tools = [
      {
        name: 'get_user_info',
        description: '获取用户信息',
        inputSchema: {
          type: 'object',
          properties: {
            qqId: { type: 'string', description: 'QQ号' },
          },
          required: ['qqId'],
        },
      },
      {
        name: 'get_group_info',
        description: '获取群组信息',
        inputSchema: {
          type: 'object',
          properties: {
            qqId: { type: 'string', description: 'QQ群号' },
          },
          required: ['qqId'],
        },
      },
      {
        name: 'send_message',
        description: '发送消息',
        inputSchema: {
          type: 'object',
          properties: {
            target: { type: 'string', description: '目标（用户QQ号或群号）' },
            message: { type: 'string', description: '消息内容' },
            type: {
              type: 'string',
              enum: ['private', 'group'],
              description: '消息类型',
            },
          },
          required: ['target', 'message', 'type'],
        },
      },
    ];
  }

  private async handleGetUserInfo(args: any) {
    Logger.info('获取用户信息（模拟）', { qqId: args.qqId });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              qqId: args.qqId,
              nickname: '示例用户',
              level: 5,
              exp: 1250,
              coins: 100,
              note: '这是模拟数据，MCP 功能暂时禁用',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetGroupInfo(args: any) {
    Logger.info('获取群组信息（模拟）', { qqId: args.qqId });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              qqId: args.qqId,
              name: '示例群组',
              memberCount: 100,
              isActive: true,
              note: '这是模拟数据，MCP 功能暂时禁用',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleSendMessage(args: any) {
    Logger.info('发送消息（模拟）', {
      target: args.target,
      type: args.type,
      message: args.message,
    });

    return {
      content: [
        {
          type: 'text',
          text: `[模拟] 消息已发送到 ${args.type === 'private' ? '私聊' : '群聊'}: ${args.target}`,
        },
      ],
    };
  }

  async getAvailableTools(): Promise<MCPTool[]> {
    return this.tools;
  }

  async invokeTool(toolName: string, args: any): Promise<any> {
    try {
      // 模拟工具调用
      switch (toolName) {
        case 'get_user_info':
          return await this.handleGetUserInfo(args);
        case 'get_group_info':
          return await this.handleGetGroupInfo(args);
        case 'send_message':
          return await this.handleSendMessage(args);
        default:
          throw new Error(`未知工具: ${toolName}`);
      }
    } catch (error) {
      Logger.error(`调用工具 ${toolName} 失败:`, error);
      throw error;
    }
  }

  async getConnectionStatus(): Promise<MCPConnectionStatus> {
    return this.connectionStatus;
  }

  async reconnect(): Promise<void> {
    Logger.info('MCP 重连（模拟模式下无实际操作）');
    this.connectionStatus = {
      isConnected: false,
      error: 'MCP 功能暂时禁用，等待 SDK 兼容性更新',
    };
  }

  async disconnect(): Promise<void> {
    Logger.info('MCP 断开连接（模拟模式下无实际操作）');
    this.isConnected = false;
    this.connectionStatus.isConnected = false;
  }
}
