package agent

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// OpenAIConfig 配置结构
type OpenAIConfig struct {
	APIKey      string        // OpenAI API密钥
	BaseURL     string        // API基础URL，默认为https://api.openai.com/v1
	Model       string        // 使用的模型，默认为gpt-3.5-turbo
	MaxTokens   int64         // 最大令牌数
	Temperature float64       // 温度参数，控制随机性
	TopP        float64       // Top-p参数
	Timeout     time.Duration // 请求超时时间
	ProxyURL    string        // 代理URL（可选）
}

// DefaultConfig 返回默认配置
func DefaultOpenAIConfig() *OpenAIConfig {
	return &OpenAIConfig{
		BaseURL:     "https://api.openai.com/v1",
		Model:       "gpt-3.5-turbo",
		MaxTokens:   4096,
		Temperature: 0.7,
		TopP:        1.0,
		Timeout:     30 * time.Second,
	}
}

// OpenAIClient 封装的OpenAI客户端
type OpenAIClient struct {
	client  *openai.Client
	config  *OpenAIConfig
	storage ContextStorage // 上下文存储
}

// NewOpenAIClient 创建新的OpenAI客户端
func NewOpenAIClient(config *OpenAIConfig) *OpenAIClient {
	return NewOpenAIClientWithStorage(config, nil)
}

// NewOpenAIClientWithStorage 创建带存储的OpenAI客户端
func NewOpenAIClientWithStorage(config *OpenAIConfig, storage ContextStorage) *OpenAIClient {
	if config == nil {
		config = DefaultOpenAIConfig()
	}

	// 设置默认值
	if config.BaseURL == "" {
		config.BaseURL = "https://api.openai.com/v1"
	}
	if config.Model == "" {
		config.Model = "gpt-3.5-turbo"
	}
	if config.MaxTokens == 0 {
		config.MaxTokens = 4096
	}
	if config.Temperature == 0 {
		config.Temperature = 0.7
	}
	if config.TopP == 0 {
		config.TopP = 1.0
	}
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	// 创建HTTP客户端选项
	opts := []option.RequestOption{
		option.WithBaseURL(config.BaseURL),
		option.WithAPIKey(config.APIKey),
		option.WithHTTPClient(&http.Client{
			Timeout: config.Timeout,
		}),
	}

	// 创建OpenAI客户端
	client := openai.NewClient(opts...)

	return &OpenAIClient{
		client:  &client,
		config:  config,
		storage: storage,
	}
}

// Message 消息结构
type Message struct {
	Role    string `json:"role"`    // "system", "user", "assistant"
	Content string `json:"content"` // 消息内容
}

// ChatResponse 聊天响应
type ChatResponse struct {
	Content      string `json:"content"`       // 回复内容
	FinishReason string `json:"finish_reason"` // 完成原因
	Usage        struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"` // 令牌使用情况
}

// SimpleChat 简单对话接口
func (c *OpenAIClient) SimpleChat(message string) (*ChatResponse, error) {
	return c.ChatWithMessages([]Message{
		{Role: "user", Content: message},
	})
}

// ChatWithSystem 带系统提示的对话
func (c *OpenAIClient) ChatWithSystem(systemPrompt, userMessage string) (*ChatResponse, error) {
	messages := []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userMessage},
	}
	return c.ChatWithMessages(messages)
}

// ChatWithMessages 使用消息数组进行对话
func (c *OpenAIClient) ChatWithMessages(messages []Message) (*ChatResponse, error) {
	// 转换消息格式
	openaiMessages := make([]openai.ChatCompletionMessageParamUnion, len(messages))
	for i, msg := range messages {
		switch msg.Role {
		case "system":
			openaiMessages[i] = openai.SystemMessage(msg.Content)
		case "user":
			openaiMessages[i] = openai.UserMessage(msg.Content)
		case "assistant":
			openaiMessages[i] = openai.AssistantMessage(msg.Content)
		default:
			return nil, fmt.Errorf("不支持的消息角色: %s", msg.Role)
		}
	}

	// 创建聊天完成请求
	params := openai.ChatCompletionNewParams{
		Messages:    openaiMessages,
		Model:       openai.ChatModel(c.config.Model),
		MaxTokens:   openai.Int(c.config.MaxTokens),
		Temperature: openai.Float(c.config.Temperature),
		TopP:        openai.Float(c.config.TopP),
	}

	// 调用API
	completion, err := c.client.Chat.Completions.New(context.Background(), params)
	if err != nil {
		return nil, fmt.Errorf("调用OpenAI API失败: %w", err)
	}

	if len(completion.Choices) == 0 {
		return nil, fmt.Errorf("API响应中没有选择项")
	}

	// 构建响应
	response := &ChatResponse{
		Content:      completion.Choices[0].Message.Content,
		FinishReason: string(completion.Choices[0].FinishReason),
		Usage: struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		}{
			PromptTokens:     int(completion.Usage.PromptTokens),
			CompletionTokens: int(completion.Usage.CompletionTokens),
			TotalTokens:      int(completion.Usage.TotalTokens),
		},
	}

	return response, nil
}

// ChatStream 流式对话接口
func (c *OpenAIClient) ChatStream(messages []Message, callback func(content string) error) error {
	// 转换消息格式
	openaiMessages := make([]openai.ChatCompletionMessageParamUnion, len(messages))
	for i, msg := range messages {
		switch msg.Role {
		case "system":
			openaiMessages[i] = openai.SystemMessage(msg.Content)
		case "user":
			openaiMessages[i] = openai.UserMessage(msg.Content)
		case "assistant":
			openaiMessages[i] = openai.AssistantMessage(msg.Content)
		default:
			return fmt.Errorf("不支持的消息角色: %s", msg.Role)
		}
	}

	// 创建流式聊天完成请求
	params := openai.ChatCompletionNewParams{
		Messages:    openaiMessages,
		Model:       openai.ChatModel(c.config.Model),
		MaxTokens:   openai.Int(c.config.MaxTokens),
		Temperature: openai.Float(c.config.Temperature),
		TopP:        openai.Float(c.config.TopP),
	}

	// 调用流式API
	stream := c.client.Chat.Completions.NewStreaming(context.Background(), params)
	defer stream.Close()

	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			if err := callback(chunk.Choices[0].Delta.Content); err != nil {
				return err
			}
		}
	}

	return stream.Err()
}

// UpdateConfig 更新配置
func (c *OpenAIClient) UpdateConfig(config *OpenAIConfig) {
	c.config = config
	// 重新创建客户端
	opts := []option.RequestOption{
		option.WithBaseURL(config.BaseURL),
		option.WithAPIKey(config.APIKey),
		option.WithHTTPClient(&http.Client{
			Timeout: config.Timeout,
		}),
	}
	client := openai.NewClient(opts...)
	c.client = &client
}

// GetConfig 获取当前配置
func (c *OpenAIClient) GetConfig() *OpenAIConfig {
	return c.config
}

// SetStorage 设置上下文存储
func (c *OpenAIClient) SetStorage(storage ContextStorage) {
	c.storage = storage
}

// GetStorage 获取上下文存储
func (c *OpenAIClient) GetStorage() ContextStorage {
	return c.storage
}

// ChatWithSession 带会话管理的对话
func (c *OpenAIClient) ChatWithSession(sessionID, message string) (*ChatResponse, error) {
	return c.ChatWithSessionAndSystem(sessionID, "", message)
}

// ChatWithSessionAndSystem 带会话管理和系统提示的对话
func (c *OpenAIClient) ChatWithSessionAndSystem(sessionID, systemPrompt, message string) (*ChatResponse, error) {
	if c.storage == nil {
		// 如果没有存储，则退回到普通对话
		if systemPrompt != "" {
			return c.ChatWithSystem(systemPrompt, message)
		}
		return c.SimpleChat(message)
	}

	// 加载历史消息
	messages, err := c.storage.LoadMessages(sessionID)
	if err != nil {
		return nil, fmt.Errorf("加载会话历史失败: %w", err)
	}

	// 如果没有历史消息且有系统提示，则添加系统消息
	if len(messages) == 0 && systemPrompt != "" {
		systemMessage := Message{Role: "system", Content: systemPrompt}
		messages = append(messages, systemMessage)

		// 保存系统消息
		if err := c.storage.SaveMessage(sessionID, systemMessage); err != nil {
			return nil, fmt.Errorf("保存系统消息失败: %w", err)
		}
	}

	// 添加用户消息
	userMessage := Message{Role: "user", Content: message}
	messages = append(messages, userMessage)

	// 调用API
	response, err := c.ChatWithMessages(messages)
	if err != nil {
		return nil, err
	}

	// 保存用户消息和AI回复
	if err := c.storage.SaveMessage(sessionID, userMessage); err != nil {
		return nil, fmt.Errorf("保存用户消息失败: %w", err)
	}

	assistantMessage := Message{Role: "assistant", Content: response.Content}
	if err := c.storage.SaveMessage(sessionID, assistantMessage); err != nil {
		return nil, fmt.Errorf("保存AI回复失败: %w", err)
	}

	return response, nil
}

// ChatStreamWithSession 带会话管理的流式对话
func (c *OpenAIClient) ChatStreamWithSession(sessionID, message string, callback func(content string) error) error {
	return c.ChatStreamWithSessionAndSystem(sessionID, "", message, callback)
}

// ChatStreamWithSessionAndSystem 带会话管理和系统提示的流式对话
func (c *OpenAIClient) ChatStreamWithSessionAndSystem(sessionID, systemPrompt, message string, callback func(content string) error) error {
	if c.storage == nil {
		// 如果没有存储，则退回到普通流式对话
		messages := []Message{{Role: "user", Content: message}}
		if systemPrompt != "" {
			messages = []Message{
				{Role: "system", Content: systemPrompt},
				{Role: "user", Content: message},
			}
		}
		return c.ChatStream(messages, callback)
	}

	// 加载历史消息
	messages, err := c.storage.LoadMessages(sessionID)
	if err != nil {
		return fmt.Errorf("加载会话历史失败: %w", err)
	}

	// 如果没有历史消息且有系统提示，则添加系统消息
	if len(messages) == 0 && systemPrompt != "" {
		systemMessage := Message{Role: "system", Content: systemPrompt}
		messages = append(messages, systemMessage)

		// 保存系统消息
		if err := c.storage.SaveMessage(sessionID, systemMessage); err != nil {
			return fmt.Errorf("保存系统消息失败: %w", err)
		}
	}

	// 添加用户消息
	userMessage := Message{Role: "user", Content: message}
	messages = append(messages, userMessage)

	// 收集流式回复内容
	var assistantContent string
	wrappedCallback := func(content string) error {
		assistantContent += content
		return callback(content)
	}

	// 调用流式API
	err = c.ChatStream(messages, wrappedCallback)
	if err != nil {
		return err
	}

	// 保存用户消息和AI回复
	if err := c.storage.SaveMessage(sessionID, userMessage); err != nil {
		return fmt.Errorf("保存用户消息失败: %w", err)
	}

	if assistantContent != "" {
		assistantMessage := Message{Role: "assistant", Content: assistantContent}
		if err := c.storage.SaveMessage(sessionID, assistantMessage); err != nil {
			return fmt.Errorf("保存AI回复失败: %w", err)
		}
	}

	return nil
}

// ClearSession 清空指定会话
func (c *OpenAIClient) ClearSession(sessionID string) error {
	if c.storage == nil {
		return fmt.Errorf("未设置上下文存储")
	}
	return c.storage.ClearSession(sessionID)
}

// DeleteSession 删除指定会话
func (c *OpenAIClient) DeleteSession(sessionID string) error {
	if c.storage == nil {
		return fmt.Errorf("未设置上下文存储")
	}
	return c.storage.DeleteSession(sessionID)
}

// ListSessions 列出所有会话
func (c *OpenAIClient) ListSessions() ([]string, error) {
	if c.storage == nil {
		return nil, fmt.Errorf("未设置上下文存储")
	}
	return c.storage.ListSessions()
}

// GetSessionInfo 获取会话信息
func (c *OpenAIClient) GetSessionInfo(sessionID string) (*SessionInfo, error) {
	if c.storage == nil {
		return nil, fmt.Errorf("未设置上下文存储")
	}
	return c.storage.GetSessionInfo(sessionID)
}

// GetSessionMessages 获取会话消息
func (c *OpenAIClient) GetSessionMessages(sessionID string) ([]Message, error) {
	if c.storage == nil {
		return nil, fmt.Errorf("未设置上下文存储")
	}
	return c.storage.LoadMessages(sessionID)
}
