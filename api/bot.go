package api

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/kiririx/krutils/httpx"
	"github.com/kiririx/krutils/strx"
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
				if err != nil {
					Error(err, param.GroupId)
					return true
				}
				switch tg.MessageType {
				case "pr":
					qqutil.SendPrivateMessage(strx.ToStr(param.UserId), qqutil.QQMsg{
						Message: msg,
						CQ:      tg.MessageType,
					})
				case "at":
					sendToGroupAt(param.GroupId, msg, param.UserId)
				case "gr":
					sendToGroup(param.GroupId, msg)
				}
				return true
			}
			return false
		}
		for _, tg := range trigger.Triggers {
			isOver := handle(&tg)
			if isOver {
				return
			}
		}
		for _, tg := range trigger.DynamicTriggers {
			isOver := handle(&tg)
			if isOver {
				return
			}
		}
	}
}

func sendToGroupAt(groupId int64, msg string, userId int64) {
	url := env.Get("onebot.http.url") + "/send_group_msg"
	sendGroupId := strx.ToStr(groupId)
	_, err := httpx.Client().Timeout(time.Second*30).PostString(url, map[string]any{
		"group_id": sendGroupId,
		"message":  fmt.Sprintf("[CQ:at,qq=%v] %s", userId, msg),
	})
	if err != nil {
		Error(err, groupId)
		return
	}
}

func sendToGroup(groupId int64, msg string) {
	url := env.Get("onebot.http.url") + "/send_group_msg"
	sendGroupId := strx.ToStr(groupId)
	_, err := httpx.Client().Timeout(time.Second*30).PostString(url, map[string]any{
		"group_id": sendGroupId,
		"message":  msg,
	})
	if err != nil {
		Error(err, groupId)
		return
	}
}

func Error(err error, groupId int64) {
	if err != nil {
		log.Println(groupId, "Error => 🌸", err)
		qqutil.SendPrivateMessage(env.Get("master.qq_account"), qqutil.QQMsg{
			Message: err.Error(),
			CQ:      "pr",
		})
	}
}
