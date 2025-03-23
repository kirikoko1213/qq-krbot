package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"qq-krbot/qqutil"
	"qq-krbot/req"
	"strings"
	"time"

	"github.com/kiririx/krutils/ut"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/shared"
	"github.com/tidwall/gjson"
)

var messageMap = make(map[int64]*[]map[string]string)

var getRoleMap = func(qqAccount int64, groupId int64) map[string]string {
	return map[string]string{"role": "system", "content": GetAISetting(qqAccount, groupId)}
}

func GetAISetting(qqAccount int64, groupId int64) string {
	l1 := env.Get(env.AITalkPrompts())
	if l1 != "" {
		l1 = "1. (必须遵守):" + l1 + ";\n"
	}
	l2 := env.Get(env.AITalkGroupPrompts(groupId))
	if l2 != "" {
		l2 = "2. (必须遵守):" + l2 + ";\n"
	}
	l3 := env.Get(env.AITalkGroupAndUserPrompts(groupId, qqAccount))
	if l3 != "" {
		l3 = "3. (尽量遵守):" + l3 + ";\n"
	}
	return l1 + l2 + l3
}

type _AIHandler struct {
}

var AIHandler = &_AIHandler{}

var memStorage = &MemoryStorage{}
var dbStorage = &DbStorage{}

func getStorage() Storage {
	if env.Get("storage.engine") == "db" {
		return memStorage
	} else {
		// todo dbStorage
		return memStorage
	}
}

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

var openaiClient *openai.Client

func init() {
	apiServerURL := env.Get("chatgpt.server.url")
	if apiServerURL == "" {
		apiServerURL = "https://api.openai.com/v1"
	}
	c := openai.NewClient(
		option.WithAPIKey(env.Get("chatgpt.key")),
		option.WithBaseURL(apiServerURL),
	)
	openaiClient = &c
}

func (*_AIHandler) Do(param *req.Param) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	storage := getStorage()
	// 获取群成员信息
	memberInfo, err := OneBotHandler.GetGroupMemberInfo(param.GroupId, param.UserId, false)
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

func getMCPTools() ([]openai.ChatCompletionToolParam, error) {
	mcpTools := make([]openai.ChatCompletionToolParam, 0)
	// 请求 MCP 获取工具
	tools, err := MCPClient().ListTools(context.Background(), mcp.ListToolsRequest{})
	if err != nil {
		return nil, err
	}
	for _, tool := range tools.Tools {
		funcParam := shared.FunctionDefinitionParam{
			Name:        tool.Name,
			Description: param.NewOpt(tool.Description),
		}
		if tool.InputSchema.Properties != nil {
			funcParam.Parameters = map[string]any{
				"type":       "object",
				"properties": tool.InputSchema.Properties,
				"required":   tool.InputSchema.Required,
			}
		}
		mcpTools = append(mcpTools, openai.ChatCompletionToolParam{
			Type:     "function",
			Function: funcParam,
		})
	}
	return mcpTools, nil
}

func convertMessageArrToOpenAI(messageArr []map[string]string) []openai.ChatCompletionMessageParamUnion {
	openaiMessageArr := make([]openai.ChatCompletionMessageParamUnion, 0)
	for _, message := range messageArr {
		if message["role"] == "user" {
			openaiMessageArr = append(openaiMessageArr, openai.UserMessage(message["content"]))
		} else if message["role"] == "assistant" {
			openaiMessageArr = append(openaiMessageArr, openai.AssistantMessage(message["content"]))
		} else if message["role"] == "system" {
			openaiMessageArr = append(openaiMessageArr, openai.SystemMessage(message["content"]))
		}
	}
	return openaiMessageArr
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
			result, err := MCPClient().CallTool(context.Background(), mcp.CallToolRequest{
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

type Storage interface {
	Push(roleType string, groupId, qqAccount int64, content string) error
	GetArray(groupId, qqAccount int64) (*[]map[string]string, error)
	GetArrayWithNewContent(roleType string, groupId, qqAccount int64, content string) ([]map[string]string, error)
	Clear(groupId, qqAccount int64) error
}

type MemoryStorage struct {
}

func (m *MemoryStorage) Push(roleType string, groupId, qqAccount int64, content string) error {
	userMessageArr, err := m.GetArray(groupId, qqAccount)
	if err != nil {
		return err
	}
	*userMessageArr = append(*userMessageArr, map[string]string{"role": roleType, "content": content})
	if len(*userMessageArr) == 16 {
		*userMessageArr = (*userMessageArr)[4:]
		*userMessageArr = append([]map[string]string{getRoleMap(qqAccount, groupId)}, *userMessageArr...)
	}
	return nil
}

func (m *MemoryStorage) GetArray(groupId, qqAccount int64) (*[]map[string]string, error) {
	userMessageArr := messageMap[groupId+qqAccount]
	if userMessageArr == nil {
		userMessageArr = &[]map[string]string{}
		*userMessageArr = append(*userMessageArr, getRoleMap(qqAccount, groupId))
		messageMap[groupId+qqAccount] = userMessageArr
	}
	return userMessageArr, nil
}

func (m *MemoryStorage) GetArrayWithNewContent(roleType string, groupId, qqAccount int64, content string) ([]map[string]string, error) {
	arr, err := m.GetArray(groupId, qqAccount)
	if err != nil {
		return nil, err
	}
	newContent := map[string]string{"role": roleType, "content": content}
	return qqutil.AppendValue(*arr, newContent), nil
}

func (m *MemoryStorage) Clear(groupId, qqAccount int64) error {
	// delete(messageMap, groupId+qqAccount)
	// if qqAccount == 0 && groupId == 0 {
	// 	clear(messageMap)
	// } else if qqAccount == 0 {
	// 	for k := range messageMap {
	// 		// todo 这里需要处理, 因为key是通过整型相加, 而不是字符串相加
	// 		if strings.Contains(strconv.FormatInt(k, 10), strconv.FormatInt(groupId, 10)) {
	// 			delete(messageMap, k)
	// 		}
	// 	}
	// }
	clear(messageMap)
	return nil
}

type DbStorage struct{}

func (m *DbStorage) Push(roleType string, qqAccount int64, content string) error {
	return nil
}

func (m *DbStorage) GetArray(qqAccount int64) (*[]map[string]string, error) {
	return nil, nil
}

func (m *DbStorage) GetArrayWithNewContent(roleType string, qqAccount int64, content string) ([]map[string]string, error) {
	return nil, nil
}
