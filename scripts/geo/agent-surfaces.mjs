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

const MCP_ENDPOINT = `${ORIGIN}/mcp`;
const SERVER_CARD = `${ORIGIN}/.well-known/mcp/server-card.json`;
const DEADLINE_MS = 20_000;

const json = (path, predicate) => ({
  name: path,
  url: `${ORIGIN}${path}`,
  typePrefix: "application/json",
  cors: true,
  parse: "json",
  predicate,
});

export const isServerCard = (card) =>
  card?.transport?.endpoint === MCP_ENDPOINT &&
  Array.isArray(card.remotes) &&
  card.remotes.some((remote) => remote?.url === MCP_ENDPOINT) &&
  typeof card.capabilities?.tools === "object";

export const isAiCatalog = (catalog) =>
  Array.isArray(catalog?.entries) &&
  catalog.entries.some((entry) => entry?.url === SERVER_CARD);

export const isSkillsIndex = (index) =>
  Array.isArray(index?.skills) &&
  index.skills.length > 0 &&
  index.skills.every(
    (skill) => skill?.url && /^sha256:[0-9a-f]{64}$/.test(skill.digest)
  );

// Every anchor is an endpoint with a card; today that is /mcp alone.
export const isApiCatalog = (catalog) =>
  Array.isArray(catalog?.linkset) &&
  catalog.linkset.length > 0 &&
  catalog.linkset.every(
    (context) =>
      context?.anchor === MCP_ENDPOINT &&
      context["service-desc"]?.[0]?.href === SERVER_CARD &&
      !("status" in context)
  );

export const ROWS = [
  {
    name: "/auth.md",
    url: `${ORIGIN}/auth.md`,
    typePrefix: "text/markdown",
    parse: "text",
    predicate: (body) => /^## Authentication\s*\n+None\b/m.test(body),
  },
  json("/.well-known/mcp/server-card.json", isServerCard),
  json("/.well-known/ai-catalog.json", isAiCatalog),
  json("/.well-known/agent-skills/index.json", isSkillsIndex),
  {
    ...json("/.well-known/api-catalog", isApiCatalog),
    typePrefix: "application/linkset+json",
  },
  {
    name: "POST /mcp tools/list",
    method: "POST",
    url: MCP_ENDPOINT,
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

// The signal also aborts the body read, so a stalled stream ends the row.
async function inspect(row, fetch, timeoutMs) {
  const { method = "GET", headers, body } = row;
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(row.url, { method, headers, body, signal });
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

export async function checkRow(row, fetch, timeoutMs = DEADLINE_MS) {
  try {
    return { name: row.name, reason: await inspect(row, fetch, timeoutMs) };
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
