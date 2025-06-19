package trigger

import (
	"qq-krbot/model"
	"qq-krbot/trigger/resp"
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
