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
// externally_connectable.matches entries allowed in each extension.
// kaiord.com covers the production editor; localhost entries are the
// dev-server match patterns the policy discloses explicitly.
const ALLOWED_EXTERNALLY_CONNECTABLE = new Set([
  "https://*.kaiord.com/*",
  "http://localhost:5173/*",
  "http://localhost:5174/*",
]);
// content_scripts.matches entries allowed for the announce-only script
// that injects into SPA origins so the editor can discover installed
// extensions at runtime. Chrome match patterns do not accept a port in
// the host, so localhost is expressed as `http://localhost/*`.
const ALLOWED_ANNOUNCE_CONTENT_SCRIPT_MATCHES = new Set([
  "https://*.kaiord.com/*",
  "http://localhost/*",
]);
// No extension may declare these: cookies (credential access),
// webRequestBlocking / declarativeNetRequest* (request mutation).
const FORBIDDEN_PERMISSIONS = new Set([
  "cookies",
  "webRequestBlocking",
  "declarativeNetRequest",
  "declarativeNetRequestWithHostAccess",
  "declarativeNetRequestFeedback",
]);

// Each rule = human-readable label + regex that MUST match the file.
const REQUIRED_RULES = [
  {
    label: "Last updated date in YYYY-MM-DD format",
    re: /\*\*Last updated:\*\*\s+\d{4}-\d{2}-\d{2}/,
  },
  {
    label: "Data controller scope clarified (no Kaiord-operated controller)",
    re: /no Kaiord-operated data controller/i,
  },
  {
    label: "Retention / deletion guidance present",
    re: /(clear site data|delete it from the editor)/i,
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
    label: "Host-permission narrowing stated (no <all_urls>)",
    re: /no wildcard or `<all_urls>` access/i,
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
    label: "Announce-only content-script disclosure present",
    re: /announce-only/i,
  },
  {
    label: "Localhost dev origins disclosed",
    re: /localhost:5173/,
  },
  {
    label: "Children's Privacy section present",
    re: /##\s+Children's Privacy/i,
  },
  {
    label: "Changes-to-policy section present",
    re: /##\s+Changes to this Policy/i,
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

  // permissions + optional_permissions (both paths can grant credential
  // or request-mutation access at runtime).
  const allPerms = [
    ...(manifest.permissions ?? []),
    ...(manifest.optional_permissions ?? []),
  ];
  for (const p of allPerms) {
    if (FORBIDDEN_PERMISSIONS.has(p)) {
      violations.push(
        `${extensionName}: forbidden permission "${p}" declared (policy claims no credential access and no request mutation)`
      );
    }
  }

  // host_permissions narrowed to the disclosed host.
  const hosts = manifest.host_permissions ?? [];
  for (const h of hosts) {
    if (!allowedHosts.has(h)) {
      violations.push(
        `${extensionName}: undisclosed host_permission "${h}" — policy lists only ${[...allowedHosts].join(", ")}`
      );
    }
  }

  // content_scripts matches must be inside the disclosed host, OR
  // must be the announce-only injection set disclosed alongside
  // externally_connectable (the SPA-origin match used for runtime
  // extension discovery).
  for (const cs of manifest.content_scripts ?? []) {
    for (const m of cs.matches ?? []) {
      if (
        allowedHosts.has(m) ||
        ALLOWED_ANNOUNCE_CONTENT_SCRIPT_MATCHES.has(m)
      ) {
        continue;
      }
      violations.push(
        `${extensionName}: undisclosed content_scripts match "${m}" — policy restricts DOM access to ${[...allowedHosts].join(", ")} or the announce-only matches ${[...ALLOWED_ANNOUNCE_CONTENT_SCRIPT_MATCHES].join(", ")}`
      );
    }
  }

  // externally_connectable matches must be inside the disclosed set
  // (prod + dev localhost origins the policy names explicitly).
  const ec = manifest.externally_connectable?.matches ?? [];
  for (const m of ec) {
    if (!ALLOWED_EXTERNALLY_CONNECTABLE.has(m)) {
      violations.push(
        `${extensionName}: undisclosed externally_connectable match "${m}" — policy restricts the one-way inbound channel to ${[...ALLOWED_EXTERNALLY_CONNECTABLE].join(", ")}`
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
