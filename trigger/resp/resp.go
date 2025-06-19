package resp

import (
	"fmt"
	"io/ioutil"
	"qq-krbot/env"
	ai_handler "qq-krbot/handler/ai"
	bot_handler "qq-krbot/handler/bot_engine"
	"qq-krbot/helper"
	"qq-krbot/model"
	"qq-krbot/repo"
	"strings"
	"time"

	"github.com/kiririx/krutils/ut"
	"github.com/tidwall/gjson"
)

var (
	AnimeImages []string
)

type Resp struct {
	Message string
	CQ      string
	SubType int
	File    string
}

func init() {
	go func() {
		for {
			select {
			case <-time.After(time.Second * 5):
				// 涩图列表
				AnimeImages = make([]string, 0)
				files, _ := ioutil.ReadDir("./photo")
				for _, file := range files {
					if file.IsDir() {
						continue
					}
					AnimeImages = append(AnimeImages, file.Name())
				}
			}
		}
	}()
}

func Help(*model.TriggerParameter) (string, error) {
	text := env.Get(env.HelpWordText())
	if text != "" {
		return text, nil
	}
	return "🌸使用方法🌸\n" +
		"1. 报时: @我并发送 报时，显示下班时间" + "\n" +
		"2. 设定: 设置以当前群组和发送者为单位的AI角色 @我并发送 设定, 你是一个xxxxx" + "\n" +
		"3. 群角色设定: 设置以群组为单位的AI角色, @我并发送 群角色设定 你是一个xxxxx" + "\n" +
		"4. AI回复: @我输入任意内容即可与AI对话" + "\n" +
		"5. 群吹水排名: @我并发送 排名" + "\n" +
		"6. 人格分析: @我并发送 人格分析" + "\n" +
		"7. 假期倒计时: @我并发送 假期" + "\n" +
		"......" + "\n" +
		"\n开源地址: https://github.com/kirikoko1213/qq-krbot", nil
}

func Health(param *model.TriggerParameter) (string, error) {
	return "pong", nil
}

func OffWorkTimeAnnounce(param *model.TriggerParameter) (string, error) {
	if time.Now().Hour() >= 18 {
		return "不会有人这个时间还在上班吧?", nil
	}
	var message string
	result1, _ := helper.TimeUntilOffWork("17:00")
	if result1 != "" {
		message += fmt.Sprintf("\n 5:00.PM -> %s", result1)
	}
	result2, _ := helper.TimeUntilOffWork("17:30")
	if result2 != "" {
		message += fmt.Sprintf("\n 5:30.PM -> %s", result2)
	}
	result3, _ := helper.TimeUntilOffWork("18:00")
	if result3 != "" {
		message += fmt.Sprintf("\n 6:00.PM -> %s", result3)
	}
	return message, nil
}

func HolidayAnnounce(param *model.TriggerParameter) (string, error) {
	holidayJSON := env.Get("holiday")
	if holidayJSON == "" {
		return "抱歉，没有找到假期信息", nil
	}
	holiday := gjson.Parse(holidayJSON)
	var message string
	message += "距离下面的假期还有: \n"
	holiday.ForEach(func(key, value gjson.Result) bool {
		holidayName := value.Get("name").String()
		holidayDate := value.Get("date").String()
		// 计算剩余天数
		remainingDays, err := helper.CalculateRemainingDays(holidayDate)
		if err != nil {
			return false
		}

		// 添加到消息中
		message += fmt.Sprintf("%s [%s]: %d天\n", holidayName, holidayDate, remainingDays)
		return true
	})
	return message, nil
}

func GroupChat(param *model.TriggerParameter) (string, error) {
	return ai_handler.AIHandler.GroupChat(param.WrapperParam.EngineParam)
}

// key is groupID, value is message content
var lastRepeatMsg = map[int64]string{}

func Repeat(param *model.TriggerParameter) (string, error) {
	if param.MsgQueue.Length() < 2 {
		return "", nil
	}
	repeatMsg := param.MsgQueue.GetIndex(param.MsgQueue.Length() - 1).(string)
	v, _ := lastRepeatMsg[param.WrapperParam.EngineParam.GroupId]
	if v == repeatMsg {
		return "", nil
	}
	lastRepeatMsg[param.WrapperParam.EngineParam.GroupId] = repeatMsg
	return repeatMsg, nil
}
func AISetting(param *model.TriggerParameter) (string, error) {
	if ut.String().StartWith(param.WrapperParam.EngineParam.GetTextMessage(), "设定") {
		setting := ut.String().SubStrWithRune(strings.TrimSpace(param.WrapperParam.EngineParam.GetTextMessage()), 2, ut.String().LenWithRune(param.WrapperParam.EngineParam.GetTextMessage()))
		if setting == "" {
			return "(当前设定): " + env.Get(env.AITalkGroupAndUserPrompts(param.WrapperParam.EngineParam.GroupId, param.WrapperParam.EngineParam.UserId)), nil
		}
		env.SetWithMode(env.ModeDB, env.AITalkGroupAndUserPrompts(param.WrapperParam.EngineParam.GroupId, param.WrapperParam.EngineParam.UserId), setting)
		ai_handler.AIHandler.ClearSetting(param.WrapperParam.EngineParam)
		return "角色设定成功！", nil
	}
	if ut.String().StartWith(param.WrapperParam.EngineParam.GetTextMessage(), "群角色设定") {
		// setting := ut.String().SubStrWithRune(strings.TrimSpace(cqParam.KrMessage), 5, ut.String().LenWithRune(cqParam.KrMessage))
		// if setting == "" {
		// 	return "(当前设定): " + env.Get(env.AITalkGroupPrompts(cqParam.GroupId)), nil
		// }
		// env.SetWithMode(env.ModeDB, env.AITalkGroupPrompts(cqParam.GroupId), setting)
		// handler.AIHandler.ClearSetting(cqParam)
		return "群角色设定暂停使用", nil

	}
	return "", nil
}

func RankOfGroupMsg(param *model.TriggerParameter) (string, error) {
	rankArray := repo.NewMessageRecordRepo().RankWithGroupAndToday(param.WrapperParam.EngineParam.GroupId)
	return bot_handler.NewRankHandler().BuildResponseString(rankArray, param.WrapperParam.EngineParam.GroupId), nil
}

func MyWifeOfGroup(param *model.TriggerParameter) (string, error) {
	startDateTime := time.Now().AddDate(0, 0, -7)
	accounts := repo.NewMessageRecordRepo().FindQQAccountsByDateAndGroupId(param.WrapperParam.EngineParam.GroupId, startDateTime, time.Now())
	wifeArr, remain := bot_handler.NewWifeHandler().BuildWifeGroup(accounts)
	defWord := "抱歉, 今天你是本群单身狗~"
	if param.WrapperParam.EngineParam.UserId == *remain {
		return defWord, nil
	}
	var targetAccount int64
	for _, qqAccounts := range wifeArr {
		if param.WrapperParam.EngineParam.UserId == qqAccounts[0] {
			targetAccount = qqAccounts[1]
			break
		}
		if param.WrapperParam.EngineParam.UserId == qqAccounts[1] {
			targetAccount = qqAccounts[0]
			break
		}
	}
	// 如果没有找到对象
	if targetAccount == 0 {
		return defWord, nil
	}
	// 根据targetAccount查询qq信息

	return "你今天的老婆是", nil
}

func CharacterPortrait(param *model.TriggerParameter) (string, error) {
	groupId := param.WrapperParam.EngineParam.GroupId
	userId := param.WrapperParam.EngineParam.UserId
	messages := repo.NewMessageRecordRepo().FindTextMessageByQQAccountAndGroupId(groupId, userId, 300)
	if len(messages) < 10 {
		return "没有足够的消息记录，请继续水群吧", nil
	}
	message, err := ai_handler.AIHandler.SingleTalk(env.Get(env.CharacterPortraitPrompts(groupId)), strings.Join(messages, "\n"))
	if err != nil {
		return "", err
	}
	return message, nil
}

func SmartReply(param *model.TriggerParameter) (string, error) {
	return ai_handler.AIHandler.SingleTalk(env.Get(env.SmartReplyPrompts()), param.WrapperParam.EngineParam.GetTextMessage())
}

func ExecSQL(param *model.TriggerParameter) (string, error) {
	sql := ut.String().SubStrWithRune(strings.TrimSpace(param.WrapperParam.EngineParam.GetTextMessage()), 4, ut.String().LenWithRune(param.WrapperParam.EngineParam.GetTextMessage()))
	query, err := bot_handler.ExecuteSelectQuery(repo.Sql, sql)
	if err != nil {
		return "", err
	}
	return bot_handler.FormatResultAsTable(query), nil
}
