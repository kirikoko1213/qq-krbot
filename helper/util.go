package helper

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

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

// ExtractQQ 从CQ码中提取QQ号
func ExtractQQ(input string) (int64, error) {
	// 定义一个正则表达式来匹配 "qq=" 后面的数字
	re := regexp.MustCompile(`qq=(\d+)`)

	// 使用正则表达式查找匹配项
	matches := re.FindStringSubmatch(input)
	if len(matches) < 2 {
		return 0, fmt.Errorf("no QQ number found")
	}

	// 返回匹配的 QQ 号码
	qq, err := strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		return 0, err
	}
	return qq, nil
}

// ParseCQCodes 解析CQ码，返回剩余的文本
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
