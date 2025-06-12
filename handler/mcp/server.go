package kr_mcp

import (
	"log"
	"qq-krbot/env"

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

	return mcpServer
}

func RunSSEMCPServer() {
	go func() {
		mcpServer := NewMCPServer()
		port := env.Get("mcp.sse.port")
		sseServer := server.NewSSEServer(mcpServer, server.WithBaseURL("http://localhost:"+port))
		log.Printf("SSE server listening on :%s", port)
		if err := sseServer.Start(":" + port); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()
}
