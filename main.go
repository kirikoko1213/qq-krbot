package main

import (
	"log"
	"qq-krbot/api"
	"qq-krbot/env"
	kr_mcp "qq-krbot/handler/mcp"
	"qq-krbot/repo"
	"qq-krbot/work"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化 Redis
	if err := repo.InitRedis(); err != nil {
		log.Fatalf("Redis 初始化失败: %v", err)
	}

	// 初始化 SSE MCP 服务端
	kr_mcp.RunSSEMCPServer()
	// 初始化 SSE MCP 客户端
	kr_mcp.InitSSEMCPClient()

	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	api.RegisterRouter(r)
	_ = r.Run(":" + env.Get("serve.port"))
}
