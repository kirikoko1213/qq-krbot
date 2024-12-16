package api

import (
	"github.com/gin-gonic/gin"
)

func ResultSuccess(c *gin.Context, data any) {
	c.JSON(200, gin.H{
		"data":   data,
		"status": "success",
	})
}

func ResultError(c *gin.Context, code string, err error) {
	c.JSON(200, gin.H{
		"msg":    err.Error(),
		"status": "error",
		"code":   code,
	})
}
