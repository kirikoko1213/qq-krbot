package dao

import "gorm.io/gorm"

type ContentModel struct {
	Tag     string `gorm:"column:tag"`
	Content string `gorm:"column:content"`
	gorm.Model
}

func (*ContentModel) TableName() string {
	return "content"
}

// SubscribeSubject 订阅的主题
type SubscribeSubject struct {
	Tag       string `gorm:"column:tag"`
	QQAccount string `gorm:"column:qq_account"`
	Active    bool   `gorm:"column:active"`
	gorm.Model
}

func (*SubscribeSubject) TableName() string {
	return "subscribe_subject"
}

type SubscribeUser struct {
	SubId     uint   `gorm:"column:sub_id"`
	QQAccount string `gorm:"column:qq_account"`
	gorm.Model
}

func (s *SubscribeUser) TableName() string {
	return "subscribe_user"
}

type Conversation struct {
	QQAccount  string `gorm:"column:qq_account"`
	QQNickname string `gorm:"column:qq_nickname"`
	GroupId    int64  `gorm:"column:group_id"`
	GroupName  string `gorm:"column:group_name"`
	Role       string `gorm:"column:role"`
	Content    string `gorm:"column:content"`
	gorm.Model
}

func (s *Conversation) TableName() string {
	return "conversation"
}

type AIRole struct {
	QQAccount  int64  `gorm:"column:qq_account"`
	QQNickname string `gorm:"column:qq_nickname"`
	GroupId    int64  `gorm:"column:group_id"`
	GroupName  string `gorm:"column:group_name"`
	Setting    string `gorm:"column:setting"`
	gorm.Model
}

func (s *AIRole) TableName() string {
	return "ai_role"
}

type MessageRecord struct {
	QQAccount   int64  `gorm:"column:qq_account"`
	QQNickname  string `gorm:"column:qq_nickname"`
	GroupId     int64  `gorm:"column:group_id"`
	GroupName   string `gorm:"column:group_name"`
	Message     string `gorm:"column:message"` // 这里存储的是携带CQ码的消息
	MessageType string `gorm:"column:message_type"`
	gorm.Model
}

func (s *MessageRecord) TableName() string {
	return "message_record"
}
