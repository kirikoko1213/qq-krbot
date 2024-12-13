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

// BlockAccount 被屏蔽的账号, 用en逗号分隔
func BlockAccount() string {
	return "block.account"
}

// CharacterPortraitPrompts 人格分析的提示词, 如果groupId为0则使用默认的提示词
func CharacterPortraitPrompts(groupId int64) string {
	if groupId != 0 {
		return fmt.Sprintf("character.portrait.prompts-%v", groupId)
	}
	return "character.portrait.prompts"
}

// SmartReplyPrompts 智能回复的提示词
func SmartReplyPrompts() string {
	return "smart.reply.prompts"
}

// HelpWordText 帮助词的文本
func HelpWordText() string {
	return "help.word.text"
}
