package app

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type SearchInput struct {
	Query         string `json:"query" jsonschema:"text or regular expression to search for"`
	UseRegex      bool   `json:"use_regex,omitempty"`
	PathPrefix    string `json:"path_prefix,omitempty" jsonschema:"optional project-relative directory or file prefix"`
	MaxResults    int    `json:"max_results,omitempty" jsonschema:"maximum number of matches"`
	CaseSensitive bool   `json:"case_sensitive,omitempty"`
}

type SearchMatch struct {
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Preview string `json:"preview"`
}

type SearchOutput struct {
	Query     string        `json:"query"`
	Matches   []SearchMatch `json:"matches"`
	Truncated bool          `json:"truncated"`
}

func (a *App) SearchProject(_ context.Context, _ *mcp.CallToolRequest, input SearchInput) (*mcp.CallToolResult, SearchOutput, error) {
	query := strings.TrimSpace(input.Query)
	if query == "" {
		return nil, SearchOutput{}, fmt.Errorf("query is required")
	}

	limit := input.MaxResults
	if limit <= 0 || limit > a.Config.MaxSearchResults {
		limit = a.Config.MaxSearchResults
	}

	base := a.Config.ProjectRoot
	if strings.TrimSpace(input.PathPrefix) != "" {
		resolved, err := a.Policy.ResolveExisting(input.PathPrefix)
		if err != nil {
			return nil, SearchOutput{}, err
		}
		base = resolved
	}

	var regex *regexp.Regexp
	if input.UseRegex {
		pattern := query
		if !input.CaseSensitive {
			pattern = "(?i)" + pattern
		}
		compiled, err := regexp.Compile(pattern)
		if err != nil {
			return nil, SearchOutput{}, fmt.Errorf("invalid regular expression: %w", err)
		}
		regex = compiled
	}

	allowedExtensions := make(map[string]struct{}, len(a.Config.AllowedExtensions))
	for _, ext := range a.Config.AllowedExtensions {
		allowedExtensions[strings.ToLower(ext)] = struct{}{}
	}

	var matches []SearchMatch
	truncated := false
	err := filepath.WalkDir(base, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if entry.IsDir() {
			if path != base && a.Policy.IsIgnoredDir(entry.Name()) {
				return filepath.SkipDir
			}
			return nil
		}
		if a.Policy.IsDeniedFile(entry.Name()) {
			return nil
		}
		if _, ok := allowedExtensions[strings.ToLower(filepath.Ext(entry.Name()))]; !ok {
			return nil
		}

		info, err := entry.Info()
		if err != nil || info.Size() > a.Config.MaxFileBytes {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return nil
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		scanner.Buffer(make([]byte, 64*1024), 1024*1024)
		lineNo := 0
		for scanner.Scan() {
			lineNo++
			text := scanner.Text()
			found := false
			if regex != nil {
				found = regex.MatchString(text)
			} else if input.CaseSensitive {
				found = strings.Contains(text, query)
			} else {
				found = strings.Contains(strings.ToLower(text), strings.ToLower(query))
			}
			if !found {
				continue
			}

			rel, _ := filepath.Rel(a.Config.ProjectRoot, path)
			preview := strings.TrimSpace(text)
			if len(preview) > 240 {
				preview = preview[:240] + "…"
			}
			matches = append(matches, SearchMatch{Path: filepath.ToSlash(rel), Line: lineNo, Preview: preview})
			if len(matches) >= limit {
				truncated = true
				return filepath.SkipAll
			}
		}
		return nil
	})
	if err != nil {
		return nil, SearchOutput{}, err
	}

	sort.Slice(matches, func(i, j int) bool {
		if matches[i].Path == matches[j].Path {
			return matches[i].Line < matches[j].Line
		}
		return matches[i].Path < matches[j].Path
	})

	return nil, SearchOutput{Query: query, Matches: matches, Truncated: truncated}, nil
}
