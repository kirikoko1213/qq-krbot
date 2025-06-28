# QQ 机器人后端服务

基于 TypeScript + Koa + MySQL + Prisma + MCP 的 QQ 机器人后端服务。

## 🚀 特性

- **TypeScript**: 完整的类型安全支持
- **Koa**: 轻量级的 Node.js Web 框架
- **Prisma**: 现代化的数据库 ORM
- **MySQL**: 可靠的关系型数据库
- **MCP**: Model Context Protocol 支持
- **Winston**: 专业的日志管理
- **Joi**: 数据验证
- **Jest**: 单元测试框架

## 📁 项目结构

```
backend/
├── src/
│   ├── controllers/         # 控制器层
│   │   ├── userController.ts
│   │   ├── groupController.ts
│   │   ├── messageController.ts
│   │   ├── triggerController.ts
│   │   └── mcpController.ts
│   ├── routes/             # 路由层
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── group.ts
│   │   ├── message.ts
│   │   ├── trigger.ts
│   │   └── mcp.ts
│   ├── services/           # 服务层
│   │   └── mcpManager.ts
│   ├── middleware/         # 中间件
│   │   └── errorHandler.ts
│   ├── utils/              # 工具类
│   │   └── logger.ts
│   └── index.ts            # 入口文件
├── prisma/
│   └── schema.prisma       # 数据库模式
├── package.json
├── tsconfig.json
├── nodemon.json
├── jest.config.js
└── README.md
```

## 🛠️ 安装与运行

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/qq_krbot"

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key

# MCP 配置
MCP_SERVER_URL=http://localhost:8080

# 日志级别
LOG_LEVEL=debug
```

### 3. 数据库设置

生成 Prisma 客户端：

```bash
npm run db:generate
```

同步数据库模式（开发环境）：

```bash
npm run db:push
```

或创建迁移（生产环境）：

```bash
npm run db:migrate
```

### 4. 启动服务

开发模式（热重载）：

```bash
npm run dev
```

生产模式：

```bash
npm run build
npm start
```

## 📖 API 文档

### 基础信息

- **基础 URL**: `http://localhost:3000/api`
- **响应格式**: JSON

### 健康检查

```
GET /api/health
```

### 用户管理

```
GET     /api/users              # 获取用户列表
GET     /api/users/:qqId        # 获取用户信息
POST    /api/users              # 创建或更新用户
PUT     /api/users/:qqId        # 更新用户信息
POST    /api/users/:qqId/exp    # 增加经验值
POST    /api/users/:qqId/coins  # 增加金币
```

### 群组管理

```
GET     /api/groups                 # 获取群组列表
GET     /api/groups/:qqId           # 获取群组信息
POST    /api/groups                 # 创建或更新群组
PUT     /api/groups/:qqId           # 更新群组信息
PUT     /api/groups/:qqId/status    # 设置群组状态
```

### 消息管理

```
GET     /api/messages                      # 获取消息列表
GET     /api/messages/group/:groupQQId     # 获取群组消息
GET     /api/messages/user/:userQQId       # 获取用户消息
POST    /api/messages                      # 创建消息记录
GET     /api/messages/stats                # 获取消息统计
```

### 触发器管理

```
GET     /api/triggers                      # 获取触发器列表
GET     /api/triggers/group/:groupQQId     # 获取群组触发器
POST    /api/triggers                      # 创建触发器
PUT     /api/triggers/:id                  # 更新触发器
DELETE  /api/triggers/:id                  # 删除触发器
PUT     /api/triggers/:id/status           # 设置触发器状态
POST    /api/triggers/test                 # 测试触发器
```

### MCP 管理

```
GET     /api/mcp/tools              # 获取工具列表
POST    /api/mcp/tools/:toolName    # 调用工具
GET     /api/mcp/status             # 获取服务器状态
POST    /api/mcp/reconnect          # 重新连接
```

## 🧪 测试

运行单元测试：

```bash
npm test
```

运行测试覆盖率：

```bash
npm run test:coverage
```

## 📊 数据库管理

启动 Prisma Studio（图形化数据库管理）：

```bash
npm run db:studio
```

## 🔧 开发工具

- **TypeScript**: 静态类型检查
- **Prisma**: 数据库 ORM 和迁移工具
- **Winston**: 日志管理
- **Nodemon**: 开发时自动重启
- **Jest**: 单元测试框架

## 📝 日志

日志文件位置：
- 错误日志: `logs/error.log`
- 综合日志: `logs/combined.log`

开发环境下，日志同时输出到控制台。

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

[MIT License](LICENSE) 