import dotenv from 'dotenv';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import logger from 'koa-logger';

import { debugDemo } from './debug-demo';
import { initTriggers } from './handlers/trigger/trigger';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';
import { dbService } from './services/database';
import { Logger } from './utils/logger';

// 加载环境变量
dotenv.config();

// 注册触发器
initTriggers();

const app = new Koa();
const port = process.env.PORT || 3000;

// 导出prisma实例以保持向后兼容性
export const prisma = dbService.prisma;

// 中间件（顺序很重要）
app.use(errorHandler); // 错误处理（最先）
app.use(logger());
app.use(cors());
app.use(
  bodyParser({
    jsonLimit: '10mb',
    textLimit: '10mb',
  })
);

// 添加调试演示路由
app.use(async (ctx, next) => {
  if (ctx.path === '/debug-demo') {
    const result = debugDemo(); // 👈 在这里设置断点
    // 现在只需要设置data，响应格式化中间件会自动包装
    ctx.data = result;
    ctx.message = '调试演示完成';
    return;
  }
  await next();
});

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
async function startServer() {
  try {
    // 使用我们创建的数据库服务连接数据库
    await dbService.connect();

    // 测试数据库连接
    const isConnected = await dbService.ping();
    if (!isConnected) {
      throw new Error('数据库连接测试失败');
    }

    app.listen(port, () => {
      Logger.info(`服务器运行在端口 ${port}`);
      Logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    Logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  Logger.info('正在关闭服务器...');
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('正在关闭服务器...');
  await dbService.disconnect();
  process.exit(0);
});

startServer();
