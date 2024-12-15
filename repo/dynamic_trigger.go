package repo

import (
	"gorm.io/gorm"
)

type DynamicTriggerModel struct {
	TriggerType        string // at pr gr
	ConditionType      string // equal contains startWith endWith handler
	ConditionValue     string //
	TriggerContentType string // text image ai api func
	TriggerContent     string // 触发内容
	Sequence           int64  // 执行顺序
	gorm.Model
}

type DynamicTriggerRepo struct{}

func NewDynamicTriggerRepo() *DynamicTriggerRepo {
	return &DynamicTriggerRepo{}
}

func (*DynamicTriggerRepo) FindList(model *DynamicTriggerModel) ([]DynamicTriggerModel, error) {
	tx := Sql.Model(&DynamicTriggerModel{})
	if model.TriggerType != "" {
		tx.Where("trigger_type = ?", model.TriggerType)
	}
	if model.ConditionType != "" {
		tx.Where("condition_type = ?", model.ConditionType)
	}
	if model.TriggerContentType != "" {
		tx.Where("trigger_content_type = ?", model.TriggerContent)
	}
	if model.TriggerContent != "" {
		tx.Where("trigger_content = ?", model.TriggerContent)
	}
	var result []DynamicTriggerModel
	err := tx.Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (*DynamicTriggerRepo) FindOne(id int64) (*DynamicTriggerModel, error) {
	var model DynamicTriggerModel
	err := Sql.Take(&model, "id=?", id).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (*DynamicTriggerRepo) Delete(id int64) error {
	return Sql.Delete(&DynamicTriggerModel{}, "id=?", id).Error
}

func (*DynamicTriggerRepo) Save(model *DynamicTriggerModel) (*DynamicTriggerModel, error) {
	// 使用 GORM 的 Save 方法将数据保存或更新到数据库
	if err := Sql.Save(model).Error; err != nil {
		return nil, err // 如果保存或更新失败，返回 nil 和错误信息
	}
	return model, nil // 保存或更新成功，返回保存后的模型和 nil
}
