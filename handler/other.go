package handler

import (
	"errors"
	"fmt"
	"gorm.io/gorm"
	"strings"
)

func ExecuteSelectQuery(db *gorm.DB, query string) ([]map[string]string, error) {
	// 检查是否为SELECT查询
	if !strings.HasPrefix(strings.ToUpper(strings.TrimSpace(query)), "SELECT") {
		return nil, errors.New("只允许SELECT查询")
	}

	// 执行原生SQL查询
	var result []map[string]interface{}
	err := db.Raw(query).Scan(&result).Error
	if err != nil {
		return nil, err
	}

	// 将所有类型转换为string
	stringResult := make([]map[string]string, len(result))
	for i, row := range result {
		stringRow := make(map[string]string)
		for key, value := range row {
			stringRow[key] = toString(value)
		}
		stringResult[i] = stringRow
	}

	return stringResult, nil
}

func FormatResultAsTable(result []map[string]string) string {
	if len(result) == 0 {
		return "没有数据"
	}

	// 获取所有列名
	var columns []string
	for col := range result[0] {
		columns = append(columns, col)
	}

	// 计算每列的最大宽度
	colWidths := make(map[string]int)
	for _, col := range columns {
		colWidths[col] = len(col)
		for _, row := range result {
			if len(row[col]) > colWidths[col] {
				colWidths[col] = len(row[col])
			}
		}
	}

	// 构建表头
	var sb strings.Builder
	sb.WriteString("+")
	for _, col := range columns {
		sb.WriteString(strings.Repeat("-", colWidths[col]+2))
		sb.WriteString("+")
	}
	sb.WriteString("\n|")
	for _, col := range columns {
		sb.WriteString(fmt.Sprintf(" %-*s |", colWidths[col], col))
	}
	sb.WriteString("\n+")
	for _, col := range columns {
		sb.WriteString(strings.Repeat("-", colWidths[col]+2))
		sb.WriteString("+")
	}
	sb.WriteString("\n")

	// 添加数据行
	for _, row := range result {
		sb.WriteString("|")
		for _, col := range columns {
			sb.WriteString(fmt.Sprintf(" %-*s |", colWidths[col], row[col]))
		}
		sb.WriteString("\n")
	}

	// 添加底部边框
	sb.WriteString("+")
	for _, col := range columns {
		sb.WriteString(strings.Repeat("-", colWidths[col]+2))
		sb.WriteString("+")
	}
	sb.WriteString("\n")

	return sb.String()
}

// 辅助函数：将任何类型转换为string
func toString(value interface{}) string {
	if value == nil {
		return "NULL"
	}
	switch v := value.(type) {
	case bool:
		return fmt.Sprintf("%t", v)
	case int, int8, int16, int32, int64:
		return fmt.Sprintf("%d", v)
	case uint, uint8, uint16, uint32, uint64:
		return fmt.Sprintf("%d", v)
	case float32, float64:
		return fmt.Sprintf("%f", v)
	case string:
		return v
	default:
		return fmt.Sprintf("%v", v)
	}
}
