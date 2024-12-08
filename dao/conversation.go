package dao

type _ConversationDao struct {
}

var ConversationDao = &_ConversationDao{}

func (*_ConversationDao) QueryLimit(limit int) ([]Conversation, error) {
	var result []Conversation
	err := Sql.Limit(limit).Order("created_at desc").Find(&result).Error
	if err != nil {
		return nil, err
	}
	return result, nil
}
