import dotenv from 'dotenv';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import logger from 'koa-logger';

import { initTriggers } from './handlers/trigger/trigger.js';
import { errorHandler } from './middleware/errorHandler.js';
import router from './routes/index.js';
import conf from '@/handlers/config/config.js';
import { sutando } from 'sutando';
import { Logger } from './utils/logger.js';

console.log(`pid: ${process.pid}`);

// 加载环境变量
dotenv.config();

// 配置 Sutando 连接
sutando.addConnection({
  client: 'mysql2',
  connection: {
    host: await conf.get('DB_HOST'),
    port: await conf.get('DB_PORT'),
    user: await conf.get('DB_USER'),
    password: await conf.get('DB_PASSWORD'),
    database: await conf.get('DB_NAME'),
  },
  debug: false, // 可以根据环境设置
});

sutando.connection();

// 注册触发器
initTriggers();

const app = new Koa();
const port = (await conf.get('PORT')) || 3000;

// 数据库服务现在使用 Sutando 而不是 Prisma

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

// 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
async function startServer() {
  try {
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
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('正在关闭服务器...');
  process.exit(0);
});

startServer();
