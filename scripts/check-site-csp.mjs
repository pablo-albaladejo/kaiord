#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

// Reads the assembled site exactly as Pages serves it and fails on a landing
// or App page whose content security policy would let an injected script
// run. It parses the policy back out of the HTML on purpose: it shares no
// code with the injector, so removing the policy, or loosening it, is seen
// here whatever the injector does. The docs ship their own VitePress build
// and are not judged.

const META = /<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/i;
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const EXECUTABLE_TYPE = /^(|text\/javascript|application\/javascript|module)$/i;

// A source that admits code nobody hashed: any inline or eval'd code, any
// scheme, any host wildcard.
const isUnsafeScriptSource = (source) =>
  /^'unsafe-(inline|eval|hashes)'$/i.test(source) ||
  source.includes("*") ||
  /^[a-z][a-z0-9+.-]*:$/i.test(source);

const parsePolicy = (content) =>
  new Map(
    content
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name.toLowerCase(), sources])
  );

const attr = (attrs, name) =>
  new RegExp(`\\b${name}\\s*=\\s*["']?([^"'\\s>]*)`, "i").exec(attrs)?.[1];

const scriptsOf = (html) =>
  [...html.matchAll(SCRIPT)]
    .map((m) => ({ at: m.index, attrs: m[1], text: m[2] }))
    .filter(({ attrs }) => EXECUTABLE_TYPE.test(attr(attrs, "type") ?? ""));

const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text).digest("base64")}'`;

export function checkPage(html) {
  const meta = META.exec(html);
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
    .filter((entry) => !entry.startsWith("docs/"))
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
  const problems = checkSiteCsp(values.merged);
  if (problems.length > 0) {
    console.error(`❌ ${problems.length} content security policy problem(s):`);
    for (const problem of problems.slice(0, 3)) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("✅ Every landing and App page carries a safe CSP");
}
