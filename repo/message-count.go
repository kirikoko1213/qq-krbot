package repo

import "gorm.io/gorm"

type MessageCount struct {
	userId   string `gorm:"column:user_id"`
	GroupId  string `gorm:"column:group_id"`
	Quantity int64  `gorm:"column:quantity"`
	gorm.Model
}

func (s *MessageCount) TableName() string {
	return "message_count"
}

type MessageCountRepo struct {
}
