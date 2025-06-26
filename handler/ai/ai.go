package ai_handler

import (
	"fmt"
	"log"
	"qq-krbot/agent"
	"qq-krbot/env"
	bot_handler "qq-krbot/handler/bot_engine"
	lg "qq-krbot/logx"
	"qq-krbot/model"
	"qq-krbot/repo"
	"strings"
	"time"

	"github.com/kiririx/krutils/ut"
)

var agentCfg = &agent.OpenAIConfig{
	APIKey:  env.Get("chatgpt.key"),
	BaseURL: env.Get("chatgpt.server.url"),
	Model:   env.Get("chatgpt.model"),
	Timeout: time.Duration(ut.Convert(env.Get("chatgpt.timeout")).Int64Value()) * time.Second,
}

var client *agent.OpenAIClient

func InitClient() {
	// 延迟 1s
	time.Sleep(time.Millisecond * 500)
	client = agent.NewOpenAIClient(agentCfg)
	storage := agent.NewMemoryContextStorage(50) // 最多存储50条消息

	mcpManager := agent.NewMCPManager(&agent.MCPConfig{
		URL:           "http://localhost:" + env.Get("mcp.sse.port"),
		EnableLogging: true,
		LogToolCalls:  true,
	})

	// 连接MCP
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
	// 约定
	systemPrompt += "**约定**\n"
	systemPrompt += "消息发送人的昵称会在 [发送人：昵称1,昵称2] 这里面，昵称1和昵称2都是发送人的昵称，可能是1个，也可能是多个。"
	return systemPrompt
}

func (*_AIHandler) ClearSetting(param *model.EngineParam) {

}

func (*_AIHandler) SingleTalk(prompts, message string) (string, error) {
	response, err := client.ChatWithSystem(prompts, message)
	if err != nil {
		return "", err
	}
	return response.Content, nil
}

func (a *_AIHandler) GroupChat(param *model.WrapperParam) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	// 获取群成员信息
	memberInfo, err := bot_handler.OneBotHandler.GetGroupMemberInfo(param.EngineParam.GroupId, param.EngineParam.UserId, false)
	if err != nil {
		return "", err
	}
	// 查询群员的别名
	alias, err := repo.NewMemberAliasRepo().FindAliasByGroupIdAndQQAccount(param.EngineParam.GroupId, param.EngineParam.UserId)
	if err != nil {
		return "", err
	}
	nickname := memberInfo.Card
	if alias != nil && len(alias) > 0 {
		nickname = strings.Join(alias, ",")
	}
	readySendMessage := fmt.Sprintf("[发送人: %s] [发送内容: %s]", nickname, param.GetTextMessage())

	// 会话ID
	sessionID := fmt.Sprintf("%d_%d", param.EngineParam.GroupId, param.EngineParam.UserId)
	systemPrompt := a.GetSystemPrompt(param.EngineParam)

	response, err := client.ChatWithToolsSessionAndSystem(sessionID, systemPrompt, readySendMessage)
	if err != nil {
		return "", err
	}
	return response.Content, nil
}
