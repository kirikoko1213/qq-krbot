package obm

type ObmResponse[T any] struct {
	Status  string `json:"status"`
	Retcode int    `json:"retcode"`
	Message string `json:"message"`
	Wording string `json:"wording"`
	Data    T      `json:"data"`
}

/*
获取群列表
返回示例:

	{
		"group_id": 1006177553,
		"group_name": "†✰⇝树理♡†、🍬Lilithia†、树理老师.GPT",
		"group_memo": "",
		"group_create_time": 1724076140,
		"member_count": 3,
		"max_member_count": 200,
		"remark_name": ""
	}
*/
type GroupInfo struct {
	GroupId         int64  `json:"group_id"`
	GroupName       string `json:"group_name"`
	GroupMemo       string `json:"group_memo"`
	GroupCreateTime int64  `json:"group_create_time"`
	MemberCount     int64  `json:"member_count"`
	MaxMemberCount  int64  `json:"max_member_count"`
	RemarkName      string `json:"remark_name"`
}

/*
获取群成员信息
返回示例:

	"group_id": 717298252,
	"user_id": 442063283,
	"nickname": "！",
	"card": "找屎小能手黑猪盖🍜",
	"sex": "unknown",
	"age": 0,
	"area": "",
	"level": "100",
	"qq_level": 0,
	"join_time": 1668078968,
	"last_sent_time": 1750471881,
	"title_expire_time": 0,
	"unfriendly": false,
	"card_changeable": true,
	"is_robot": false,
	"shut_up_timestamp": 0,
	"role": "member",
	"title": "猪鼻大哥"
*/
type GroupMemberInfo struct {
	GroupId         int64  `json:"group_id"`
	UserId          int64  `json:"user_id"`
	Nickname        string `json:"nickname"`
	Card            string `json:"card"`
	Title           string `json:"title"`
	Sex             string `json:"sex"`
	Age             int64  `json:"age"`
	Area            string `json:"area"`
	Level           string `json:"level"`
	QQLevel         int64  `json:"qq_level"`
	JoinTime        int64  `json:"join_time"`
	LastSentTime    int64  `json:"last_sent_time"`
	TitleExpireTime int64  `json:"title_expire_time"`
	Unfriendly      bool   `json:"unfriendly"`
	CardChangeable  bool   `json:"card_changeable"`
}
