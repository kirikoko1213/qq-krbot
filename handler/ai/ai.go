package ai_handler

import (
	"context"
	"encoding/json"
	"fmt"
	"qq-krbot/env"
	bot_handler "qq-krbot/handler/bot_engine"
	kr_mcp "qq-krbot/handler/mcp"
	lg "qq-krbot/logx"
	"qq-krbot/req"
	"strings"
	"time"

	"github.com/kiririx/krutils/ut"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/tidwall/gjson"
)

var messageMap = make(map[int64]*[]map[string]string)

var getRoleMap = func(qqAccount int64, groupId int64) map[string]string {
	return map[string]string{"role": "system", "content": getAISetting(qqAccount, groupId)}
}

type _AIHandler struct {
}

var AIHandler = &_AIHandler{}

func (*_AIHandler) ClearSetting(param *req.Param) {
	storage := getStorage()
	_ = storage.Clear(param.GroupId, param.UserId)
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

func (*_AIHandler) Do(param *req.Param) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	storage := getStorage()
	// 获取群成员信息
	memberInfo, err := bot_handler.OneBotHandler.GetGroupMemberInfo(param.GroupId, param.UserId, false)
	if err != nil {
		return "", err
	}
	readySendMessage := fmt.Sprintf("[%s] %s", memberInfo.Card, param.KrMessage)
	messageArr, err := storage.GetArrayWithNewContent("user", param.GroupId, param.UserId, readySendMessage)
	if err != nil {
		return "", err
	}

	// 定义消息
	openaiMessageArr := convertMessageArrToOpenAI(messageArr)
	// 调用 MCP 获取工具
	mcpTools, err := getMCPTools()
	if err != nil {
		return "", err
	}
	// 调用 OpenAI API 生成回复
	chatCompletion, err := openaiClient.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
		Messages: openaiMessageArr,
		Model:    env.Get("chatgpt.model"),
		Tools:    mcpTools,
	})
	if err != nil {
		return "", err
	}
	if len(chatCompletion.Choices[0].Message.ToolCalls) > 0 {
		// 调用 MCP 执行工具
		var err error
		chatCompletion, err = handleToolCalls(chatCompletion, openaiMessageArr, mcpTools)
		if err != nil {
			return "", err
		}
	}
	content := chatCompletion.Choices[0].Message.Content
	if content == "" {
		lg.Log.WithField("AI-response: ", chatCompletion).Error("AI 回复为空")
	}

	err = storage.Push("user", param.GroupId, param.UserId, readySendMessage)
	if err != nil {
		return "", err
	}

	err = storage.Push("assistant", param.GroupId, param.UserId, content)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(content), err
}

func handleToolCalls(chatCompletion *openai.ChatCompletion, openaiMessageArr []openai.ChatCompletionMessageParamUnion, mcpTools []openai.ChatCompletionToolParam) (*openai.ChatCompletion, error) {
	innerChatCompletion := *chatCompletion
	innerChatCompletionPtr := &innerChatCompletion
	var toolCallMessages []openai.ChatCompletionMessageParamUnion
	toolCallMessages = append(toolCallMessages, openaiMessageArr...)
	// 调用工具次数限制
	invokeCount := 0
	for {
		invokeCount++
		// 调用次数限制, 防止无限调用
		if invokeCount >= 10 {
			break
		}
		toolCalls := innerChatCompletionPtr.Choices[0].Message.ToolCalls
		if len(toolCalls) == 0 {
			break
		}
		// 添加assistant的回复（包含tool_calls）
		assistantMessage := openai.AssistantMessage(innerChatCompletionPtr.Choices[0].Message.Content)
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

		for _, toolCall := range toolCalls {
			var toolArgs map[string]interface{}
			err := json.Unmarshal([]byte(toolCall.Function.Arguments), &toolArgs)
			if err != nil {
				return nil, err
			}

			lg.Log.WithField("tool_name", toolCall.Function.Name).WithField("tool_args", toolArgs).Info("调用工具")
			result, err := kr_mcp.SSEMCPClient().CallTool(context.Background(), mcp.CallToolRequest{
				Params: struct {
					Name      string                 `json:"name"`
					Arguments map[string]interface{} `json:"arguments,omitempty"`
					Meta      *struct {
						ProgressToken mcp.ProgressToken `json:"progressToken,omitempty"`
					} `json:"_meta,omitempty"`
				}{
					Name:      toolCall.Function.Name,
					Arguments: toolArgs,
				},
			})
			if err != nil {
				return nil, err
			}
			toolCallMessages = append(toolCallMessages, openai.ToolMessage(result.Content[0].(mcp.TextContent).Text, toolCall.ID))
		}

		var err error
		innerChatCompletionPtr, err = openaiClient.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
			Messages: toolCallMessages,
			Model:    env.Get("chatgpt.model"),
			Tools:    mcpTools,
		})
		if err != nil {
			return nil, err
		}
	}
	return innerChatCompletionPtr, nil
}
