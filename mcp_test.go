package main

import (
	"context"
	"log"
	kr_mcp "qq-krbot/handler/mcp"
	"qq-krbot/repo"
	"testing"

	"github.com/mark3labs/mcp-go/mcp"
)

func TestMCP(t *testing.T) {
	// 初始化 Redis
	if err := repo.InitRedis(); err != nil {
		log.Fatalf("Redis 初始化失败: %v", err)
	}
	kr_mcp.RunSSEMCPServer()
	kr_mcp.InitSSEMCPClient()
	tools, err := kr_mcp.SSEMCPClient().ListTools(context.Background(), mcp.ListToolsRequest{})
	if err != nil {
		t.Fatal(err)
	}
	t.Log(tools)
}
