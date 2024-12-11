package env

import "fmt"

func AITalkGroupAndUserPrompts(groupId, userId int64) string {
	return fmt.Sprintf("ai_talk.prompts.group-%v.user-%v", groupId, userId)
}

// AITalkGroupPrompts 群组的提示词
func AITalkGroupPrompts(groupId int64) string {
	return fmt.Sprintf("ai_talk.prompts.group-%v", groupId)
}

func AITalkPrompts() string {
	return "ai_talk.prompts"
}
