package ai_handler

import "qq-krbot/qqutil"

type MemoryStorage struct {
}

var memStorage = &MemoryStorage{}

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
