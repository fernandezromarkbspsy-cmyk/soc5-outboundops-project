package security

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Policy struct {
	Root              string
	IgnoreDirectories map[string]struct{}
	DeniedFileNames   map[string]struct{}
}

func NewPolicy(root string, ignored, denied []string) Policy {
	p := Policy{
		Root:              filepath.Clean(root),
		IgnoreDirectories: make(map[string]struct{}, len(ignored)),
		DeniedFileNames:   make(map[string]struct{}, len(denied)),
	}
	for _, name := range ignored {
		p.IgnoreDirectories[strings.ToLower(filepath.Clean(name))] = struct{}{}
	}
	for _, name := range denied {
		p.DeniedFileNames[strings.ToLower(filepath.Base(name))] = struct{}{}
	}
	return p
}

func (p Policy) ResolveExisting(relative string) (string, error) {
	relative = strings.TrimSpace(relative)
	if relative == "" {
		return "", fmt.Errorf("path is required")
	}
	if filepath.IsAbs(relative) {
		return "", fmt.Errorf("absolute paths are not allowed")
	}

	target := filepath.Clean(filepath.Join(p.Root, relative))
	if err := p.ensureInside(target); err != nil {
		return "", err
	}
	if err := p.ensureAllowed(relative); err != nil {
		return "", err
	}

	resolved, err := filepath.EvalSymlinks(target)
	if err != nil {
		return "", err
	}
	if err := p.ensureInside(resolved); err != nil {
		return "", fmt.Errorf("symlink escapes project root: %w", err)
	}
	return resolved, nil
}

func (p Policy) ResolveForWrite(relative string) (string, error) {
	relative = strings.TrimSpace(relative)
	if relative == "" {
		return "", fmt.Errorf("path is required")
	}
	if filepath.IsAbs(relative) {
		return "", fmt.Errorf("absolute paths are not allowed")
	}
	if err := p.ensureAllowed(relative); err != nil {
		return "", err
	}

	target := filepath.Clean(filepath.Join(p.Root, relative))
	if err := p.ensureInside(target); err != nil {
		return "", err
	}

	parent := filepath.Dir(target)
	resolvedParent, err := filepath.EvalSymlinks(parent)
	if err != nil {
		if !os.IsNotExist(err) {
			return "", err
		}
		resolvedParent = parent
	}
	if err := p.ensureInside(resolvedParent); err != nil {
		return "", fmt.Errorf("parent path escapes project root: %w", err)
	}
	return target, nil
}

func (p Policy) IsIgnoredDir(name string) bool {
	_, found := p.IgnoreDirectories[strings.ToLower(name)]
	return found
}

func (p Policy) IsDeniedFile(name string) bool {
	lower := strings.ToLower(filepath.Base(name))
	if _, found := p.DeniedFileNames[lower]; found {
		return true
	}
	if strings.HasPrefix(lower, ".env.") || strings.HasSuffix(lower, ".pem") || strings.HasSuffix(lower, ".key") {
		return true
	}
	return false
}

func (p Policy) ensureInside(target string) error {
	rel, err := filepath.Rel(p.Root, target)
	if err != nil {
		return fmt.Errorf("compare path with project root: %w", err)
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return fmt.Errorf("path escapes project root")
	}
	return nil
}

func (p Policy) ensureAllowed(relative string) error {
	clean := filepath.Clean(relative)
	for _, part := range strings.Split(clean, string(filepath.Separator)) {
		if p.IsIgnoredDir(part) {
			return fmt.Errorf("access to directory %q is blocked", part)
		}
	}
	if p.IsDeniedFile(clean) {
		return fmt.Errorf("access to sensitive file %q is blocked", filepath.Base(clean))
	}
	return nil
}
