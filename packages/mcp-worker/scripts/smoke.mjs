#!/usr/bin/env node
// Post-deploy smoke test for the remote MCP endpoint (task 3.5, design D9).
// `wrangler dev` does not reproduce production's isolate limits, so this runs
// against the deployed Worker and gates the discovery step.
//
//   node scripts/smoke.mjs https://kaiord.com/mcp
//
// Exits 0 when every check passes, 1 naming each failed check, 2 on usage.
import { pathToFileURL } from "node:url";

import { CHECKS } from "./smoke-checks.mjs";

const ACCEPT = "application/json, text/event-stream";

export const endpointOf = (base) => {
  const url = new URL(base);
  if (!url.pathname.endsWith("/mcp"))
    url.pathname = `${url.pathname.replace(/\/$/, "")}/mcp`;
  return url.toString();
};

// One JSON-RPC request per call; `padTo` pads the body with whitespace,
// which JSON allows, to an exact byte length.
export const createCaller = (endpoint, fetchImpl) => {
  let id = 0;
  return async (method, params, { padTo } = {}) => {
    id += 1;
    let body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    if (padTo !== undefined) body += " ".repeat(padTo - body.length);
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: ACCEPT },
      body,
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    return { status: response.status, body: parsed };
  };
};

export const runSmoke = async (base, fetchImpl = globalThis.fetch) => {
  const call = createCaller(endpointOf(base), fetchImpl);
  const results = [];
  for (const [name, check] of Object.entries(CHECKS)) {
    try {
      await check(call);
      results.push({ name, ok: true });
    } catch (error) {
      results.push({
        name,
        ok: false,
        detail: String(error?.message ?? error),
      });
    }
  }
  return results;
};

export const main = async (argv, fetchImpl, out = console) => {
  const base = argv[0];
  if (!base) {
    out.error("usage: node scripts/smoke.mjs <endpoint-url>");
    return 2;
  }
  const results = await runSmoke(base, fetchImpl);
  for (const r of results)
    out.log(
      `${r.ok ? "PASS" : "FAIL"} ${r.name}${r.ok ? "" : `: ${r.detail}`}`
    );
  const failed = results.filter((r) => !r.ok).map((r) => r.name);
  if (failed.length > 0) {
    out.error(`smoke failed: ${failed.join(", ")}`);
    return 1;
  }
  out.log(`smoke passed: ${results.length} checks`);
  return 0;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = await main(process.argv.slice(2));
}
