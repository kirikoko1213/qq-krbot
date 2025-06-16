package mcp_tools

import (
	"context"
	bot_handler "qq-krbot/handler/bot_engine"
	"qq-krbot/repo"

	"github.com/kiririx/krutils/ut"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

func QQGroupMessageRankTool() (mcp.Tool, server.ToolHandlerFunc) {
	t := mcp.NewTool("qq_group_message_rank",
		mcp.WithDescription("获取QQ群消息每个人的发言排行榜"),
		mcp.WithString("groupId",
			mcp.Description("QQ群ID"),
			mcp.Required(),
		),
	)
	return t, handleQQGroupMessageRankTool
}

func handleQQGroupMessageRankTool(
	ctx context.Context,
	request mcp.CallToolRequest,
) (*mcp.CallToolResult, error) {
	groupId := ut.Convert(request.Params.Arguments["groupId"]).Int64Value()
	rank, err := QQGroupMessageRank(groupId)
	if err != nil {
		return nil, err
	}
	return &mcp.CallToolResult{Content: []mcp.Content{mcp.TextContent{Type: "text", Text: rank}}}, nil
}

// QQGroupMessageRank 获取QQ群消息排行榜
func QQGroupMessageRank(groupId int64) (string, error) {
	rankArray := repo.NewMessageRecordRepo().RankWithGroupAndToday(groupId)
	// 只取前5名
	if len(rankArray) > 5 {
		rankArray = rankArray[:5]
	}
	handler := bot_handler.NewRankHandler()
	return handler.BuildResponseString(rankArray, groupId), nil
}
