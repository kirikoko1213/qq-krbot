package main

import (
	"github.com/gin-gonic/gin"
	"qq-krbot/api"
	"qq-krbot/env"
	"qq-krbot/work"
)

func main() {
	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	api.RegisterRouter(r)
	_ = r.Run(":" + env.Get("serve.port"))
}
