package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/shared"
)

// MCPConfig MCP配置
type MCPConfig struct {
	URL             string        // MCP服务器URL
	ServerName      string        // 期望的服务器名称
	ClientName      string        // 客户端名称
	ClientVersion   string        // 客户端版本
	ConnectTimeout  time.Duration // 连接超时时间
	PingInterval    time.Duration // Ping间隔时间
	AutoReconnect   bool          // 是否自动重连
	MaxRetries      int           // 最大重试次数
	RetryDelay      time.Duration // 重试延迟
	MaxToolCalls    int           // 最大工具调用次数（防止无限循环）
	ToolCallTimeout time.Duration // 工具调用超时时间
	EnableLogging   bool          // 是否启用日志
	LogToolCalls    bool          // 是否记录工具调用日志
}

// DefaultMCPConfig 返回默认MCP配置
func DefaultMCPConfig() *MCPConfig {
	return &MCPConfig{
		ServerName:      "mcp-server",
		ClientName:      "agent-client",
		ClientVersion:   "1.0.0",
		ConnectTimeout:  30 * time.Second,
		PingInterval:    10 * time.Second,
		AutoReconnect:   true,
		MaxRetries:      3,
		RetryDelay:      2 * time.Second,
		MaxToolCalls:    10,
		ToolCallTimeout: 30 * time.Second,
		EnableLogging:   true,
		LogToolCalls:    true,
	}
}

// MCPManager MCP管理器
type MCPManager struct {
	config    *MCPConfig
	client    *client.SSEMCPClient
	ctx       context.Context
	cancel    context.CancelFunc
	mu        sync.RWMutex
	connected bool
	tools     []mcp.Tool
	lastPing  time.Time
}

// NewMCPManager 创建MCP管理器
func NewMCPManager(config *MCPConfig) *MCPManager {
	if config == nil {
		config = DefaultMCPConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &MCPManager{
		config: config,
		ctx:    ctx,
		cancel: cancel,
	}
}

// Connect 连接到MCP服务器
func (m *MCPManager) Connect() error {
	if m.config.URL == "" {
		return fmt.Errorf("MCP服务器URL不能为空")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// 创建客户端
	var err error
	m.client, err = client.NewSSEMCPClient(m.config.URL)
	if err != nil {
		return fmt.Errorf("创建MCP客户端失败: %w", err)
	}

	// 设置连接超时
	connectCtx := m.ctx
	if m.config.ConnectTimeout > 0 {
		connectCtx, _ = context.WithTimeout(m.ctx, m.config.ConnectTimeout)
		// defer cancel()
	}

	// 启动客户端
	if err := m.client.Start(connectCtx); err != nil {
		return fmt.Errorf("启动MCP客户端失败: %w", err)
	}

	// 初始化
	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    m.config.ClientName,
		Version: m.config.ClientVersion,
	}

	result, err := m.client.Initialize(connectCtx, initRequest)
	if err != nil {
		return fmt.Errorf("初始化MCP客户端失败: %w", err)
	}

	// 验证服务器名称（如果指定了）
	if m.config.ServerName != "" && result.ServerInfo.Name != m.config.ServerName {
		return fmt.Errorf("服务器名称不匹配，期望: %s，实际: %s",
			m.config.ServerName, result.ServerInfo.Name)
	}

	m.connected = true
	m.lastPing = time.Now()

	// 加载工具列表
	if err := m.loadTools(); err != nil {
		return fmt.Errorf("加载工具失败: %w", err)
	}

	// 启动健康检查
	if m.config.AutoReconnect && m.config.PingInterval > 0 {
		go m.healthCheck()
	}

	return nil
}

// Disconnect 断开连接
func (m *MCPManager) Disconnect() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.cancel != nil {
		m.cancel()
	}

	m.connected = false
	return nil
}

// IsConnected 检查连接状态
func (m *MCPManager) IsConnected() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.connected
}

// GetTools 获取OpenAI格式的工具列表
func (m *MCPManager) GetTools() ([]openai.ChatCompletionToolParam, error) {
	if !m.IsConnected() {
		return nil, fmt.Errorf("MCP客户端未连接")
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	tools := make([]openai.ChatCompletionToolParam, 0, len(m.tools))
	for _, tool := range m.tools {
		funcParam := shared.FunctionDefinitionParam{
			Name:        tool.Name,
			Description: param.NewOpt(tool.Description),
		}

		// 转换参数schema
		if tool.InputSchema.Properties != nil {
			funcParam.Parameters = map[string]any{
				"type":       "object",
				"properties": tool.InputSchema.Properties,
				"required":   tool.InputSchema.Required,
			}
		}

		tools = append(tools, openai.ChatCompletionToolParam{
			Type:     "function",
			Function: funcParam,
		})
	}

	return tools, nil
}

// CallTool 调用MCP工具
func (m *MCPManager) CallTool(toolName string, arguments map[string]interface{}) (string, error) {
	if !m.IsConnected() {
		return "", fmt.Errorf("MCP客户端未连接")
	}

	// 设置超时
	callCtx := m.ctx
	if m.config.ToolCallTimeout > 0 {
		var cancel context.CancelFunc
		callCtx, cancel = context.WithTimeout(m.ctx, m.config.ToolCallTimeout)
		defer cancel()
	}

	// 记录工具调用
	if m.config.LogToolCalls {
		argJson, _ := json.Marshal(arguments)
		fmt.Printf("调用MCP工具: %s, 参数: %s\n", toolName, string(argJson))
	}

	// 调用工具
	result, err := m.client.CallTool(callCtx, mcp.CallToolRequest{
		Params: struct {
			Name      string                 `json:"name"`
			Arguments map[string]interface{} `json:"arguments,omitempty"`
			Meta      *struct {
				ProgressToken mcp.ProgressToken `json:"progressToken,omitempty"`
			} `json:"_meta,omitempty"`
		}{
			Name:      toolName,
			Arguments: arguments,
		},
	})

	if err != nil {
		return "", fmt.Errorf("调用工具 %s 失败: %w", toolName, err)
	}

	// 提取文本内容
	if len(result.Content) > 0 {
		if textContent, ok := result.Content[0].(mcp.TextContent); ok {
			return textContent.Text, nil
		}
	}

	return "", fmt.Errorf("工具 %s 未返回有效内容", toolName)
}

// loadTools 加载工具列表
func (m *MCPManager) loadTools() error {
	listResult, err := m.client.ListTools(m.ctx, mcp.ListToolsRequest{})
	if err != nil {
		return err
	}

	m.tools = listResult.Tools

	if m.config.EnableLogging {
		fmt.Printf("加载了 %d 个MCP工具: ", len(m.tools))
		for i, tool := range m.tools {
			if i > 0 {
				fmt.Print(", ")
			}
			fmt.Print(tool.Name)
		}
		fmt.Println()
	}

	return nil
}

// healthCheck 健康检查
func (m *MCPManager) healthCheck() {
	ticker := time.NewTicker(m.config.PingInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			if err := m.ping(); err != nil {
				if m.config.EnableLogging {
					fmt.Printf("MCP健康检查失败: %v，尝试重连\n", err)
				}
				m.reconnect()
			}
		}
	}
}

// ping 发送ping
func (m *MCPManager) ping() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.connected || m.client == nil {
		return fmt.Errorf("客户端未连接")
	}

	err := m.client.Ping(m.ctx)
	if err == nil {
		m.lastPing = time.Now()
	}
	return err
}

// reconnect 重新连接
func (m *MCPManager) reconnect() {
	m.mu.Lock()
	m.connected = false
	m.mu.Unlock()

	for retry := 0; retry < m.config.MaxRetries; retry++ {
		if m.config.EnableLogging {
			fmt.Printf("尝试重连MCP服务器 (%d/%d)\n", retry+1, m.config.MaxRetries)
		}

		time.Sleep(m.config.RetryDelay)

		if err := m.Connect(); err == nil {
			if m.config.EnableLogging {
				fmt.Println("MCP服务器重连成功")
			}
			return
		}
	}

	if m.config.EnableLogging {
		fmt.Printf("MCP服务器重连失败，已达到最大重试次数 %d\n", m.config.MaxRetries)
	}
}

// GetLastPingTime 获取最后一次ping时间
func (m *MCPManager) GetLastPingTime() time.Time {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.lastPing
}

// GetToolNames 获取工具名称列表
func (m *MCPManager) GetToolNames() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, len(m.tools))
	for i, tool := range m.tools {
		names[i] = tool.Name
	}
	return names
}

// GetToolInfo 获取工具信息
func (m *MCPManager) GetToolInfo(toolName string) (*mcp.Tool, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, tool := range m.tools {
		if tool.Name == toolName {
			return &tool, nil
		}
	}
	return nil, fmt.Errorf("未找到工具: %s", toolName)
}
