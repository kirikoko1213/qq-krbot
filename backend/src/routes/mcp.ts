import Router from 'koa-router';
import { MCPController } from '../controllers/mcpController';

const router = new Router();
const mcpController = new MCPController();

// 获取 MCP 工具列表
router.get('/tools', mcpController.getTools);

// 调用 MCP 工具
router.post('/tools/:toolName', mcpController.invokeTool);

// 获取 MCP 服务器状态
router.get('/status', mcpController.getStatus);

// 重新连接 MCP 服务器
router.post('/reconnect', mcpController.reconnect);

export default router;
