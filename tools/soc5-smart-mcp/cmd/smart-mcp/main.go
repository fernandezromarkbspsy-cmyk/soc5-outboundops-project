package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/example/soc5-smart-mcp/internal/app"
	"github.com/example/soc5-smart-mcp/internal/config"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func main() {
	configPath := flag.String("config", "", "path to smart-mcp.json")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Printf("configuration error: %v", err)
		os.Exit(1)
	}

	application := app.New(cfg)
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "soc5-smart-mcp",
		Version: "v0.1.0",
	}, nil)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "project_snapshot",
		Description: "Inspect the repository structure and detect the main technology stack without reading sensitive files.",
	}, application.ProjectSnapshot)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_project_file",
		Description: "Read a bounded line range from a non-sensitive file inside the configured project root.",
	}, application.ReadProjectFile)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "search_project",
		Description: "Search source and documentation files inside the project while excluding secrets, dependencies, and build output.",
	}, application.SearchProject)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "git_status",
		Description: "Return the current branch and concise repository status. This tool never modifies Git state.",
	}, application.GitStatus)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "git_diff",
		Description: "Return the current unstaged or staged Git diff. This tool never modifies Git state.",
	}, application.GitDiff)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "list_quality_checks",
		Description: "List the allowlisted project quality checks configured in smart-mcp.json.",
	}, application.ListQualityChecks)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "run_quality_check",
		Description: "Run one exact allowlisted test, lint, typecheck, vet, or build command. Arbitrary shell commands are not accepted.",
	}, application.RunQualityCheck)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_project_memory",
		Description: "Read durable project architecture decisions from .smart-mcp/memory.md.",
	}, application.ReadProjectMemory)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "record_project_decision",
		Description: "Append an approved architecture or workflow decision to .smart-mcp/memory.md.",
	}, application.RecordProjectDecision)

	// Never print normal logs to stdout in stdio mode; stdout is reserved for MCP JSON-RPC.
	log.SetOutput(os.Stderr)
	log.Printf("starting soc5-smart-mcp for %s", cfg.ProjectRoot)

	if err := server.Run(context.Background(), &mcp.StdioTransport{}); err != nil {
		fmt.Fprintln(os.Stderr, "MCP server stopped:", err)
		os.Exit(1)
	}
}
