#!/usr/bin/env node
// Live guard for the agent discovery surfaces of kaiord.com. Each row
// fetches one URL and checks its status, media type, CORS header and body.
// A bad row is reported, never thrown, so one broken surface never hides
// another. Exits 1 naming every failed row.
//
//   node scripts/geo/agent-surfaces.mjs
import { fileURLToPath } from "node:url";

const ORIGIN = "https://kaiord.com";
export const REMOTE_TOOLS = [
  "kaiord_convert",
  "kaiord_diff",
  "kaiord_extract_workout",
  "kaiord_get_format_spec",
  "kaiord_inspect",
  "kaiord_list_formats",
  "kaiord_round_trip_validate",
  "kaiord_validate",
];

const json = (path) => ({
  name: path,
  url: `${ORIGIN}${path}`,
  typePrefix: "application/json",
  cors: true,
  parse: "json",
  predicate: (body) => body !== null && typeof body === "object",
});

export const ROWS = [
  {
    name: "/auth.md",
    url: `${ORIGIN}/auth.md`,
    typePrefix: "text/markdown",
    parse: "text",
    predicate: (body) => /^## Authentication\s*\n+None\b/m.test(body),
  },
  json("/.well-known/mcp/server-card.json"),
  json("/.well-known/ai-catalog.json"),
  json("/.well-known/agent-skills/index.json"),
  {
    name: "POST /mcp tools/list",
    method: "POST",
    url: `${ORIGIN}/mcp`,
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    typePrefix: "application/json",
    parse: "json",
    predicate: (body) =>
      JSON.stringify(body?.result?.tools?.map((t) => t.name).sort()) ===
      JSON.stringify(REMOTE_TOOLS),
  },
];

async function inspect(row, fetch) {
  const { method = "GET", headers, body } = row;
  const response = await fetch(row.url, { method, headers, body });
  if (response.status !== (row.status ?? 200))
    return `status ${response.status}`;
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith(row.typePrefix)) return `content-type "${type}"`;
  if (row.cors && response.headers.get("access-control-allow-origin") !== "*")
    return "missing CORS *";
  const text = await response.text();
  let parsed = text;
  if (row.parse === "json") {
    try {
      parsed = JSON.parse(text);
    } catch {
      return "body is not JSON";
    }
  }
  return row.predicate(parsed) ? null : "body check failed";
}

export async function checkRow(row, fetch) {
  try {
    return { name: row.name, reason: await inspect(row, fetch) };
  } catch (error) {
    return { name: row.name, reason: `fetch failed: ${error.message}` };
  }
}

export async function run({
  rows = ROWS,
  fetch = globalThis.fetch,
  log = console,
} = {}) {
  const results = await Promise.all(rows.map((row) => checkRow(row, fetch)));
  for (const { name, reason } of results)
    log.log(reason ? `FAIL ${name}: ${reason}` : `PASS ${name}`);
  return results.filter((r) => r.reason).map((r) => r.name);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failed = await run();
  if (failed.length > 0) {
    console.error(`::error::agent surfaces failing: ${failed.join(", ")}`);
    process.exit(1);
  }
}
