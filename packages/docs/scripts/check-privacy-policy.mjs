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

import {
  APP_ORIGIN,
  DEV_ORIGINS,
  matchPattern,
} from "../../../scripts/lib/app-origins.mjs";

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
// kaiord.com/privacy/ — kept answering 200 for store listings that may still
// link it, but it must only forward to the docs policy.
const LANDING_PRIVACY = join(
  REPO_ROOT,
  "packages",
  "landing",
  "public",
  "privacy",
  "index.html"
);
export const DOCS_POLICY_PATH = "/docs/legal/privacy-policy";

// Per-extension policy section headings. A rule carrying `section` is
// matched ONLY against that section's body (heading line exclusive, up to
// the next `## `), never against the whole document — otherwise the intro
// sentence at the top of the policy, which names every extension, and the
// shared Communication Scope section, which names every host, silently
// satisfy rules that are supposed to be about the section itself. Deleting
// a whole section must fail the lint; before this anchoring it did not.
const GARMIN_SECTION = "Kaiord for Garmin Extension";
const TRAIN2GO_SECTION = "Kaiord for Train2Go Extension";
const TANITA_SECTION = "Kaiord for Tanita Extension";
const TRAININGPEAKS_SECTION = "Kaiord for TrainingPeaks Extension";
const WHOOP_SECTION = "Kaiord for WHOOP Extension";

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
  [GARMIN_SECTION]: 16,
  [TRAIN2GO_SECTION]: 12,
  [TANITA_SECTION]: 13,
  [TRAININGPEAKS_SECTION]: 19,
  [WHOOP_SECTION]: 9,
};

// A section with no recorded floor is a bridge being onboarded. It has to
// clear this before it can be recorded — the 0 → 6 barrier.
export const MIN_NEW_SECTION_RULES = 6;

// externally_connectable.matches entries allowed in each extension: the
// exact App origin (no subdomain) and the two Vite dev servers the policy
// discloses. The announce-only content script that lets the editor discover
// installed extensions is allowed on the same set; a match pattern without
// a port (`http://localhost/*`) would match every port.
const APP_MATCHES = [APP_ORIGIN, ...DEV_ORIGINS].map(matchPattern);
const ALLOWED_EXTERNALLY_CONNECTABLE = new Set(APP_MATCHES);
const ALLOWED_ANNOUNCE_CONTENT_SCRIPT_MATCHES = new Set(APP_MATCHES);
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
    // The site, docs and editor run Umami. A policy saying "no analytics"
    // is false, so the disclosure sentence itself is what this pins.
    label:
      "Umami analytics disclosed (cookie-less, anonymous, never user data, surfaces named)",
    re: /We use Umami, a privacy-friendly, cookie-less analytics tool\. It records anonymous page views and product events \(e\.g\. 'workout exported'\); never your workouts, health data or API keys\. Umami runs on the website \(kaiord\.com\), the documentation and the web editor\./,
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
    label: "Garmin calendar write disclosed",
    section: GARMIN_SECTION,
    re: /places each workout on its date in your Garmin Connect calendar/i,
  },
  {
    label: "Garmin calendar delete limited to superseded Kaiord-placed entries",
    section: GARMIN_SECTION,
    re: /deletes the old entry that Kaiord itself placed and has since superseded[\s\S]*?never deletes entries of other workouts/i,
  },
  {
    label:
      "Garmin library delete limited to versions Kaiord created and no entry uses",
    section: GARMIN_SECTION,
    re: /deletes the earlier version from your Garmin Connect workout library \(a library delete\)\. It deletes only library workouts that Kaiord's record holds as created by Kaiord, never one you created, and keeps an earlier version while it has a calendar entry/i,
  },
  {
    label: "Garmin calendar read filtered on the device",
    section: GARMIN_SECTION,
    re: /filtered in the Kaiord App, in your browser[\s\S]*?nothing is sent to a Kaiord-operated server/i,
  },
  {
    label: "Garmin answers handed to the App unread (thin Bridge)",
    section: GARMIN_SECTION,
    re: /hands the Kaiord App Garmin's answer as it came, without reading it/i,
  },
  {
    label: "Garmin calendar read purposes named",
    section: GARMIN_SECTION,
    re: /before placing it on a date, so no second entry is added there; when you send again a workout that has not changed, to check that its entry is still there; to confirm a placement Garmin did not clearly confirm; to check the calendar before removing an entry Kaiord replaced; and to re-check entries whose earlier removal did not complete/i,
  },
  {
    label: "Garmin calendar delete scoped to entries Kaiord placed",
    section: GARMIN_SECTION,
    re: /deletes only entries that Kaiord's record holds as placed by Kaiord[\s\S]*?added yourself is recognized[\s\S]*?never moved or deleted/i,
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
    label:
      "Train2Go capture path disclosed (service worker, own session cookie)",
    section: TRAIN2GO_SECTION,
    re: /with `credentials: "include"`, so Chrome attaches your own Train2Go session cookie/i,
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
    label: "Train2Go no-DOM-access stated",
    section: TRAIN2GO_SECTION,
    re: /injects no script into Train2Go pages/i,
  },
  {
    label: "Train2Go read-only access stated (no page or account mutation)",
    section: TRAIN2GO_SECTION,
    re: /does not modify the page, submit forms, or write to your account/i,
  },
  {
    label: "Train2Go local storage disclosed (popup state only)",
    section: TRAIN2GO_SECTION,
    re: /keeps in `chrome\.storage\.local` only what its popup shows/i,
  },
  {
    label: "Train2Go coach name and notes disclosed",
    section: TRAIN2GO_SECTION,
    re: /your coach's name and the notes your coach keeps about you/i,
  },
  {
    label: "Train2Go profile page kept by the App to zones and weight only",
    section: TRAIN2GO_SECTION,
    re: /which keeps only your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight/i,
  },
  {
    label: "Train2Go answers handed to the App unread (thin Bridge)",
    section: TRAIN2GO_SECTION,
    re: /hands it Train2Go's answer as it came, without reading it/i,
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
    label: "Tanita read-only requests to one fixed export address disclosed",
    section: TANITA_SECTION,
    re: /read-only requests to one fixed address, `[^`]+`: a `GET` that downloads the export and a `HEAD` that checks the connection/i,
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
  {
    label: "Tanita session check by HEAD, downloading nothing, disclosed",
    section: TANITA_SECTION,
    re: /Checking the Connection Downloads Nothing\*\*: .*it sends a `HEAD` request for the export, which returns no measurement/,
  },
  {
    label: "Tanita chrome.storage.local contents disclosed",
    section: TANITA_SECTION,
    re: /keeps in `chrome\.storage\.local` only when its popup last could and could not reach your export, and the Kaiord App's theme preference/,
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
    label: "TrainingPeaks body and workout scopes disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /`read:body`, `write:body` and `write:workouts` capabilities/,
  },
  {
    label: "TrainingPeaks workout write disclosed (calendar)",
    section: TRAININGPEAKS_SECTION,
    re: /adds each workout you send from the Kaiord App to your TrainingPeaks calendar/i,
  },
  {
    label: "TrainingPeaks no delete or overwrite stated",
    section: TRAININGPEAKS_SECTION,
    re: /cannot delete anything in TrainingPeaks or change a workout already there/i,
  },
  {
    label: "TrainingPeaks unused weight write disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /accepts a request to add one weight measurement, but the Kaiord App does not send it today/i,
  },
  {
    label: "TrainingPeaks connection check minting no token disclosed",
    section: TRAININGPEAKS_SECTION,
    re: /When the Kaiord App or the popup checks your sign-in, the extension asks TrainingPeaks nothing and mints no token/i,
  },
  {
    label: "TrainingPeaks answers handed to the App unread (thin Bridge)",
    section: TRAININGPEAKS_SECTION,
    re: /hands the Kaiord App TrainingPeaks' answer as it came, without reading it/i,
  },
  {
    label: "TrainingPeaks workout read kept by the App to its id and day",
    section: TRAININGPEAKS_SECTION,
    re: /to the Kaiord App, which keeps only that workout's id and day/i,
  },
  {
    label:
      "TrainingPeaks day read only after an unanswered send, kept to titles",
    section: TRAININGPEAKS_SECTION,
    re: /If a send gets no answer, then before that workout is sent again the extension reads the workouts of that day[\s\S]*?which keeps only their titles; if one has the same title, the Kaiord App sends nothing and asks you first/i,
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
    label: "WHOOP answers handed to the Kaiord App unread (thin Bridge)",
    section: WHOOP_SECTION,
    re: /WHOOP's answer is handed to the Kaiord App as it came, without being read/i,
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

  // ---------------------- remote MCP endpoint ----------------------
  // Whole-file rules: the section-rule floor ratchet is per bridge, and
  // each phrase below exists only in the endpoint section, so deleting
  // that section fails every one of them.
  {
    label: "Remote MCP endpoint: structured workouts only, rejects not kept",
    re: /accepts only structured workout definitions[\s\S]*?decoded in memory only to learn its type, and is neither stored, logged nor returned/i,
  },
  {
    label: "Remote MCP endpoint: workout content may carry personal data",
    re: /name, free-text notes, heart-rate targets and device metadata[\s\S]*?processed in transit, and may contain personal information/i,
  },
  {
    label: "Remote MCP endpoint: content never stored or logged",
    re: /processed only to answer that request and is never stored or logged/i,
  },
  {
    label: "Remote MCP endpoint: client IP transient, not stored",
    re: /client IP address is used transiently by the rate limiter and is not stored by Kaiord/i,
  },
  {
    label: "Remote MCP endpoint: Cloudflare named as provider",
    re: /travel through Cloudflare's network, which is the endpoint's network and hosting provider/i,
  },
  {
    label: "Remote MCP endpoint: no Garmin or health tools",
    re: /endpoint offers no Garmin or health tools/i,
  },
  {
    label: "Remote A2A endpoint: same tools and terms, tasks not retained",
    re: /`https:\/\/kaiord\.com\/a2a`[^\n]*same tools under the same terms[^\n]*tasks finish inside the reply and are not retained/i,
  },
  {
    label: "Remote A2A endpoint: stated as not deployed yet",
    re: /`https:\/\/kaiord\.com\/a2a`[^\n]*it is not deployed yet, so nothing answers there today\. Once deployed, it runs/,
  },
  {
    label: "Regulatory statement names both remote endpoints",
    re: /The remote MCP endpoint \(kaiord\.com\/mcp\), like the A2A endpoint \(kaiord\.com\/a2a\) once it is deployed,/,
  },
  {
    label: "Regulatory statement covers remote MCP in-transit data",
    re: /no personal data is retained server-side[\s\S]*?in transit only, and retains neither/i,
  },

  // -------------------------- whole file --------------------------
  {
    label: "Exact Kaiord App origin disclosed, subdomains excluded",
    re: /`https:\/\/kaiord\.com\/\*`[^\n]*that exact origin only, no subdomain/,
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
      "Provider API key storage disclosed (obfuscated, who can read it, Drive copy)",
    re: /API key is stored in your browser[\s\S]*?obfuscated[\s\S]*?any script running on kaiord\.com[\s\S]*?browser extension[\s\S]*?never to Kaiord[\s\S]*?Google Drive/,
  },
  {
    label:
      "Chat assistant data flow disclosed (health summaries, user-initiated)",
    re: /chat assistant[\s\S]*?health/i,
  },
  {
    label:
      "Assistant Traces disclosed as device-only (never sent, not synced, not in a backup)",
    re: /leaves a Trace in your browser[\s\S]*?Traces are never sent anywhere[\s\S]*?sync snapshot[\s\S]*?backup file/,
  },
  {
    label:
      "Assistant usage log disclosed as device-only (not synced, not in a backup)",
    re: /The usage log stays on this device[\s\S]*?sync snapshot[\s\S]*?backup file/,
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

// A "no analytics" claim is false while Umami runs, and requiring the
// disclosure does not stop a stale denial surviving next to it. Any
// negation ("no", "not", "without", "never", "n't") followed by "analytics"
// in the same sentence counts: "we do not use analytics", "don't collect
// analytics", "without analytics", "not ... any analytics". `\b` keeps
// "anonymous analytics" from matching on its "no". Bridge sections are
// exempt: their "No Telemetry" bullets describe the extensions, which
// really have none.
export const NO_ANALYTICS_CLAIM =
  /(?:\b(?:no|not|without|never)\b|n['’]t\b)[^.]*\banalytics\b/i;
const BRIDGE_HEADING = /^## Kaiord for .+ Extension$/;

export function checkNoAnalyticsClaim(src) {
  const violations = [];
  let inBridge = false;
  for (const line of src.split("\n")) {
    if (/^## /.test(line)) inBridge = BRIDGE_HEADING.test(line.trimEnd());
    if (inBridge) continue;
    // Emphasis is stripped first: the original claim read "does **not**
    // collect any … analytics", which the bare regex does not match.
    const match = line.replace(/[*_]/g, "").match(NO_ANALYTICS_CLAIM);
    if (match) {
      violations.push(
        `"No analytics" claim outside the bridge sections — Umami runs on the site, docs and editor: "${match[0]}"`
      );
    }
  }
  return violations;
}

// The text a browser would render, found in a single left-to-right pass
// the way its tokenizer does: `<!--` runs to the next `-->`, a `<` that
// opens a tag runs to the next `>`, and any other `<` is literal text. One
// pass, so markup that only becomes a tag or comment after another is
// removed (`<<!---->!-- x -->`) stays text, as it does in the browser.
export function visibleText(html, tagReplacement = " ") {
  let out = "";
  let i = 0;
  while (i < html.length) {
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      i = end === -1 ? html.length : end + 3;
    } else if (html[i] === "<" && /[a-zA-Z/!?]/.test(html[i + 1] ?? "")) {
      const end = html.indexOf(">", i + 1);
      i = end === -1 ? html.length : end + 1;
      out += tagReplacement;
    } else {
      out += html[i];
      i += 1;
    }
  }
  return out;
}

// The markup with every `<!-- ... -->` removed, in one left-to-right pass
// so removing one comment can never form another.
export function withoutComments(html) {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf("<!--", i);
    if (start === -1) return out + html.slice(i);
    out += html.slice(i, start);
    const end = html.indexOf("-->", start + 4);
    i = end === -1 ? html.length : end + 3;
  }
  return out;
}

// The landing page at kaiord.com/privacy/ used to carry its own, stale copy
// of the policy ("We use no analytics…"). It may only forward to the docs.
export function checkLandingPrivacyRedirect(html) {
  const violations = [];
  const where = "packages/landing/public/privacy/index.html";
  const target = DOCS_POLICY_PATH.replaceAll("/", "\\/");
  const checks = [
    [
      new RegExp(`<link rel="canonical" href="https://kaiord\\.com${target}"`),
      "canonical link to the docs policy",
    ],
    [
      new RegExp(`<meta http-equiv="refresh" content="0; url=${target}"`),
      "meta refresh 0 to the docs policy",
    ],
    [new RegExp(`<a href="${target}"`), "visible link to the docs policy"],
  ];
  // A commented-out element does nothing in the browser, so it must not
  // satisfy the check.
  const active = withoutComments(html);
  for (const [re, what] of checks) {
    if (!re.test(active)) violations.push(`${where}: missing ${what}`);
  }
  // A tag may split a word (`n<b>o</b>`) or separate two (`no<br>analytics`),
  // so the claim is checked against both joinings.
  const match =
    visibleText(html, "").match(NO_ANALYTICS_CLAIM) ??
    visibleText(html, " ").match(NO_ANALYTICS_CLAIM);
  if (match) {
    violations.push(`${where}: "no analytics" claim: "${match[0].trim()}"`);
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
  all.push(...checkNoAnalyticsClaim(policySrc));
  all.push(...checkBridgeCoverage(policySrc, bridges));
  if (existsSync(LANDING_PRIVACY)) {
    all.push(
      ...checkLandingPrivacyRedirect(readFileSync(LANDING_PRIVACY, "utf8"))
    );
  } else {
    all.push(
      `${LANDING_PRIVACY} not found — kaiord.com/privacy/ must keep answering 200`
    );
  }
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
