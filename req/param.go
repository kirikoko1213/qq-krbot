package req

import (
	"fmt"
	"github.com/kiririx/krutils/strx"
	"qq-krbot/base"
	"qq-krbot/env"
	"regexp"
	"strings"
)

type TriggerParameter struct {
	CqParam  *Param
	MsgQueue *base.Queue
}

type Param struct {
	Time        int64  `json:"time"`
	SelfId      string `json:"self_id"`
	PostType    string `json:"post_type"` // message notice request meta_event
	SubType     string `json:"sub_type"`
	MessageId   int64  `json:"message_id"`
	Message     string `json:"message"`
	MessageType string `json:"message_type"` // group private
	GroupId     int64  `json:"group_id"`
	RawMessage  string `json:"raw_message"`
	Font        int64  `json:"font"`
	UserId      int64  `json:"user_id"`
	KrMessage   string
}

// Parse [CQ:at,qq=11056248xx]
func (p *Param) Parse() {
	if p.PostType == "message" {
		switch p.MessageType {
		case "private":
			p.MessageType = "pr"
			p.KrMessage = p.Message
		case "group":
			regex := `\[CQ:at,qq=(\d+)\]`
			reg, err := regexp.Compile(regex)
			if err != nil {
				return
			}
			matchedStr := reg.FindString(p.RawMessage)
			cqPrefix := strings.Split(matchedStr, ",")[0]
			_ = strings.Replace(cqPrefix, "[CQ:", "", -1)
			if strings.HasPrefix(p.RawMessage, "[CQ:at,qq=") {
				qqAccount, err := ExtractQQ(p.RawMessage)
				if err != nil {
					return
				}
				if qqAccount != env.Get("qq.account") {
					return
				}
				p.MessageType = "at"
				p.KrMessage = ParseCQCodes(p.RawMessage)
				break
			}
			if !strings.HasPrefix(p.RawMessage, "[CQ:") {
				p.MessageType = "gr"
				p.KrMessage = p.RawMessage
			}
		}
		p.KrMessage = strx.TrimSpace(p.KrMessage)
	}
}

// ExtractQQ extracts the QQ number from the given input string
func ExtractQQ(input string) (string, error) {
	// 定义一个正则表达式来匹配 "qq=" 后面的数字
	re := regexp.MustCompile(`qq=(\d+)`)

	// 使用正则表达式查找匹配项
	matches := re.FindStringSubmatch(input)
	if len(matches) < 2 {
		return "", fmt.Errorf("no QQ number found")
	}

	// 返回匹配的 QQ 号码
	return matches[1], nil
}

func ParseCQCodes(input string) string {
	// Define a regular expression to match [CQ:...] patterns
	re := regexp.MustCompile(`\[CQ:(\w+),([^\]]+)\]`)
	matches := re.FindAllStringSubmatch(input, -1)

	remainingText := input

	for _, match := range matches {
		paramsStr := match[2]

		// Parse the parameters into a map
		params := make(map[string]string)
		for _, param := range strings.Split(paramsStr, ",") {
			kv := strings.SplitN(param, "=", 2)
			if len(kv) == 2 {
				params[kv[0]] = kv[1]
			}
		}

		// Remove the matched CQ code from the remaining text
		remainingText = strings.Replace(remainingText, match[0], "", 1)
	}

	return remainingText
}
