package api

import (
	"github.com/gin-gonic/gin"
	"github.com/kiririx/krutils/convertx"
	"qq-krbot/repo"
)

type DynamicTriggerAPI struct{}

func NewDynamicTriggerAPI() *DynamicTriggerAPI {
	return &DynamicTriggerAPI{}
}

func (api *DynamicTriggerAPI) List(c *gin.Context) {
	rp := repo.NewDynamicTriggerRepo()
	list, err := rp.FindList(&repo.DynamicTriggerModel{})
	if err != nil {
		return
	}
	ResultSuccess(c, list)
}

func (api *DynamicTriggerAPI) Save(c *gin.Context) {
	rp := repo.NewDynamicTriggerRepo()
	req := &repo.DynamicTriggerModel{}
	if err := c.ShouldBindJSON(req); err != nil {
		ResultError(c, "400", err)
		return
	}
	_, err := rp.Save(req)
	if err != nil {
		ResultError(c, "500", err)
		return
	}
	ResultSuccess(c, nil)
}

func (api *DynamicTriggerAPI) Delete(c *gin.Context) {
	rp := repo.NewDynamicTriggerRepo()
	params := make(map[string]int64)
	err := c.ShouldBindJSON(&params)
	if err != nil {
		return
	}
	err = rp.Delete(params["id"])
	if err != nil {
		ResultError(c, "500", err)
		return
	}
	ResultSuccess(c, nil)
}

func (api *DynamicTriggerAPI) Find(c *gin.Context) {
	rp := repo.NewDynamicTriggerRepo()
	id := c.Query("id")
	model, err := rp.FindOne(convertx.StringToInt64(id))
	if err != nil {
		ResultError(c, "500", err)
		return
	}
	ResultSuccess(c, model)
}
