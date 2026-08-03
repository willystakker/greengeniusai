#!/usr/bin/env node
// GreenGeniusAI MCP server — exposes the real contents of this repository
// (FastAPI routes, the AI trading engine's scheduled jobs, the Next.js
// dashboard's routes, and the env var reference) as tools over the Model
// Context Protocol (stdio transport). Every tool parses the actual source
// files at call time — no hardcoded data.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.vercel', 'mcp-server', '__pycache__', '.venv', 'venv']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function read(rel) {
  return readFileSync(join(REPO_ROOT, rel), 'utf8');
}

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

// ── Server ──────────────────────────────────────────────────────────────────
const server = new McpServer({ name: 'greengeniusai', version: '1.0.0' });

server.registerTool(
  'get_api_routes',
  {
    title: 'Get FastAPI backend routes',
    description:
      'Scan backend/routers/*.py and return every FastAPI endpoint: HTTP method, path, router file, and the handler function name, parsed from the real @router decorators.',
    inputSchema: {},
  },
  async () => {
    const dir = join(REPO_ROOT, 'backend', 'routers');
    const routes = [];
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.py'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      const matches = [...src.matchAll(
        /@router\.(get|post|put|patch|delete)\(\s*["']([^"']*)["'][^)]*\)\s*\n\s*async def (\w+)/g,
      )];
      for (const m of matches) {
        routes.push({ method: m[1].toUpperCase(), path: m[2], handler: m[3], file: `backend/routers/${f}` });
      }
    }
    return json({ routes });
  },
);

server.registerTool(
  'get_scheduler_jobs',
  {
    title: 'Get AI engine scheduled jobs',
    description:
      "Parse backend/main.py and return every APScheduler job the AI trading engine runs (market scan, after-hours analysis, crypto scan): job id, the function it calls, trigger type, and the real cron/interval schedule.",
    inputSchema: {},
  },
  async () => {
    const src = read('backend/main.py');
    const blocks = [...src.matchAll(/scheduler\.add_job\(([\s\S]*?)\)\s*\n/g)].map((m) => m[1]);
    const jobs = blocks.map((b) => {
      const fn = (b.match(/^\s*([\w.]+),/) || [])[1];
      const trigger = (b.match(/["'](cron|interval|date)["']/) || [])[1];
      const id = (b.match(/id=["']([^"']+)["']/) || [])[1];
      const dayOfWeek = (b.match(/day_of_week=["']([^"']+)["']/) || [])[1];
      const hour = (b.match(/hour=["']?([^,\n"']+)["']?/) || [])[1];
      const minute = (b.match(/minute=["']?([^,\n"']+)["']?/) || [])[1];
      const minutes = (b.match(/minutes=(\d+)/) || [])[1];
      return {
        id,
        function: fn,
        trigger,
        dayOfWeek,
        hour: hour?.trim(),
        minute: minute?.trim(),
        intervalMinutes: minutes ? Number(minutes) : undefined,
      };
    });
    return json({ jobs });
  },
);

server.registerTool(
  'get_dashboard_pages',
  {
    title: 'Get Next.js dashboard pages',
    description:
      'Walk website/app/ and return every page route found on the real filesystem (route groups stripped) — the marketing site, onboarding, checkout, and the trading dashboard sections (bots, watchlist, risk, news, etc).',
    inputSchema: {},
  },
  async () => {
    const base = join(REPO_ROOT, 'website', 'app');
    const files = walk(base);
    const pages = files
      .filter((f) => /\/?page\.tsx?$/.test(f))
      .map((f) => {
        const rel = relative(base, f).split(sep).join('/');
        const route = '/' + rel.replace(/\/?page\.tsx?$/, '').replace(/\([^)]*\)\//g, '').replace(/\([^)]*\)$/, '');
        return route === '/' ? '/' : route.replace(/\/$/, '');
      })
      .sort();
    return json({ pages });
  },
);

server.registerTool(
  'get_env_reference',
  {
    title: 'Get environment variable reference',
    description:
      'Parse .env.example and return every environment variable grouped under its section header (Anthropic, Polygon, Alpaca, Stripe, Supabase, JWT, App Config) with the placeholder shown in the file. Never returns real secrets — this repo only tracks the .example template.',
    inputSchema: {},
  },
  async () => {
    const src = read('.env.example');
    const groups = [];
    let current = null;
    for (const line of src.split('\n')) {
      const header = line.match(/^#\s*──+\s*(.+?)\s*──+/);
      if (header) {
        current = { section: header[1], vars: [] };
        groups.push(current);
        continue;
      }
      const kv = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (kv && current) {
        current.vars.push({ name: kv[1], placeholder: kv[2].split('#')[0].trim() });
      }
    }
    return json({ groups });
  },
);

server.registerTool(
  'search_code',
  {
    title: 'Search code',
    description:
      'Regex search across all tracked source files in the repository (node_modules, .git, __pycache__, .next excluded). Returns file, line number, and the matching line. Case-insensitive by default.',
    inputSchema: {
      pattern: z.string().describe('JavaScript regular expression to search for'),
      caseSensitive: z.boolean().optional().describe('Match case-sensitively (default false)'),
      maxResults: z.number().int().min(1).max(500).optional().describe('Cap on returned matches (default 100)'),
    },
  },
  async ({ pattern, caseSensitive, maxResults }) => {
    const re = new RegExp(pattern, caseSensitive ? '' : 'i');
    const cap = maxResults ?? 100;
    const results = [];
    const files = walk(REPO_ROOT).filter((f) =>
      /\.(ts|tsx|js|mjs|py|json|md)$/.test(f) && !f.endsWith('package-lock.json'),
    );
    for (const f of files) {
      const lines = readFileSync(f, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) {
          results.push({ file: relative(REPO_ROOT, f), line: i + 1, text: lines[i].trim().slice(0, 300) });
          if (results.length >= cap) return json({ matches: results, truncated: true });
        }
      }
    }
    return json({ matches: results, truncated: false });
  },
);

server.registerTool(
  'read_file',
  {
    title: 'Read repository file',
    description:
      'Read a file from the repository by path relative to the repo root (e.g. "backend/services/ai_trader.py"). Refuses paths outside the repo.',
    inputSchema: {
      path: z.string().describe('Path relative to the repository root'),
    },
  },
  async ({ path }) => {
    if (path.includes('..')) throw new Error('Path traversal is not allowed');
    const text = read(path);
    return { content: [{ type: 'text', text: text.length > 100_000 ? text.slice(0, 100_000) + '\n…(truncated)' : text }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
