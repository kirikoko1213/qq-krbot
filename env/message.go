package env

type MessageRangeType = string
type MessageCqType = string

// 消息范围
const (
	RangePr MessageRangeType = "private"
	RangeGr MessageRangeType = "group"
)

// CQ 代码
const (
	CqAt      MessageCqType = "at"
	CqRecord  MessageCqType = "record"
	CqImage   MessageCqType = "image"
	CqVideo   MessageCqType = "video"
	CqVoice   MessageCqType = "voice"
	CqFile    MessageCqType = "file"
	CqMusic   MessageCqType = "music"
	CqForward MessageCqType = "forward"
)
