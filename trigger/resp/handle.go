package resp

import (
	lg "qq-krbot/logx"
	"qq-krbot/model"
	"qq-krbot/repo"
	"strings"

	"github.com/kiririx/krutils/ut"
)

func GetCondition(tdm *repo.DynamicTriggerModel) func(*model.TriggerParameter) bool {
	switch tdm.ConditionType {
	case "equals":
		return func(param *model.TriggerParameter) bool {
			return ut.String().In(strings.TrimSpace(param.CqParam.GetTextMessage()), tdm.ConditionValue)
		}

	case "contains":
		return func(param *model.TriggerParameter) bool {
			return ut.String().Contains(param.CqParam.GetTextMessage(), tdm.ConditionValue)
		}

	case "startsWith":
		return func(param *model.TriggerParameter) bool {
			return ut.String().StartWith(param.CqParam.GetTextMessage(), tdm.ConditionValue)
		}
	case "endsWith":
		return func(param *model.TriggerParameter) bool {
			return ut.String().EndWith(param.CqParam.GetTextMessage(), tdm.ConditionValue)
		}
	}
	panic("不存在的conditionType")
}

func GetCallback(tdm *repo.DynamicTriggerModel) func(*model.TriggerParameter) (string, error) {
	switch tdm.TriggerContentType {
	case "text":
		return func(param *model.TriggerParameter) (string, error) {
			return tdm.TriggerContent, nil
		}
	case "api":
		return func(param *model.TriggerParameter) (string, error) {
			return tdm.TriggerContent, nil
		}
	case "image":
		return func(param *model.TriggerParameter) (string, error) {
			return tdm.TriggerContent, nil
		}
	case "handler":
		return GetHandler(tdm.TriggerContent).Func
	}
	panic("不存在的triggerContentType")
}

type DynamicTriggerHandler struct{}

func NewDynamicTriggerHandler() *DynamicTriggerHandler {
	return &DynamicTriggerHandler{}
}

func (m *DynamicTriggerHandler) RegisterTriggers(f func(scene model.Scene, condition func(*model.TriggerParameter) bool, callback func(*model.TriggerParameter) (string, error))) {
	dtRepo := repo.NewDynamicTriggerRepo()
	list, err := dtRepo.FindList(&repo.DynamicTriggerModel{})
	if err != nil {
		lg.Log.Error(err)
		return
	}
	for _, item := range list {
		f(item.Scene, GetCondition(&item), GetCallback(&item))
	}
}
