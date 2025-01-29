package main

import (
	"qq-krbot/api"
	"qq-krbot/env"
	"qq-krbot/work"

	"github.com/gin-gonic/gin"
)

func main() {
	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	api.RegisterRouter(r)
	_ = r.Run(":" + env.Get("serve.port"))
}
