package bot_handler

import (
	"encoding/json"
	"fmt"
	"log"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"qq-krbot/repo"
	"time"

	"github.com/kiririx/krutils/ut"
)

type GroupMemberNicknameObj struct {
	Account  string `json:"account"`
	Nickname string `json:"nickname"`
}

type _OneBotHandler struct {
	GroupMemberNickname map[int64]map[int64]string
}

var OneBotHandler = &_OneBotHandler{
	GroupMemberNickname: make(map[int64]map[int64]string),
}

type GroupMemberInfo struct {
	Nickname string `json:"nickname"`
	Card     string `json:"card"`
	Title    string `json:"title"`
}

// GetGroupMemberInfo 获取群成员信息，优先从Redis缓存获取
func (receiver _OneBotHandler) GetGroupMemberInfo(groupId, qqAccount int64, noCache bool) (GroupMemberInfo, error) {
	var groupMemberInfo GroupMemberInfo

	defer func() {
		nickname, _ := receiver.GetGroupMemberNickname(groupId, qqAccount)
		if nickname != "" {
			groupMemberInfo.Card = nickname
		}
	}()

	// 如果不使用缓存，直接从API获取
	if noCache {
		return receiver.getGroupMemberInfoFromAPI(groupId, qqAccount)
	}

	// 构造Redis key
	redisKey := fmt.Sprintf("group_member:%d:%d", groupId, qqAccount)

	// 尝试从Redis获取数据
	cacheData, err := repo.Get(redisKey)
	if err == nil && cacheData != "" {
		// 解析缓存的JSON数据
		err = json.Unmarshal([]byte(cacheData), &groupMemberInfo)
		if err == nil {
			return groupMemberInfo, nil
		}
	}

	// 如果Redis中没有数据或解析失败，从API获取
	groupMemberInfo, err = receiver.getGroupMemberInfoFromAPI(groupId, qqAccount)
	if err != nil {
		return groupMemberInfo, err
	}

	// 将数据存入Redis，设置24小时过期
	cacheJson, err := json.Marshal(groupMemberInfo)
	if err == nil {
		_ = repo.Set(redisKey, string(cacheJson), time.Hour*24)
	}

	return groupMemberInfo, nil
}

func (receiver _OneBotHandler) GetGroupMemberNickname(groupId, qqAccount int64) (string, error) {
	if receiver.GroupMemberNickname[groupId] == nil {
		configString := env.Get(env.GroupMemberNickname(groupId))
		if configString != "" {
			var list []GroupMemberNicknameObj
			err := json.Unmarshal([]byte(configString), &list)
			if err != nil {
				return "", err
			}
			receiver.GroupMemberNickname[groupId] = make(map[int64]string)
			for _, item := range list {
				receiver.GroupMemberNickname[groupId][ut.Convert(item.Account).Int64Value()] = item.Nickname
			}
		}
	}
	nickname, ok := receiver.GroupMemberNickname[groupId][qqAccount]
	if !ok {
		return "", nil
	}
	return nickname, nil
}

// getGroupMemberInfoFromAPI 从API获取群成员信息
func (receiver _OneBotHandler) getGroupMemberInfoFromAPI(groupId, qqAccount int64) (GroupMemberInfo, error) {
	apiURL := fmt.Sprintf("%s%s", env.Get("onebot.http.url"), "/get_group_member_info")
	response, err := ut.HttpClient().GetJSON(apiURL, map[string]string{
		"group_id": fmt.Sprintf("%d", groupId),
		"user_id":  fmt.Sprintf("%d", qqAccount),
		"no_cache": "false",
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

type QQMsg struct {
	CQ      string
	FileURL string
	Message string
}

func SendPrivateMessage(targetQQ string, msg QQMsg) {
	if msg.CQ == "image" && msg.FileURL == "" {
		return
	}
	url := env.Get("onebot.http.url") + "/send_private_msg"
	_, err := ut.HttpClient().Timeout(time.Second*30).Headers(map[string]string{
		"content-type": "application/json",
	}).PostString(url, map[string]any{
		"message": func() string {
			if msg.CQ == "image" {
				return fmt.Sprintf("[CQ:image,file=%v,subType=%v]", msg.FileURL, 0)
			}
			return msg.Message
		}(),
		"user_id":     targetQQ,
		"auto_escape": false,
	})
	if err != nil {
		log.Println(err)
		return
	}
}
