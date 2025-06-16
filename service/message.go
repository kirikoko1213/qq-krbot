package svc

import (
	lg "qq-krbot/logx"
	"qq-krbot/model"
	"qq-krbot/repo"
)

type MessageService struct {
	messageRepo *repo.MessageRecordRepo
}

func NewMessageService() *MessageService {
	return &MessageService{
		messageRepo: repo.NewMessageRecordRepo(),
	}
}

func (m *MessageService) SaveMessage(message model.EngineParam) {
	err := m.messageRepo.Save(message.UserId, message.GroupId, message.RawMessage)
	if err != nil {
		lg.Log.Error(err)
	}
}

func (m *MessageService) GetMessage(userId int64, groupId int64) (string, error) {
	return "", nil
}
