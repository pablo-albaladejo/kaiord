#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

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

export function checkPage(html) {
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

export function checkSiteCsp(dir) {
  return htmlFiles(dir).flatMap((file) =>
    checkPage(readFileSync(join(dir, file), "utf8")).map(
      (problem) => `${file}: ${problem}`
    )
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { merged: { type: "string" } } });
  if (!values.merged) {
    console.error("Usage: node scripts/check-site-csp.mjs --merged <dir>");
    process.exit(1);
  }
  failIfAny("content security policy problem(s)", checkSiteCsp(values.merged));
  console.log("✅ Every page of the site carries a safe CSP");
}
