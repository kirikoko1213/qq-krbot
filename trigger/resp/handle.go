package resp

import (
	"github.com/kiririx/krutils/ut"
	lg "qq-krbot/logx"
	"qq-krbot/repo"
	"qq-krbot/req"
	"strings"
)

func GetCondition(model *repo.DynamicTriggerModel) func(*req.TriggerParameter) bool {
	switch model.ConditionType {
	case "equals":
		return func(param *req.TriggerParameter) bool {
			return ut.String().In(strings.TrimSpace(param.CqParam.KrMessage), model.ConditionValue)
		}

	case "contains":
		return func(param *req.TriggerParameter) bool {
			return ut.String().Contains(param.CqParam.KrMessage, model.ConditionValue)
		}

	case "startsWith":
		return func(param *req.TriggerParameter) bool {
			return ut.String().StartWith(param.CqParam.KrMessage, model.ConditionValue)
		}
	case "endsWith":
		return func(param *req.TriggerParameter) bool {
			return ut.String().EndWith(param.CqParam.KrMessage, model.ConditionValue)
		}
	}
	panic("不存在的conditionType")
}

func GetCallback(model *repo.DynamicTriggerModel) func(*req.TriggerParameter) (string, error) {
	switch model.TriggerContentType {
	case "text":
		return func(param *req.TriggerParameter) (string, error) {
			return model.TriggerContent, nil
		}
	case "api":
		return func(param *req.TriggerParameter) (string, error) {
			return model.TriggerContent, nil
		}
	case "image":
		return func(param *req.TriggerParameter) (string, error) {
			return model.TriggerContent, nil
		}
	case "handler":
		return GetHandler(model.TriggerContent).Func
	}
	panic("不存在的triggerContentType")
}

type DynamicTriggerHandler struct{}

func NewDynamicTriggerHandler() *DynamicTriggerHandler {
	return &DynamicTriggerHandler{}
}

func (m *DynamicTriggerHandler) RegisterTriggers(f func(messageType string, condition func(*req.TriggerParameter) bool, callback func(*req.TriggerParameter) (string, error))) {
	dtRepo := repo.NewDynamicTriggerRepo()
	list, err := dtRepo.FindList(&repo.DynamicTriggerModel{})
	if err != nil {
		lg.Log.Error(err)
		return
	}
	for _, model := range list {
		f(model.MessageType, GetCondition(&model), GetCallback(&model))
	}
}
