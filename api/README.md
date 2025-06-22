# 群组管理 API 文档

## 接口列表

### 1. 获取群组列表
**接口地址：** `GET /api/group/list`

**请求参数：** 无

**响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "groupId": "123456789"
    },
    {
      "groupId": "987654321"
    }
  ]
}
```

### 2. 获取群员列表
**接口地址：** `GET /api/group/{groupId}/members`

**路径参数：**
- `groupId`: 群号（字符串）

**响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "groupId": "123456789",
      "qq": "10001",
      "nickname": "用户昵称",
      "alias": ["自定义别名1", "自定义别名2"]
    }
  ]
}
```

### 3. 更新群员别名
**接口地址：** `POST /api/group/member/alias`

**请求体：**
```json
{
  "groupId": "123456789",
  "qq": "10001",
  "alias": ["新的别名1", "新的别名2"]
}
```

**响应格式：**
```json
{
  "code": 0,
  "message": "别名更新成功",
  "data": null
}
```

## 错误码说明

- `code: 0` - 成功
- `code: 400` - 请求参数错误
- `code: 500` - 服务器内部错误

## Mock 数据说明

当OneBot API不可用时，接口会返回Mock数据：

**群组列表Mock数据：**
```json
[
  {"groupId": "123456789"},
  {"groupId": "987654321"},
  {"groupId": "555666777"}
]
```

**群员列表Mock数据：**
```json
[
  {
    "groupId": "{传入的群号}",
    "qq": "10001",
    "nickname": "用户A",
    "alias": ["小A", "阿A"]
  },
  {
    "groupId": "{传入的群号}",
    "qq": "10002",
    "nickname": "用户B",
    "alias": []
  },
  {
    "groupId": "{传入的群号}",
    "qq": "10003",
    "nickname": "用户C",
    "alias": ["小C同学", "C哥"]
  }
]
```

## 依赖说明

- 依赖OneBot HTTP API
- 需要配置 `onebot.http.url` 环境变量
- 别名功能需要后续集成数据库存储 