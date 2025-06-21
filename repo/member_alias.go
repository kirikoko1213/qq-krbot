package repo

import (
	"github.com/tidwall/gjson"
	"gorm.io/gorm"
)

type MemberAliasModel struct {
	GroupId   int64  `json:"groupId" gorm:"group_id"`
	QQAccount int64  `json:"qqAccount" gorm:"qq_account"`
	Alias     string `json:"alias" gorm:"alias"` // 别名，存储 json 数组
	gorm.Model
}

func (m *MemberAliasModel) TableName() string {
	return "member_alias"
}

type MemberAliasRepo struct{}

func NewMemberAliasRepo() *MemberAliasRepo {
	return &MemberAliasRepo{}
}

func (*MemberAliasRepo) FindAliasByGroupIdAndQQAccount(groupId int64, qqAccount int64) ([]string, error) {
	tx := Sql.Model(&MemberAliasModel{})
	tx.Where("group_id = ?", groupId)
	tx.Where("qq_account = ?", qqAccount)
	tx.Select("alias")
	var alias string
	err := tx.First(&alias).Error
	if err != nil {
		return nil, err
	}
	aliasJson := gjson.Parse(alias)
	aliasArray := aliasJson.Array()
	aliases := make([]string, 0, len(aliasArray))
	for _, item := range aliasArray {
		aliases = append(aliases, item.String())
	}
	return aliases, nil
}

func (*MemberAliasRepo) FindAliasByGroupId(groupId int64) ([]MemberAliasModel, error) {
	tx := Sql.Model(&MemberAliasModel{})
	tx.Where("group_id = ?", groupId)
	var alias []MemberAliasModel
	err := tx.Find(&alias).Error
	if err != nil {
		return nil, err
	}
	return alias, nil
}
