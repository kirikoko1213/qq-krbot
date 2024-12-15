package handler

import (
	"github.com/kiririx/krutils/strx"
	lg "qq-krbot/logx"
	"qq-krbot/repo"
	"qq-krbot/req"
)

type DynamicTriggerHandler struct{}

func NewDynamicTriggerHandler() *DynamicTriggerHandler {
	return &DynamicTriggerHandler{}
}

func getCondition(model *repo.DynamicTriggerModel) func(*req.TriggerParameter) bool {
	switch model.ConditionType {
	case "equals":
		return func(param *req.TriggerParameter) bool {
			return strx.Equals(strx.TrimSpace(param.CqParam.KrMessage), model.ConditionValue)
		}

	case "contains":
		return func(param *req.TriggerParameter) bool {
			return strx.Contains(param.CqParam.KrMessage, model.ConditionValue)
		}

	case "startWith":
		return func(param *req.TriggerParameter) bool {
			return strx.StartWith(param.CqParam.KrMessage, model.ConditionValue)
		}
	case "endWith":
		return func(param *req.TriggerParameter) bool {
			return strx.EndWith(param.CqParam.KrMessage, model.ConditionValue)
		}
	}
	panic("不存在的conditionType")
}

func getCallback(model *repo.DynamicTriggerModel) func(*req.TriggerParameter) (string, error) {
	switch model.TriggerContentType {
	case "text":
		return func(param *req.TriggerParameter) (string, error) {
			return model.ConditionValue, nil
		}
	case "api":
		return func(param *req.TriggerParameter) (string, error) {
			return model.ConditionValue, nil
		}
	case "image":
		return func(param *req.TriggerParameter) (string, error) {
			return model.ConditionValue, nil
		}
	case "func":
		return func(param *req.TriggerParameter) (string, error) {
			return model.ConditionValue, nil
		}
	}
	panic("不存在的triggerContentType")
}

func (m *DynamicTriggerHandler) RegisterTriggers(f func(messageType string, condition func(*req.TriggerParameter) bool, callback func(*req.TriggerParameter) (string, error))) {
	dtRepo := repo.NewDynamicTriggerRepo()
	list, err := dtRepo.FindList(&repo.DynamicTriggerModel{})
	if err != nil {
		lg.Log.Error(err)
		return
	}
	for _, model := range list {
		f(model.TriggerType, getCondition(&model), getCallback(&model))
	}
}
