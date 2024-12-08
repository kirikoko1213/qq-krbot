package dao

import (
	"errors"
	"gorm.io/gorm"
)

type _AIRoleDao struct {
}

var AIRoleDao = new(_AIRoleDao)

func (a *_AIRoleDao) Get(qqAccount int64, groupId int64) (string, error) {
	aiRole := AIRole{}
	err := Sql.Where("qq_account=? AND group_id=?", qqAccount, groupId).Take(&aiRole).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return aiRole.Setting, nil
}

func (a *_AIRoleDao) Set(qqAccount int64, qqNickname string, groupId int64, groupName, setting string) error {
	aiRole := AIRole{}
	err := Sql.Where("qq_account=? AND group_id=?", qqAccount, groupId).Take(&aiRole).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
	}
	aiRole.QQAccount = qqAccount
	aiRole.QQNickname = qqNickname
	aiRole.GroupId = groupId
	aiRole.GroupName = groupName
	aiRole.Setting = setting
	err = Sql.Save(&aiRole).Error
	if err != nil {
		return err
	}
	return nil
}
