package trigger

import (
	"qq-krbot/helper"
	"qq-krbot/model"
	"qq-krbot/trigger/resp"

	"github.com/kiririx/krutils/ut"
)

var (
	Triggers        []Trigger
	DynamicTriggers []Trigger
)

const Master = "master" // 机器人主人身份，处理一些特殊数据，如密码管理

type Trigger struct {
	Scene     model.Scene
	Condition func(*model.TriggerParameter) bool
	Callback  func(*model.TriggerParameter) (string, error)
}

// IsMatchScene 判断是否匹配场景 todo
func (t *Trigger) IsMatchScene(param *model.EngineParam) bool {
	if ut.String().Contains(param.RawMessage, "[CQ:at,") {
		// 提取消息中@的qq号
		qqAccount, err := helper.ExtractQQ(param.RawMessage)
		if err != nil {
			return false
		}
		if qqAccount == param.UserId {
			return t.Scene == model.SceneAtMe
		}
		return t.Scene == model.SceneAtOther
	}
	return t.Scene == model.ScenePr
}

func addTrigger(scene model.Scene, condition func(*model.TriggerParameter) bool, callback func(*model.TriggerParameter) (string, error)) {
	Triggers = append(Triggers, Trigger{
		Scene:     scene,
		Condition: condition,
		Callback:  callback,
	})
}

func addDynamicTrigger(scene model.Scene, condition func(*model.TriggerParameter) bool, callback func(*model.TriggerParameter) (string, error)) {
	DynamicTriggers = append(DynamicTriggers, Trigger{
		Scene:     scene,
		Condition: condition,
		Callback:  callback,
	})
}

func ResetTriggers() {
	// 添加来自数据库的trigger
	clear(DynamicTriggers)
	resp.NewDynamicTriggerHandler().RegisterTriggers(addDynamicTrigger)
}

func init() {
	addTrigger(model.ScenePr, Help, resp.Help)                                 // 帮助
	addTrigger(model.SceneAtMe, Help, resp.Help)                               // 帮助
	addTrigger(model.ScenePr, Health, resp.Health)                             // ping
	addTrigger(model.SceneAtMe, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce) // 下班时间
	addTrigger(model.SceneGr, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce)   // 下班时间
	addTrigger(model.SceneAtMe, HolidayAnnounce, resp.HolidayAnnounce)         // 假期倒计时
	addTrigger(model.SceneAtMe, AISetting, resp.AISetting)                     // ai角色设置
	addTrigger(model.SceneAtMe, GroupChat, resp.GroupChat)
	addTrigger(model.SceneGr, Repeat, resp.Repeat)
	addTrigger(model.SceneGr, SmartReply, resp.SmartReply)
	ResetTriggers()
}
