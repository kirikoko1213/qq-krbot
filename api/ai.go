package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"qq-krbot/handler"
	"qq-krbot/req"
)

type AiAPI struct {
}

func NewAiAPI() *AiAPI {
	return &AiAPI{}
}

type ClearAISettingCacheReq struct {
	UserId  int64 `json:"user_id"`
	GroupId int64 `json:"group_id"`
}

func (receiver *AiAPI) ClearAISettingCache(c *gin.Context) {
	var req_ = ClearAISettingCacheReq{}
	err := c.ShouldBindJSON(&req_)
	if err != nil {
		return
	}
	handler.AIHandler.ClearSetting(&req.Param{
		UserId:  req_.UserId,
		GroupId: req_.GroupId,
	})
	c.JSON(http.StatusOK, gin.H{
		"message": "clear success",
	})
}
