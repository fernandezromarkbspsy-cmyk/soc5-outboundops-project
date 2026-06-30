package app

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type EmptyInput struct{}

type CommandOutput struct {
	ExitCode  int    `json:"exit_code"`
	Output    string `json:"output"`
	Truncated bool   `json:"truncated"`
}

func (a *App) GitStatus(ctx context.Context, _ *mcp.CallToolRequest, _ EmptyInput) (*mcp.CallToolResult, CommandOutput, error) {
	return a.runReadOnlyCommand(ctx, a.Config.ProjectRoot, 30*time.Second, []string{"git", "status", "--short", "--branch"})
}

type GitDiffInput struct {
	Staged bool `json:"staged,omitempty"`
}

func (a *App) GitDiff(ctx context.Context, _ *mcp.CallToolRequest, input GitDiffInput) (*mcp.CallToolResult, CommandOutput, error) {
	args := []string{"git", "diff", "--no-ext-diff", "--unified=3"}
	if input.Staged {
		args = append(args, "--cached")
	}
	return a.runReadOnlyCommand(ctx, a.Config.ProjectRoot, 30*time.Second, args)
}

func (a *App) runReadOnlyCommand(ctx context.Context, dir string, timeout time.Duration, command []string) (*mcp.CallToolResult, CommandOutput, error) {
	if len(command) == 0 {
		return nil, CommandOutput{}, fmt.Errorf("empty command")
	}
	commandCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(commandCtx, command[0], command[1:]...)
	cmd.Dir = dir
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()

	output := stdout.String()
	if stderr.Len() > 0 {
		if output != "" && !strings.HasSuffix(output, "\n") {
			output += "\n"
		}
		output += stderr.String()
	}

	exitCode := 0
	if err != nil {
		if commandCtx.Err() == context.DeadlineExceeded {
			return nil, CommandOutput{}, fmt.Errorf("command timed out after %s", timeout)
		}
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, CommandOutput{}, err
		}
	}

	truncated := false
	if len(output) > a.Config.MaxCommandOutput {
		output = output[:a.Config.MaxCommandOutput] + "\n…output truncated…"
		truncated = true
	}

	return nil, CommandOutput{ExitCode: exitCode, Output: output, Truncated: truncated}, nil
}
