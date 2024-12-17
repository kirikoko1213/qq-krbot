package repo

import (
	"gorm.io/gorm"
	"time"
)

type DynamicTriggerModel struct {
	MessageType        string `json:"messageType" gorm:"message_type"`                // at pr gr
	ConditionType      string `json:"conditionType" gorm:"condition_type"`            // equal contains startWith endWith handler
	ConditionValue     string `json:"conditionValue" gorm:"condition_value"`          //
	TriggerContentType string `json:"triggerContentType" gorm:"trigger_content_type"` // text image ai api func
	TriggerContent     string `json:"triggerContent" gorm:"trigger_content"`          // 触发内容
	Sequence           int64  `json:"sequence" gorm:"sequence"`                       // 执行顺序
	Description        string `json:"description" gorm:"description"`
	gorm.Model
}

type DynamicTriggerRepo struct{}

func NewDynamicTriggerRepo() *DynamicTriggerRepo {
	return &DynamicTriggerRepo{}
}

func (*DynamicTriggerRepo) FindList(model *DynamicTriggerModel) ([]DynamicTriggerModel, error) {
	tx := Sql.Model(&DynamicTriggerModel{})
	if model.MessageType != "" {
		tx.Where("trigger_type = ?", model.MessageType)
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
	tx.Order("sequence asc")
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
	return Sql.Delete(&DynamicTriggerModel{}, id).Error
}

func (*DynamicTriggerRepo) GetMaxSequence() (int64, error) {
	var maxSequence any
	err := Sql.Model(&DynamicTriggerModel{}).Select("MAX(sequence)").Row().Scan(&maxSequence)
	if err != nil {
		return 0, err
	}
	if maxSequence == nil {
		return 0, nil
	}
	return maxSequence.(int64), nil
}

func (d *DynamicTriggerRepo) Save(model *DynamicTriggerModel) (*DynamicTriggerModel, error) {
	if model.ID != 0 {
		dbModel, err := d.FindOne(int64(model.ID))
		if err != nil {
			return nil, err
		}
		model.UpdatedAt = time.Now()
		model.CreatedAt = dbModel.CreatedAt
	} else {
		model.CreatedAt = time.Now()
		// 使用 GORM 的 Save 方法将数据保存或更新到数据库
		maxSequence, err := d.GetMaxSequence()
		if err != nil {
			return nil, err
		}
		model.Sequence = maxSequence + 1
	}
	if err := Sql.Save(model).Error; err != nil {
		return nil, err // 如果保存或更新失败，返回 nil 和错误信息
	}
	return model, nil // 保存或更新成功，返回保存后的模型和 nil
}
