package ai_handler

import "qq-krbot/env"

type Storage interface {
	Push(roleType string, groupId, qqAccount int64, content string) error
	GetArray(groupId, qqAccount int64) (*[]map[string]string, error)
	GetArrayWithNewContent(roleType string, groupId, qqAccount int64, content string) ([]map[string]string, error)
	Clear(groupId, qqAccount int64) error
}

func getStorage() Storage {
	if env.Get("storage.engine") == "db" {
		return memStorage
	} else {
		// todo dbStorage
		return memStorage
	}
}
