package kr_mcp

import (
	"context"
	"fmt"
	"qq-krbot/env"
	lg "qq-krbot/logx"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

var mcpClient *client.SSEMCPClient

var sseCtx context.Context

func InitSSEMCPClient() {
	if env.Get("mcp.url") == "" {
		return
	}
	err := initSSEMCPClient()
	if err != nil {
		panic(err)
	}
	// 定期 ping，如果连接断开则重新连接
	go func() {
		for {
			time.Sleep(2 * time.Second)
			err := mcpClient.Ping(sseCtx)
			if err != nil {
				lg.Log.Error(err)
				initSSEMCPClient()
			}
		}
	}()
}

func SSEMCPClient() *client.SSEMCPClient {
	return mcpClient
}

func initSSEMCPClient() error {
	mcpURL := env.Get("mcp.url")
	mcpName := env.Get("mcp.name")
	var err error
	mcpClient, err = client.NewSSEMCPClient(mcpURL)
	if err != nil {
		return err
	}

	sseCtx = context.Background()

	// Start the client
	if err := mcpClient.Start(sseCtx); err != nil {
		return err
	}

	// Initialize
	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    mcpName,
		Version: "1.0.0",
	}

	result, err := mcpClient.Initialize(sseCtx, initRequest)
	if err != nil {
		return err
	}

	if result.ServerInfo.Name != mcpName {
		return fmt.Errorf(
			"Expected server name '%s', got '%s'",
			mcpName,
			result.ServerInfo.Name,
		)
	}

	return nil
}
