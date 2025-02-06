package main

import (
	"log"
	"qq-krbot/api"
	"qq-krbot/env"
	"qq-krbot/repo"
	"qq-krbot/work"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化 Redis
	if err := repo.InitRedis(); err != nil {
		log.Fatalf("Redis 初始化失败: %v", err)
	}

	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	api.RegisterRouter(r)
	_ = r.Run(":" + env.Get("serve.port"))
}
