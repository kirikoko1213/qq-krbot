package ai_handler

import (
	"fmt"
	"log"
	"qq-krbot/agent"
	"qq-krbot/env"
	bot_handler "qq-krbot/handler/bot_engine"
	lg "qq-krbot/logx"
	"qq-krbot/model"
	"strings"
	"time"

	"github.com/kiririx/krutils/ut"
	"github.com/tidwall/gjson"
)

var agentCfg = &agent.OpenAIConfig{
	APIKey:  env.Get("chatgpt.key"),
	BaseURL: env.Get("chatgpt.server.url"),
	Model:   env.Get("chatgpt.model"),
	Timeout: time.Duration(ut.Convert(env.Get("chatgpt.timeout")).Int64Value()) * time.Second,
}

var client *agent.OpenAIClient

func init() {
	storage := agent.NewMemoryContextStorage(50) // 最多存储50条消息

	mcpManager := agent.NewMCPManager(&agent.MCPConfig{
		URL:           "http://localhost:" + env.Get("mcp.sse.port"),
		EnableLogging: true,
		LogToolCalls:  true,
	})

	// 2. 连接MCP
	err := mcpManager.Connect()
	if err != nil {
		log.Printf("连接MCP失败: %v", err)
		return
	}
	client = agent.NewOpenAIClientWithAll(agentCfg, storage, mcpManager)
}

type _AIHandler struct {
}

var AIHandler = &_AIHandler{}

func getAIRulePrompt(qqAccount int64, groupId int64) string {
	l1 := env.Get(env.AITalkPrompts())
	index := 1
	if l1 != "" {
		l1 = fmt.Sprintf("%d. (必须遵守):%s;\n", index, l1)
		index++
	}
	l2 := env.Get(env.AITalkGroupPrompts(groupId))
	if l2 != "" {
		l2 = fmt.Sprintf("%d. (必须遵守):%s;\n", index, l2)
		index++
	}
	l3 := env.Get(env.AITalkGroupAndUserPrompts(groupId, qqAccount))
	if l3 != "" {
		l3 = fmt.Sprintf("%d. (尽量遵守):%s;\n", index, l3)
		index++
	}
	return l1 + l2 + l3
}

func (*_AIHandler) GetSystemPrompt(param *model.EngineParam) string {
	systemPrompt := "**背景信息**\n"
	// 当前时间
	systemPrompt += fmt.Sprintf("- 当前时间：%s\n", time.Now().Format("2006-01-02 15:04:05"))
	// 当前区域
	systemPrompt += fmt.Sprintf("- 当前区域：%s\n", "中国")
	systemPrompt += "\n\n"
	// 规则
	systemPrompt += "**规则**\n"
	systemPrompt += getAIRulePrompt(param.UserId, param.GroupId)
	return systemPrompt
}

func (*_AIHandler) ClearSetting(param *model.EngineParam) {

}

func (*_AIHandler) SingleTalk(prompts, message string) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	timeout := env.Get("chatgpt.timeout")
	proxyURL := env.Get("proxy.url")
	cli := ut.HttpClient()
	if proxyURL != "" {
		cli.Proxy(proxyURL)
	}
	apiServerURL := env.Get("chatgpt.server.url")
	if apiServerURL == "" {
		apiServerURL = "https://api.openai.com"
	}

	messageArr := make([]map[string]string, 0)
	messageArr = append(messageArr, map[string]string{"role": "system", "content": prompts})
	messageArr = append(messageArr, map[string]string{"role": "user", "content": message})
	json, err := cli.Timeout(time.Second*time.Duration(ut.Convert(timeout).Int64Value())).Headers(map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + env.Get("chatgpt.key"),
	}).PostString(apiServerURL+"/v1/chat/completions", map[string]any{
		"model":       env.Get("chatgpt.model"),
		"messages":    messageArr,
		"temperature": 0.7,
	})
	if err != nil {
		return "", err
	}
	content := gjson.Get(json, "choices.0.message.content").String()
	if content == "" {
		lg.Log.WithField("AI-response: ", json).Error("AI 回复为空")
	}
	return strings.TrimSpace(content), nil
}

func (a *_AIHandler) GroupChat(param *model.EngineParam) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	// 获取群成员信息
	memberInfo, err := bot_handler.OneBotHandler.GetGroupMemberInfo(param.GroupId, param.UserId, false)
	if err != nil {
		return "", err
	}
	readySendMessage := fmt.Sprintf("发送人: %s 发送内容: %s", memberInfo.Card, param.GetTextMessage())

	// 会话ID
	sessionID := fmt.Sprintf("%d_%d", param.GroupId, param.UserId)
	systemPrompt := a.GetSystemPrompt(param)

	response, err := client.ChatWithToolsSessionAndSystem(sessionID, systemPrompt, readySendMessage)
	if err != nil {
		return "", err
	}
	return response.Content, nil
}
