package agent

import (
	"fmt"
	"log"
	"time"
)

// ExampleUsage 展示如何使用OpenAI客户端库
func ExampleUsage() {
	// 1. 创建配置
	config := &OpenAIConfig{
		APIKey:      "your-api-key-here",      // 替换为你的API密钥
		BaseURL:     "https://api.openai.com", // 或者其他兼容的端点
		Model:       "gpt-3.5-turbo",
		MaxTokens:   1000,
		Temperature: 0.7,
		Timeout:     30 * time.Second,
	}

	// 2. 创建客户端
	client := NewOpenAIClient(config)

	// 3. 简单对话
	response1, err := client.SimpleChat("你好，请介绍一下你自己")
	if err != nil {
		log.Printf("简单对话失败: %v", err)
		return
	}
	fmt.Printf("简单对话回复: %s\n", response1.Content)
	fmt.Printf("使用令牌: %d\n", response1.Usage.TotalTokens)

	// 4. 带系统提示的对话
	systemPrompt := "你是一个专业的编程助手，请用简洁明了的语言回答问题。"
	userQuestion := "如何在Go语言中创建一个HTTP服务器？"

	response2, err := client.ChatWithSystem(systemPrompt, userQuestion)
	if err != nil {
		log.Printf("系统对话失败: %v", err)
		return
	}
	fmt.Printf("系统对话回复: %s\n", response2.Content)

	// 5. 多轮对话
	messages := []Message{
		{Role: "system", Content: "你是一个友好的助手"},
		{Role: "user", Content: "今天天气怎么样？"},
		{Role: "assistant", Content: "抱歉，我无法获取实时天气信息。"},
		{Role: "user", Content: "那请告诉我一些关于天气的有趣知识吧"},
	}

	response3, err := client.ChatWithMessages(messages)
	if err != nil {
		log.Printf("多轮对话失败: %v", err)
		return
	}
	fmt.Printf("多轮对话回复: %s\n", response3.Content)

	// 6. 流式对话示例
	fmt.Println("流式对话回复:")
	err = client.ChatStream([]Message{
		{Role: "user", Content: "请写一个简短的Go语言Hello World程序"},
	}, func(content string) error {
		fmt.Print(content) // 实时输出每个片段
		return nil
	})
	if err != nil {
		log.Printf("流式对话失败: %v", err)
	}
	fmt.Println() // 换行

	// 7. 更新配置
	newConfig := &OpenAIConfig{
		APIKey:      "new-api-key",
		BaseURL:     "https://custom-endpoint.com",
		Model:       "gpt-4",
		MaxTokens:   2000,
		Temperature: 0.5,
		Timeout:     60 * time.Second,
	}
	client.UpdateConfig(newConfig)

	// 8. 获取当前配置
	currentConfig := client.GetConfig()
	fmt.Printf("当前使用的模型: %s\n", currentConfig.Model)
	fmt.Printf("当前API端点: %s\n", currentConfig.BaseURL)
}

// QuickStart 快速开始示例
func QuickStart() {
	// 最简单的使用方式
	client := NewOpenAIClient(&OpenAIConfig{
		APIKey: "your-api-key-here",
	})

	response, err := client.SimpleChat("Hello, World!")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("AI回复:", response.Content)
}

// CustomEndpointExample 自定义端点示例（如使用国内的API代理）
func CustomEndpointExample() {
	config := &OpenAIConfig{
		APIKey:  "your-api-key",
		BaseURL: "https://your-proxy-endpoint.com", // 你的代理端点
		Model:   "gpt-3.5-turbo",
	}

	client := NewOpenAIClient(config)

	response, err := client.ChatWithSystem(
		"你是一个中文助手",
		"请用中文回答：Go语言有什么优点？",
	)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("回复:", response.Content)
	fmt.Printf("消耗tokens: %d\n", response.Usage.TotalTokens)
}
