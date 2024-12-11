package api

import (
	"github.com/gin-gonic/gin"
	"qq-krbot/env"
)

type ConfigAPI struct{}

func NewConfigAPI() *ConfigAPI {
	return &ConfigAPI{}
}

func (*ConfigAPI) Get(c *gin.Context) {
	key := c.Query("key")
	mode := c.Query("mode")

	c.JSON(200, gin.H{
		"key":   key,
		"value": env.GetWithMode(mode, key),
	})
}

func (*ConfigAPI) Set(c *gin.Context) {
	req := &SetConfigReq{}
	err := c.ShouldBindJSON(req)
	if err != nil {
		c.JSON(500, gin.H{
			"message": err.Error(),
		})
		return
	}
	env.SetWithMode(req.Mode, req.Key, req.Value)
	c.JSON(200, gin.H{
		"key":   req.Key,
		"value": req.Value,
	})
}

type SetConfigReq struct {
	Key   string   `json:"key"`
	Value string   `json:"value"`
	Mode  env.Mode `json:"mode"`
}
