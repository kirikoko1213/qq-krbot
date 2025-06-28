import { Context } from 'koa';
import { Logger } from '../utils/logger.js';
import { MCPManager } from '../services/mcp/mcpManager.js';
import { toolRegistry } from '../services/mcpTools/toolRegistry.js';

export class MCPController {
  private mcpManager: MCPManager;

  constructor() {
    this.mcpManager = new MCPManager();
  }

  // 启动 MCP Server
  async startServer(ctx: Context) {
    try {
      await this.mcpManager.startServer();

      ctx.body = {
        success: true,
        message: 'MCP Server 启动成功',
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error('启动 MCP Server 失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `启动 Server 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 停止 MCP Server
  async stopServer(ctx: Context) {
    try {
      await this.mcpManager.stopServer();

      ctx.body = {
        success: true,
        message: 'MCP Server 已停止',
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error('停止 MCP Server 失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `停止 Server 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 添加 MCP Client
  async addClient(ctx: Context) {
    try {
      const { name, config } = ctx.request.body as any;

      if (!name || !config) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '客户端名称和配置不能为空',
        };
        return;
      }

      await this.mcpManager.addClient(name, config);

      ctx.body = {
        success: true,
        message: `MCP Client '${name}' 连接成功`,
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error('添加 MCP Client 失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `添加 Client 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 移除 MCP Client
  async removeClient(ctx: Context) {
    try {
      const { name } = ctx.params;

      if (!name) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: '客户端名称不能为空',
        };
        return;
      }

      await this.mcpManager.removeClient(name);

      ctx.body = {
        success: true,
        message: `MCP Client '${name}' 已断开连接`,
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error(`移除 MCP Client 失败:`, error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `移除 Client 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 获取 MCP 工具列表
  async getTools(ctx: Context) {
    try {
      const tools = toolRegistry.getAllToolDefinitions();

      ctx.body = {
        success: true,
        data: {
          tools,
          count: tools.length,
        },
      };
    } catch (error) {
      Logger.error('获取MCP工具列表失败', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取工具列表失败',
      };
    }
  }

  // 获取工具详细信息
  async getToolInfo(ctx: Context) {
    try {
      const { name } = ctx.params;

      if (!toolRegistry.hasTool(name)) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: `工具 '${name}' 不存在`,
        };
        return;
      }

      const tool = toolRegistry.getTool(name);

      ctx.body = {
        success: true,
        data: tool?.definition,
      };
    } catch (error) {
      Logger.error('获取工具信息失败', { toolName: ctx.params.name, error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取工具信息失败',
      };
    }
  }

  // 调用工具
  async callTool(ctx: Context) {
    try {
      const { name } = ctx.params;
      const { arguments: args = {} } = ctx.request.body as any;

      if (!toolRegistry.hasTool(name)) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: `工具 '${name}' 不存在`,
        };
        return;
      }

      const result = await toolRegistry.callTool(name, args);

      if (result.success) {
        ctx.body = {
          success: true,
          data: {
            content: result.content,
          },
        };
      } else {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      Logger.error('调用MCP工具失败', {
        toolName: ctx.params.name,
        args: ctx.request.body,
        error,
      });
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '工具调用失败',
      };
    }
  }

  // 获取工具统计信息
  async getStats(ctx: Context) {
    try {
      const stats = toolRegistry.getStats();

      ctx.body = {
        success: true,
        data: stats,
      };
    } catch (error) {
      Logger.error('获取MCP统计信息失败', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '获取统计信息失败',
      };
    }
  }

  // 批量调用工具
  async batchCallTools(ctx: Context) {
    try {
      const { calls } = ctx.request.body as {
        calls: Array<{ name: string; arguments: Record<string, any> }>;
      };

      if (!Array.isArray(calls) || calls.length === 0) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '请提供有效的工具调用列表',
        };
        return;
      }

      const results = await Promise.all(
        calls.map(async call => {
          const result = await toolRegistry.callTool(call.name, call.arguments);
          return {
            toolName: call.name,
            ...result,
          };
        })
      );

      ctx.body = {
        success: true,
        data: {
          results,
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      };
    } catch (error) {
      Logger.error('批量调用MCP工具失败', { error });
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '批量调用工具失败',
      };
    }
  }

  // 健康检查
  async healthCheck(ctx: Context) {
    try {
      const stats = toolRegistry.getStats();

      ctx.body = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          ...stats,
        },
      };
    } catch (error) {
      Logger.error('MCP健康检查失败', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: '健康检查失败',
      };
    }
  }

  // 获取 MCP 状态
  async getStatus(ctx: Context) {
    try {
      const status = await this.mcpManager.getConnectionStatus();
      const detailedStatus = this.mcpManager.getStatus();

      ctx.body = {
        success: true,
        data: {
          connectionStatus: status,
          detailedStatus,
        },
      };
    } catch (error) {
      Logger.error('获取 MCP 状态失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '获取状态失败' };
    }
  }

  // 重新连接 MCP
  async reconnect(ctx: Context) {
    try {
      await this.mcpManager.reconnect();

      ctx.body = {
        success: true,
        message: 'MCP 重连成功',
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error('重连 MCP 失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `重连失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 断开所有连接
  async disconnect(ctx: Context) {
    try {
      await this.mcpManager.disconnect();

      ctx.body = {
        success: true,
        message: 'MCP 已断开所有连接',
        data: this.mcpManager.getStatus(),
      };
    } catch (error) {
      Logger.error('断开 MCP 连接失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `断开连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}
