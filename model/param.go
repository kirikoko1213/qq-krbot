package model

import (
	"errors"
	"qq-krbot/base"
	"qq-krbot/env"
	"qq-krbot/helper"
	lg "qq-krbot/logx"
	"regexp"
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

type EngineParam struct {
	Time        int64                `json:"time"`
	SelfId      string               `json:"self_id"`
	PostType    string               `json:"post_type"` // message notice request meta_event
	SubType     string               `json:"sub_type"`
	MessageId   int64                `json:"message_id"`
	Message     string               `json:"message"`
	MessageType env.MessageRangeType `json:"message_type"` // group private
	GroupId     int64                `json:"group_id"`
	RawMessage  string               `json:"raw_message"`
	Font        int64                `json:"font"`
	UserId      int64                `json:"user_id"`
}

type AtMessage struct {
	AtAccount int64
	Message   string
}

// GetTextMessage 获取文本消息
func (p *EngineParam) GetTextMessage() string {
	if p.MessageType == env.RangeGr {
		return p.RawMessage
	}
	if p.MessageType == env.RangePr {
		return p.Message
	}
	return p.Message
}

// GetAtMessage 获取@消息
func (p *EngineParam) GetAtMessage() (AtMessage, error) {
	regex := `\[CQ:at,qq=(\d+)\]`
	reg, err := regexp.Compile(regex)
	if err != nil {
		return AtMessage{}, err
	}
	matchedStr := reg.FindString(p.RawMessage)
	if matchedStr == "" {
		return AtMessage{}, nil
	}
	if strings.HasPrefix(p.RawMessage, "[CQ:at,qq=") {
		atAccount, err := helper.ExtractQQ(matchedStr)
		if err != nil {
			return AtMessage{}, err
		}
		return AtMessage{
			AtAccount: atAccount,
			Message:   helper.ParseCQCodes(p.RawMessage),
		}, nil
	}
	return AtMessage{}, nil
}

type Scene string

const SceneAtMe Scene = "at_me"       // 群组里@我的触发器
const SceneAtOther Scene = "at_other" // 群组里@其他人的触发器
const ScenePr Scene = "pr"            // 非群组，单人私聊时的触发器
const SceneGr Scene = "gr"
