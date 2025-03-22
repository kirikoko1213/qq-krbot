package main

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
)

func TestMCP(t *testing.T) {
	client, err := client.NewSSEMCPClient("http://localhost:3001/sse")
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Start the client
	if err := client.Start(ctx); err != nil {
		t.Fatalf("Failed to start client: %v", err)
	}

	// Initialize
	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    "Demo",
		Version: "1.0.0",
	}

	result, err := client.Initialize(ctx, initRequest)
	if err != nil {
		t.Fatalf("Failed to initialize: %v", err)
	}

	if result.ServerInfo.Name != "Demo" {
		t.Errorf(
			"Expected server name 'Demo', got '%s'",
			result.ServerInfo.Name,
		)
	}

	// Test Ping
	if err := client.Ping(ctx); err != nil {
		t.Errorf("Ping failed: %v", err)
	}

	// Test ListTools
	toolsRequest := mcp.ListToolsRequest{}
	tools, err := client.ListTools(ctx, toolsRequest)
	if err != nil {
		t.Errorf("ListTools failed: %v", err)
	}
	for _, tool := range tools.Tools {
		t.Log(tool.Description)
		fmt.Println(tool.Description)
	}
}
