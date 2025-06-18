package model

import (
	"qq-krbot/base"
	"qq-krbot/env"
	"qq-krbot/helper"
	"regexp"
	"strings"
)

type TriggerParameter struct {
	CqParam  *EngineParam
	MsgQueue *base.Queue
}

type WrapperParam struct {
	EngineParam *EngineParam
	KrMessage   string
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
