package api

import "github.com/gin-gonic/gin"

type DynamicTriggerAPI struct{}

func NewDynamicTriggerAPI() *DynamicTriggerAPI {
	return &DynamicTriggerAPI{}
}

func (api *DynamicTriggerAPI) List(c *gin.Context) {

}
