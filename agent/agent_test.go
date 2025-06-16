package agent

import (
	"fmt"
	"testing"
)

var (
	apiKey   = ""
	endPoint = "https://dashscope.aliyuncs.com/compatible-mode/v1"
)

func TestOpenAIClient_ChatWithSystem(t *testing.T) {
	fmt.Println("apiKey", apiKey, "endPoint", endPoint)
	config := &OpenAIConfig{
		APIKey:  apiKey,
		BaseURL: endPoint,
		Model:   "qwen-max-latest",
	}
	ContextExamples(config)
}
