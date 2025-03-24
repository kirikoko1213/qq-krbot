package ai_handler

import (
	"qq-krbot/env"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

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
