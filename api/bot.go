package api

import (
	"fmt"
	"log"
	"net/http"
	"qq-krbot/base"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"qq-krbot/qqutil"
	"qq-krbot/repo"
	"qq-krbot/req"
	"qq-krbot/trigger"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kiririx/krutils/ut"
)

var msgQueue = base.NewQueue(5)

func Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
}

func Bot(c *gin.Context) {
	param := &req.Param{}
	err := c.ShouldBindJSON(param)
	if err != nil {
		// return
	}
	param.Parse()
	if param.PostType == "message" {
		go func() {
			err := repo.NewMessageRecordRepo().Save(param.UserId, param.GroupId, param.RawMessage)
			if err != nil {
				lg.Log.Error(err)
			}
		}()
		lg.Log.Infof("接收消息: %s", param.RawMessage)
		msgQueue.Enqueue(param.RawMessage)
		triggerParameter := &req.TriggerParameter{
			CqParam:  param,
			MsgQueue: msgQueue,
		}
		var handle = func(tg *trigger.Trigger) bool {
			if tg.MessageType == param.MessageType && tg.Condition(triggerParameter) {
				msg, err := tg.Callback(triggerParameter)

				switch tg.MessageType {
				case "pr":
					if err != nil {
						Error(err, param.GroupId, param.UserId, "pr")
						return true
					}
					qqutil.SendPrivateMessage(ut.Convert(param.UserId).StringValue(), qqutil.QQMsg{
						Message: msg,
						CQ:      tg.MessageType,
					})
				case "at":
					if err != nil {
						Error(err, param.GroupId, param.UserId, "at")
						return true
					}
					sendToGroupAt(param.GroupId, msg, param.UserId)
				case "gr":
					if err != nil {
						Error(err, param.GroupId, param.UserId, "gr")
						return true
					}
					sendToGroup(param.GroupId, msg)
				}
				return true
			}
			return false
		}
		for _, tg := range trigger.DynamicTriggers {
			isOver := handle(&tg)
			if isOver {
				return
			}
		}
		for _, tg := range trigger.Triggers {
			isOver := handle(&tg)
			if isOver {
				return
			}
		}
	}
}

func sendToGroupAt(groupId int64, msg string, userId int64) {
	url := env.Get("onebot.http.url") + "/send_group_msg"
	sendGroupId := ut.Convert(groupId).StringValue()
	_, err := ut.HttpClient().Timeout(time.Second*30).PostString(url, map[string]any{
		"group_id": sendGroupId,
		"message":  fmt.Sprintf("[CQ:at,qq=%v] %s", userId, msg),
	})
	if err != nil {
		lg.Log.Error(err)
		return
	}
}

func sendToGroup(groupId int64, msg string) {
	url := env.Get("onebot.http.url") + "/send_group_msg"
	sendGroupId := ut.Convert(groupId).StringValue()
	_, err := ut.HttpClient().Timeout(time.Second*30).PostString(url, map[string]any{
		"group_id": sendGroupId,
		"message":  msg,
	})
	if err != nil {
		lg.Log.Error(err)
		return
	}
}

// Error 错误处理
// mode: pr 私聊，gr 群聊, at 群聊@某人
func Error(err error, groupId int64, userId int64, mode string) {
	if err != nil {
		log.Println(groupId, "Error => 🌸", err)
		qqutil.SendPrivateMessage(env.Get("master.qq_account"), qqutil.QQMsg{
			Message: err.Error(),
			CQ:      "pr",
		})
		if mode == "gr" {
			sendToGroup(groupId, err.Error())
		}
		if mode == "at" {
			sendToGroupAt(groupId, err.Error(), userId)
		}
		if mode == "pr" {
			qqutil.SendPrivateMessage(ut.Convert(userId).StringValue(), qqutil.QQMsg{
				Message: err.Error(),
				CQ:      "pr",
			})
		}
	}
}
