package kr_mcp

import (
	"log"

	"qq-krbot/handler/mcp/mcp_tools"

	"github.com/mark3labs/mcp-go/server"
)

// doc：https://github.com/mark3labs/mcp-go/blob/main/examples/everything/main.go
type ToolName string

const (
	ECHO                   ToolName = "echo"
	ADD                    ToolName = "add"
	LONG_RUNNING_OPERATION ToolName = "longRunningOperation"
	SAMPLE_LLM             ToolName = "sampleLLM"
	GET_TINY_IMAGE         ToolName = "getTinyImage"
)

type PromptName string

const (
	SIMPLE  PromptName = "simple_prompt"
	COMPLEX PromptName = "complex_prompt"
)

func NewMCPServer() *server.MCPServer {
	mcpServer := server.NewMCPServer(
		"qq-mcp-server",
		"1.0.0",
		server.WithResourceCapabilities(true, true),
		server.WithPromptCapabilities(true),
		server.WithLogging(),
	)

	mcpServer.AddTool(mcp_tools.WeatherTool())
	mcpServer.AddTool(mcp_tools.DnfGoldTool())
	mcpServer.AddTool(mcp_tools.QQGroupMessageRankTool())
	return mcpServer
}

func RunSSEMCPServer() {
	go func() {
		mcpServer := NewMCPServer()
		sseServer := server.NewSSEServer(mcpServer, server.WithBaseURL("http://localhost:3001"))
		log.Printf("SSE server listening on :3001")
		if err := sseServer.Start(":3001"); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()
}
