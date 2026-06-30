package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadUsesEnvironmentProjectRoot(t *testing.T) {
	root := t.TempDir()
	t.Setenv("SMART_MCP_PROJECT_ROOT", root)

	cfg, err := Load(filepath.Join(root, "missing.json"))
	if err != nil {
		t.Fatal(err)
	}
	expected, _ := filepath.Abs(root)
	if cfg.ProjectRoot != expected {
		t.Fatalf("got %q, want %q", cfg.ProjectRoot, expected)
	}
	if cfg.MaxFileBytes <= 0 || len(cfg.Checks) == 0 {
		t.Fatal("expected defaults to be populated")
	}
	_ = os.Unsetenv("SMART_MCP_PROJECT_ROOT")
}
