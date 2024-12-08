package lg

import (
	"github.com/sirupsen/logrus"
	"io"
	"log"
	"os"
)

var Log *logrus.Logger

func init() {
	Log = logrus.New()

	// 创建文件
	file, err := os.OpenFile("./log.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		Log.Info("无法打开日志文件，使用默认输出")
	}
	// 将日志同时写入控制台和文件
	log.SetOutput(io.MultiWriter(os.Stdout, file))
}
