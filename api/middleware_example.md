# Gin错误监控中间件使用指南

## 功能说明

该中间件系统提供以下功能：
1. **HTTP状态码监控**: 自动监控非200状态码
2. **业务状态码监控**: 监控响应体中的业务错误码
3. **调用栈追踪**: 自动记录错误发生的代码位置
4. **详细错误日志**: 记录完整的错误上下文

## 安装配置

### 1. 注册中间件

在 `api/router.go` 中注册：

```go
func RegisterRouter(r *gin.Engine) {
    // 注册响应日志中间件
    r.Use(ResponseLoggerMiddleware())
    
    // 其他路由...
}
```

### 2. 使用错误处理函数

```go
// 业务错误（返回HTTP 200，但业务失败）
func SomeHandler(c *gin.Context) {
    if err := someBusinessLogic(); err != nil {
        ResultError(c, "1001", err)  // 自动记录错误位置
        return
    }
    ResultSuccess(c, data)
}

// HTTP错误（返回非200状态码）
func AnotherHandler(c *gin.Context) {
    if unauthorized {
        ResultHttpError(c, 401, errors.New("未授权访问"))
        return
    }
}
```

## 监控规则

### HTTP状态码监控
- 监控所有非200的HTTP状态码
- 自动记录请求路径和响应内容

### 业务状态码监控
支持以下响应格式：

```json
// 错误格式1: code字段
{
  "code": 1001,           // 非0表示错误
  "message": "业务错误",
  "data": null
}

// 错误格式2: status字段  
{
  "status": "error",      // "error"或"fail"表示错误
  "msg": "业务失败",
  "data": null
}

// 成功格式
{
  "code": 0,              // 0表示成功
  "status": "success",    // "success"表示成功
  "data": {...}
}
```

## 日志输出格式

### 业务错误日志
```
2024/01/01 12:00:00 [ERROR] API业务错误 - 位置: /path/to/file.go:123 [FunctionName], 错误码: 1001, 错误信息: 数据库连接失败
```

### HTTP错误日志
```
2024/01/01 12:00:00 [ERROR] API HTTP错误 - 位置: /path/to/file.go:456 [HandlerName], HTTP状态码: 500, 错误信息: 服务器内部错误
```

### 中间件详细日志
```
2024/01/01 12:00:00 [ERROR] 
=== API错误日志 ===
错误类型: 业务状态码错误
请求路径: POST /api/group/member/alias
调用位置: /path/to/group.go:234 [(*GroupAPI).UpdateMemberAlias]
响应内容: {"status":"error","msg":"数据库更新失败","code":"1002"}
================
```

## 最佳实践

### 1. 统一错误码
```go
const (
    ErrCodeInvalidParam    = "1001"
    ErrCodeDatabaseError   = "1002"
    ErrCodePermissionDeny  = "1003"
)
```

### 2. 自定义错误类型
```go
type BusinessError struct {
    Code    string
    Message string
}

func (e BusinessError) Error() string {
    return e.Message
}

// 使用
func SomeHandler(c *gin.Context) {
    if err := validate(); err != nil {
        bizErr := BusinessError{
            Code:    ErrCodeInvalidParam,
            Message: "参数验证失败",
        }
        ResultError(c, bizErr.Code, bizErr)
        return
    }
}
```

### 3. 错误分类处理
```go
func HandleError(c *gin.Context, err error) {
    switch e := err.(type) {
    case *ValidationError:
        ResultError(c, "1001", e)
    case *DatabaseError:
        ResultError(c, "1002", e)  
    case *AuthError:
        ResultHttpError(c, 401, e)
    default:
        ResultHttpError(c, 500, e)
    }
}
```

## 注意事项

1. **性能影响**: 中间件会拦截所有响应，对高并发应用有轻微性能影响
2. **日志存储**: 确保日志系统有足够存储空间
3. **敏感信息**: 避免在响应体中包含敏感信息，因为会被完整记录
4. **调用栈过滤**: 中间件会自动过滤框架内部调用，只显示业务代码位置

## 配置选项

可以通过环境变量或配置文件调整：

```go
// 是否启用错误监控
const EnableErrorTracking = true

// 调用栈深度限制
const MaxStackDepth = 10

// 是否记录成功请求
const LogSuccessRequests = false
``` 