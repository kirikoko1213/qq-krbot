package handler

import "github.com/kiririx/krutils/ut"

type DNFHandler struct {
}

type DNFGold struct {
	Scale     float64
	TradeType string
}

func NewDNFHandler() *DNFHandler {
	return &DNFHandler{}
}

func (d *DNFHandler) Gold() ([]DNFGold, error) {
	url := "http://www.uu898.com/ashx/GameRetail.ashx?act=a001&g=95&a=2335&s=25080&c=-3&cmp=-1&_t=1639304944162"
	resp, err := ut.HttpClient().GetJSON(url, nil)
	if err != nil {
		return nil, err
	}
	gold := resp["list"].(map[string]interface{})["datas"].([]interface{})
	goldList := make([]DNFGold, 0)
	for _, v := range gold {
		goldList = append(goldList, DNFGold{
			Scale:     v.(map[string]interface{})["Scale"].(float64),
			TradeType: v.(map[string]interface{})["TradeType"].(string),
		})
	}
	return goldList, nil
}
