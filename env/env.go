package env

import (
	"os"

	"github.com/kiririx/easy-config/ec"
	"github.com/kiririx/krutils/ut"
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

var PropertiesEnv ec.Handler

var DbEnv ec.Handler

func init() {
	PropertiesEnv = ec.Initialize(ec.NewPropertiesStorage("./config.properties"), "main")
	DbEnv = ec.Initialize(ec.NewMySQLStorage(
		Get("mysql.host"),
		ut.Convert(Get("mysql.port")).IntValue(),
		Get("mysql.username"),
		Get("mysql.password"),
		Get("mysql.database"),
	), "main")
}
