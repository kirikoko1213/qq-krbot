package repo

import (
	"errors"
	"gorm.io/gorm"
)

type AIRoleRepo struct {
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

func NewAIRepoRole() *AIRoleRepo {
	return &AIRoleRepo{}
}

func (a *AIRoleRepo) Get(qqAccount int64, groupId int64) (string, error) {
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

func (a *AIRoleRepo) Set(qqAccount int64, qqNickname string, groupId int64, groupName, setting string) error {
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
