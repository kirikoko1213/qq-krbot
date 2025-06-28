import Router from 'koa-router';
import { MCPController } from '../controllers/mcpController.js';

const router = new Router({ prefix: '/api/mcp' });
const mcpController = new MCPController();

// Server 模式相关路由
router.post('/server/start', mcpController.startServer.bind(mcpController));
router.post('/server/stop', mcpController.stopServer.bind(mcpController));

// Client 模式相关路由
router.post('/client/add', mcpController.addClient.bind(mcpController));
router.delete('/client/:name', mcpController.removeClient.bind(mcpController));

// 工具相关路由
router.get('/tools', mcpController.getTools.bind(mcpController));
router.get('/tools/:name', mcpController.getToolInfo.bind(mcpController));
router.post('/tools/:name/call', mcpController.callTool.bind(mcpController));
router.post('/tools/batch', mcpController.batchCallTools.bind(mcpController));

// 统计和健康检查
router.get('/stats', mcpController.getStats.bind(mcpController));
router.get('/health', mcpController.healthCheck.bind(mcpController));

// 状态和连接管理
router.get('/status', mcpController.getStatus.bind(mcpController));
router.post('/reconnect', mcpController.reconnect.bind(mcpController));
router.post('/disconnect', mcpController.disconnect.bind(mcpController));

export default router;
