# SOC 5 SMART MCP

A scoped, memory-aware, approval-gated, repository-aware, test-driven MCP server for the SOC 5 Outbound project.

## What it is

This server does not replace the language model or coding-agent UI. It gives an MCP-compatible coding agent structured, safe project tools. Pair it with Cline, VS Code Agent mode, Claude Code, or another MCP host.

SMART means:

- **Scoped** — every path is confined to one project root.
- **Memory-aware** — durable decisions live in `.smart-mcp/memory.md`.
- **Approval-gated** — write-like actions and checks remain visible to the host.
- **Repository-aware** — the server can inspect structure, source, Git status, and diffs.
- **Test-driven** — the model can run only allowlisted quality checks.

## Included tools

- `project_snapshot`
- `read_project_file`
- `search_project`
- `git_status`
- `git_diff`
- `list_quality_checks`
- `run_quality_check`
- `read_project_memory`
- `record_project_decision`

## Windows setup

1. Copy this folder into your project as `tools/soc5-smart-mcp`.
2. Copy `smart-mcp.json` to the project root.
3. Open PowerShell in `tools/soc5-smart-mcp`.
4. Run:

   ```powershell
   .\install.ps1
   ```

5. Add the server to Cline using `examples/cline-mcp.json`, or use the included `.vscode/mcp.json` workspace configuration.
6. Keep read-only tools auto-approved. Do not auto-approve `run_quality_check` or `record_project_decision` until you trust the workflow.

## Termux/Linux setup

```sh
cd tools/soc5-smart-mcp
./install.sh
```

Use the generated `bin/smart-mcp` path in the MCP host configuration.

## Test directly

The server uses stdio. Start it through an MCP host or MCP Inspector; do not interact with it as a normal terminal program.

## Configuration

Edit the root `smart-mcp.json` to match the actual frontend/backend folders and package scripts. The server rejects any command not explicitly listed under `checks`.

## Recommended first prompt

```text
Use soc5-smart-mcp. First inspect project_snapshot, read_project_memory, and git_status. Then analyze the requested task. Before changing code, list the files you expect to touch and the checks you will run. Do not access secrets. After changes, run the relevant allowlisted checks and inspect git_diff.
```

## Full integration walkthrough

See `SETUP-GUIDE.md` for the phased Windows, Cline, and verification workflow.
