# 管理面板 (Manage Board)

基于 Vue 3 + TypeScript + Element Plus 的QQ机器人管理系统。

## 功能特性

### 群员管理
- **群组选择**: 从机器人所在的群组中选择要管理的群
- **同步群员信息**: 获取选定群组中的所有群员信息
- **别名管理**: 为群员设置自定义别名，支持实时编辑和保存
- **数据表格**: 展示群号、QQ号、QQ昵称、群员别名四列信息

## 技术栈

- **框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **构建工具**: Vite
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

## 项目结构

```
src/
├── api/           # API接口定义
│   └── member.ts  # 群员管理相关接口
├── assets/        # 静态资源
├── components/    # 通用组件
├── router/        # 路由配置
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
│   └── request.ts # Axios封装
├── views/         # 页面组件
│   └── MemberManageView.vue # 群员管理页面
├── App.vue        # 主应用组件
└── main.ts        # 应用入口
```

## 开发命令

```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 预览构建结果
yarn preview

# TypeScript类型检查
yarn type-check
```

## API接口

### 群员管理接口
- `GET /api/group/list` - 获取群组列表
- `GET /api/group/{groupId}/members` - 获取群员列表
- `POST /api/group/member/alias` - 更新群员别名

## 使用说明

1. **选择群组**: 在页面顶部下拉框中选择要管理的群组
2. **同步信息**: 点击"同步信息"按钮获取群员列表
3. **编辑别名**: 直接在表格的"群员别名"列中编辑别名
4. **保存更改**: 别名输入框失去焦点时自动保存

## 特性

- ✅ **泛型Axios封装**: 提供类型安全的HTTP请求
- ✅ **实时编辑**: 支持表格内直接编辑别名
- ✅ **自动保存**: 失去焦点时自动保存更改
- ✅ **错误处理**: 完善的错误提示和回滚机制
- ✅ **Loading状态**: 提供加载状态反馈
- ✅ **响应式设计**: 适配不同屏幕尺寸
