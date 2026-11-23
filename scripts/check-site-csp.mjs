#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { APP_ORIGIN } from "./lib/app-origins.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";
import {
  attr,
  CSP_META,
  isUnsafeScriptSource,
  parsePolicy,
  scriptsOf,
  sha256,
} from "./lib/site-csp-read.mjs";

// Reads the assembled site exactly as Pages serves it and fails on any page
// (landing, docs or App) whose content security policy would let an
// injected script run. It parses the policy back out of the HTML on
// purpose: it shares no code with the injector, so removing the policy, or
// loosening it, is seen here whatever the injector does.

// Only the App may start a worker, and only its own, named by its exact URL
// at the origin the site is served from: `'self'` would admit any
// same-origin script.
const workerProblem = (policy, worker) => {
  const sources = policy.get("worker-src")?.join(" ");
  if (!worker) return sources === "'none'" ? [] : ["worker-src is not 'none'"];
  return sources === worker ? [] : [`worker-src is not exactly ${worker}`];
};

export function checkPage(html, { worker } = {}) {
  const meta = CSP_META.exec(html);
  if (!meta) return ["no Content-Security-Policy meta"];
  const policy = parsePolicy(/content="([^"]*)"/i.exec(meta[0])?.[1] ?? "");
  const scriptSrc = policy.get("script-src") ?? policy.get("default-src") ?? [];
  const problems = scriptSrc
    .filter(isUnsafeScriptSource)
    .map((source) => `unsafe script source ${source}`);
  if (policy.get("object-src")?.join(" ") !== "'none'") {
    problems.push("object-src is not 'none'");
  }
  if (!policy.has("base-uri")) problems.push("no base-uri");
  problems.push(...workerProblem(policy, worker));
  const scripts = scriptsOf(html);
  if (scripts.some(({ at }) => at < meta.index)) {
    problems.push("a script precedes the Content-Security-Policy meta");
  }
  scripts
    .filter(({ attrs }) => attr(attrs, "src") === undefined)
    .forEach(({ text }, i) => {
      if (!scriptSrc.includes(sha256(text))) {
        problems.push(`inline script #${i + 1} is not in script-src`);
      }
    });
  return problems;
}

const htmlFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .map((entry) => String(entry))
    .filter((entry) => entry.endsWith(".html"))
    .map((entry) => entry.split(sep).join("/"))
    .sort();

export function checkSiteCsp(dir, { origin = APP_ORIGIN } = {}) {
  return htmlFiles(dir).flatMap((file) => {
    const worker = file.startsWith("app/") ? `${origin}/app/sw.js` : null;
    return checkPage(readFileSync(join(dir, file), "utf8"), { worker }).map(
      (problem) => `${file}: ${problem}`
    );
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      merged: { type: "string" },
      origin: { type: "string", default: APP_ORIGIN },
    },
  });
  if (!values.merged) {
    console.error(
      "Usage: node scripts/check-site-csp.mjs --merged <dir> [--origin https://kaiord.com]"
    );
    process.exit(1);
  }
  failIfAny(
    "content security policy problem(s)",
    checkSiteCsp(values.merged, { origin: values.origin })
  );
  console.log("✅ Every page of the site carries a safe CSP");
}
