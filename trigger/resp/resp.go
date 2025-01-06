package resp

import (
	"fmt"
	"github.com/kiririx/krutils/ut"
	"github.com/tidwall/gjson"
	"io/ioutil"
	"qq-krbot/env"
	"qq-krbot/handler"
	"qq-krbot/qqutil"
	"qq-krbot/repo"
	"qq-krbot/req"
	"strings"
	"time"
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

func Help(*req.TriggerParameter) (string, error) {
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
		"\n开源地址: https://github.com/kiririx/qq-krbot", nil
}

func Health(param *req.TriggerParameter) (string, error) {
	return "pong", nil
}

func OffWorkTimeAnnounce(param *req.TriggerParameter) (string, error) {
	if time.Now().Hour() >= 18 {
		return "不会有人这个时间还在上班吧?", nil
	}
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
	return message, nil
}

func HolidayAnnounce(param *req.TriggerParameter) (string, error) {
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
		remainingDays, err := qqutil.CalculateRemainingDays(holidayDate)
		if err != nil {
			return false
		}

		// 添加到消息中
		message += fmt.Sprintf("%s [%s]: %d天\n", holidayName, holidayDate, remainingDays)
		return true
	})
	return message, nil
}

func ChatGPT(param *req.TriggerParameter) (string, error) {
	return handler.AIHandler.Do(param.CqParam)
}

// key is groupID, value is message content
var lastRepeatMsg = map[int64]string{}

func Repeat(param *req.TriggerParameter) (string, error) {
	if param.MsgQueue.Length() < 2 {
		return "", nil
	}
	repeatMsg := param.MsgQueue.GetIndex(param.MsgQueue.Length() - 1).(string)
	v, _ := lastRepeatMsg[param.CqParam.GroupId]
	if v == repeatMsg {
		return "", nil
	}
	lastRepeatMsg[param.CqParam.GroupId] = repeatMsg
	return repeatMsg, nil
}
func AISetting(param *req.TriggerParameter) (string, error) {
	cqParam := param.CqParam
	if ut.String().StartWith(cqParam.KrMessage, "设定") {
		setting := ut.String().SubStrWithRune(strings.TrimSpace(cqParam.KrMessage), 2, ut.String().LenWithRune(cqParam.KrMessage))
		if setting == "" {
			return "(当前设定): " + env.Get(env.AITalkGroupAndUserPrompts(cqParam.GroupId, cqParam.UserId)), nil
		}
		env.SetWithMode(env.ModeDB, env.AITalkGroupAndUserPrompts(cqParam.GroupId, cqParam.UserId), setting)
		handler.AIHandler.ClearSetting(cqParam)
		return "角色设定成功！", nil
	}
	if ut.String().StartWith(cqParam.KrMessage, "群角色设定") {
		setting := ut.String().SubStrWithRune(strings.TrimSpace(cqParam.KrMessage), 5, ut.String().LenWithRune(cqParam.KrMessage))
		if setting == "" {
			return "(当前设定): " + env.Get(env.AITalkGroupPrompts(cqParam.GroupId)), nil
		}
		env.SetWithMode(env.ModeDB, env.AITalkGroupPrompts(cqParam.GroupId), setting)
		handler.AIHandler.ClearSetting(cqParam)
		return "群角色设定成功！", nil
	}
	return "", nil
}

func RankOfGroupMsg(param *req.TriggerParameter) (string, error) {
	rankArray := repo.NewMessageRecordRepo().RankWithGroupAndToday(param.CqParam.GroupId)
	return handler.NewRankHandler().BuildResponseString(rankArray, param.CqParam.GroupId), nil
}

func MyWifeOfGroup(param *req.TriggerParameter) (string, error) {
	cqParam := param.CqParam
	startDateTime := time.Now().AddDate(0, 0, -7)
	accounts := repo.NewMessageRecordRepo().FindQQAccountsByDateAndGroupId(cqParam.GroupId, startDateTime, time.Now())
	wifeArr, remain := handler.NewWifeHandler().BuildWifeGroup(accounts)
	defWord := "抱歉, 今天你是本群单身狗~"
	if cqParam.UserId == *remain {
		return defWord, nil
	}
	var targetAccount int64
	for _, qqAccounts := range wifeArr {
		if cqParam.UserId == qqAccounts[0] {
			targetAccount = qqAccounts[1]
			break
		}
		if cqParam.UserId == qqAccounts[1] {
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

func CharacterPortrait(param *req.TriggerParameter) (string, error) {
	groupId := param.CqParam.GroupId
	userId := param.CqParam.UserId
	messages := repo.NewMessageRecordRepo().FindTextMessageByQQAccountAndGroupId(groupId, userId, 300)
	if len(messages) < 10 {
		return "没有足够的消息记录，请继续水群吧", nil
	}
	message, err := handler.AIHandler.SingleTalk(env.Get(env.CharacterPortraitPrompts(groupId)), strings.Join(messages, "\n"))
	if err != nil {
		return "", err
	}
	return message, nil
}

func SmartReply(param *req.TriggerParameter) (string, error) {
	return handler.AIHandler.SingleTalk(env.Get(env.SmartReplyPrompts()), param.CqParam.KrMessage)
}

func ExecSQL(param *req.TriggerParameter) (string, error) {
	sql := ut.String().SubStrWithRune(strings.TrimSpace(param.CqParam.KrMessage), 4, ut.String().LenWithRune(param.CqParam.KrMessage))
	query, err := handler.ExecuteSelectQuery(repo.Sql, sql)
	if err != nil {
		return "", err
	}
	return handler.FormatResultAsTable(query), nil
}
