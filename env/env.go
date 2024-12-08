package env

import (
	"github.com/kiririx/easy-config/ec"
	"github.com/kiririx/krutils/convertx"
)

func Get(key string) string {
	return PropertiesEnv.Get(key)
}

var OneBotURL string

var PropertiesEnv ec.Handler

var DbEnv ec.Handler

func init() {
	PropertiesEnv = ec.Initialize(ec.NewPropertiesStorage("./config.properties"), "main")
	DbEnv = ec.Initialize(ec.NewMySQLStorage(
		PropertiesEnv.Get("mysql.host"),
		convertx.StringToInt(PropertiesEnv.Get("mysql.port")),
		PropertiesEnv.Get("mysql.username"),
		PropertiesEnv.Get("mysql.password"),
		PropertiesEnv.Get("mysql.database"),
	), "main")
	OneBotURL = PropertiesEnv.Get("onebot.http.url")
}
