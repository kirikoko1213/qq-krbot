package trigger

import (
	"qq-krbot/env"
	"qq-krbot/model"

	"strconv"
	"strings"

	"github.com/kiririx/krutils/ut"
)

func Help(param *model.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.GetTextMessage()), "ヘルプ", "帮助", "help", "?", "？", "")
}

func AISetting(param *model.TriggerParameter) bool {
	return ut.String().StartWith(param.CqParam.GetTextMessage(), "设定", "群角色设定")
}

func Health(param *model.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.GetTextMessage()), "ping")
}

func OffWorkTimeAnnounce(param *model.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.GetTextMessage()), "报时", "11")
}

func HolidayAnnounce(param *model.TriggerParameter) bool {
	return ut.String().In(param.CqParam.GetTextMessage(), "假期", "假期倒计时")
}

func RankOfGroupMsg(param *model.TriggerParameter) bool {
	text := strings.TrimSpace(param.CqParam.GetTextMessage())
	return text == "排名"
}

func MyWifeOfGroup(param *model.TriggerParameter) bool {
	text := strings.TrimSpace(param.CqParam.GetTextMessage())
	return ut.String().In(text, "群老婆")
}

func GroupChat(param *model.TriggerParameter) bool {
	if ut.String().Contains(env.Get("block.account"), strconv.FormatInt(param.CqParam.UserId, 10)) {
		return false
	}
	return true
}

func SmartReply(param *model.TriggerParameter) bool {
	return ut.String().Contains(param.CqParam.GetTextMessage(), "人生", "不想上班", "好累", "工作")
}

func Repeat(param *model.TriggerParameter) bool {
	if param.MsgQueue.Length() >= 2 {
		if param.MsgQueue.GetIndex(param.MsgQueue.Length()-1) == param.MsgQueue.GetIndex(param.MsgQueue.Length()-2) {
			return true
		}
	}
	return false
}

func ExecSQL(param *model.TriggerParameter) bool {
	return ut.String().StartWith(param.CqParam.GetTextMessage(), "-sql ")
}

func CharacterPortrait(param *model.TriggerParameter) bool {
	return ut.String().In(param.CqParam.GetTextMessage(), "人格分析")
}
