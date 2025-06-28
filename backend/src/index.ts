import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import logger from 'koa-logger';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import router from './routes';
import { errorHandler } from './middleware/errorHandler';
import { Logger } from './utils/logger';
import { initTriggers } from './handlers/trigger/trigger';
import { debugDemo } from './debug-demo';

// 加载环境变量
dotenv.config();

// 注册触发器
initTriggers();

const app = new Koa();
const port = process.env.PORT || 3000;

// 初始化 Prisma 客户端
export const prisma = new PrismaClient();

// 中间件
app.use(errorHandler);
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
    ctx.body = {
      success: true,
      message: '调试演示完成',
      data: result,
    };
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
    // 测试数据库连接
    await prisma.$connect();
    Logger.info('数据库连接成功');

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
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
