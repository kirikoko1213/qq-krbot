# OpenAI 客户端库

这是一个简洁易用的 OpenAI API 封装库，让您只需要提供必要信息就可以直接对话。

## 特性

- 🚀 **简单易用** - 只需提供 API Key 和端点即可开始使用
- 🔧 **高度可配置** - 支持自定义模型、温度、最大令牌数等参数
- 💬 **多种对话模式** - 支持简单对话、系统提示对话、多轮对话
- 🌊 **流式响应** - 支持实时流式输出
- 🔄 **动态配置** - 运行时可以更新配置
- 🌐 **兼容性强** - 支持 OpenAI 官方 API 及其他兼容接口

## 快速开始

### 基础使用

```go
package main

import (
    "fmt"
    "log"
    "qq-krbot/agent"
)

func main() {
    // 创建客户端（使用默认配置）
    client := agent.NewOpenAIClient(&agent.OpenAIConfig{
        APIKey: "your-api-key-here",
    })

    // 简单对话
    response, err := client.SimpleChat("Hello, World!")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("AI回复:", response.Content)
}
```

### 完整配置示例

```go
config := &agent.OpenAIConfig{
    APIKey:      "your-api-key-here",
    BaseURL:     "https://api.openai.com",  // API端点
    Model:       "gpt-3.5-turbo",           // 使用的模型
    MaxTokens:   1000,                      // 最大令牌数
    Temperature: 0.7,                       // 温度参数
    TopP:        1.0,                       // Top-p参数
    Timeout:     30 * time.Second,          // 请求超时时间
}

client := agent.NewOpenAIClient(config)
```

## 使用示例

### 1. 简单对话

```go
response, err := client.SimpleChat("你好，请介绍一下你自己")
if err != nil {
    log.Fatal(err)
}
fmt.Println("回复:", response.Content)
fmt.Println("使用令牌:", response.Usage.TotalTokens)
```

### 2. 带系统提示的对话

```go
systemPrompt := "你是一个专业的编程助手，请用简洁明了的语言回答问题。"
userQuestion := "如何在Go语言中创建一个HTTP服务器？"

response, err := client.ChatWithSystem(systemPrompt, userQuestion)
if err != nil {
    log.Fatal(err)
}
fmt.Println("回复:", response.Content)
```

### 3. 多轮对话

```go
messages := []agent.Message{
    {Role: "system", Content: "你是一个友好的助手"},
    {Role: "user", Content: "今天天气怎么样？"},
    {Role: "assistant", Content: "抱歉，我无法获取实时天气信息。"},
    {Role: "user", Content: "那请告诉我一些关于天气的有趣知识吧"},
}

response, err := client.ChatWithMessages(messages)
if err != nil {
    log.Fatal(err)
}
fmt.Println("回复:", response.Content)
```

### 4. 流式对话

```go
err := client.ChatStream([]agent.Message{
    {Role: "user", Content: "请写一个简短的Go语言Hello World程序"},
}, func(content string) error {
    fmt.Print(content) // 实时输出每个片段
    return nil
})
if err != nil {
    log.Fatal(err)
}
```

### 5. 使用自定义端点（如代理服务）

```go
config := &agent.OpenAIConfig{
    APIKey:  "your-api-key",
    BaseURL: "https://your-proxy-endpoint.com", // 你的代理端点
    Model:   "gpt-3.5-turbo",
}

client := agent.NewOpenAIClient(config)
response, err := client.SimpleChat("Hello!")
```

### 6. 动态更新配置

```go
// 初始配置
client := agent.NewOpenAIClient(&agent.OpenAIConfig{
    APIKey: "key1",
    Model:  "gpt-3.5-turbo",
})

// 运行时更新配置
newConfig := &agent.OpenAIConfig{
    APIKey: "key2",
    Model:  "gpt-4",
    MaxTokens: 2000,
}
client.UpdateConfig(newConfig)
```

## API 参考

### OpenAIConfig

| 字段        | 类型          | 默认值                    | 说明                      |
|-------------|---------------|---------------------------|---------------------------|
| APIKey      | string        | 无                        | OpenAI API 密钥           |
| BaseURL     | string        | https://api.openai.com/v1 | API 基础 URL              |
| Model       | string        | gpt-3.5-turbo            | 使用的模型                |
| MaxTokens   | int64         | 4096                      | 最大令牌数                |
| Temperature | float64       | 0.7                       | 温度参数（0-2）           |
| TopP        | float64       | 1.0                       | Top-p 参数（0-1）         |
| Timeout     | time.Duration | 30s                       | 请求超时时间              |
| ProxyURL    | string        | 无                        | 代理 URL（预留，暂未使用） |

### Message

| 字段    | 类型   | 说明                                    |
|---------|--------|-----------------------------------------|
| Role    | string | 消息角色："system", "user", "assistant" |
| Content | string | 消息内容                                |

### ChatResponse

| 字段         | 类型   | 说明           |
|--------------|--------|----------------|
| Content      | string | AI 回复内容    |
| FinishReason | string | 完成原因       |
| Usage        | struct | 令牌使用情况   |
| └ PromptTokens     | int    | 输入令牌数     |
| └ CompletionTokens | int    | 输出令牌数     |
| └ TotalTokens      | int    | 总令牌数       |

### 主要方法

- `NewOpenAIClient(config *OpenAIConfig) *OpenAIClient` - 创建新客户端
- `SimpleChat(message string) (*ChatResponse, error)` - 简单对话
- `ChatWithSystem(systemPrompt, userMessage string) (*ChatResponse, error)` - 带系统提示的对话
- `ChatWithMessages(messages []Message) (*ChatResponse, error)` - 多轮对话
- `ChatStream(messages []Message, callback func(content string) error) error` - 流式对话
- `UpdateConfig(config *OpenAIConfig)` - 更新配置
- `GetConfig() *OpenAIConfig` - 获取当前配置

## 常见问题

### Q: 如何使用国内的 API 代理？

A: 只需要在配置中设置 `BaseURL` 为代理地址：

```go
config := &agent.OpenAIConfig{
    APIKey:  "your-api-key",
    BaseURL: "https://your-proxy.com/v1",
}
```

### Q: 如何控制回复的长度？

A: 通过设置 `MaxTokens` 参数：

```go
config := &agent.OpenAIConfig{
    APIKey:    "your-api-key",
    MaxTokens: 500, // 限制回复最多500个令牌
}
```

### Q: 如何让 AI 回复更加随机或更加确定？

A: 通过调整 `Temperature` 参数：
- `Temperature: 0.1` - 更确定、一致的回复
- `Temperature: 1.0` - 平衡
- `Temperature: 1.5` - 更随机、创造性的回复

### Q: 支持哪些模型？

A: 支持所有 OpenAI 兼容的模型，如：
- `gpt-3.5-turbo`
- `gpt-4`
- `gpt-4-turbo`
- 以及其他第三方兼容模型

## 注意事项

1. 请确保妥善保管您的 API 密钥，不要在代码中硬编码
2. 流式对话时，确保正确处理回调函数中的错误
3. 根据实际需求调整超时时间和令牌限制
4. 使用代理服务时，确保端点 URL 正确

## 上下文管理功能

新增的上下文管理功能让您可以自动保存和加载对话历史，实现连续对话。

### 快速开始

```go
// 1. 创建内存存储
storage := agent.NewMemoryContextStorage(50) // 最多存储50条消息

// 2. 创建带存储的客户端
client := agent.NewOpenAIClientWithStorage(&agent.OpenAIConfig{
    APIKey: "your-api-key",
}, storage)

// 3. 带会话的对话
sessionID := "user-123"
response1, _ := client.ChatWithSession(sessionID, "我叫小明")
response2, _ := client.ChatWithSession(sessionID, "我叫什么名字？") // AI 会记住之前的信息
```

### 主要功能

#### 1. 会话对话
```go
// 简单会话对话
response, err := client.ChatWithSession(sessionID, "你好")

// 带系统提示的会话对话
response, err := client.ChatWithSessionAndSystem(sessionID, "你是一个助手", "你好")
```

#### 2. 流式会话对话
```go
err := client.ChatStreamWithSession(sessionID, "请介绍Go语言", func(content string) error {
    fmt.Print(content)
    return nil
})
```

#### 3. 会话管理
```go
// 列出所有会话
sessions, err := client.ListSessions()

// 获取会话信息
info, err := client.GetSessionInfo(sessionID)

// 获取会话消息历史
messages, err := client.GetSessionMessages(sessionID)

// 清空会话
err := client.ClearSession(sessionID)

// 删除会话
err := client.DeleteSession(sessionID)
```

### 存储接口

#### 内存存储
```go
// 创建内存存储（线程安全）
storage := agent.NewMemoryContextStorage(100) // 每个会话最多100条消息
```

#### 自定义数据库存储
您可以实现 `ContextStorage` 接口来使用数据库存储：

```go
type DatabaseStorage struct {
    db *sql.DB
}

func (d *DatabaseStorage) SaveMessage(sessionID string, message agent.Message) error {
    // 实现数据库保存逻辑
    _, err := d.db.Exec("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        sessionID, message.Role, message.Content, time.Now())
    return err
}

func (d *DatabaseStorage) LoadMessages(sessionID string) ([]agent.Message, error) {
    // 实现数据库加载逻辑
    rows, err := d.db.Query("SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at",
        sessionID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var messages []agent.Message
    for rows.Next() {
        var msg agent.Message
        err := rows.Scan(&msg.Role, &msg.Content)
        if err != nil {
            return nil, err
        }
        messages = append(messages, msg)
    }
    return messages, nil
}

// ... 实现其他接口方法

// 使用
dbStorage := &DatabaseStorage{db: yourDB}
client := agent.NewOpenAIClientWithStorage(config, dbStorage)
```

### ContextStorage 接口

```go
type ContextStorage interface {
    SaveMessage(sessionID string, message Message) error
    LoadMessages(sessionID string) ([]Message, error)
    ClearSession(sessionID string) error
    DeleteSession(sessionID string) error
    ListSessions() ([]string, error)
    GetSessionInfo(sessionID string) (*SessionInfo, error)
}
```

### 特性

- **自动管理**: 对话后自动保存，下次对话自动加载历史
- **消息限制**: 防止单个会话消息过多，自动清理最旧的消息
- **系统消息保护**: 自动保留系统消息不被清理
- **线程安全**: 内存存储实现了读写锁，支持并发访问
- **会话隔离**: 不同会话ID的对话完全独立
- **灵活扩展**: 通过接口可以轻松扩展到数据库存储

## 示例代码

更多示例请查看：
- `example.go` - 基础使用示例
- `context_example.go` - 上下文管理示例 