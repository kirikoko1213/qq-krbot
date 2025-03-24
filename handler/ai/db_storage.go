package ai_handler

type DbStorage struct{}

var dbStorage = &DbStorage{}

func (m *DbStorage) Push(roleType string, qqAccount int64, content string) error {
	return nil
}

func (m *DbStorage) GetArray(qqAccount int64) (*[]map[string]string, error) {
	return nil, nil
}

func (m *DbStorage) GetArrayWithNewContent(roleType string, qqAccount int64, content string) ([]map[string]string, error) {
	return nil, nil
}
