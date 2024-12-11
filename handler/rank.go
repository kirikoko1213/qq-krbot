package handler

import (
	"fmt"
	lg "qq-krbot/logx"
	"qq-krbot/repo"
)

type RankHandler struct {
}

func NewRankHandler() *RankHandler {
	return &RankHandler{}
}

func (receiver *RankHandler) BuildResponseString(rankArray repo.RankWithGroupResult, groupId int64) string {
	var response string
	for rank, v := range rankArray {
		// 获取qq号对应的群名片
		result, err := OneBotHandler.GetGroupMemberInfo(groupId, v.QQAccount, true)
		if err != nil {
			lg.Log.Error(err)
			continue
		}
		// 获取头衔
		title := func() string {
			if result.Title != "" {
				return "[" + result.Title + "]"
			}
			return ""
		}()
		// 获取群名片，如果没有，就取昵称
		card := func() string {
			if result.Card != "" {
				return result.Card
			}
			return result.Nickname
		}()
		// 设置排名icon
		rankIcon := func() string {
			if rank == 0 {
				return "🥇"
			}
			if rank == 1 {
				return "🥈"
			}
			if rank == 2 {
				return "🥉"
			}
			return fmt.Sprintf("%d", rank+1)
		}()
		response += fmt.Sprintf("\n%s %s%s 发言次数:%d", rankIcon, title, card, v.Count)
	}
	return response
}
