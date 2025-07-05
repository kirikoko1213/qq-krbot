import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../../utils/logger.js';
import { botEngine } from '../../handlers/obt/onebot.js';
import { dbService } from '../database.js';
import MessageRecordModel from '../../repositories/models/message-record.js';

export class MCPServer {
  private server: Server;
  private transport: StdioServerTransport;

  constructor() {
    this.server = new Server(
      {
        name: 'qq-krbot-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.transport = new StdioServerTransport();
    this.setupHandlers();
  }

  private setupHandlers() {
    // 工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_user_info',
            description: '获取 QQ 用户信息',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'number',
                  description: 'QQ 用户 ID',
                },
                groupId: {
                  type: 'number',
                  description: '群组 ID (可选)',
                },
              },
              required: ['userId'],
            },
          },
          {
            name: 'get_group_list',
            description: '获取机器人所在的群组列表',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_group_member_list',
            description: '获取群成员列表',
            inputSchema: {
              type: 'object',
              properties: {
                groupId: {
                  type: 'number',
                  description: '群组 ID',
                },
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
                groupId: {
                  type: 'number',
                  description: '群组 ID',
                },
                message: {
                  type: 'string',
                  description: '消息内容',
                },
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
                userId: {
                  type: 'number',
                  description: '用户 ID',
                },
                message: {
                  type: 'string',
                  description: '消息内容',
                },
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
                groupId: {
                  type: 'number',
                  description: '群组 ID (可选，不提供则获取所有群)',
                },
                limit: {
                  type: 'number',
                  description: '限制返回条数，默认 20',
                  default: 20,
                },
                offset: {
                  type: 'number',
                  description: '偏移量，默认 0',
                  default: 0,
                },
              },
            },
          },
        ],
      };
    });

    // 工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_user_info':
            return await this.handleGetUserInfo(args);
          case 'get_group_list':
            return await this.handleGetGroupList();
          case 'get_group_member_list':
            return await this.handleGetGroupMemberList(args);
          case 'send_group_message':
            return await this.handleSendGroupMessage(args);
          case 'send_private_message':
            return await this.handleSendPrivateMessage(args);
          case 'get_message_history':
            return await this.handleGetMessageHistory(args);
          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        Logger.error(`调用工具 ${name} 失败:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetUserInfo(args: any) {
    const { userId, groupId } = args;

    try {
      let userInfo;
      if (groupId) {
        userInfo = await botEngine.getGroupMemberInfo(groupId, userId);
      } else {
        // 如果没有 groupId，我们只能返回基本信息
        userInfo = { userId, nickname: '未知用户' };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(userInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取用户信息失败: ${error}`);
    }
  }

  private async handleGetGroupList() {
    try {
      const groups = await botEngine.getGroupList();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(groups, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取群组列表失败: ${error}`);
    }
  }

  private async handleGetGroupMemberList(args: any) {
    const { groupId } = args;

    try {
      const members = await botEngine.getGroupMemberList(groupId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(members, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取群成员列表失败: ${error}`);
    }
  }

  private async handleSendGroupMessage(args: any) {
    const { groupId, message } = args;

    try {
      await botEngine.sendGroupMessage(groupId, message);
      return {
        content: [
          {
            type: 'text',
            text: `消息已发送到群组 ${groupId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`发送群消息失败: ${error}`);
    }
  }

  private async handleSendPrivateMessage(args: any) {
    const { userId, message } = args;

    try {
      await botEngine.sendPrivateMessage(userId, message);
      return {
        content: [
          {
            type: 'text',
            text: `消息已发送给用户 ${userId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`发送私聊消息失败: ${error}`);
    }
  }

  private async handleGetMessageHistory(args: any) {
    const { groupId, limit = 20, offset = 0 } = args;

    try {
      let messages;
      if (groupId) {
        messages = await MessageRecordModel.getGroupMessages(
          parseInt(groupId),
          limit,
          offset
        );
      } else {
        // 获取所有消息记录
        const result = await MessageRecordModel.query()
          .whereNull('deleted_at')
          .orderBy('created_at', 'desc')
          .limit(limit)
          .offset(offset)
          .get();
        messages = result.all();
      }

      const formattedMessages = messages.map((msg: MessageRecordModel) => {
        const data = msg.getData();
        return {
          id: data.id.toString(),
          groupId: data.groupId.toString(),
          qqAccount: data.qqAccount.toString(),
          qqNickname: data.qqNickname,
          groupName: data.groupName,
          message: data.textMessage!,
          messageType: data.messageType,
          createdAt: data.createdAt,
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedMessages, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取消息历史失败: ${error}`);
    }
  }

  async start() {
    try {
      await this.server.connect(this.transport);
      Logger.info('MCP Server 启动成功');
    } catch (error) {
      Logger.error('MCP Server 启动失败:', error);
      throw error;
    }
  }

  async stop() {
    try {
      await this.server.close();
      Logger.info('MCP Server 已停止');
    } catch (error) {
      Logger.error('MCP Server 停止失败:', error);
      throw error;
    }
  }
}
