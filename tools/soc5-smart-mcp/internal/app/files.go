package app

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ProjectSnapshotInput struct {
	Depth int `json:"depth" jsonschema:"maximum directory depth to show, from 1 to 4"`
}

type ProjectSnapshotOutput struct {
	Root          string   `json:"root"`
	DetectedStack []string `json:"detected_stack"`
	Files         []string `json:"files"`
	Notes         []string `json:"notes"`
}

func (a *App) ProjectSnapshot(_ context.Context, _ *mcp.CallToolRequest, input ProjectSnapshotInput) (*mcp.CallToolResult, ProjectSnapshotOutput, error) {
	depth := input.Depth
	if depth < 1 || depth > 4 {
		depth = 2
	}

	var files []string
	err := filepath.WalkDir(a.Config.ProjectRoot, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if path == a.Config.ProjectRoot {
			return nil
		}

		rel, err := filepath.Rel(a.Config.ProjectRoot, path)
		if err != nil {
			return nil
		}
		parts := strings.Split(rel, string(filepath.Separator))
		if entry.IsDir() {
			if a.Policy.IsIgnoredDir(entry.Name()) {
				return filepath.SkipDir
			}
			if len(parts) > depth {
				return filepath.SkipDir
			}
			files = append(files, filepath.ToSlash(rel)+"/")
			return nil
		}
		if len(parts) <= depth+1 && !a.Policy.IsDeniedFile(entry.Name()) {
			files = append(files, filepath.ToSlash(rel))
		}
		if len(files) >= 500 {
			return io.EOF
		}
		return nil
	})
	if err != nil && err != io.EOF {
		return nil, ProjectSnapshotOutput{}, err
	}
	sort.Strings(files)

	stack := detectStack(a.Config.ProjectRoot)
	notes := []string{
		"Sensitive files and dependency/build directories are intentionally excluded.",
		"Use read_project_file for exact file content and search_project for code discovery.",
	}

	return nil, ProjectSnapshotOutput{
		Root:          a.Config.ProjectRoot,
		DetectedStack: stack,
		Files:         files,
		Notes:         notes,
	}, nil
}

func detectStack(root string) []string {
	markers := map[string]string{
		"go.mod":                  "Go",
		"backend/go.mod":          "Go backend",
		"package.json":            "Node.js/TypeScript",
		"frontend/package.json":   "React/Node frontend",
		"vite.config.ts":          "Vite",
		"frontend/vite.config.ts": "Vite frontend",
		"supabase/config.toml":    "Supabase",
		"docker-compose.yml":      "Docker Compose",
		"Dockerfile":              "Docker",
	}
	var stack []string
	for rel, label := range markers {
		if _, err := os.Stat(filepath.Join(root, filepath.FromSlash(rel))); err == nil {
			stack = append(stack, label)
		}
	}
	sort.Strings(stack)
	return stack
}

type ReadFileInput struct {
	Path      string `json:"path" jsonschema:"project-relative file path"`
	StartLine int    `json:"start_line,omitempty" jsonschema:"1-based first line; defaults to 1"`
	EndLine   int    `json:"end_line,omitempty" jsonschema:"1-based last line; maximum 400 lines per call"`
}

type ReadFileOutput struct {
	Path       string `json:"path"`
	StartLine  int    `json:"start_line"`
	EndLine    int    `json:"end_line"`
	TotalLines int    `json:"total_lines"`
	Content    string `json:"content"`
	Truncated  bool   `json:"truncated"`
}

func (a *App) ReadProjectFile(_ context.Context, _ *mcp.CallToolRequest, input ReadFileInput) (*mcp.CallToolResult, ReadFileOutput, error) {
	path, err := a.Policy.ResolveExisting(input.Path)
	if err != nil {
		return nil, ReadFileOutput{}, err
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, ReadFileOutput{}, err
	}
	if info.IsDir() {
		return nil, ReadFileOutput{}, fmt.Errorf("path is a directory")
	}
	if info.Size() > a.Config.MaxFileBytes {
		return nil, ReadFileOutput{}, fmt.Errorf("file exceeds the %d-byte read limit", a.Config.MaxFileBytes)
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, ReadFileOutput{}, err
	}
	defer file.Close()

	start := input.StartLine
	if start <= 0 {
		start = 1
	}
	end := input.EndLine
	if end <= 0 || end < start {
		end = start + 199
	}
	if end-start+1 > 400 {
		end = start + 399
	}

	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	var builder strings.Builder
	lineNo := 0
	selectedEnd := start - 1
	for scanner.Scan() {
		lineNo++
		if lineNo >= start && lineNo <= end {
			fmt.Fprintf(&builder, "%d: %s\n", lineNo, scanner.Text())
			selectedEnd = lineNo
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, ReadFileOutput{}, err
	}

	rel, _ := filepath.Rel(a.Config.ProjectRoot, path)
	return nil, ReadFileOutput{
		Path:       filepath.ToSlash(rel),
		StartLine:  start,
		EndLine:    selectedEnd,
		TotalLines: lineNo,
		Content:    builder.String(),
		Truncated:  selectedEnd < lineNo,
	}, nil
}
