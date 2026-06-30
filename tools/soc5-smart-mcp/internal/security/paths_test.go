package security

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveExistingBlocksTraversalAndSecrets(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("package main"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, ".env"), []byte("SECRET=x"), 0o600); err != nil {
		t.Fatal(err)
	}

	policy := NewPolicy(root, []string{"node_modules", ".git"}, []string{".env"})

	if _, err := policy.ResolveExisting("main.go"); err != nil {
		t.Fatalf("expected main.go to be allowed: %v", err)
	}
	if _, err := policy.ResolveExisting("../outside.txt"); err == nil {
		t.Fatal("expected traversal to be rejected")
	}
	if _, err := policy.ResolveExisting(".env"); err == nil {
		t.Fatal("expected .env to be rejected")
	}
}

func TestDeniedSuffixes(t *testing.T) {
	policy := NewPolicy(t.TempDir(), nil, nil)
	for _, name := range []string{"private.pem", "server.key", ".env.staging"} {
		if !policy.IsDeniedFile(name) {
			t.Fatalf("expected %s to be denied", name)
		}
	}
}
