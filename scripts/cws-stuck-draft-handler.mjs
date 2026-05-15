#!/usr/bin/env node
// Tiered auto-unstick handler for STUCK_DRAFT extensions.
// CLI: node scripts/cws-stuck-draft-handler.mjs <ext> <ext-id> <version> <run-url>
// See tierFor() for the tier map. Functions return {tier, action};
// the CLI entry translates that to $GITHUB_OUTPUT. Deps (`gh`, `publishItem`)
// are injected for testability.

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { parseServiceAccountJson } from "./cws-api/auth.mjs";
import { publishItem } from "./cws-api/publish.mjs";
import { bumpRetryCount, parseRetryCount } from "./cws-api/stuck-draft-tier.mjs";

// Tier mapping: null → 1 (fresh issue); 0/1 → 2 (kick); -1 or >=2 → 3 (escalate).
function tierFor(count) {
  if (count == null) return 1;
  if (count === -1 || count >= 2) return 3;
  return 2;
}

const tier1Body = (ext, version, runUrl) =>
  `**CWS publish stuck:** ${ext} draft is at ${version}, but the live store version is older.\n\n` +
  "This issue is automatically tracked by `cws-publish.yml`. Do not edit the `RETRY_COUNT:` marker manually unless you understand the parser contract in `scripts/cws-api/stuck-draft-tier.mjs`.\n\n" +
  `- Local version: ${version}\n- Run: ${runUrl}\n` +
  "- Partner dashboard: https://chrome.google.com/webstore/devconsole\n\n" +
  "### Status\n\n- Tier: 1 (notify)\n- Next workflow run will attempt a `publishItem` kick (Tier 2).\n\nRETRY_COUNT: 0\n";

export function findOpenIssue(gh, title) {
  const out = gh("issue", [
    "list", "--state", "open", "--search", `${title} in:title`,
    "--json", "number,title,body", "--limit", "20",
  ]);
  const exact = JSON.parse(out || "[]").find((i) => i.title === title);
  return exact ? { number: exact.number, body: exact.body ?? "" } : null;
}

const editBody = (gh, number, body) =>
  gh("issue", ["edit", String(number), "--body", body]);

async function runTier2(gh, publish, issue, extensionId) {
  const bumped = bumpRetryCount(issue.body);
  editBody(gh, issue.number, bumped);
  try {
    await publish(extensionId);
    return { tier: 2, action: "publishitem-kicked" };
  } catch {
    editBody(gh, issue.number, bumped.replace(/RETRY_COUNT: \d+/, "RETRY_COUNT: -1"));
    return { tier: "2-failed-to-3", action: "sentinel-applied" };
  }
}

export async function handle({ extension, extensionId, version, runUrl, gh, publish }) {
  const title = `cws-publish-stuck-${extension}-${version}`;
  const issue = findOpenIssue(gh, title);
  if (issue === null) {
    gh("issue", ["create", "--title", title, "--label", "cws-stuck", "--body", tier1Body(extension, version, runUrl)]);
    return { tier: 1, action: "opened-issue" };
  }
  const tier = tierFor(parseRetryCount(issue.body));
  if (tier === 1) {
    editBody(gh, issue.number, bumpRetryCount(issue.body));
    return { tier: 1, action: "reset-counter" };
  }
  if (tier === 2) return runTier2(gh, publish, issue, extensionId);
  return { tier: 3, action: "escalation-required" };
}

const defaultGh = () => (sub, args) =>
  execFileSync("gh", [sub, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const defaultPublish = (env) => {
  const sa = parseServiceAccountJson(env.CWS_SERVICE_ACCOUNT_KEY ?? "");
  return (extensionId) => publishItem(sa, extensionId);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [extension, extensionId, version, runUrl] = process.argv.slice(2);
  if (!extension || !extensionId || !version || !runUrl) {
    process.stderr.write("Usage: cws-stuck-draft-handler.mjs <ext> <ext-id> <version> <run-url>\n");
    process.exit(2);
  }
  handle({ extension, extensionId, version, runUrl, gh: defaultGh(), publish: defaultPublish(process.env) }).then(
    (result) => {
      if (process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, `tier=${result.tier}\naction=${result.action}\n`);
      }
      process.stdout.write(JSON.stringify(result) + "\n");
      process.exit(0);
    },
    (err) => {
      process.stderr.write(`[CwsStateError] ${err.message}\n`);
      process.exit(1);
    },
  );
}
