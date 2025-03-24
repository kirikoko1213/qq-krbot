package ai_handler

import "qq-krbot/env"

func getAISetting(qqAccount int64, groupId int64) string {
	l1 := env.Get(env.AITalkPrompts())
	if l1 != "" {
		l1 = "1. (必须遵守):" + l1 + ";\n"
	}
	l2 := env.Get(env.AITalkGroupPrompts(groupId))
	if l2 != "" {
		l2 = "2. (必须遵守):" + l2 + ";\n"
	}
	l3 := env.Get(env.AITalkGroupAndUserPrompts(groupId, qqAccount))
	if l3 != "" {
		l3 = "3. (尽量遵守):" + l3 + ";\n"
	}
	return l1 + l2 + l3
}
