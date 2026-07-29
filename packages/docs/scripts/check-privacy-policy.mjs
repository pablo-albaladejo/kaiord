#!/usr/bin/env node
// Lint privacy-policy.md against the spec at
// openspec/specs/privacy-policy/spec.md: every required disclosure
// bullet must appear in the rendered policy. Prevents doc drift
// when the spec or the shipping extensions change without a
// corresponding policy update.

import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

// Per-extension policy section headings. A rule carrying `section` is
// matched ONLY against that section's body (heading line exclusive, up to
// the next `## `), never against the whole document — otherwise the intro
// sentence at the top of the policy, which names every extension, and the
// shared Communication Scope section, which names every host, silently
// satisfy rules that are supposed to be about the section itself. Deleting
// a whole section must fail the lint; before this anchoring it did not.
const GARMIN_SECTION = "Kaiord Garmin Bridge Extension";
const TRAIN2GO_SECTION = "Kaiord Train2Go Bridge Extension";
const TANITA_SECTION = "Kaiord Tanita Bridge Extension";
const TRAININGPEAKS_SECTION = "Kaiord TrainingPeaks Bridge Extension";
const WHOOP_SECTION = "Kaiord WHOOP Bridge Extension";

// Bridge package -> its policy section and the hosts the policy claims the
// extension may contact.
//
// The KEY SET is checked against `packages/*-bridge` on disk by
// checkBridgeCoverage below. Hardcoding five manifest paths, five host sets
// and five section constants meant `packages/foo-bridge` could ship with no
// policy section, no host allowlist and — worse — no forbidden-permission
// and no credential-permission check at all, entirely green. The host sets
// themselves cannot be derived from the manifests: the manifest is the
// thing being checked.
export const BRIDGE_REGISTRY = {
  "garmin-bridge": {
    section: GARMIN_SECTION,
    hosts: new Set([
      "https://connect.garmin.com/*",
      "https://connectapi.garmin.com/*",
      "https://sso.garmin.com/*",
    ]),
  },
  "train2go-bridge": {
    section: TRAIN2GO_SECTION,
    hosts: new Set(["https://app.train2go.com/*"]),
  },
  "tanita-bridge": {
    section: TANITA_SECTION,
    hosts: new Set(["https://mytanita.eu/*"]),
  },
  "trainingpeaks-bridge": {
    section: TRAININGPEAKS_SECTION,
    hosts: new Set(["https://tpapi.trainingpeaks.com/*"]),
  },
  "whoop-bridge": {
    section: WHOOP_SECTION,
    hosts: new Set(["https://api.prod.whoop.com/*", "https://app.whoop.com/*"]),
  },
};

// A section that exists but is constrained by almost nothing is the same
// defect as a section that is missing. "Covered" has to mean the rule set
// still says as much about this extension as it did.
//
// Shrink-only ratchet, in the shape `BOUNDARIES_ALLOWLIST_MAX` already uses
// in this repo: each number is that section's CURRENT rule count and may
// only ever go up. A flat floor of 6 would have let TrainingPeaks lose 7 of
// its 13 rules with the guard silent — a floor with no regression power,
// which is most of what a floor is for.
export const SECTION_RULE_FLOOR = {
  [GARMIN_SECTION]: 9,
  [TRAIN2GO_SECTION]: 8,
  [TANITA_SECTION]: 11,
  [TRAININGPEAKS_SECTION]: 13,
  [WHOOP_SECTION]: 8,
};

// A section with no recorded floor is a bridge being onboarded. It has to
// clear this before it can be recorded — the 0 → 6 barrier.
export const MIN_NEW_SECTION_RULES = 6;

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
// No extension may declare these under any circumstance: they let the
// extension mutate, redirect, or block the user's traffic, which the
// policy claims none of them can do.
const FORBIDDEN_PERMISSIONS = new Set([
  "webRequestBlocking",
  "declarativeNetRequest",
  "declarativeNetRequestWithHostAccess",
  "declarativeNetRequestFeedback",
]);

// Permissions that grant direct read access to a credential the user never
// handed to the extension. `cookies` exposes session cookie values;
// `webRequest` + `extraHeaders` exposes Authorization headers, which is the
// same class of access by a different mechanism — a guard that forbids the
// first while silently permitting the second does not enforce its own
// stated premise. Declaring one of these is a violation UNLESS the
// extension appears in CREDENTIAL_PERMISSION_EXEMPTIONS below with a
// written reason, so the exception is recorded and reviewable rather than
// invisible.
const CREDENTIAL_ACCESS_PERMISSIONS = new Set(["cookies", "webRequest"]);

// extension name -> { permission -> why it is justified }.
// Adding an entry here is a deliberate act that MUST be accompanied by a
// matching disclosure in the extension's privacy-policy section.
const CREDENTIAL_PERMISSION_EXEMPTIONS = {
  "whoop-bridge": {
    webRequest:
      "read-only chrome.webRequest.onBeforeSendHeaders on api.prod.whoop.com; " +
      "session-bearer capture path 2 of 3, disclosed in the policy's " +
      "'Three Session-Bearer Capture Paths' bullet. No webRequestBlocking " +
      "and no declarativeNetRequest*, so no request is ever modified.",
  },
};

// Claims every bridge section must make, whatever the bridge does: the
// extension talks to nobody else, and it phones nothing home.
const NO_THIRD_PARTY = /No data is shared with any third party/i;
const NO_TELEMETRY =
  /does not include any analytics, error reporting, or telemetry/i;

// Each rule = human-readable label + regex that MUST match, either the
// whole file (no `section`) or one section's body (`section` set).
//
// Per-bridge rules follow the shape WHOOP's already had: one rule per
// capture path, one per sensitive permission, one per data destination,
// each failing on its own. Four of the five sections used to be anchored by
// one or two substrings, so replacing an entire section body with a single
// line that happened to name the host produced zero violations.
export const REQUIRED_RULES = [
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

  // ---------------------------- Garmin ----------------------------
  {
    label: "Garmin host disclosed",
    section: GARMIN_SECTION,
    re: /connect\.garmin\.com/,
  },
  {
    label: "Garmin SSO host disclosed",
    section: GARMIN_SECTION,
    re: /sso\.garmin\.com/,
  },
  {
    label: "Garmin API host disclosed",
    section: GARMIN_SECTION,
    re: /connectapi\.garmin\.com/,
  },
  {
    label: "OAuth-token local-storage disclosure",
    section: GARMIN_SECTION,
    re: /OAuth token[\s\S]*?chrome\.storage\.local/i,
  },
  {
    label: "Garmin capture path disclosed (existing single-sign-on session)",
    section: GARMIN_SECTION,
    re: /reusing your existing Garmin single-sign-on session/i,
  },
  {
    label: "Garmin no-password guarantee stated",
    section: GARMIN_SECTION,
    re: /never reads, stores, or transmits your Garmin Connect password/i,
  },
  {
    label: "Garmin write scope disclosed (write:body upload)",
    section: GARMIN_SECTION,
    re: /`write:body`/,
  },
  {
    label: "Garmin no-third-party-sharing stated",
    section: GARMIN_SECTION,
    re: NO_THIRD_PARTY,
  },
  {
    label: "Garmin no-telemetry stated",
    section: GARMIN_SECTION,
    re: NO_TELEMETRY,
  },

  // --------------------------- Train2Go ---------------------------
  {
    label: "Train2Go host disclosed",
    section: TRAIN2GO_SECTION,
    re: /app\.train2go\.com/,
  },
  {
    label: "Train2Go capture path disclosed (on-demand page-DOM read)",
    section: TRAIN2GO_SECTION,
    re: /read on-demand from the Train2Go page DOM/i,
  },
  {
    label: "Train2Go no-credentials guarantee stated",
    section: TRAIN2GO_SECTION,
    re: /never reads, stores, or transmits your Train2Go password/i,
  },
  {
    label: "Train2Go non-declaration of the `cookies` permission stated",
    section: TRAIN2GO_SECTION,
    re: /does not declare the `cookies` permission/i,
  },
  {
    label: "Train2Go read-only DOM access stated (no page mutation)",
    section: TRAIN2GO_SECTION,
    re: /does not modify the page, submit forms/i,
  },
  {
    label: "Train2Go zero-persistence stated (nothing written to storage)",
    section: TRAIN2GO_SECTION,
    re: /nothing is written to `chrome\.storage`/i,
  },
  {
    label: "Train2Go no-third-party-sharing stated",
    section: TRAIN2GO_SECTION,
    re: NO_THIRD_PARTY,
  },
  {
    label: "Train2Go no-telemetry stated",
    section: TRAIN2GO_SECTION,
    re: NO_TELEMETRY,
  },

  // ---------------------------- Tanita ----------------------------
  {
    label: "Tanita host disclosed",
    section: TANITA_SECTION,
    re: /mytanita\.eu/,
  },
  {
    label: "Tanita read scope disclosed (read:body only)",
    section: TANITA_SECTION,
    re: /Only the `read:body` capability is declared/i,
  },
  {
    label: "Tanita body-composition data class disclosed",
    section: TANITA_SECTION,
    re: /body[- ]composition/i,
  },
  {
    label: "Tanita no-password guarantee stated",
    section: TANITA_SECTION,
    re: /never asks for, reads, stores, or transmits your MyTANITA password/i,
  },
  {
    label: "Tanita capture path disclosed (existing session cookie ride)",
    section: TANITA_SECTION,
    re: /credentials:"include"/,
  },
  {
    label: "Tanita session cookie named and stated unreadable (TANITASESS)",
    section: TANITA_SECTION,
    re: /HttpOnly `TANITASESS` session cookie/,
  },
  {
    label: "Tanita non-declaration of the `cookies` permission stated",
    section: TANITA_SECTION,
    re: /does not declare the `cookies` permission/i,
  },
  {
    label: "Tanita no-DOM-access stated (no content script on mytanita.eu)",
    section: TANITA_SECTION,
    re: /injects no content script/i,
  },
  {
    label: "Tanita single fixed read-only GET disclosed",
    section: TANITA_SECTION,
    re: /single, fixed, read-only `GET`/i,
  },
  {
    label: "Tanita no-third-party-sharing stated",
    section: TANITA_SECTION,
    re: NO_THIRD_PARTY,
  },
  {
    label: "Tanita no-telemetry stated",
    section: TANITA_SECTION,
    re: NO_TELEMETRY,
  },

  // ------------------------- TrainingPeaks ------------------------
  {
    label: "TrainingPeaks host disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /tpapi\.trainingpeaks\.com/,
  },
  {
    label: "TrainingPeaks no-password cookie→token nature disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /cookie for a short-lived access token/i,
  },
  {
    label: "TrainingPeaks no-password guarantee stated",
    section: TRAININGPEAKS_SECTION,
    re: /never asks for, reads, stores, or transmits your TrainingPeaks password/i,
  },
  {
    label: "TrainingPeaks token endpoint disclosed (users/v3/token)",
    section: TRAININGPEAKS_SECTION,
    re: /users\/v3\/token/,
  },
  {
    label: "TrainingPeaks session cookie named (Production_tpAuth)",
    section: TRAININGPEAKS_SECTION,
    re: /Production_tpAuth/,
  },
  {
    label: "TrainingPeaks non-declaration of the `cookies` permission stated",
    section: TRAININGPEAKS_SECTION,
    re: /does not declare the `cookies` permission/i,
  },
  {
    label: "TrainingPeaks token storage location disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /chrome\.storage\.local/,
  },
  {
    label: "TrainingPeaks read+write body scopes disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /`read:body` and `write:body` capabilities/,
  },
  {
    label: "TrainingPeaks write path disclosed (single weight measurement)",
    section: TRAININGPEAKS_SECTION,
    re: /writes a single weight measurement back/i,
  },
  {
    label: "TrainingPeaks metrics read endpoint disclosed (metrics/v3)",
    section: TRAININGPEAKS_SECTION,
    re: /metrics\/v3/,
  },
  {
    label: "TrainingPeaks no-DOM-access stated",
    section: TRAININGPEAKS_SECTION,
    re: /injects no content script/i,
  },
  {
    label: "TrainingPeaks no-third-party-sharing stated",
    section: TRAININGPEAKS_SECTION,
    re: NO_THIRD_PARTY,
  },
  {
    label: "TrainingPeaks no-telemetry stated",
    section: TRAININGPEAKS_SECTION,
    re: NO_TELEMETRY,
  },

  // ----------------------------- WHOOP ----------------------------
  {
    label: "WHOOP host disclosed",
    section: WHOOP_SECTION,
    re: /app\.whoop\.com/,
  },
  {
    label: "WHOOP no-OAuth session-bearer nature disclosed",
    section: WHOOP_SECTION,
    re: /No OAuth/i,
  },
  // The WHOOP bridge has three distinct ways of obtaining the session
  // bearer. Each gets its own rule: a section that describes only one or
  // two of them is incomplete, and an incomplete disclosure is the defect
  // this whole rule set exists to prevent.
  {
    label: "WHOOP capture path 1 disclosed (main-world request interceptor)",
    section: WHOOP_SECTION,
    re: /main-world script[\s\S]*?`?Authorization/i,
  },
  {
    label: "WHOOP capture path 2 disclosed (read-only webRequest listener)",
    section: WHOOP_SECTION,
    re: /chrome\.webRequest\.onBeforeSendHeaders/,
  },
  {
    label:
      "WHOOP capture path 3 disclosed (Cognito access token at rest in localStorage)",
    section: WHOOP_SECTION,
    re: /localStorage[\s\S]*?CognitoIdentityServiceProvider/,
  },
  {
    label: "WHOOP declared permissions named in its own section",
    section: WHOOP_SECTION,
    re: /`tabs`[\s\S]*?`webRequest`[\s\S]*?`scripting`[\s\S]*?`storage`/,
  },
  {
    label: "WHOOP non-declaration of the `cookies` permission stated",
    section: WHOOP_SECTION,
    re: /not\*?\*? declare the `cookies` permission/i,
  },
  {
    label:
      "WHOOP account identifier egress disclosed (custom:user_id reaches the editor)",
    section: WHOOP_SECTION,
    re: /custom:user_id/,
  },

  // -------------------------- whole file --------------------------
  {
    label: "Kaiord origin disclosed",
    re: /\*\.kaiord\.com/,
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
    label:
      "Chat assistant data flow disclosed (health summaries, user-initiated)",
    re: /chat assistant[\s\S]*?health/i,
  },
  {
    label: "Chat transcripts client-side storage disclosed",
    re: /chat transcripts?/i,
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

// Body of the `## <heading>` section: everything after the heading line up
// to the next top-level `## ` heading. Returns null when the heading is
// absent. The heading must match a whole line exactly, so a mention of the
// same words in running prose cannot stand in for the section.
export function sectionBody(src, heading) {
  const lines = src.split("\n");
  const start = lines.findIndex((line) => line.trimEnd() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

export function checkPolicy(src, rules = REQUIRED_RULES) {
  const violations = [];
  for (const { label, section, re } of rules) {
    if (section === undefined) {
      if (!re.test(src)) violations.push(label);
      continue;
    }
    const body = sectionBody(src, section);
    if (body === null) {
      violations.push(`${label} — section "## ${section}" is missing entirely`);
      continue;
    }
    if (!re.test(body)) {
      violations.push(`${label} — not found inside "## ${section}"`);
    }
  }
  return violations;
}

// Every `packages/*-bridge` on disk, sorted. Same derivation the CI-coverage
// and locales guards already use.
export function discoverBridgePackages(repoRoot = REPO_ROOT) {
  return readdirSync(join(repoRoot, "packages"))
    .filter(
      (name) =>
        name.endsWith("-bridge") &&
        statSync(join(repoRoot, "packages", name)).isDirectory()
    )
    .sort();
}

// "<X> Bridge extension covered" used to be a rule whose regex was `/\S/`:
// it fired only when a section was empty, which is a strict subset of when
// its sibling rules fire, so it never once failed on its own. It named the
// requirement and asserted nothing.
//
// The requirement is real, so it is kept — as a check that CAN fail alone.
// Two independent mutations trip it and nothing else: shipping a bridge
// package that no section and no host set describes, and gutting the rule
// set for a section that still exists.
export function checkBridgeCoverage(
  src,
  bridges,
  registry = BRIDGE_REGISTRY,
  rules = REQUIRED_RULES
) {
  const violations = [];
  for (const bridge of bridges) {
    const entry = registry[bridge];
    if (!entry) {
      violations.push(
        `${bridge} Bridge extension covered — packages/${bridge} exists on disk but has no BRIDGE_REGISTRY entry, ` +
          `so it has no policy section, no host allowlist, and no forbidden/credential permission check at all`
      );
      continue;
    }
    if (sectionBody(src, entry.section) === null) {
      violations.push(
        `${bridge} Bridge extension covered — section "## ${entry.section}" is missing entirely`
      );
      continue;
    }
    const count = rules.filter((r) => r.section === entry.section).length;
    const floor = SECTION_RULE_FLOOR[entry.section];
    if (floor === undefined) {
      if (count < MIN_NEW_SECTION_RULES) {
        violations.push(
          `${bridge} Bridge extension covered — "## ${entry.section}" is constrained by ${count} rule(s); ` +
            `a bridge needs at least ${MIN_NEW_SECTION_RULES} before it is recorded in SECTION_RULE_FLOOR`
        );
      }
    } else if (count < floor) {
      violations.push(
        `${bridge} Bridge extension covered — "## ${entry.section}" is constrained by ${count} rule(s), ` +
          `down from the recorded ${floor}. This floor is shrink-only: raise it when you add rules, ` +
          `never lower it to accommodate deleting one`
      );
    }
  }
  for (const bridge of Object.keys(registry)) {
    if (!bridges.includes(bridge)) {
      violations.push(
        `${bridge} Bridge extension covered — BRIDGE_REGISTRY names it but packages/${bridge} does not exist; the entry is stale`
      );
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
  const exemptions = CREDENTIAL_PERMISSION_EXEMPTIONS[extensionName] ?? {};
  for (const p of allPerms) {
    if (FORBIDDEN_PERMISSIONS.has(p)) {
      violations.push(
        `${extensionName}: forbidden permission "${p}" declared (policy claims no request mutation)`
      );
    }
    if (CREDENTIAL_ACCESS_PERMISSIONS.has(p) && !exemptions[p]) {
      violations.push(
        `${extensionName}: credential-access permission "${p}" declared with no documented exemption — ` +
          `either drop it, or add it to CREDENTIAL_PERMISSION_EXEMPTIONS in this script with a written reason ` +
          `AND disclose the use in the extension's privacy-policy section`
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

// Both sides resolved through realpath: comparing a raw
// `pathToFileURL(process.argv[1])` against `import.meta.url` is false
// whenever the invocation path contains a symlink (macOS `/tmp` →
// `/private/tmp`, a CI checkout under a linked workdir, a container
// bind-mount), because Node resolves module URLs to the real path but
// leaves argv[1] exactly as typed. The guard then exited 0 having checked
// nothing — and with no `argv[1]` guard at all it threw instead when the
// module was loaded with no entry path.
export function isDirectInvocation(moduleUrl, entryPath) {
  if (!entryPath) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(entryPath);
  } catch {
    return false;
  }
}

function main() {
  if (!existsSync(POLICY)) {
    console.error(`[check-privacy-policy] ${POLICY} not found`);
    process.exit(2);
  }
  const policySrc = readFileSync(POLICY, "utf8");
  const bridges = discoverBridgePackages();
  const all = [];
  all.push(...checkPolicy(policySrc));
  all.push(...checkBridgeCoverage(policySrc, bridges));
  for (const bridge of bridges) {
    const entry = BRIDGE_REGISTRY[bridge];
    // An unregistered bridge is already reported by checkBridgeCoverage,
    // and there is no host set to check its manifest against.
    if (!entry) continue;
    all.push(
      ...checkManifestPermissions(
        join(REPO_ROOT, "packages", bridge, "manifest.json"),
        bridge,
        entry.hosts
      )
    );
  }
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

if (isDirectInvocation(import.meta.url, process.argv[1])) {
  main();
}
