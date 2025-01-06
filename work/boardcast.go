package work

import (
	"fmt"
	"github.com/kiririx/krutils/ut"
	"qq-krbot/env"
	"qq-krbot/handler"
	"qq-krbot/qqutil"
	"qq-krbot/repo"
	"strconv"
	"strings"
)

var hour = 8
var minute = 0

func Boardcast() {
	go ut.Async().ScheduleTask("0 8 * * *", rankTask)
	go ut.Async().ScheduleTask("0 11 * * 1-5", takeoutTips)
	go ut.Async().ScheduleTask("40 16 * * 1-5", workOffTips)
	go ut.Async().ScheduleTask("20 17 * * 1-5", workOffTips)
}

func takeoutTips() {
	groupIdStrings := env.Get("task.rank_of_group.id.list")
	if len(groupIdStrings) == 0 {
		return
	}
	botName := env.Get("bot.name")
	groupIdArr := strings.Split(groupIdStrings, ",")
	for _, groupIdStr := range groupIdArr {
		groupId := ut.Convert(groupIdStr).Int64Value()
		handler.OneBotHandler.SendGroupMsg(groupId, fmt.Sprintf("%s提醒你该点外卖了！", botName))
	}
}

func workOffTips() {
	groupIdStrings := env.Get("task.rank_of_group.id.list")
	if len(groupIdStrings) == 0 {
		return
	}
	botName := env.Get("bot.name")
	groupIdArr := strings.Split(groupIdStrings, ",")
	for _, groupIdStr := range groupIdArr {
		groupId, _ := strconv.ParseInt(groupIdStr, 10, 64)
		var message string
		result1, _ := qqutil.TimeUntilOffWork("17:00")
		if result1 != "" {
			message += fmt.Sprintf("\n 5:00.PM -> %s", result1)
		}
		result2, _ := qqutil.TimeUntilOffWork("17:30")
		if result2 != "" {
			message += fmt.Sprintf("\n 5:30.PM -> %s", result2)
		}
		result3, _ := qqutil.TimeUntilOffWork("18:00")
		if result3 != "" {
			message += fmt.Sprintf("\n 6:00.PM -> %s", result3)
		}
		handler.OneBotHandler.SendGroupMsg(groupId, fmt.Sprintf("%s提醒你快下班了！\n%s", botName, message))
	}
}

func rankTask() {
	groupIdStrings := env.Get("task.rank_of_group.id.list")
	if len(groupIdStrings) == 0 {
		return
	}
	botName := env.Get("bot.name")
	groupIdArr := strings.Split(groupIdStrings, ",")
	for _, groupIdStr := range groupIdArr {
		groupId, _ := strconv.ParseInt(groupIdStr, 10, 64)
		rankArray := repo.NewMessageRecordRepo().RankWithGroupAndYesterday(groupId)
		// 只取前三名
		if len(rankArray) > 3 {
			rankArray = rankArray[:3]
		}
		response := handler.NewRankHandler().BuildResponseString(rankArray, groupId)
		handler.OneBotHandler.SendGroupMsg(groupId, ""+
			"早上好！"+botName+"为您播报昨日的水群排名："+
			response)
	}
}
