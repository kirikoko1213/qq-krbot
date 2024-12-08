package handler

import (
	"fmt"
	"github.com/kiririx/krutils/convertx"
	"github.com/kiririx/krutils/httpx"
	"github.com/kiririx/krutils/strx"
	"github.com/tidwall/gjson"
	"qq-krbot/dao"
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
	if env.Get("storage.engine") == "db" {
		setting, err := dao.AIRoleDao.Get(qqAccount, groupId)
		if err != nil {
			lg.Log.Error(err)
		}
		if setting != "" {
			return setting
		}
	}
	return env.Get("ai.setting")
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

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("解析json错误")
			fmt.Println(json)
		}
	}()

	content := gjson.Get(json, "choices.0.message.content").String()
	return strx.TrimSpace(content), nil
}

func (*_AIHandler) Do(param *req.Param) (string, error) {
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

	defer func() {
		if err := recover(); err != nil {
			fmt.Println("解析json错误")
			fmt.Println(json)
		}
	}()

	content := gjson.Get(json, "choices.0.message.content").String()
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
	delete(messageMap, groupId+qqAccount)
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
