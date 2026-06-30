package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Check struct {
	Directory string   `json:"directory"`
	Command   []string `json:"command"`
	Timeout   int      `json:"timeout_seconds"`
}

type Config struct {
	ProjectRoot       string           `json:"project_root"`
	MaxFileBytes      int64            `json:"max_file_bytes"`
	MaxSearchResults  int              `json:"max_search_results"`
	MaxCommandOutput  int              `json:"max_command_output"`
	AllowMemoryWrites bool             `json:"allow_memory_writes"`
	IgnoreDirectories []string         `json:"ignore_directories"`
	DeniedFileNames   []string         `json:"denied_file_names"`
	AllowedExtensions []string         `json:"allowed_extensions"`
	Checks            map[string]Check `json:"checks"`
}

func Default() Config {
	return Config{
		ProjectRoot:       ".",
		MaxFileBytes:      512 * 1024,
		MaxSearchResults:  100,
		MaxCommandOutput:  24_000,
		AllowMemoryWrites: true,
		IgnoreDirectories: []string{".git", "node_modules", "vendor", "dist", "build", ".next", "coverage", ".cache"},
		DeniedFileNames: []string{
			".env", ".env.local", ".env.production", ".env.development",
			"credentials.json", "service-account.json", "secrets.json",
		},
		AllowedExtensions: []string{
			".go", ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".sql",
			".css", ".scss", ".html", ".yaml", ".yml", ".toml", ".txt",
		},
		Checks: map[string]Check{
			"backend_test": {
				Directory: "backend",
				Command:   []string{"go", "test", "./..."},
				Timeout:   180,
			},
			"backend_vet": {
				Directory: "backend",
				Command:   []string{"go", "vet", "./..."},
				Timeout:   180,
			},
			"frontend_typecheck": {
				Directory: "frontend",
				Command:   []string{"npm", "run", "typecheck", "--if-present"},
				Timeout:   180,
			},
			"frontend_lint": {
				Directory: "frontend",
				Command:   []string{"npm", "run", "lint", "--if-present"},
				Timeout:   180,
			},
			"frontend_build": {
				Directory: "frontend",
				Command:   []string{"npm", "run", "build"},
				Timeout:   300,
			},
		},
	}
}

func Load(path string) (Config, error) {
	cfg := Default()

	if path == "" {
		path = os.Getenv("SMART_MCP_CONFIG")
	}
	if path == "" {
		path = "smart-mcp.json"
	}

	if data, err := os.ReadFile(path); err == nil {
		if err := json.Unmarshal(data, &cfg); err != nil {
			return Config{}, fmt.Errorf("parse %s: %w", path, err)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return Config{}, fmt.Errorf("read %s: %w", path, err)
	}

	if envRoot := strings.TrimSpace(os.Getenv("SMART_MCP_PROJECT_ROOT")); envRoot != "" {
		cfg.ProjectRoot = envRoot
	}

	root, err := filepath.Abs(cfg.ProjectRoot)
	if err != nil {
		return Config{}, fmt.Errorf("resolve project root: %w", err)
	}
	info, err := os.Stat(root)
	if err != nil {
		return Config{}, fmt.Errorf("project root: %w", err)
	}
	if !info.IsDir() {
		return Config{}, fmt.Errorf("project root is not a directory: %s", root)
	}
	cfg.ProjectRoot = filepath.Clean(root)

	if cfg.MaxFileBytes <= 0 {
		cfg.MaxFileBytes = Default().MaxFileBytes
	}
	if cfg.MaxSearchResults <= 0 {
		cfg.MaxSearchResults = Default().MaxSearchResults
	}
	if cfg.MaxCommandOutput <= 0 {
		cfg.MaxCommandOutput = Default().MaxCommandOutput
	}
	if cfg.Checks == nil {
		cfg.Checks = Default().Checks
	}

	return cfg, nil
}
