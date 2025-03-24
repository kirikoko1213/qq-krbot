package ai_handler

import (
	"context"
	kr_mcp "qq-krbot/handler/mcp"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/shared"
)

func getMCPTools() ([]openai.ChatCompletionToolParam, error) {
	mcpTools := make([]openai.ChatCompletionToolParam, 0)
	// 请求 MCP 获取工具
	tools, err := kr_mcp.SSEMCPClient().ListTools(context.Background(), mcp.ListToolsRequest{})
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
