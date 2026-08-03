# greengeniusai-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) stdio server that exposes this
repository — the GreenGeniusAI trading platform — to AI assistants. Every tool parses the real
Python/TypeScript source files at call time; nothing is hardcoded or stubbed.

## Tools

| Tool | Input | What it returns |
|---|---|---|
| `get_api_routes` | — | Every FastAPI endpoint parsed from `backend/routers/*.py`: HTTP method, path, handler function, source file |
| `get_scheduler_jobs` | — | Every APScheduler job registered in `backend/main.py` — market scan, after-hours analysis, crypto scan — with the real cron/interval schedule |
| `get_dashboard_pages` | — | Every page route under `website/app/` (marketing site, onboarding, checkout, and the trading dashboard) |
| `get_env_reference` | — | Every variable in `.env.example`, grouped by section (Anthropic, Polygon, Alpaca, Stripe, Supabase, JWT, App Config) with its placeholder — never real secrets |
| `search_code` | `pattern`, `caseSensitive?`, `maxResults?` | Regex search across all tracked source files — file, line, matched text |
| `read_file` | `path` | Contents of any file in the repo, given a path relative to the repo root |

## Setup

```bash
cd mcp-server
npm install
```

Register with Claude Code:

```bash
claude mcp add greengeniusai -- node mcp-server/server.mjs
```

Or run it directly for testing:

```bash
npm start
```

## Smoke test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' | node server.mjs
```

should print an `initialize` result with the server name `greengeniusai`.
