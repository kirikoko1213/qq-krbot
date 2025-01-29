package handler

import (
	"fmt"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"time"

	"github.com/kiririx/krutils/ut"
)

type _OneBotHandler struct {
}

var OneBotHandler = &_OneBotHandler{}

type GroupMemberInfo struct {
	Nickname string `json:"nickname"`
	Card     string `json:"card"`
	Title    string `json:"title"`
}

func (receiver _OneBotHandler) GetGroupMemberInfo(groupId, qqAccount int64, noCache bool) (GroupMemberInfo, error) {
	apiURL := fmt.Sprintf("%s%s", env.Get("onebot.http.url"), "/get_group_member_info")
	response, err := ut.HttpClient().GetJSON(apiURL, map[string]string{
		"group_id": fmt.Sprintf("%d", groupId),
		"user_id":  fmt.Sprintf("%d", qqAccount),
		"no_cache": fmt.Sprintf("%t", noCache),
	})
	var groupMemberInfo GroupMemberInfo
	if err != nil {
		lg.Log.Error(err)
		return groupMemberInfo, err
	}
	// 将 JSON 数据解析到结构体实例中
	data := response["data"].(map[string]interface{})
	groupMemberInfo.Nickname = data["nickname"].(string)
	groupMemberInfo.Card = data["card"].(string)
	groupMemberInfo.Title = data["title"].(string)
	return groupMemberInfo, nil
}

func (receiver _OneBotHandler) SendGroupMsg(groupId int64, msg string) {
	url := env.Get("onebot.http.url") + "/send_group_msg"
	sendGroupId := ut.Convert(groupId).StringValue()
	_, err := ut.HttpClient().Timeout(time.Second*10).PostString(url, map[string]any{
		"group_id": sendGroupId,
		"message":  msg,
	})
	if err != nil {
		lg.Log.Error(err)
		return
	}
}
