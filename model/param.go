package model

import (
	"errors"
	"qq-krbot/base"
	"qq-krbot/env"
	"qq-krbot/helper"
	lg "qq-krbot/logx"
	"strings"

	"github.com/kiririx/krutils/ut"
)

type TriggerParameter struct {
	WrapperParam *WrapperParam
	MsgQueue     *base.Queue
}

type WrapperParam struct {
	EngineParam *EngineParam // 原始参数
	AtAccount   int64        // 被@的qq号
	Scene       Scene        // 场景 私聊 群聊 at我 at其他
}

func BuildWrapperParam(param *EngineParam) (*WrapperParam, error) {
	// 获取场景
	var scene Scene
	var atAccount int64
	if ut.String().Contains(param.RawMessage, "[CQ:at,") {
		// 提取消息中@的qq号
		qqAccount, err := helper.ExtractQQ(param.RawMessage)
		if err != nil {
			return nil, err
		}
		if qqAccount == ut.Convert(env.Get("qq.account")).Int64Value() {
			scene = SceneAtMe
			atAccount = qqAccount
		} else {
			scene = SceneAtOther
			atAccount = qqAccount
		}
	} else if param.MessageType == env.RangeGr {
		scene = SceneGr
	} else if param.MessageType == env.RangePr {
		scene = ScenePr // 非群组，单人私聊时的触发器
	} else {
		lg.Log.Error("获取场景失败，请检查消息类型", param)
		return nil, errors.New("获取场景失败，请检查消息类型")
	}
	// 构建包装参数
	return &WrapperParam{
		EngineParam: param,
		Scene:       scene,
		AtAccount:   atAccount,
	}, nil
}

/*
  - 消息格式
    {
    "self_id": 1105624883,
    "user_id": 2187391949,
    "time": 1750563155,
    "message_id": 1009718967,
    "message_seq": 2002,
    "message_type": "group",
    "sender": {
    "user_id": 2187391949,
    "nickname": "†✰⇝树理♡†",
    "card": "†✰⇝TT树理♡†",
    "role": "admin",
    "title": ""
    },
    "raw_message": "121",
    "font": 14,
    "sub_type": "normal",
    "message": [
    {
    "type": "text",
    "data": {
    "text": "121"
    }
    }
    ],
    "message_format": "array",
    "post_type": "message",
    "group_id": 815182520
    }
*/
type EngineParam struct {
	SelfId        int64                `json:"self_id"`        // 机器人id
	UserId        int64                `json:"user_id"`        // 发送者id
	Time          int64                `json:"time"`           // 时间
	MessageId     int64                `json:"message_id"`     // 1009718967
	MessageSeq    int64                `json:"message_seq"`    // 2002
	MessageType   env.MessageRangeType `json:"message_type"`   // group private
	Sender        Sender               `json:"sender"`         // 发送者
	RawMessage    string               `json:"raw_message"`    // 原始消息
	Font          int64                `json:"font"`           // 字体
	SubType       string               `json:"sub_type"`       // 子类型 normal |
	Message       []MessageItem        `json:"message"`        // 消息内容
	MessageFormat string               `json:"message_format"` // array | string
	PostType      string               `json:"post_type"`      // message notice request meta_event
	GroupId       int64                `json:"group_id"`       // 群组id
}

type Sender struct {
	UserId   int64  `json:"user_id"`
	Nickname string `json:"nickname"`
	Card     string `json:"card"`
	Role     string `json:"role"`
	Title    string `json:"title"`
}

type MessageItem struct {
	Type string          `json:"type"`
	Data MessageItemData `json:"data"`
}

type MessageItemData struct {
	Text string `json:"text"`
}

type AtMessage struct {
	AtAccount int64
	Message   string
}

// GetTextMessage 获取文本消息
func (p *WrapperParam) GetTextMessage() string {
	ep := p.EngineParam
	if ep.MessageType == env.RangeGr {
		var text string
		for _, item := range ep.Message {
			if item.Type == "text" {
				text += item.Data.Text
				text += ";"
			}
		}
		text = strings.TrimRight(text, ";")
		return text
	}
	if ep.MessageType == env.RangePr {
		// todo
		return ep.Message[0].Data.Text
	}
	return ""
}

type Scene string

const SceneAtMe Scene = "at_me"       // 群组里@我的触发器
const SceneAtOther Scene = "at_other" // 群组里@其他人的触发器
const ScenePr Scene = "pr"            // 非群组，单人私聊时的触发器
const SceneGr Scene = "gr"
