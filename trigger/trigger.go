package trigger

import (
	"qq-krbot/handler"
	"qq-krbot/req"
	"qq-krbot/trigger/resp"
)

var (
	Triggers []Trigger
)

const at = "at" // 群组里@某人的触发器
const pr = "pr" // 非群组，单人私聊时的触发器
const gr = "gr"
const Master = "master" // 机器人主人身份，处理一些特殊数据，如密码管理

type Trigger struct {
	MessageType string
	Condition   func(*req.TriggerParameter) bool
	Callback    func(*req.TriggerParameter) (string, error)
}

func addTrigger(messageType string, condition func(*req.TriggerParameter) bool, callback func(*req.TriggerParameter) (string, error)) {
	Triggers = append(Triggers, Trigger{
		MessageType: messageType,
		Condition:   condition,
		Callback:    callback,
	})
}

func init() {
	addTrigger(pr, Help, resp.Help)                               // 帮助
	addTrigger(at, Help, resp.Help)                               // 帮助
	addTrigger(pr, Health, resp.Health)                           // ping
	addTrigger(at, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce) // 下班时间
	addTrigger(gr, OffWorkTimeAnnounce, resp.OffWorkTimeAnnounce) // 下班时间
	addTrigger(at, HolidayAnnounce, resp.HolidayAnnounce)         // 假期倒计时
	addTrigger(at, AISetting, resp.AISetting)                     // ai角色设置
	addTrigger(at, RankOfGroupMsg, resp.RankOfGroupMsg)           // 群吹水排名
	addTrigger(at, MyWifeOfGroup, resp.MyWifeOfGroup)             // 群吹水排名
	addTrigger(at, CharacterPortrait, resp.CharacterPortrait)     // 群吹水排名
	addTrigger(at, ChatGPT, resp.ChatGPT)
	addTrigger(gr, Repeat, resp.Repeat)
	addTrigger(gr, ExecSQL, resp.ExecSQL)
	addTrigger(gr, SmartReply, resp.SmartReply)
	// 添加来自数据库的trigger
	handler.NewDynamicTriggerHandler().RegisterTriggers(addTrigger)
}
