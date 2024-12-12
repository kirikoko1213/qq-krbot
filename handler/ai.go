package handler

import (
	"github.com/kiririx/krutils/convertx"
	"github.com/kiririx/krutils/httpx"
	"github.com/kiririx/krutils/strx"
	"github.com/tidwall/gjson"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"qq-krbot/qqutil"
	"qq-krbot/req"
	"time"
)

var messageMap = make(map[int64]*[]map[string]string)

var getRoleMap = func(qqAccount int64, groupId int64) map[string]string {
	return map[string]string{"role": "system", "content": GetAISetting(qqAccount, groupId)}
}

func GetAISetting(qqAccount int64, groupId int64) string {
	var promptsGetter func(key string) string
	if env.Get("storage.engine") == "db" {
		promptsGetter = env.GetWithDB
	} else {
		promptsGetter = env.Get
	}
	l1 := promptsGetter(env.AITalkPrompts())
	if l1 != "" {
		l1 = "1. (必须遵守):" + l1 + ";\n"
	}
	l2 := promptsGetter(env.AITalkGroupPrompts(groupId))
	if l2 != "" {
		l2 = "2. (必须遵守):" + l2 + ";\n"
	}
	l3 := promptsGetter(env.AITalkGroupAndUserPrompts(groupId, qqAccount))
	if l3 != "" {
		l3 = "3. (尽量遵守):" + l3 + ";\n"
	}
	return l1 + l2 + l3
}

type _AIHandler struct {
}

var AIHandler = &_AIHandler{}

var memStorage = &MemoryStorage{}
var dbStorage = &DbStorage{}

func getStorage() Storage {
	if env.Get("storage.engine") == "db" {
		return memStorage
	} else {
		// todo dbStorage
		return memStorage
	}
}

func (*_AIHandler) ClearSetting(param *req.Param) {
	storage := getStorage()
	_ = storage.Clear(param.GroupId, param.UserId)
}

func (*_AIHandler) SingleTalk(prompts, message string) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	timeout := env.Get("chatgpt.timeout")
	proxyURL := env.Get("proxy.url")
	cli := httpx.Client()
	if proxyURL != "" {
		cli.Proxy(proxyURL)
	}
	apiServerURL := env.Get("chatgpt.server.url")
	if apiServerURL == "" {
		apiServerURL = "https://api.openai.com"
	}

	messageArr := make([]map[string]string, 0)
	messageArr = append(messageArr, map[string]string{"role": "system", "content": prompts})
	messageArr = append(messageArr, map[string]string{"role": "user", "content": message})
	json, err := cli.Timeout(time.Second*time.Duration(convertx.StringToInt64(timeout))).Headers(map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + env.Get("chatgpt.key"),
	}).PostString(apiServerURL+"/v1/chat/completions", map[string]any{
		"model":       env.Get("chatgpt.model"),
		"messages":    messageArr,
		"temperature": 0.7,
	})
	if err != nil {
		return "", err
	}
	content := gjson.Get(json, "choices.0.message.content").String()
	if content == "" {
		lg.Log.WithField("AI-response: ", json).Error("AI 回复为空")
	}
	return strx.TrimSpace(content), nil
}

func (*_AIHandler) Do(param *req.Param) (string, error) {
	defer func() {
		if err := recover(); err != nil {
			lg.Log.Error(err)
		}
	}()
	storage := getStorage()
	timeout := env.Get("chatgpt.timeout")
	proxyURL := env.Get("proxy.url")
	cli := httpx.Client()
	if proxyURL != "" {
		cli.Proxy(proxyURL)
	}

	apiServerURL := env.Get("chatgpt.server.url")
	if apiServerURL == "" {
		apiServerURL = "https://api.openai.com"
	}

	messageArr, err := storage.GetArrayWithNewContent("user", param.GroupId, param.UserId, param.KrMessage)
	if err != nil {
		return "", err
	}

	json, err := cli.Timeout(time.Second*time.Duration(convertx.StringToInt64(timeout))).Headers(map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + env.Get("chatgpt.key"),
	}).PostString(apiServerURL+"/v1/chat/completions", map[string]any{
		"model":       env.Get("chatgpt.model"),
		"messages":    messageArr,
		"temperature": 0.7,
	})
	if err != nil {
		return "", err
	}
	content := gjson.Get(json, "choices.0.message.content").String()
	if content == "" {
		lg.Log.WithField("AI-response: ", json).Error("AI 回复为空")
	}
	err = storage.Push("user", param.GroupId, param.UserId, param.KrMessage)
	if err != nil {
		return "", err
	}

	err = storage.Push("assistant", param.GroupId, param.UserId, content)
	if err != nil {
		return "", err
	}

	return strx.TrimSpace(content), err
}

type Storage interface {
	Push(roleType string, groupId, qqAccount int64, content string) error
	GetArray(groupId, qqAccount int64) (*[]map[string]string, error)
	GetArrayWithNewContent(roleType string, groupId, qqAccount int64, content string) ([]map[string]string, error)
	Clear(groupId, qqAccount int64) error
}

type MemoryStorage struct {
}

func (m *MemoryStorage) Push(roleType string, groupId, qqAccount int64, content string) error {
	userMessageArr, err := m.GetArray(groupId, qqAccount)
	if err != nil {
		return err
	}
	*userMessageArr = append(*userMessageArr, map[string]string{"role": roleType, "content": content})
	if len(*userMessageArr) == 16 {
		*userMessageArr = (*userMessageArr)[4:]
		*userMessageArr = append([]map[string]string{getRoleMap(qqAccount, groupId)}, *userMessageArr...)
	}
	return nil
}

func (m *MemoryStorage) GetArray(groupId, qqAccount int64) (*[]map[string]string, error) {
	userMessageArr := messageMap[groupId+qqAccount]
	if userMessageArr == nil {
		userMessageArr = &[]map[string]string{}
		*userMessageArr = append(*userMessageArr, getRoleMap(qqAccount, groupId))
		messageMap[groupId+qqAccount] = userMessageArr
	}
	return userMessageArr, nil
}

func (m *MemoryStorage) GetArrayWithNewContent(roleType string, groupId, qqAccount int64, content string) ([]map[string]string, error) {
	arr, err := m.GetArray(groupId, qqAccount)
	if err != nil {
		return nil, err
	}
	newContent := map[string]string{"role": roleType, "content": content}
	return qqutil.AppendValue(*arr, newContent), nil
}

func (m *MemoryStorage) Clear(groupId, qqAccount int64) error {
	// delete(messageMap, groupId+qqAccount)
	// if qqAccount == 0 && groupId == 0 {
	// 	clear(messageMap)
	// } else if qqAccount == 0 {
	// 	for k := range messageMap {
	// 		// todo 这里需要处理, 因为key是通过整型相加, 而不是字符串相加
	// 		if strings.Contains(strconv.FormatInt(k, 10), strconv.FormatInt(groupId, 10)) {
	// 			delete(messageMap, k)
	// 		}
	// 	}
	// }
	clear(messageMap)
	return nil
}

type DbStorage struct{}

func (m *DbStorage) Push(roleType string, qqAccount int64, content string) error {
	return nil
}

func (m *DbStorage) GetArray(qqAccount int64) (*[]map[string]string, error) {
	return nil, nil
}

func (m *DbStorage) GetArrayWithNewContent(roleType string, qqAccount int64, content string) ([]map[string]string, error) {
	return nil, nil
}
