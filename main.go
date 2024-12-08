package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"qq-krbot/api"
	"qq-krbot/env"
	"qq-krbot/work"
)

func main() {
	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	r.POST("/ping", api.Ping)
	r.POST("/api/bot", api.Bot)
	r.StaticFS("/photo", http.Dir("./photo"))
	_ = r.Run(":" + env.Get("serve.port"))
}
