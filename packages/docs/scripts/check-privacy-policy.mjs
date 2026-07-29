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
const TANITA_MANIFEST = join(
  REPO_ROOT,
  "packages",
  "tanita-bridge",
  "manifest.json"
);
const TRAININGPEAKS_MANIFEST = join(
  REPO_ROOT,
  "packages",
  "trainingpeaks-bridge",
  "manifest.json"
);
const WHOOP_MANIFEST = join(
  REPO_ROOT,
  "packages",
  "whoop-bridge",
  "manifest.json"
);

// Hosts the policy claims each production extension may contact.
const TRAIN2GO_ALLOWED_HOSTS = new Set(["https://app.train2go.com/*"]);
const GARMIN_ALLOWED_HOSTS = new Set([
  "https://connect.garmin.com/*",
  "https://connectapi.garmin.com/*",
  "https://sso.garmin.com/*",
]);
const TANITA_ALLOWED_HOSTS = new Set(["https://mytanita.eu/*"]);
const TRAININGPEAKS_ALLOWED_HOSTS = new Set([
  "https://tpapi.trainingpeaks.com/*",
]);
const WHOOP_ALLOWED_HOSTS = new Set([
  "https://api.prod.whoop.com/*",
  "https://app.whoop.com/*",
]);
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

// Each rule = human-readable label + regex that MUST match, either the
// whole file (no `section`) or one section's body (`section` set).
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
    label: "Garmin Bridge extension covered (own section, non-empty)",
    section: GARMIN_SECTION,
    re: /\S/,
  },
  {
    label: "Train2Go Bridge extension covered (own section, non-empty)",
    section: TRAIN2GO_SECTION,
    re: /\S/,
  },
  {
    label: "Tanita Bridge extension covered (own section, non-empty)",
    section: TANITA_SECTION,
    re: /\S/,
  },
  {
    label: "TrainingPeaks Bridge extension covered (own section, non-empty)",
    section: TRAININGPEAKS_SECTION,
    re: /\S/,
  },
  {
    label: "WHOOP Bridge extension covered (own section, non-empty)",
    section: WHOOP_SECTION,
    re: /\S/,
  },
  {
    label: "Garmin host disclosed",
    section: GARMIN_SECTION,
    re: /connect\.garmin\.com/,
  },
  {
    label: "Train2Go host disclosed",
    section: TRAIN2GO_SECTION,
    re: /app\.train2go\.com/,
  },
  {
    label: "Tanita host disclosed",
    section: TANITA_SECTION,
    re: /mytanita\.eu/,
  },
  {
    label: "Tanita body-composition read scope disclosed (read:body)",
    section: TANITA_SECTION,
    re: /body[- ]composition/i,
  },
  {
    label: "Tanita no-password cookie-session nature disclosed",
    section: TANITA_SECTION,
    re: /no password/i,
  },
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
  {
    label: "Kaiord origin disclosed",
    re: /\*\.kaiord\.com/,
  },
  {
    label: "OAuth-token local-storage disclosure",
    section: GARMIN_SECTION,
    re: /OAuth token[\s\S]*?chrome\.storage\.local/i,
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

export function checkPolicy(src) {
  const violations = [];
  for (const { label, section, re } of REQUIRED_RULES) {
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
  all.push(
    ...checkManifestPermissions(
      TANITA_MANIFEST,
      "tanita-bridge",
      TANITA_ALLOWED_HOSTS
    )
  );
  all.push(
    ...checkManifestPermissions(
      TRAININGPEAKS_MANIFEST,
      "trainingpeaks-bridge",
      TRAININGPEAKS_ALLOWED_HOSTS
    )
  );
  all.push(
    ...checkManifestPermissions(
      WHOOP_MANIFEST,
      "whoop-bridge",
      WHOOP_ALLOWED_HOSTS
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
