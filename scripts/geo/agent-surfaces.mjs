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
const A2A_ENDPOINT = `${ORIGIN}/a2a`;
const SERVER_CARD = `${ORIGIN}/.well-known/mcp/server-card.json`;
const AGENT_CARD = `${ORIGIN}/.well-known/agent-card.json`;
const CARD_OF_ANCHOR = new Map([
  [MCP_ENDPOINT, SERVER_CARD],
  [A2A_ENDPOINT, AGENT_CARD],
]);
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

// Every anchor is an endpoint described by its own card.
export const isApiCatalog = (catalog) =>
  Array.isArray(catalog?.linkset) &&
  catalog.linkset.length === CARD_OF_ANCHOR.size &&
  [...CARD_OF_ANCHOR.keys()].every((anchor) =>
    catalog.linkset.some((context) => context?.anchor === anchor)
  ) &&
  catalog.linkset.every(
    (context) =>
      CARD_OF_ANCHOR.has(context?.anchor) &&
      context["service-desc"]?.[0]?.href ===
        CARD_OF_ANCHOR.get(context.anchor) &&
      !("status" in context)
  );

// Website-only PAP manifest: these three keys and an empty `web`, so it
// declares no agent and no OAuth.
export const isPoppy = (manifest) =>
  JSON.stringify(Object.keys(manifest ?? {}).sort()) ===
    '["organization","protocol_version","web"]' &&
  manifest.protocol_version === "0.1" &&
  manifest.organization?.domain === "kaiord.com" &&
  JSON.stringify(manifest.web) === "{}";

export const isAgentCard = (card) => {
  const entry = card?.supportedInterfaces?.[0];
  return entry?.url === A2A_ENDPOINT && entry.protocolBinding === "JSONRPC";
};

export const isCompletedTask = (reply) => {
  const task = reply?.result?.task;
  const text = task?.artifacts?.[0]?.parts?.[0]?.text;
  return (
    task?.status?.state === "TASK_STATE_COMPLETED" &&
    typeof text === "string" &&
    text.length > 0
  );
};

const sortedNames = (names) => JSON.stringify([...(names ?? [])].sort());

export const cardMatchesTools = (card, reply) =>
  Array.isArray(card?.skills) &&
  card.skills.length > 0 &&
  sortedNames(card.skills.map((skill) => skill.id)) ===
    sortedNames(reply?.result?.tools?.map((tool) => tool.name));

const TOOLS_LIST = {
  method: "POST",
  url: MCP_ENDPOINT,
  headers: {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  typePrefix: "application/json",
  parse: "json",
};

const AGENT_CARD_ROW = json("/.well-known/agent-card.json", isAgentCard);

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
  json("/.well-known/poppy.json", isPoppy),
  {
    name: "POST /mcp tools/list",
    ...TOOLS_LIST,
    predicate: (body) =>
      JSON.stringify(body?.result?.tools?.map((t) => t.name).sort()) ===
      JSON.stringify(REMOTE_TOOLS),
  },
  AGENT_CARD_ROW,
  {
    name: "POST /a2a SendMessage",
    method: "POST",
    url: A2A_ENDPOINT,
    headers: { "content-type": "application/json", "A2A-Version": "1.0" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "SendMessage",
      params: {
        message: {
          messageId: "agent-surfaces",
          role: "ROLE_USER",
          parts: [{ data: { skill: "kaiord_list_formats" } }],
        },
      },
    }),
    typePrefix: "application/json",
    parse: "json",
    predicate: isCompletedTask,
  },
  {
    ...AGENT_CARD_ROW,
    name: "agent card skills vs /mcp tools/list",
    joins: TOOLS_LIST,
    predicate: cardMatchesTools,
  },
];

// The signal also aborts the body read, so a stalled stream ends the row.
async function read(row, fetch, signal) {
  const { method = "GET", headers, body } = row;
  const response = await fetch(row.url, { method, headers, body, signal });
  if (response.status !== (row.status ?? 200))
    return { reason: `status ${response.status}` };
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith(row.typePrefix))
    return { reason: `content-type "${type}"` };
  if (row.cors && response.headers.get("access-control-allow-origin") !== "*")
    return { reason: "missing CORS *" };
  const text = await response.text();
  if (row.parse !== "json") return { parsed: text };
  try {
    return { parsed: JSON.parse(text) };
  } catch {
    return { reason: "body is not JSON" };
  }
}

// A row with `joins` reads a second reply and hands both to its predicate.
async function inspect(row, fetch, timeoutMs) {
  const signal = AbortSignal.timeout(timeoutMs);
  const first = await read(row, fetch, signal);
  if (first.reason) return first.reason;
  const second = row.joins ? await read(row.joins, fetch, signal) : {};
  if (second.reason) return `joined reply: ${second.reason}`;
  return row.predicate(first.parsed, second.parsed)
    ? null
    : "body check failed";
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
