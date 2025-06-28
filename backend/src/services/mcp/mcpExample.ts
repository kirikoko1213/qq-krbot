import { MCPManager } from './mcpManager.js';
import { MCPClientConfig } from './mcpClient.js';
import { Logger } from '../../utils/logger.js';

export class MCPExample {
  private mcpManager: MCPManager;

  constructor() {
    this.mcpManager = new MCPManager();
  }

  // 示例：启动 MCP Server 模式
  async startServerMode() {
    try {
      Logger.info('启动 MCP Server 模式示例...');

      await this.mcpManager.startServer();

      const tools = await this.mcpManager.getAvailableTools();
      Logger.info(
        '可用工具:',
        tools.map(t => t.name)
      );

      const status = this.mcpManager.getStatus();
      Logger.info('MCP Server 状态:', status);
    } catch (error) {
      Logger.error('MCP Server 模式示例失败:', error);
    }
  }

  // 示例：客户端模式连接到外部 MCP 服务器
  async startClientMode() {
    try {
      Logger.info('启动 MCP Client 模式示例...');

      // 示例配置：连接到一个假设的 MCP 服务器
      const clientConfig: MCPClientConfig = {
        type: 'sse',
        url: 'http://localhost:3001/mcp',
      };

      await this.mcpManager.addClient('example-server', clientConfig);

      const tools = await this.mcpManager.getAvailableTools();
      Logger.info(
        '从客户端获取的工具:',
        tools.map(t => t.name)
      );

      // 示例：调用远程工具
      if (tools.length > 0) {
        const firstTool = tools[0];
        Logger.info(`尝试调用工具: ${firstTool.name}`);

        // 这里需要根据实际工具的参数来调用
        // const result = await this.mcpManager.invokeTool(firstTool.name, {});
        // Logger.info('工具调用结果:', result);
      }
    } catch (error) {
      Logger.error('MCP Client 模式示例失败:', error);
    }
  }

  // 示例：演示内置工具调用（Server 模式）
  async demonstrateBuiltinTools() {
    try {
      Logger.info('演示内置工具调用...');

      await this.mcpManager.startServer();

      // 注意：在 Server 模式下，工具调用通常是由外部客户端发起的
      // 这里只是演示可用的工具
      const tools = await this.mcpManager.getAvailableTools();

      Logger.info('内置工具列表:');
      tools.forEach(tool => {
        Logger.info(`- ${tool.name}: ${tool.description}`);
      });
    } catch (error) {
      Logger.error('演示内置工具失败:', error);
    }
  }

  // 清理资源
  async cleanup() {
    try {
      await this.mcpManager.disconnect();
      Logger.info('MCP 示例清理完成');
    } catch (error) {
      Logger.error('MCP 示例清理失败:', error);
    }
  }
}

// 使用示例
export async function runMCPExamples() {
  const example = new MCPExample();

  try {
    // 演示 Server 模式
    await example.startServerMode();

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 演示内置工具
    await example.demonstrateBuiltinTools();

    // 注意：Client 模式需要有实际的外部 MCP 服务器
    // await example.startClientMode();
  } finally {
    await example.cleanup();
  }
}

// 如果直接运行此文件，则执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runMCPExamples().catch(console.error);
}
