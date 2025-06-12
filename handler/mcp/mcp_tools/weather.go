package mcp_tools

import (
	"context"
	"fmt"
	"os"

	"github.com/kiririx/krutils/ut"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/tidwall/gjson"
)

func WeatherTool() (mcp.Tool, server.ToolHandlerFunc) {
	t := mcp.NewTool("weather",
		mcp.WithDescription("获取一个城市的天气，需要提供中文城市名称，如北京，上海，南京，广州等，用户必须明确指定查看天气相关信息时才调用"),
		mcp.WithString("city",
			mcp.Description("中文城市名称"),
			mcp.Required(),
		),
	)
	return t, handleWeatherTool
}

func handleWeatherTool(
	ctx context.Context,
	request mcp.CallToolRequest,
) (*mcp.CallToolResult, error) {
	arguments := request.Params.Arguments
	city, ok := arguments["city"].(string)
	if !ok {
		return nil, fmt.Errorf("city is required")
	}

	weather, err := getWeather(city)
	if err != nil {
		return nil, err
	}

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			mcp.TextContent{Type: "text", Text: weather},
		},
	}, nil
}

func getWeather(city string) (string, error) {
	baseURL := "http://apis.juhe.cn/simpleWeather/query"
	apiKey := os.Getenv("JUHE_KEY_SIMPLE_WEATHER")
	resp, err := ut.HttpClient().GetString(baseURL, map[string]string{
		"city": city,
		"key":  apiKey,
	})
	if err != nil {
		return "", fmt.Errorf("error getting weather: %v", err)
	}

	cityName := gjson.Get(resp, "result.city").String()
	weather := gjson.Get(resp, "result.realtime.info").String()
	temp := gjson.Get(resp, "result.realtime.temperature").String()
	humidity := gjson.Get(resp, "result.realtime.humidity").String()
	power := gjson.Get(resp, "result.realtime.power").String()
	direct := gjson.Get(resp, "result.realtime.direct").String()
	aqi := gjson.Get(resp, "result.realtime.aqi").String()

	return fmt.Sprintf("城市: %s\n天气: %s\n温度: %s\n湿度: %s\n风力: %s\n风向: %s\n空气质量: %s\n", cityName, weather, temp, humidity, power, direct, aqi), nil
}
