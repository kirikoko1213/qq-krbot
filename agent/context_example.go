package agent

import (
	"fmt"
	"log"
)

// ContextExamples 上下文管理示例
func ContextExamples(config *OpenAIConfig) {
	// 1. 创建带内存存储的客户端
	storage := NewMemoryContextStorage(50) // 最多存储50条消息

	client := NewOpenAIClientWithStorage(config, storage)

	fmt.Println("=== 上下文管理示例 ===")

	// 2. 开始一个新会话
	sessionID := "user-123" // 通常使用用户ID或其他唯一标识
	systemPrompt := "你是一个友好的助手，请记住我们的对话内容。"

	// 第一轮对话
	fmt.Println("\n--- 第一轮对话 ---")
	response1, err := client.ChatWithSessionAndSystem(sessionID, systemPrompt, "我叫小明，今年25岁")
	if err != nil {
		log.Printf("对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 我叫小明，今年25岁\n")
	fmt.Printf("AI: %s\n", response1.Content)

	// 第二轮对话（应该记住之前的信息）
	fmt.Println("\n--- 第二轮对话 ---")
	response2, err := client.ChatWithSession(sessionID, "我的名字是什么？")
	if err != nil {
		log.Printf("对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 我的名字是什么？\n")
	fmt.Printf("AI: %s\n", response2.Content)

	// 第三轮对话
	fmt.Println("\n--- 第三轮对话 ---")
	response3, err := client.ChatWithSession(sessionID, "我今年几岁了？")
	if err != nil {
		log.Printf("对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 我今年几岁了？\n")
	fmt.Printf("AI: %s\n", response3.Content)

	// 3. 查看会话信息
	fmt.Println("\n--- 会话信息 ---")
	sessionInfo, err := client.GetSessionInfo(sessionID)
	if err != nil {
		log.Printf("获取会话信息失败: %v", err)
	} else {
		fmt.Printf("会话ID: %s\n", sessionInfo.SessionID)
		fmt.Printf("消息数量: %d\n", sessionInfo.MessageCount)
		fmt.Printf("创建时间: %s\n", sessionInfo.CreatedAt.Format("2006-01-02 15:04:05"))
		fmt.Printf("更新时间: %s\n", sessionInfo.UpdatedAt.Format("2006-01-02 15:04:05"))
		fmt.Printf("首条消息: %s\n", sessionInfo.FirstMessage)
	}

	// 4. 查看会话历史
	fmt.Println("\n--- 会话历史 ---")
	messages, err := client.GetSessionMessages(sessionID)
	if err != nil {
		log.Printf("获取会话历史失败: %v", err)
	} else {
		for i, msg := range messages {
			fmt.Printf("%d. [%s] %s\n", i+1, msg.Role, msg.Content)
		}
	}

	// 5. 开始另一个会话
	fmt.Println("\n--- 另一个会话 ---")
	sessionID2 := "user-456"
	response4, err := client.ChatWithSession(sessionID2, "你好，你还记得我吗？")
	if err != nil {
		log.Printf("对话失败: %v", err)
		return
	}
	fmt.Printf("用户: 你好，你还记得我吗？\n")
	fmt.Printf("AI: %s\n", response4.Content)

	// 6. 列出所有会话
	fmt.Println("\n--- 所有会话 ---")
	sessions, err := client.ListSessions()
	if err != nil {
		log.Printf("列出会话失败: %v", err)
	} else {
		fmt.Printf("总共有 %d 个会话:\n", len(sessions))
		for _, session := range sessions {
			info, _ := client.GetSessionInfo(session)
			if info != nil {
				fmt.Printf("- %s (%d条消息) - %s\n", session, info.MessageCount, info.FirstMessage)
			}
		}
	}
}

// StreamContextExample 流式对话上下文示例
func StreamContextExample() {
	storage := NewMemoryContextStorage(30)
	client := NewOpenAIClientWithStorage(&OpenAIConfig{
		APIKey: "your-api-key-here",
	}, storage)

	sessionID := "stream-session"
	systemPrompt := "你是一个编程助手。"

	fmt.Println("=== 流式对话上下文示例 ===")

	// 第一次流式对话
	fmt.Println("\n用户: 请解释什么是Go语言的goroutine")
	fmt.Print("AI: ")

	err := client.ChatStreamWithSessionAndSystem(sessionID, systemPrompt, "请解释什么是Go语言的goroutine", func(content string) error {
		fmt.Print(content)
		return nil
	})
	if err != nil {
		log.Printf("流式对话失败: %v", err)
		return
	}
	fmt.Println()

	// 第二次流式对话（应该记住上下文）
	fmt.Println("\n用户: 能给我一个简单的例子吗？")
	fmt.Print("AI: ")

	err = client.ChatStreamWithSession(sessionID, "能给我一个简单的例子吗？", func(content string) error {
		fmt.Print(content)
		return nil
	})
	if err != nil {
		log.Printf("流式对话失败: %v", err)
		return
	}
	fmt.Println()
}

// SessionManagementExample 会话管理示例
func SessionManagementExample() {
	storage := NewMemoryContextStorage(20)
	client := NewOpenAIClientWithStorage(&OpenAIConfig{
		APIKey: "your-api-key-here",
	}, storage)

	fmt.Println("=== 会话管理示例 ===")

	// 创建多个会话
	sessions := []string{"chat-1", "chat-2", "chat-3"}

	for _, sessionID := range sessions {
		message := fmt.Sprintf("这是会话 %s 的第一条消息", sessionID)
		_, err := client.ChatWithSession(sessionID, message)
		if err != nil {
			log.Printf("创建会话 %s 失败: %v", sessionID, err)
			continue
		}
		fmt.Printf("创建会话: %s\n", sessionID)
	}

	// 列出所有会话
	allSessions, _ := client.ListSessions()
	fmt.Printf("\n当前有 %d 个会话\n", len(allSessions))

	// 清空一个会话
	fmt.Println("\n清空会话 chat-2")
	err := client.ClearSession("chat-2")
	if err != nil {
		log.Printf("清空会话失败: %v", err)
	}

	// 删除一个会话
	fmt.Println("删除会话 chat-3")
	err = client.DeleteSession("chat-3")
	if err != nil {
		log.Printf("删除会话失败: %v", err)
	}

	// 再次列出会话
	allSessions, _ = client.ListSessions()
	fmt.Printf("\n现在有 %d 个会话\n", len(allSessions))
	for _, sessionID := range allSessions {
		info, _ := client.GetSessionInfo(sessionID)
		if info != nil {
			fmt.Printf("- %s: %d 条消息\n", sessionID, info.MessageCount)
		}
	}
}

// DatabaseStorageExample 数据库存储接口示例（您需要实现）
func DatabaseStorageExample() {
	fmt.Println("=== 数据库存储示例 ===")
	fmt.Println("您可以实现 ContextStorage 接口来使用数据库存储：")
	fmt.Println()
	fmt.Println("type DatabaseContextStorage struct {")
	fmt.Println("    db *sql.DB // 或者其他数据库连接")
	fmt.Println("}")
	fmt.Println()
	fmt.Println("func (d *DatabaseContextStorage) SaveMessage(sessionID string, message Message) error {")
	fmt.Println("    // 实现数据库保存逻辑")
	fmt.Println("    return nil")
	fmt.Println("}")
	fmt.Println()
	fmt.Println("func (d *DatabaseContextStorage) LoadMessages(sessionID string) ([]Message, error) {")
	fmt.Println("    // 实现数据库加载逻辑")
	fmt.Println("    return nil, nil")
	fmt.Println("}")
	fmt.Println()
	fmt.Println("// ... 实现其他方法")
	fmt.Println()
	fmt.Println("然后这样使用：")
	fmt.Println("dbStorage := &DatabaseContextStorage{db: yourDB}")
	fmt.Println("client := NewOpenAIClientWithStorage(config, dbStorage)")
}

// MemoryStorageDetailsExample 内存存储详细示例
func MemoryStorageDetailsExample() {
	fmt.Println("=== 内存存储详细示例 ===")

	// 创建限制消息数量的存储
	storage := NewMemoryContextStorage(5) // 每个会话最多5条消息

	client := NewOpenAIClientWithStorage(&OpenAIConfig{
		APIKey: "your-api-key-here",
	}, storage)

	sessionID := "test-session"

	// 连续发送多条消息，测试消息限制
	messages := []string{
		"第1条消息",
		"第2条消息",
		"第3条消息",
		"第4条消息",
		"第5条消息",
		"第6条消息", // 这条消息会导致最早的消息被清理
		"第7条消息",
	}

	for i, msg := range messages {
		fmt.Printf("\n发送第 %d 条消息: %s\n", i+1, msg)

		_, err := client.ChatWithSession(sessionID, msg)
		if err != nil {
			log.Printf("发送消息失败: %v", err)
			continue
		}

		// 查看当前存储的消息数量
		sessionMessages, _ := client.GetSessionMessages(sessionID)
		fmt.Printf("当前存储消息数量: %d\n", len(sessionMessages))

		if len(sessionMessages) > 10 { // 避免输出太多
			fmt.Println("消息太多，只显示前3条和后3条:")
			for j := 0; j < 3 && j < len(sessionMessages); j++ {
				fmt.Printf("  %d. [%s] %s\n", j+1, sessionMessages[j].Role, sessionMessages[j].Content)
			}
			if len(sessionMessages) > 6 {
				fmt.Println("  ...")
			}
			for j := len(sessionMessages) - 3; j < len(sessionMessages); j++ {
				if j >= 3 {
					fmt.Printf("  %d. [%s] %s\n", j+1, sessionMessages[j].Role, sessionMessages[j].Content)
				}
			}
		} else {
			for j, sessionMsg := range sessionMessages {
				fmt.Printf("  %d. [%s] %s\n", j+1, sessionMsg.Role, sessionMsg.Content)
			}
		}
	}
}
