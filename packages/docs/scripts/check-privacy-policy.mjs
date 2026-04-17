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
const VITEPRESS_CONFIG = join(
  REPO_ROOT,
  "packages",
  "docs",
  ".vitepress",
  "config.ts"
);
const TRAIN2GO_MANIFEST = join(
  REPO_ROOT,
  "packages",
  "train2go-bridge",
  "manifest.json"
);
const GARMIN_MANIFEST = join(
  REPO_ROOT,
  "packages",
  "garmin-bridge",
  "manifest.json"
);

// Hosts the policy claims each production extension may contact.
const TRAIN2GO_ALLOWED_HOSTS = new Set(["https://app.train2go.com/*"]);
const GARMIN_ALLOWED_HOSTS = new Set(["https://connect.garmin.com/*"]);
// Train2Go must not declare `cookies`; Garmin uses `webRequest` +
// `storage` but must not add `cookies` either (policy claims no
// credential access).
const FORBIDDEN_PERMISSIONS = new Set(["cookies"]);

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

export function checkManifestPermissions(
  manifestPath,
  extensionName,
  allowedHosts
) {
  const violations = [];
  if (!existsSync(manifestPath)) {
    violations.push(`${extensionName}: manifest not found at ${manifestPath}`);
    return violations;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const perms = manifest.permissions ?? [];
  for (const p of perms) {
    if (FORBIDDEN_PERMISSIONS.has(p)) {
      violations.push(
        `${extensionName}: forbidden permission "${p}" declared (policy claims no credential access)`
      );
    }
  }
  const hosts = manifest.host_permissions ?? [];
  for (const h of hosts) {
    if (!allowedHosts.has(h)) {
      violations.push(
        `${extensionName}: undisclosed host_permission "${h}" — policy lists only ${[...allowedHosts].join(", ")}`
      );
    }
  }
  return violations;
}

export function checkSidebar(configSrc) {
  if (!/legal\/privacy-policy/.test(configSrc)) {
    return [
      `packages/docs/.vitepress/config.ts: no sidebar link to /legal/privacy-policy — spec Requirement "Privacy policy navigation" violated`,
    ];
  }
  return [];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(POLICY)) {
    console.error(`[check-privacy-policy] ${POLICY} not found`);
    process.exit(2);
  }
  const policySrc = readFileSync(POLICY, "utf8");
  const all = [];
  all.push(...checkPolicy(policySrc));
  all.push(
    ...checkManifestPermissions(
      TRAIN2GO_MANIFEST,
      "train2go-bridge",
      TRAIN2GO_ALLOWED_HOSTS
    )
  );
  all.push(
    ...checkManifestPermissions(
      GARMIN_MANIFEST,
      "garmin-bridge",
      GARMIN_ALLOWED_HOSTS
    )
  );
  if (existsSync(VITEPRESS_CONFIG)) {
    all.push(...checkSidebar(readFileSync(VITEPRESS_CONFIG, "utf8")));
  }

  if (all.length > 0) {
    console.error(
      `\npackages/docs/legal/privacy-policy.md drift detected (${all.length}):\n`
    );
    for (const v of all) console.error(`  - ${v}`);
    console.error(
      "\nEvery rule corresponds to a requirement in openspec/specs/privacy-policy/spec.md."
    );
    process.exit(1);
  }

  console.log(
    "packages/docs/legal/privacy-policy.md: policy text, extension manifests, and sidebar are in sync with the spec."
  );
}
