import Router from 'koa-router';
import groupRoutes from './group';
import messageRoutes from './message';
import triggerRoutes from './trigger';
import mcpRoutes from './mcp';

const router = new Router({ prefix: '/api' });

// 健康检查
router.get('/health', async ctx => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
});

// 注册子路由
router.use('/groups', groupRoutes.routes());
router.use('/message', messageRoutes.routes());
router.use('/triggers', triggerRoutes.routes());
router.use('/mcp', mcpRoutes.routes());

export default router;
