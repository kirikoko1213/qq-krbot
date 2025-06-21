package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRouter(r *gin.Engine) {
	r.POST("/ping", Ping)
	r.POST("/api/bot", Bot)
	r.StaticFS("/photo", http.Dir("./photo"))

	configAPI := NewConfigAPI()
	r.GET("/api/config/get", configAPI.Get)
	r.POST("/api/config/set", configAPI.Set)
	r.GET("/api/config/list", configAPI.List)
	r.POST("/api/config/remove", configAPI.Remove)

	aiAPI := NewAiAPI()
	r.POST("/api/ai/clear-setting-cache", aiAPI.ClearAISettingCache)

	dynamicTriggerAPI := NewDynamicTriggerAPI()
	r.GET("/api/dynamic-trigger/list", dynamicTriggerAPI.List)
	r.POST("/api/dynamic-trigger/save", dynamicTriggerAPI.Save)
	r.POST("/api/dynamic-trigger/delete", dynamicTriggerAPI.Delete)
	r.GET("/api/dynamic-trigger/find", dynamicTriggerAPI.Find)
	r.GET("/api/dynamic-trigger/get-functions", dynamicTriggerAPI.GetFunctions)

	groupAPI := NewGroupAPI()
	r.GET("/api/group/list", groupAPI.GetGroupList)
	r.GET("/api/group/:groupId/members", groupAPI.GetMemberList)
	r.POST("/api/group/member/alias", groupAPI.UpdateMemberAlias)
}
