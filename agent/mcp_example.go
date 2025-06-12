package agent

import (
	"fmt"
	"log"
	"qq-krbot/env"
	"time"
)

var mcpPort = env.Get("mcp.sse.port")

// MCPExamples MCP功能示例
func MCPExamples(openaiConfig *OpenAIConfig) {
	fmt.Println("=== MCP功能示例 ===")

	// 1. 创建MCP配置
	mcpConfig := &MCPConfig{
		URL:             "http://localhost:" + mcpPort + "/sse", // 您的MCP服务器地址
		ServerName:      "qq-mcp-server",                        // 期望的服务器名称
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

	// 2. 创建MCP管理器
	mcpManager := NewMCPManager(mcpConfig)

	// 3. 连接到MCP服务器
	fmt.Println("连接到MCP服务器...")
	err := mcpManager.Connect()
	if err != nil {
		log.Printf("连接MCP服务器失败: %v", err)
		fmt.Println("请确保MCP服务器正在运行在 http://localhost:" + mcpPort)
		return
	}
	defer mcpManager.Disconnect()

	fmt.Println("MCP服务器连接成功！")

	// 4. 创建带MCP功能的OpenAI客户端
	client := NewOpenAIClientWithMCP(openaiConfig, mcpManager)

	// 5. 查看可用工具
	tools, err := client.GetAvailableTools()
	if err != nil {
		log.Printf("获取工具列表失败: %v", err)
		return
	}

	fmt.Printf("可用工具数量: %d\n", len(tools))
	for i, toolName := range tools {
		fmt.Printf("%d. %s\n", i+1, toolName)

		// 获取工具详细信息
		toolInfo, err := client.GetToolInfo(toolName)
		if err == nil {
			fmt.Printf("   描述: %s\n", toolInfo["description"])
		}
	}

	// 6. 简单的工具调用对话
	fmt.Println("\n--- 天气查询示例 ---")
	response1, err := client.ChatWithTools([]Message{
		{Role: "user", Content: "请帮我查询北京的天气"},
	})
	if err != nil {
		log.Printf("天气查询失败: %v", err)
	} else {
		fmt.Printf("用户: 请帮我查询北京的天气\n")
		fmt.Printf("AI: %s\n", response1.Content)
		fmt.Printf("使用令牌: %d\n", response1.Usage.TotalTokens)
	}

	// 7. 多工具调用示例
	fmt.Println("\n--- 多工具调用示例 ---")
	response2, err := client.ChatWithTools([]Message{
		{Role: "user", Content: "请帮我查询上海和广州的天气，然后比较一下"},
	})
	if err != nil {
		log.Printf("多工具调用失败: %v", err)
	} else {
		fmt.Printf("用户: 请帮我查询上海和广州的天气，然后比较一下\n")
		fmt.Printf("AI: %s\n", response2.Content)
	}
}

// MCPWithContextExample MCP与上下文管理结合示例
func MCPWithContextExample(openaiConfig *OpenAIConfig) {
	fmt.Println("=== MCP与上下文管理结合示例 ===")

	// 1. 创建存储和MCP管理器
	storage := NewMemoryContextStorage(50)
	mcpManager := NewMCPManager(&MCPConfig{
		URL:           "http://localhost:" + mcpPort,
		EnableLogging: true,
		LogToolCalls:  true,
	})

	// 2. 连接MCP
	err := mcpManager.Connect()
	if err != nil {
		log.Printf("连接MCP失败: %v", err)
		return
	}
	defer mcpManager.Disconnect()

	// 3. 创建完整功能的客户端
	client := NewOpenAIClientWithAll(openaiConfig, storage, mcpManager)

	sessionID := "mcp-session-001"
	systemPrompt := "你是一个智能助手，可以使用各种工具来帮助用户获取信息。"

	// 4. 第一轮对话 - 建立上下文
	fmt.Println("\n--- 第一轮对话 ---")
	response1, err := client.ChatWithToolsSessionAndSystem(sessionID, systemPrompt, "我想了解北京的天气情况")
	if err != nil {
		log.Printf("第一轮对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 我想了解北京的天气情况\n")
	fmt.Printf("AI: %s\n", response1.Content)

	// 5. 第二轮对话 - 利用上下文
	fmt.Println("\n--- 第二轮对话 ---")
	response2, err := client.ChatWithToolsAndSession(sessionID, "那上海呢？")
	if err != nil {
		log.Printf("第二轮对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 那上海呢？\n")
	fmt.Printf("AI: %s\n", response2.Content)

	// 6. 第三轮对话 - 复杂查询
	fmt.Println("\n--- 第三轮对话 ---")
	response3, err := client.ChatWithToolsAndSession(sessionID, "请比较这两个城市的天气，哪个更适合旅游？")
	if err != nil {
		log.Printf("第三轮对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 请比较这两个城市的天气，哪个更适合旅游？\n")
	fmt.Printf("AI: %s\n", response3.Content)

	// 7. 查看对话历史
	fmt.Println("\n--- 对话历史 ---")
	messages, err := client.GetSessionMessages(sessionID)
	if err == nil {
		for i, msg := range messages {
			fmt.Printf("%d. [%s] %s\n", i+1, msg.Role,
				truncateString(msg.Content, 100))
		}
	}
}

// MCPHealthCheckExample MCP健康检查示例
func MCPHealthCheckExample() {
	fmt.Println("=== MCP健康检查示例 ===")

	mcpConfig := &MCPConfig{
		URL:           "http://localhost:" + mcpPort,
		PingInterval:  5 * time.Second,
		AutoReconnect: true,
		MaxRetries:    3,
		EnableLogging: true,
	}

	manager := NewMCPManager(mcpConfig)

	// 连接
	err := manager.Connect()
	if err != nil {
		log.Printf("连接失败: %v", err)
		return
	}

	// 监控连接状态
	fmt.Println("监控MCP连接状态（运行30秒）...")
	start := time.Now()
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if time.Since(start) > 30*time.Second {
				fmt.Println("监控结束")
				manager.Disconnect()
				return
			}

			status := "已连接"
			if !manager.IsConnected() {
				status = "已断开"
			}

			lastPing := manager.GetLastPingTime()
			fmt.Printf("状态: %s, 最后ping: %s, 工具数量: %d\n",
				status,
				lastPing.Format("15:04:05"),
				len(manager.GetToolNames()),
			)
		}
	}
}

// MCPToolManagementExample MCP工具管理示例
func MCPToolManagementExample(openaiConfig *OpenAIConfig) {
	fmt.Println("=== MCP工具管理示例 ===")

	mcpManager := NewMCPManager(&MCPConfig{
		URL:           "http://localhost:" + mcpPort,
		EnableLogging: true,
	})

	err := mcpManager.Connect()
	if err != nil {
		log.Printf("连接失败: %v", err)
		return
	}
	defer mcpManager.Disconnect()

	client := NewOpenAIClientWithMCP(openaiConfig, mcpManager)

	// 1. 列出所有工具
	fmt.Println("\n--- 所有可用工具 ---")
	tools, _ := client.GetAvailableTools()
	for i, toolName := range tools {
		fmt.Printf("%d. %s\n", i+1, toolName)
	}

	// 2. 获取每个工具的详细信息
	fmt.Println("\n--- 工具详细信息 ---")
	for _, toolName := range tools {
		info, err := client.GetToolInfo(toolName)
		if err == nil {
			fmt.Printf("\n工具名称: %s\n", toolName)
			fmt.Printf("描述: %s\n", info["description"])
			if params, ok := info["parameters"].(map[string]interface{}); ok {
				if props, ok := params["properties"].(map[string]interface{}); ok {
					fmt.Println("参数:")
					for paramName, paramInfo := range props {
						fmt.Printf("  - %s: %v\n", paramName, paramInfo)
					}
				}
			}
		}
	}

	// 3. 测试特定工具
	if len(tools) > 0 {
		fmt.Printf("\n--- 测试工具: %s ---\n", tools[0])

		var testMessage string
		switch tools[0] {
		case "weather":
			testMessage = "请查询深圳的天气"
		case "dnf_gold":
			testMessage = "请查询DNF金币价格"
		default:
			testMessage = fmt.Sprintf("请使用%s工具", tools[0])
		}

		response, err := client.ChatWithTools([]Message{
			{Role: "user", Content: testMessage},
		})
		if err != nil {
			log.Printf("工具测试失败: %v", err)
		} else {
			fmt.Printf("测试消息: %s\n", testMessage)
			fmt.Printf("AI回复: %s\n", response.Content)
		}
	}
}

// MCPErrorHandlingExample MCP错误处理示例
func MCPErrorHandlingExample(openaiConfig *OpenAIConfig) {
	fmt.Println("=== MCP错误处理示例 ===")

	// 1. 测试连接错误
	fmt.Println("\n--- 测试连接错误 ---")
	badManager := NewMCPManager(&MCPConfig{
		URL:            "http://localhost:9999", // 错误的地址
		ConnectTimeout: 5 * time.Second,
		EnableLogging:  true,
	})

	err := badManager.Connect()
	if err != nil {
		fmt.Printf("预期的连接错误: %v\n", err)
	}

	// 2. 测试未连接状态下的操作
	fmt.Println("\n--- 测试未连接状态 ---")
	client := NewOpenAIClientWithMCP(openaiConfig, badManager)

	// 这应该回退到普通对话
	response, err := client.ChatWithTools([]Message{
		{Role: "user", Content: "你好"},
	})
	if err != nil {
		log.Printf("错误: %v", err)
	} else {
		fmt.Printf("回退到普通对话: %s\n", response.Content)
	}

	// 3. 测试工具调用错误
	fmt.Println("\n--- 测试工具调用错误 ---")
	goodManager := NewMCPManager(&MCPConfig{
		URL:           "http://localhost:" + mcpPort,
		EnableLogging: false, // 关闭日志避免干扰
	})

	if goodManager.Connect() == nil {
		client.SetMCPManager(goodManager)

		// 尝试调用不存在的工具
		result, err := goodManager.CallTool("nonexistent-tool", map[string]interface{}{
			"param": "value",
		})
		if err != nil {
			fmt.Printf("预期的工具调用错误: %v\n", err)
		} else {
			fmt.Printf("意外的成功结果: %s\n", result)
		}

		goodManager.Disconnect()
	}
}

// truncateString 截断字符串
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
