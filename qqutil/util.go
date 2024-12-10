package qqutil

import (
	"fmt"
	"github.com/kiririx/krutils/httpx"
	"log"
	"qq-krbot/env"
	"time"
)

type QQMsg struct {
	CQ      string
	FileURL string
	Message string
}

func SendPrivateMessage(targetQQ string, msg QQMsg) {
	if msg.CQ == "image" && msg.FileURL == "" {
		return
	}
	url := env.OneBotURL + "/send_private_msg"
	resp, err := httpx.Client().Timeout(time.Second*30).Headers(map[string]string{
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
	fmt.Println("cq-http-resp => ", resp)
}

// TimeUntilOffWork 计算距离下班时间还有多久
func TimeUntilOffWork(offWorkTime string) (string, error) {
	// 获取当前时间
	now := time.Now()

	// 解析下班时间
	offWork, err := time.Parse("15:04", offWorkTime)
	if err != nil {
		return "", err
	}

	// 设置下班时间为今天的下班时间
	todayOffWork := time.Date(now.Year(), now.Month(), now.Day(), offWork.Hour(), offWork.Minute(), 0, 0, now.Location())

	// 如果下班时间已过，设置为明天的下班时间
	if now.After(todayOffWork) {
		return "", nil
	}

	// 计算剩余时间
	remaining := todayOffWork.Sub(now)

	// 计算小时、分钟和秒
	hours := int(remaining.Hours())
	minutes := int(remaining.Minutes()) % 60
	seconds := int(remaining.Seconds()) % 60

	// 返回格式化的字符串
	return fmt.Sprintf("%d:%d:%d", hours, minutes, seconds), nil
}

// AppendValue 函数将一个值添加到一个数组中，返回一个新的数组
func AppendValue[T any](arr []T, value T) []T {
	// 创建一个新数组，长度为原数组长度加1
	newArray := make([]T, len(arr)+1)

	// 复制原数组的元素到新数组
	copy(newArray, arr)

	// 在新数组末尾添加新值
	newArray[len(arr)] = value

	return newArray
}

func CalculateRemainingDays(dateStr string) (int, error) {
	holidayDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return 0, err
	}
	now := time.Now()
	duration := holidayDate.Sub(now)
	days := int(duration.Hours() / 24)
	return days, nil
}

func ReverseNewSlice[T any](s []T) []T {
	newSlice := make([]T, len(s))
	for i, j := 0, len(s)-1; i < len(s); i, j = i+1, j-1 {
		newSlice[i] = s[j]
	}
	return newSlice
}
