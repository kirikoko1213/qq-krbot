package trigger

import (
	"github.com/kiririx/krutils/ut"
	"qq-krbot/env"
	"qq-krbot/req"
	"strconv"
	"strings"
)

func Help(param *req.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.KrMessage), "ヘルプ", "帮助", "help", "?", "？", "")
}

func AISetting(param *req.TriggerParameter) bool {
	return ut.String().StartWith(param.CqParam.KrMessage, "设定", "群角色设定")
}

func Health(param *req.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.KrMessage), "ping")
}

func OffWorkTimeAnnounce(param *req.TriggerParameter) bool {
	return ut.String().In(strings.TrimSpace(param.CqParam.KrMessage), "报时", "11")
}

func HolidayAnnounce(param *req.TriggerParameter) bool {
	return ut.String().In(param.CqParam.KrMessage, "假期", "假期倒计时")
}

func RankOfGroupMsg(param *req.TriggerParameter) bool {
	text := strings.TrimSpace(param.CqParam.KrMessage)
	return text == "排名"
}

func MyWifeOfGroup(param *req.TriggerParameter) bool {
	text := strings.TrimSpace(param.CqParam.KrMessage)
	return ut.String().In(text, "群老婆")
}

func ChatGPT(param *req.TriggerParameter) bool {
	if ut.String().Contains(env.Get("block.account"), strconv.FormatInt(param.CqParam.UserId, 10)) {
		return false
	}
	return true
}

func SmartReply(param *req.TriggerParameter) bool {
	return ut.String().Contains(param.CqParam.KrMessage, "人生", "不想上班", "好累", "工作")
}

func Repeat(param *req.TriggerParameter) bool {
	if param.MsgQueue.Length() >= 2 {
		if param.MsgQueue.GetIndex(param.MsgQueue.Length()-1) == param.MsgQueue.GetIndex(param.MsgQueue.Length()-2) {
			return true
		}
	}
	return false
}

func ExecSQL(param *req.TriggerParameter) bool {
	return ut.String().StartWith(param.CqParam.KrMessage, "-sql ")
}

func CharacterPortrait(param *req.TriggerParameter) bool {
	return ut.String().In(param.CqParam.KrMessage, "人格分析")
}
