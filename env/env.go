package env

import (
	"github.com/kiririx/easy-config/ec"
	"github.com/kiririx/krutils/convertx"
	"os"
)

type Mode = string

var ModeDB = "db"
var ModeProps = "properties"

func getterWithMode(mode Mode) ec.Handler {
	if mode == ModeDB {
		return DbEnv
	}
	if mode == ModeProps {
		return PropertiesEnv
	}
	return nil
}

func GetWithMode(mode Mode, key string) string {
	return getterWithMode(mode).Get(key)
}

func SetWithMode(mode Mode, key string, value string) {
	getterWithMode(mode).Set(key, value)
}

func Get(key string) string {
	v := os.Getenv(key)
	if v == "" {
		v = PropertiesEnv.Get(key)
	}
	if v == "" {
		v = GetWithDB(key)
	}
	return v
}

func List() []ec.Item {
	return DbEnv.List()
}

func GetWithDB(key string) string {
	return DbEnv.Get(key)
}

func SetWithDB(key string, value string) {
	DbEnv.Set(key, value)
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
