package agent

import (
	"context"
	"encoding/json"
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
	client     *openai.Client
	config     *OpenAIConfig
	storage    ContextStorage // 上下文存储
	mcpManager *MCPManager    // MCP管理器
}

// NewOpenAIClient 创建新的OpenAI客户端
func NewOpenAIClient(config *OpenAIConfig) *OpenAIClient {
	return NewOpenAIClientWithStorage(config, nil)
}

// NewOpenAIClientWithStorage 创建带存储的OpenAI客户端
func NewOpenAIClientWithStorage(config *OpenAIConfig, storage ContextStorage) *OpenAIClient {
	return NewOpenAIClientWithAll(config, storage, nil)
}

// NewOpenAIClientWithMCP 创建带MCP的OpenAI客户端
func NewOpenAIClientWithMCP(config *OpenAIConfig, mcpManager *MCPManager) *OpenAIClient {
	return NewOpenAIClientWithAll(config, nil, mcpManager)
}

// NewOpenAIClientWithAll 创建完整功能的OpenAI客户端
func NewOpenAIClientWithAll(config *OpenAIConfig, storage ContextStorage, mcpManager *MCPManager) *OpenAIClient {
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
		client:     &client,
		config:     config,
		storage:    storage,
		mcpManager: mcpManager,
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

// SetMCPManager 设置MCP管理器
func (c *OpenAIClient) SetMCPManager(manager *MCPManager) {
	c.mcpManager = manager
}

// GetMCPManager 获取MCP管理器
func (c *OpenAIClient) GetMCPManager() *MCPManager {
	return c.mcpManager
}

// ChatWithTools 带工具调用的对话
func (c *OpenAIClient) ChatWithTools(messages []Message) (*ChatResponse, error) {
	if c.mcpManager == nil || !c.mcpManager.IsConnected() {
		// 如果没有MCP管理器，回退到普通对话
		return c.ChatWithMessages(messages)
	}

	// 获取工具列表
	tools, err := c.mcpManager.GetTools()
	if err != nil {
		return nil, fmt.Errorf("获取MCP工具失败: %w", err)
	}

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

	// 调用OpenAI API
	completion, err := c.client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
		Messages:    openaiMessages,
		Model:       openai.ChatModel(c.config.Model),
		MaxTokens:   openai.Int(c.config.MaxTokens),
		Temperature: openai.Float(c.config.Temperature),
		TopP:        openai.Float(c.config.TopP),
		Tools:       tools,
	})
	if err != nil {
		return nil, fmt.Errorf("调用OpenAI API失败: %w", err)
	}

	// 处理工具调用
	if len(completion.Choices[0].Message.ToolCalls) > 0 {
		completion, err = c.handleToolCalls(completion, openaiMessages, tools)
		if err != nil {
			return nil, err
		}
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

// ChatWithToolsAndSession 带工具调用和会话管理的对话
func (c *OpenAIClient) ChatWithToolsAndSession(sessionID, message string) (*ChatResponse, error) {
	return c.ChatWithToolsSessionAndSystem(sessionID, "", message)
}

// ChatWithToolsSessionAndSystem 带工具调用、会话管理和系统提示的对话
func (c *OpenAIClient) ChatWithToolsSessionAndSystem(sessionID, systemPrompt, message string) (*ChatResponse, error) {
	// 如果没有存储，直接使用工具对话
	if c.storage == nil {
		messages := []Message{{Role: "user", Content: message}}
		if systemPrompt != "" {
			messages = []Message{
				{Role: "system", Content: systemPrompt},
				{Role: "user", Content: message},
			}
		}
		return c.ChatWithTools(messages)
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

	// 调用带工具的对话
	response, err := c.ChatWithTools(messages)
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

// handleToolCalls 处理工具调用
func (c *OpenAIClient) handleToolCalls(completion *openai.ChatCompletion, originalMessages []openai.ChatCompletionMessageParamUnion, tools []openai.ChatCompletionToolParam) (*openai.ChatCompletion, error) {
	if c.mcpManager == nil {
		return completion, nil
	}

	innerCompletion := *completion
	toolCallMessages := make([]openai.ChatCompletionMessageParamUnion, len(originalMessages))
	copy(toolCallMessages, originalMessages)

	// 工具调用次数限制
	maxCalls := c.mcpManager.config.MaxToolCalls
	if maxCalls <= 0 {
		maxCalls = 10
	}

	for callCount := 0; callCount < maxCalls; callCount++ {
		toolCalls := innerCompletion.Choices[0].Message.ToolCalls
		if len(toolCalls) == 0 {
			break
		}

		// 添加assistant的回复（包含tool_calls）
		assistantMessage := openai.AssistantMessage(innerCompletion.Choices[0].Message.Content)
		var tcParams []openai.ChatCompletionMessageToolCallParam
		for _, tc := range toolCalls {
			tcParams = append(tcParams, openai.ChatCompletionMessageToolCallParam{
				ID:   tc.ID,
				Type: tc.Type,
				Function: openai.ChatCompletionMessageToolCallFunctionParam{
					Arguments: tc.Function.Arguments,
					Name:      tc.Function.Name,
				},
			})
		}
		assistantMessage.OfAssistant.ToolCalls = tcParams
		toolCallMessages = append(toolCallMessages, assistantMessage)

		// 执行每个工具调用
		for _, toolCall := range toolCalls {
			var toolArgs map[string]interface{}
			err := json.Unmarshal([]byte(toolCall.Function.Arguments), &toolArgs)
			if err != nil {
				return nil, fmt.Errorf("解析工具参数失败: %w", err)
			}

			// 调用MCP工具
			result, err := c.mcpManager.CallTool(toolCall.Function.Name, toolArgs)
			if err != nil {
				result = fmt.Sprintf("工具调用失败: %v", err)
			}

			// 添加工具调用结果
			toolCallMessages = append(toolCallMessages, openai.ToolMessage(result, toolCall.ID))
		}

		// 再次调用OpenAI API
		newCompletion, err := c.client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
			Messages:    toolCallMessages,
			Model:       openai.ChatModel(c.config.Model),
			MaxTokens:   openai.Int(c.config.MaxTokens),
			Temperature: openai.Float(c.config.Temperature),
			TopP:        openai.Float(c.config.TopP),
			Tools:       tools,
		})
		if err != nil {
			return nil, fmt.Errorf("工具调用后的API请求失败: %w", err)
		}

		innerCompletion = *newCompletion
	}

	return &innerCompletion, nil
}

// GetAvailableTools 获取可用的工具列表
func (c *OpenAIClient) GetAvailableTools() ([]string, error) {
	if c.mcpManager == nil {
		return []string{}, nil
	}
	if !c.mcpManager.IsConnected() {
		return nil, fmt.Errorf("MCP客户端未连接")
	}
	return c.mcpManager.GetToolNames(), nil
}

// GetToolInfo 获取工具信息
func (c *OpenAIClient) GetToolInfo(toolName string) (map[string]interface{}, error) {
	if c.mcpManager == nil {
		return nil, fmt.Errorf("未设置MCP管理器")
	}
	if !c.mcpManager.IsConnected() {
		return nil, fmt.Errorf("MCP客户端未连接")
	}

	tool, err := c.mcpManager.GetToolInfo(toolName)
	if err != nil {
		return nil, err
	}

	info := map[string]interface{}{
		"name":        tool.Name,
		"description": tool.Description,
		"parameters":  tool.InputSchema,
	}

	return info, nil
}
