#!/usr/bin/env node
// Lint privacy-policy.md against the spec at
// openspec/specs/privacy-policy/spec.md: every required disclosure
// bullet must appear in the rendered policy. Prevents doc drift
// when the spec or the shipping extensions change without a
// corresponding policy update.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const POLICY = join(
  REPO_ROOT,
  "packages",
  "docs",
  "legal",
  "privacy-policy.md"
);

// Each rule = human-readable label + regex that MUST match the file.
const REQUIRED_RULES = [
  {
    label: "Last updated date in YYYY-MM-DD format",
    re: /\*\*Last updated:\*\*\s+\d{4}-\d{2}-\d{2}/,
  },
  {
    label: "Garmin Bridge extension covered",
    re: /Kaiord Garmin Bridge/i,
  },
  {
    label: "Train2Go Bridge extension covered",
    re: /Kaiord Train2Go Bridge/i,
  },
  {
    label: "Garmin host disclosed",
    re: /connect\.garmin\.com/,
  },
  {
    label: "Train2Go host disclosed",
    re: /app\.train2go\.com/,
  },
  {
    label: "Kaiord origin disclosed",
    re: /\*\.kaiord\.com/,
  },
  {
    label: "CSRF-token session-storage disclosure",
    re: /CSRF token.*chrome\.storage\.session/is,
  },
  {
    label: "GDPR referenced",
    re: /GDPR/,
  },
  {
    label: "CCPA referenced",
    re: /CCPA/,
  },
  {
    label: "Data-subject rights explicitly named",
    re: /access, rectification, erasure, portability/i,
  },
  {
    label: "LLM provider data flow disclosed (Anthropic / OpenAI / Google)",
    re: /Anthropic.*OpenAI.*Google/s,
  },
  {
    label: "Client-side-only storage clarified (IndexedDB / Dexie)",
    re: /IndexedDB/i,
  },
  {
    label: "externally_connectable direction disclosed (one-way inbound)",
    re: /externally_connectable/,
  },
  {
    label: "Localhost dev origins disclosed",
    re: /localhost:5173/,
  },
  {
    label: "Open-source link present",
    re: /github\.com\/pablo-albaladejo\/kaiord/,
  },
  {
    label: "Contact path present",
    re: /contact the project maintainer/i,
  },
];

export function checkPolicy(src) {
  const violations = [];
  for (const { label, re } of REQUIRED_RULES) {
    if (!re.test(src)) {
      violations.push(label);
    }
  }
  return violations;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(POLICY)) {
    console.error(`[check-privacy-policy] ${POLICY} not found`);
    process.exit(2);
  }
  const src = readFileSync(POLICY, "utf8");
  const violations = checkPolicy(src);

  if (violations.length > 0) {
    console.error(
      `\npackages/docs/legal/privacy-policy.md is missing required disclosures (${violations.length}):\n`
    );
    for (const v of violations) console.error(`  - ${v}`);
    console.error(
      "\nEvery rule corresponds to a requirement in openspec/specs/privacy-policy/spec.md."
    );
    process.exit(1);
  }

  console.log(
    "packages/docs/legal/privacy-policy.md: all required disclosures present."
  );
}
