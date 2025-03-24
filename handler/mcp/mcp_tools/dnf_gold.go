package mcp_tools

import (
	"context"
	"fmt"

	"github.com/kiririx/krutils/ut"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/tidwall/gjson"
)

func DnfGoldTool() (mcp.Tool, server.ToolHandlerFunc) {
	t := mcp.NewTool("dnf_gold",
		mcp.WithDescription("获取 DNF 金币价格，DNF 是地下城与勇士的缩写，是一个网络游戏，数据来源是 UU898"),
	)
	return t, handleDnfGoldTool
}

func handleDnfGoldTool(
	ctx context.Context,
	request mcp.CallToolRequest,
) (*mcp.CallToolResult, error) {
	goldList, err := getDnfGold()
	if err != nil {
		return nil, err
	}

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			mcp.TextContent{Type: "text", Text: goldList},
		},
	}, nil
}

type DNFGold struct {
	Scale     float64 `json:"Scale"`
	TradeType string  `json:"TradeType"`
}

func getDnfGold() (string, error) {
	baseURL := "http://www.uu898.com/ashx/GameRetail.ashx?act=a001&g=95&a=2335&s=25080&c=-3&cmp=-1&_t=1639304944162"

	resp, err := ut.HttpClient().GetString(baseURL, nil)
	if err != nil {
		return "", err
	}
	goldItems := gjson.Get(resp, "list.datas").Array()
	goldList := make([]DNFGold, 0, len(goldItems))
	for _, item := range goldItems {
		goldList = append(goldList, DNFGold{
			Scale:     item.Get("Scale").Float(),
			TradeType: item.Get("TradeType").String(),
		})
	}
	result := "当前DNF金币价格：\n"
	for _, gold := range goldList {
		result += fmt.Sprintf("比例: %.2f万 / ¥1, 交易类型: %s\n", gold.Scale, gold.TradeType)
	}
	return result, nil
}
