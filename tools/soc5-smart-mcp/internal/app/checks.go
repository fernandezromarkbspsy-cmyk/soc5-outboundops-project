package app

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ListChecksOutput struct {
	Checks []string `json:"checks"`
}

func (a *App) ListQualityChecks(_ context.Context, _ *mcp.CallToolRequest, _ EmptyInput) (*mcp.CallToolResult, ListChecksOutput, error) {
	checks := make([]string, 0, len(a.Config.Checks))
	for name := range a.Config.Checks {
		checks = append(checks, name)
	}
	sort.Strings(checks)
	return nil, ListChecksOutput{Checks: checks}, nil
}

type RunCheckInput struct {
	Name string `json:"name" jsonschema:"exact check name returned by list_quality_checks"`
}

type RunCheckOutput struct {
	Name       string   `json:"name"`
	Directory  string   `json:"directory"`
	Command    []string `json:"command"`
	ExitCode   int      `json:"exit_code"`
	DurationMS int64    `json:"duration_ms"`
	Output     string   `json:"output"`
	Truncated  bool     `json:"truncated"`
}

func (a *App) RunQualityCheck(ctx context.Context, _ *mcp.CallToolRequest, input RunCheckInput) (*mcp.CallToolResult, RunCheckOutput, error) {
	name := strings.TrimSpace(input.Name)
	check, ok := a.Config.Checks[name]
	if !ok {
		return nil, RunCheckOutput{}, fmt.Errorf("unknown check %q; use list_quality_checks first", name)
	}
	if len(check.Command) == 0 {
		return nil, RunCheckOutput{}, fmt.Errorf("check %q has no command", name)
	}

	dir, err := a.resolveCheckDirectory(check.Directory)
	if err != nil {
		return nil, RunCheckOutput{}, err
	}
	timeout := time.Duration(check.Timeout) * time.Second
	if timeout <= 0 {
		timeout = 180 * time.Second
	}

	commandCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(commandCtx, check.Command[0], check.Command[1:]...)
	cmd.Dir = dir
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	started := time.Now()
	runErr := cmd.Run()
	duration := time.Since(started)

	output := stdout.String()
	if stderr.Len() > 0 {
		if output != "" && !strings.HasSuffix(output, "\n") {
			output += "\n"
		}
		output += stderr.String()
	}

	exitCode := 0
	if runErr != nil {
		if commandCtx.Err() == context.DeadlineExceeded {
			return nil, RunCheckOutput{}, fmt.Errorf("check %q timed out after %s", name, timeout)
		}
		var exitErr *exec.ExitError
		if errors.As(runErr, &exitErr) {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, RunCheckOutput{}, runErr
		}
	}

	truncated := false
	if len(output) > a.Config.MaxCommandOutput {
		output = output[:a.Config.MaxCommandOutput] + "\n…output truncated…"
		truncated = true
	}
	relDir, _ := filepath.Rel(a.Config.ProjectRoot, dir)
	if relDir == "." {
		relDir = ""
	}

	return nil, RunCheckOutput{
		Name:       name,
		Directory:  filepath.ToSlash(relDir),
		Command:    check.Command,
		ExitCode:   exitCode,
		DurationMS: duration.Milliseconds(),
		Output:     output,
		Truncated:  truncated,
	}, nil
}

func (a *App) resolveCheckDirectory(relative string) (string, error) {
	if strings.TrimSpace(relative) == "" || relative == "." {
		return a.Config.ProjectRoot, nil
	}
	if filepath.IsAbs(relative) {
		return "", fmt.Errorf("check directory must be project-relative")
	}
	dir := filepath.Clean(filepath.Join(a.Config.ProjectRoot, relative))
	rel, err := filepath.Rel(a.Config.ProjectRoot, dir)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("check directory escapes project root")
	}
	info, err := os.Stat(dir)
	if err != nil {
		return "", fmt.Errorf("check directory %q: %w", relative, err)
	}
	if !info.IsDir() {
		return "", fmt.Errorf("check directory %q is not a directory", relative)
	}
	return dir, nil
}
