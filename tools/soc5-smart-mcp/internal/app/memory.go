package app

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ReadMemoryOutput struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func (a *App) ReadProjectMemory(_ context.Context, _ *mcp.CallToolRequest, _ EmptyInput) (*mcp.CallToolResult, ReadMemoryOutput, error) {
	path := filepath.Join(a.Config.ProjectRoot, ".smart-mcp", "memory.md")
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, ReadMemoryOutput{Path: ".smart-mcp/memory.md", Content: "# Project Memory\n\nNo decisions recorded yet.\n"}, nil
	}
	if err != nil {
		return nil, ReadMemoryOutput{}, err
	}
	return nil, ReadMemoryOutput{Path: ".smart-mcp/memory.md", Content: string(data)}, nil
}

type RecordDecisionInput struct {
	Title    string `json:"title" jsonschema:"short decision title"`
	Decision string `json:"decision" jsonschema:"what was decided"`
	Reason   string `json:"reason" jsonschema:"why this decision was made"`
}

type RecordDecisionOutput struct {
	Path    string `json:"path"`
	Written bool   `json:"written"`
}

func (a *App) RecordProjectDecision(_ context.Context, _ *mcp.CallToolRequest, input RecordDecisionInput) (*mcp.CallToolResult, RecordDecisionOutput, error) {
	if !a.Config.AllowMemoryWrites {
		return nil, RecordDecisionOutput{}, fmt.Errorf("memory writes are disabled in smart-mcp.json")
	}
	title := strings.TrimSpace(input.Title)
	decision := strings.TrimSpace(input.Decision)
	reason := strings.TrimSpace(input.Reason)
	if title == "" || decision == "" {
		return nil, RecordDecisionOutput{}, fmt.Errorf("title and decision are required")
	}

	dir := filepath.Join(a.Config.ProjectRoot, ".smart-mcp")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, RecordDecisionOutput{}, err
	}
	path := filepath.Join(dir, "memory.md")

	if _, err := os.Stat(path); os.IsNotExist(err) {
		if err := os.WriteFile(path, []byte("# Project Memory\n\n"), 0o644); err != nil {
			return nil, RecordDecisionOutput{}, err
		}
	}

	entry := fmt.Sprintf("## %s — %s\n\n**Decision:** %s\n\n**Reason:** %s\n\n", time.Now().Format("2006-01-02"), title, decision, reason)
	file, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return nil, RecordDecisionOutput{}, err
	}
	defer file.Close()
	if _, err := file.WriteString(entry); err != nil {
		return nil, RecordDecisionOutput{}, err
	}

	return nil, RecordDecisionOutput{Path: ".smart-mcp/memory.md", Written: true}, nil
}
