package repo

import (
	"github.com/kiririx/krutils/ut"
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

func (*MemberAliasRepo) FindByGroupIdAndQQAccount(groupId int64, qqAccount int64) (MemberAliasModel, error) {
	tx := Sql.Model(&MemberAliasModel{})
	tx.Where("group_id = ?", groupId)
	tx.Where("qq_account = ?", qqAccount)
	var alias MemberAliasModel
	err := tx.First(&alias).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return MemberAliasModel{}, nil
		}
		return MemberAliasModel{}, err
	}
	return alias, nil
}

func (receiver *MemberAliasRepo) UpdateAlias(groupId int64, qqAccountId int64, alias []string) error {
	memberAlias, err := receiver.FindByGroupIdAndQQAccount(groupId, qqAccountId)
	if err != nil {
		return err
	}
	updated := memberAlias.ID != 0
	// 根据 groupId 和 qqAccountId 更新 alias，将 []string 转换为 json 字符串
	tx := Sql.Model(&MemberAliasModel{})
	tx.Where("group_id = ?", groupId)
	tx.Where("qq_account = ?", qqAccountId)
	if updated {
		err = tx.Update("alias", ut.JSON().ToString(alias).Result.(string)).Error // 更新 alias 字段
	} else {
		err = tx.Create(&MemberAliasModel{
			GroupId:   groupId,
			QQAccount: qqAccountId,
			Alias:     ut.JSON().ToString(alias).Result.(string),
		}).Error
	}
	if err != nil {
		return err
	}
	return nil
}
