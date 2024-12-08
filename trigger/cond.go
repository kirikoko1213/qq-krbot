package trigger

import (
	"github.com/kiririx/krutils/strx"
	"qq-krbot/env"
	"qq-krbot/req"
	"strconv"
)

func Help(param *req.TriggerParameter) bool {
	return strx.Equals(strx.TrimSpace(param.CqParam.KrMessage), "ヘルプ", "帮助", "help", "?", "？", "")
}

func AISetting(param *req.TriggerParameter) bool {
	return strx.StartWith(strx.TrimSpace(param.CqParam.KrMessage), "设定")
}

func Health(param *req.TriggerParameter) bool {
	return strx.Equals(strx.TrimSpace(param.CqParam.KrMessage), "ping")
}

func OffWorkTimeAnnounce(param *req.TriggerParameter) bool {
	return strx.Equals(strx.TrimSpace(param.CqParam.KrMessage), "报时", "11")
}

func RankOfGroupMsg(param *req.TriggerParameter) bool {
	text := strx.TrimSpace(param.CqParam.KrMessage)
	return strx.Equals(text, "排名")
}

func MyWifeOfGroup(param *req.TriggerParameter) bool {
	text := strx.TrimSpace(param.CqParam.KrMessage)
	return strx.Equals(text, "群老婆")
}

func ChatGPT(param *req.TriggerParameter) bool {
	if strx.Contains(env.Get("block.account"), strconv.FormatInt(param.CqParam.UserId, 10)) {
		return false
	}
	return true
}

func SmartReply(param *req.TriggerParameter) bool {
	return strx.Contains(param.CqParam.KrMessage, "人生", "不想上班", "好累", "工作")
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
	return strx.StartWith(param.CqParam.KrMessage, "-sql ")
}

func CharacterPortrait(param *req.TriggerParameter) bool {
	return strx.Equals(param.CqParam.KrMessage, "人格分析")
}
