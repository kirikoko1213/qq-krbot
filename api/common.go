package api

import (
	"fmt"
	lg "qq-krbot/logx"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
)

func ResultSuccess(c *gin.Context, data any) {
	c.JSON(200, gin.H{
		"data":   data,
		"status": "success",
		"code":   "0",
	})
}

func ResultError(c *gin.Context, code string, err error) {
	// 记录错误调用栈
	callerInfo := getCallerInfo()
	lg.Log.Errorf("API业务错误 - 位置: %s, 错误码: %s, 错误信息: %v", callerInfo, code, err)

	c.JSON(200, gin.H{
		"msg":    err.Error(),
		"status": "error",
		"code":   code,
	})
}

// ResultHttpError HTTP状态码错误
func ResultHttpError(c *gin.Context, httpCode int, err error) {
	// 记录错误调用栈
	callerInfo := getCallerInfo()
	lg.Log.Errorf("API HTTP错误 - 位置: %s, HTTP状态码: %d, 错误信息: %v", callerInfo, httpCode, err)

	c.JSON(httpCode, gin.H{
		"msg":    err.Error(),
		"status": "error",
		"code":   fmt.Sprintf("%d", httpCode),
	})
}

// getCallerInfo 获取调用者信息
func getCallerInfo() string {
	for i := 2; i < 10; i++ {
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}

		funcName := runtime.FuncForPC(pc).Name()
		// 过滤掉当前文件和框架内部调用
		if strings.Contains(file, "qq-krbot") &&
			!strings.Contains(file, "common.go") &&
			!strings.Contains(funcName, "gin") &&
			!strings.Contains(funcName, "middleware") {
			return fmt.Sprintf("%s:%d [%s]", file, line, funcName)
		}
	}
	return "unknown"
}
