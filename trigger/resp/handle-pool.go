package resp

import "qq-krbot/req"

type Handle struct {
	Description string `json:"description"`
	Func        func(*req.TriggerParameter) (string, error)
}

var HandlePool []*Handle = make([]*Handle, 0)

func GetHandler(desc string) *Handle {
	for _, handle := range HandlePool {
		if handle.Description == desc {
			return handle
		}
	}
	return nil
}

func init() {
	HandlePool = append(HandlePool, &Handle{
		Description: "下班时间倒计时",
		Func:        OffWorkTimeAnnounce,
	})
	HandlePool = append(HandlePool, &Handle{
		Description: "假期倒计时",
		Func:        HolidayAnnounce,
	})
	HandlePool = append(HandlePool, &Handle{
		Description: "群发言排名",
		Func:        RankOfGroupMsg,
	})
	HandlePool = append(HandlePool, &Handle{
		Description: "人格分析",
		Func:        CharacterPortrait,
	})
	HandlePool = append(HandlePool, &Handle{
		Description: "智能神回复",
		Func:        SmartReply,
	})
	HandlePool = append(HandlePool, &Handle{
		Description: "SQL执行",
		Func:        ExecSQL,
	})
}
