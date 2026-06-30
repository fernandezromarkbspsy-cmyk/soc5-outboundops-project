package app

import (
	"github.com/example/soc5-smart-mcp/internal/config"
	"github.com/example/soc5-smart-mcp/internal/security"
)

type App struct {
	Config config.Config
	Policy security.Policy
}

func New(cfg config.Config) *App {
	return &App{
		Config: cfg,
		Policy: security.NewPolicy(cfg.ProjectRoot, cfg.IgnoreDirectories, cfg.DeniedFileNames),
	}
}
