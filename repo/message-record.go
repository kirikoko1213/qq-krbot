package repo

import (
	"gorm.io/gorm"
	"qq-krbot/qqutil"
	"time"
)

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

type MessageRecordRepo struct {
}

func NewMessageRecordRepo() *MessageRecordRepo {
	return &MessageRecordRepo{}
}

func (m *MessageRecordRepo) Save(qqAccount int64, groupId int64, message string) error {
	err := Sql.Save(&MessageRecord{
		QQAccount:   qqAccount,
		QQNickname:  "",
		GroupId:     groupId,
		GroupName:   "",
		Message:     message,
		MessageType: "",
	}).Error
	if err != nil {
		return err
	}
	return nil
}

type RankWithGroupResult = []struct {
	QQAccount int64
	Count     int64
}

func (m *MessageRecordRepo) RankWithGroupAndToday(groupId int64) RankWithGroupResult {
	// 执行查询
	var results []struct {
		QQAccount int64
		Count     int64
	}
	// 获取今天的日期
	today := time.Now().Format("2006-01-02")
	Sql.Model(&MessageRecord{}).
		Select("qq_account, COUNT(*) AS count").
		Where("group_id = ?", groupId).
		Where("DATE(created_at) = ?", today).
		Group("qq_account").
		Order("count DESC").
		Scan(&results)
	return results
}

func (m *MessageRecordRepo) RankWithGroupAndYesterday(groupId int64) RankWithGroupResult {
	// 执行查询
	var results []struct {
		QQAccount int64
		Count     int64
	}
	// 获取昨天的日期
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	Sql.Model(&MessageRecord{}).
		Select("qq_account, COUNT(*) AS count").
		Where("group_id = ?", groupId).
		Where("DATE(created_at) = ?", yesterday).
		Group("qq_account").
		Order("count DESC").
		Scan(&results)
	return results
}

// FindQQAccountsByDateAndGroupId 根据群id查询指定时间区间的qq号
func (m *MessageRecordRepo) FindQQAccountsByDateAndGroupId(groupId int64, startDateTime time.Time, endDateTime time.Time) []int64 {
	var results []int64
	Sql.Model(&MessageRecord{}).
		Select("qq_account").
		Where("group_id = ?", groupId).
		Where("DATE(created_at) >= ?", startDateTime).
		Where("DATE(created_at) <= ?", endDateTime).
		Group("qq_account").
		Scan(&results)
	return results
}

// FindTextMessageByQQAccountAndGroupId 查询文字消息的最后limit条, 当文字超出100, 不参与统计
func (m *MessageRecordRepo) FindTextMessageByQQAccountAndGroupId(groupId int64, qqAccount int64, limit int) []string {
	var results []string
	Sql.Model(&MessageRecord{}).
		Select("message").
		Where("group_id = ?", groupId).
		Where("qq_account = ?", qqAccount).
		Where("message not like ?", "[CQ%").
		Where("char_length(message) <= 100").
		Order("created_at DESC").
		Limit(limit).
		Scan(&results)
	return qqutil.ReverseNewSlice(results)
}
