import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  CallToolRequest,
  ListToolsRequest,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../../utils/logger.js';
import { spawn, ChildProcess } from 'child_process';

export interface MCPClientConfig {
  type: 'stdio' | 'sse';
  // For stdio transport
  command?: string;
  args?: string[];
  // For SSE transport
  url?: string;
}

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | SSEClientTransport;
  private process?: ChildProcess;
  private isConnected: boolean = false;
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
    this.client = new Client(
      {
        name: 'qq-krbot-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    if (config.type === 'stdio') {
      // StdioClientTransport 需要在连接时创建，这里先设置为 undefined
      this.transport = null as any;
    } else if (config.type === 'sse') {
      if (!config.url) {
        throw new Error('SSE transport requires URL');
      }
      this.transport = new SSEClientTransport(new URL(config.url));
    } else {
      throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.config.type === 'stdio') {
        // 启动子进程
        if (this.config.command) {
          this.transport = new StdioClientTransport({
            command: this.config.command,
            args: this.config.args,
          });
          await this.client.connect(this.transport);
        } else {
          throw new Error('Stdio transport requires command');
        }
      } else if (this.config.type === 'sse') {
        await this.client.connect(this.transport);
      }

      this.isConnected = true;
      Logger.info('MCP Client 连接成功', { type: this.config.type });
    } catch (error) {
      Logger.error('MCP Client 连接失败:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.close();
        this.isConnected = false;
      }

      if (this.process && !this.process.killed) {
        this.process.kill();
        this.process = undefined;
      }

      Logger.info('MCP Client 已断开连接');
    } catch (error) {
      Logger.error('MCP Client 断开连接失败:', error);
      throw error;
    }
  }

  async listTools(): Promise<Tool[]> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    try {
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error) {
      Logger.error('获取工具列表失败:', error);
      throw error;
    }
  }

  async callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Client is not connected');
    }

    try {
      const response = await this.client.callTool({
        name,
        arguments: args,
      });
      return response;
    } catch (error) {
      Logger.error(`调用工具 ${name} 失败:`, error);
      throw error;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  // 便捷方法
  async getUserInfo(userId: number, groupId?: number) {
    return this.callTool('get_user_info', { userId, groupId });
  }

  async getGroupList() {
    return this.callTool('get_group_list');
  }

  async getGroupMemberList(groupId: number) {
    return this.callTool('get_group_member_list', { groupId });
  }

  async sendGroupMessage(groupId: number, message: string) {
    return this.callTool('send_group_message', { groupId, message });
  }

  async sendPrivateMessage(userId: number, message: string) {
    return this.callTool('send_private_message', { userId, message });
  }

  async getMessageHistory(groupId?: number, limit?: number, offset?: number) {
    return this.callTool('get_message_history', { groupId, limit, offset });
  }
}
