package trigger

import (
	"qq-krbot/model"
	"qq-krbot/trigger/resp"

	"github.com/kiririx/krutils/ut"
)

var (
	Triggers        []Trigger
	DynamicTriggers []Trigger
)

const atMe model.Scene = "at_me"       // 群组里@我的触发器
const atOther model.Scene = "at_other" // 群组里@其他人的触发器
const pr model.Scene = "pr"            // 非群组，单人私聊时的触发器
const gr model.Scene = "gr"
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

		return t.Scene == atOther
	}
	return t.Scene == pr
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
	addTrigger(pr, Help, resp.Help)                               // 帮助
	addTrigger(at, Help, resp.Help)                               // 帮助
	addTrigger(pr, Health, resp.Health)                           // ping
	addTrigger(at, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce) // 下班时间
	addTrigger(gr, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce) // 下班时间
	addTrigger(at, HolidayAnnounce, resp.HolidayAnnounce)         // 假期倒计时
	addTrigger(at, AISetting, resp.AISetting)                     // ai角色设置
	addTrigger(at, GroupChat, resp.GroupChat)
	addTrigger(gr, Repeat, resp.Repeat)
	addTrigger(gr, SmartReply, resp.SmartReply)
	ResetTriggers()
}
