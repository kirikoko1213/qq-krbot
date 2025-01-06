package main

import (
	"embed"
	"github.com/gin-gonic/gin"
	"net/http"
	"qq-krbot/api"
	"qq-krbot/env"
	"qq-krbot/work"
)

//go:embed manage-board/dist/*
var staticFiles embed.FS

func main() {
	work.Boardcast()
	r := gin.Default()
	r.Use(gin.Recovery())
	api.RegisterRouter(r)

	// 提供静态文件服务
	// 利用 gin 的 StaticFS 方法提供静态文件
	staticFS := http.FS(staticFiles)
	r.StaticFS("/static", staticFS)

	// 处理所有其他请求，重定向到index.html
	r.NoRoute(func(c *gin.Context) {
		c.FileFromFS("manage-board/dist/index.html", staticFS)
	})

	_ = r.Run(":" + env.Get("serve.port"))
}
