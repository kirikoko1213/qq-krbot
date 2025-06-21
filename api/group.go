package api

import (
	"errors"
	"net/http"
	bot_handler "qq-krbot/handler/bot_engine"
	lg "qq-krbot/logx"
	"qq-krbot/repo"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kiririx/krutils/ut"
)

// GroupInfo 群组信息
type GroupInfo struct {
	GroupId   string `json:"groupId"`
	GroupName string `json:"groupName"`
}

// UpdateAliasRequest 更新别名请求
type UpdateAliasRequest struct {
	GroupId string   `json:"groupId" binding:"required"`
	QQ      string   `json:"qq" binding:"required"`
	Alias   []string `json:"alias"`
}

// GroupAPI 群组管理API
type GroupAPI struct {
	// 这里可以存储一些配置或依赖
}

// NewGroupAPI 创建群组API实例
func NewGroupAPI() *GroupAPI {
	return &GroupAPI{}
}

// GetGroupList 获取群组列表
func (g *GroupAPI) GetGroupList(c *gin.Context) {
	// 调用OneBot API获取群组列表
	groupList, err := bot_handler.OneBotHandler.GetGroupList(false)
	if err != nil {
		lg.Log.Error("获取群组列表失败:", err)
		ResultError(c, "500", err)
		return
	}

	// 转换为前端需要的格式
	groups := make([]GroupInfo, 0, len(groupList.Data))
	for _, group := range groupList.Data {
		groups = append(groups, GroupInfo{
			GroupId:   strconv.FormatInt(group.GroupId, 10),
			GroupName: group.GroupName,
		})
	}
	ResultSuccess(c, groups)
}

// GetMemberList 获取群员列表
func (g *GroupAPI) GetMemberList(c *gin.Context) {
	groupId := c.Param("groupId")
	if groupId == "" {
		ResultError(c, "400", errors.New("群号不能为空"))
		return
	}

	// 调用OneBot API获取群员列表
	memberList, err := bot_handler.OneBotHandler.GetGroupMemberList(ut.Convert(groupId).Int64Value(), false)
	if err != nil {
		lg.Log.Error("获取群员列表失败:", err)
		ResultError(c, "500", err)
		return
	}

	aliasList, err := repo.NewMemberAliasRepo().FindAliasByGroupId(ut.Convert(groupId).Int64Value())
	if err != nil {
		lg.Log.Error("获取群员别名失败:", err)
		ResultError(c, "500", err)
		return
	}

	// 转换为前端需要的格式
	members := make([]map[string]any, 0, len(memberList.Data))
	for _, item := range memberList.Data {
		userId := item.UserId
		nickname := item.Nickname
		card := item.Card

		// 这里可以从数据库获取用户的自定义别名
		// 暂时使用群名片作为别名
		alias := []string{}
		for _, item := range aliasList {
			if item.QQAccount == userId {
				alias = append(alias, item.Alias)
			}
		}

		members = append(members, map[string]any{
			"groupId":   groupId,
			"qqAccount": ut.Convert(userId).StringValue(),
			"nickname":  nickname,
			"card":      card,
			"alias":     alias,
		})
	}

	ResultSuccess(c, map[string]any{
		"list":  members,
		"total": len(memberList.Data),
	})
}

// UpdateMemberAlias 更新群员别名
func (g *GroupAPI) UpdateMemberAlias(c *gin.Context) {
	var req UpdateAliasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code":    400,
			"message": "请求参数错误: " + err.Error(),
			"data":    nil,
		})
		return
	}

	// 这里应该将别名保存到数据库
	// 暂时只是打印日志表示保存成功
	lg.Log.Infof("更新群员别名: 群号=%s, QQ=%s, 别名=%v", req.GroupId, req.QQ, req.Alias)

	// TODO: 实际项目中应该调用数据库服务保存别名
	// 例如: err := g.memberService.UpdateAlias(req.GroupId, req.QQ, req.Alias)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "别名更新成功",
		"data":    nil,
	})
}
