package trigger

type DynamicTriggerModel struct {
	triggerType        string // at pr gr
	conditionType      string // equal contains startWith endWith handler
	triggerContentType string // text image ai
	triggerContent     string // 触发内容
	sequence           int64  // 执行顺序
}
