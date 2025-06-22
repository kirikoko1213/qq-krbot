package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	lg "qq-krbot/logx"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
)

// ResponseWriter 自定义响应写入器
type ResponseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

// Write 重写Write方法来捕获响应体
func (w ResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// ResponseLoggerMiddleware 响应日志中间件
func ResponseLoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 创建自定义响应写入器
		writer := &ResponseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBufferString(""),
		}
		c.Writer = writer

		// 处理请求
		c.Next()

		// 获取响应状态码
		statusCode := c.Writer.Status()

		// 获取响应体
		responseBody := writer.body.String()

		// 检查HTTP状态码
		if statusCode != 200 {
			logError(c, fmt.Sprintf("HTTP状态码错误: %d", statusCode), responseBody)
			return
		}

		// 检查业务状态码
		if responseBody != "" {
			var response map[string]interface{}
			if err := json.Unmarshal([]byte(responseBody), &response); err == nil {
				// 检查业务码（支持多种字段名）
				if checkBusinessCode(response) {
					logError(c, "业务状态码错误", responseBody)
				}
			}
		}
	}
}

// checkBusinessCode 检查业务状态码
func checkBusinessCode(response map[string]interface{}) bool {
	// 检查 code 字段
	if code, exists := response["code"]; exists {
		switch v := code.(type) {
		case float64:
			return v != 0
		case int:
			return v != 0
		case string:
			return v != "0" && v != ""
		}
	}

	// 检查 status 字段
	if status, exists := response["status"]; exists {
		if statusStr, ok := status.(string); ok {
			return statusStr == "error" || statusStr == "fail"
		}
	}

	return false
}

// logError 记录错误日志
func logError(c *gin.Context, errorType string, responseBody string) {
	// 获取调用栈信息
	var callerInfo string
	for i := 2; i < 10; i++ { // 从第2层开始，跳过中间件本身
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}

		// 获取函数名
		funcName := runtime.FuncForPC(pc).Name()

		// 过滤掉框架内部的调用
		if strings.Contains(file, "qq-krbot") &&
			!strings.Contains(file, "middleware.go") &&
			!strings.Contains(funcName, "gin") {
			callerInfo = fmt.Sprintf("%s:%d [%s]", file, line, funcName)
			break
		}
	}

	// 记录错误日志
	lg.Log.Errorf(`
=== API错误日志 ===
错误类型: %s
请求路径: %s %s
调用位置: %s
响应内容: %s
================`, errorType,
		c.Request.Method,
		c.Request.URL.Path,
		callerInfo,
		responseBody)
}

// ErrorTrackingMiddleware 错误追踪中间件（简化版）
func ErrorTrackingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 在上下文中添加错误追踪信息
		c.Set("caller_info", getCaller())
		c.Next()
	}
}

// getCaller 获取调用者信息
func getCaller() string {
	for i := 2; i < 10; i++ {
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}

		funcName := runtime.FuncForPC(pc).Name()
		if strings.Contains(file, "qq-krbot") &&
			!strings.Contains(file, "middleware.go") &&
			!strings.Contains(funcName, "gin") {
			return fmt.Sprintf("%s:%d [%s]", file, line, funcName)
		}
	}
	return "unknown"
}
