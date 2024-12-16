package api

import (
	"github.com/gin-gonic/gin"
	"qq-krbot/env"
)

type ConfigAPI struct{}

func NewConfigAPI() *ConfigAPI {
	return &ConfigAPI{}
}

func (*ConfigAPI) List(c *gin.Context) {
	var list []map[string]string
	for _, item := range env.List() {
		list = append(list, map[string]string{
			"key":   item.Key,
			"value": item.Value,
		})
	}
	ResultSuccess(c, list)
}

func (*ConfigAPI) Get(c *gin.Context) {
	key := c.Query("key")

	ResultSuccess(c, gin.H{
		"key":   key,
		"value": env.Get(key),
	})
}

func (*ConfigAPI) Set(c *gin.Context) {
	req := &SetConfigReq{}
	err := c.ShouldBindJSON(req)
	if err != nil {
		ResultError(c, "00001", err)
		return
	}
	env.SetWithDB(req.Key, req.Value)
	ResultSuccess(c, gin.H{
		"name":  req.Key,
		"value": req.Value,
	})
}

func (*ConfigAPI) Remove(c *gin.Context) {
	req := &RemoveConfigReq{}
	err := c.ShouldBindJSON(req)
	if err != nil {
		ResultError(c, "00002", err)
		return
	}
	env.DbEnv.Remove(req.Key)
	ResultSuccess(c, gin.H{})
}

type SetConfigReq struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type RemoveConfigReq struct {
	Key string `json:"key"`
}
