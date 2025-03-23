package handler

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

var ctx context.Context

func init() {
	err := initMCPClient()
	if err != nil {
		panic(err)
	}
	// 定期 ping，如果连接断开则重新连接
	go func() {
		for {
			time.Sleep(2 * time.Second)
			err := mcpClient.Ping(ctx)
			if err != nil {
				lg.Log.Error(err)
				initMCPClient()
			}
		}
	}()
}

func MCPClient() *client.SSEMCPClient {
	return mcpClient
}

func initMCPClient() error {
	mcpURL := env.Get("mcp.url")
	mcpName := env.Get("mcp.name")
	var err error
	mcpClient, err = client.NewSSEMCPClient(mcpURL)
	if err != nil {
		return err
	}

	ctx = context.Background()

	// Start the client
	if err := mcpClient.Start(ctx); err != nil {
		return err
	}

	// Initialize
	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    mcpName,
		Version: "1.0.0",
	}

	result, err := mcpClient.Initialize(ctx, initRequest)
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
