# Step-by-step integration guide

This setup uses **Cline as the coding-agent host** and **SOC 5 SMART MCP as the project intelligence and safety layer**. Cline supplies the model, chat interface, file editing, and command approvals. SMART MCP supplies repository inspection, safe search, Git review, durable decisions, and allowlisted tests.

## Phase 1 — Back up and prepare the project

From PowerShell:

```powershell
cd C:\Users\spxph4227\Desktop\soc5-outbound
git status
git add .
git commit -m "chore: checkpoint before SMART MCP integration"
```

Do not continue with uncommitted work unless you understand the current diff.

## Phase 2 — Place the MCP server in the project

Extract this package, then copy its folder into:

```text
soc5-outbound/
└── tools/
    └── soc5-smart-mcp/
```

Copy these files from the package root into the **SOC 5 Outbound project root**:

```text
smart-mcp.json
.clineignore
.clinerules/
.vscode/mcp.json
```

The final structure should resemble:

```text
soc5-outbound/
├── backend/
├── frontend/
├── tools/
│   └── soc5-smart-mcp/
├── .clinerules/
│   └── 01-soc5-smart-mcp.md
├── .clineignore
├── .vscode/
│   └── mcp.json
└── smart-mcp.json
```

## Phase 3 — Adjust the checks

Open the root `smart-mcp.json` and confirm:

- `backend` is the actual Go backend folder.
- `frontend` is the actual React frontend folder.
- The frontend has the scripts named `typecheck`, `lint`, and `build`.

Example frontend scripts:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "build": "vite build"
  }
}
```

Delete a check from `smart-mcp.json` when the project does not support it. Do not replace the allowlist with arbitrary shell execution.

## Phase 4 — Build the Go MCP server

```powershell
cd C:\Users\spxph4227\Desktop\soc5-outbound\tools\soc5-smart-mcp
.\install.ps1
```

Expected output:

```text
Built: ...\tools\soc5-smart-mcp\bin\smart-mcp.exe
```

The build downloads the official Go MCP SDK, runs unit tests, and creates the executable.

## Phase 5 — Install and configure Cline

1. Open VS Code.
2. Install the **Cline** extension.
3. Open Cline and select a model provider.
4. Use a provider key, Cline provider, or a supported local model runtime.
5. Keep approval prompts enabled during initial use.

For a terminal-only workflow, install Cline CLI:

```powershell
npm install -g cline
cline auth
```

## Phase 6 — Register SMART MCP in Cline

In Cline:

1. Open **MCP Servers**.
2. Choose **Configure**.
3. Open the MCP settings JSON.
4. Copy the `soc5-smart-mcp` entry from `tools/soc5-smart-mcp/examples/cline-mcp.json`.
5. Replace every placeholder with the absolute SOC 5 Outbound path.
6. Save and restart the MCP server.

Only auto-approve these read-only tools initially:

```text
project_snapshot
read_project_file
search_project
git_status
git_diff
list_quality_checks
read_project_memory
```

Keep these approval-gated:

```text
run_quality_check
record_project_decision
```

## Phase 7 — Verify the integration

Ask Cline:

```text
Use soc5-smart-mcp. Call project_snapshot, git_status, list_quality_checks, and read_project_memory. Do not modify any files. Summarize the project structure and report any configuration mismatch.
```

Confirm that:

- The MCP server appears as connected.
- The repository structure is returned.
- `.env` and credential files are not exposed.
- The configured checks appear.
- Git status is correct.

Then test one safe check:

```text
Run the backend_test quality check through soc5-smart-mcp and explain any failure without changing code.
```

## Phase 8 — Use it as your Codex alternative

Start every implementation request with this workflow:

```text
Use soc5-smart-mcp.
1. Inspect project_snapshot, read_project_memory, and git_status.
2. Search and read the relevant existing code.
3. Produce a small implementation plan before editing.
4. Make the smallest coherent change.
5. Run the relevant allowlisted checks.
6. Inspect git_diff.
7. Report changed files, test results, and remaining risks.
Never access secrets or modify production data.
```

## Phase 9 — Add project-specific intelligence

After the base integration works, add new MCP tools only for real project needs, such as:

- Reading the Supabase schema without exposing service keys.
- Validating role permissions for Ops PIC, FTE Ops, FTE MM, and Doc Officer.
- Checking API route consistency between React and Go.
- Reviewing database migrations in read-only mode.
- Running a controlled local health check.

Do not give the MCP server direct production database write access.

## Recovery

If Cline cannot start the server:

```powershell
cd C:\Users\spxph4227\Desktop\soc5-outbound\tools\soc5-smart-mcp
go test ./...
go build -o .\bin\smart-mcp.exe .\cmd\smart-mcp
```

Then verify the absolute paths in the Cline MCP configuration. Server logs must go to stderr; ordinary output on stdout breaks stdio MCP communication.
