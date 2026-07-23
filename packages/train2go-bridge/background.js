/**
 * Kaiord Train2Go Bridge — Background Service Worker
 *
 * SW-direct Train2Go read bridge: the service worker fetches the user's
 * training-plan endpoints on app.train2go.com directly with
 * `credentials:"include"`, so the site's HttpOnly session cookie travels
 * automatically. No content script on app.train2go.com, no `tabs` or
 * `scripting` permission, and no credentials ever handled by the extension.
 *
 * The raw response body is parsed into structured activity data via
 * parser.js. The session cookie is never read or exposed; a dead session
 * (redirect / login response) is surfaced to callers as needsReauth.
 */

const PROTOCOL_VERSION = 1;
const TRAIN2GO_ORIGIN = "https://app.train2go.com";
const TRAIN2GO_DASHBOARD = "https://app.train2go.com/user/index";

const BRIDGE_MANIFEST = {
  id: "train2go-bridge",
  name: "Kaiord Train2Go Bridge",
  version: "10.1.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:training-plan", "read:training-zones"],
};

// ── Swallowed-error telemetry ──
//
// Several catch{} blocks below intentionally swallow errors so a single
// failure doesn't break the whole bridge (see the comment at each call
// site). That used to make root-causing "why doesn't X work" impossible
// without opening the service worker's devtools console. This keeps the
// swallow behavior but records a structured, capped log so the cause is
// inspectable — e.g. `chrome.storage.local.get("bridgeTelemetry")` from
// the popup or chrome://extensions devtools.
const TELEMETRY_KEY = "bridgeTelemetry";
const TELEMETRY_MAX_ENTRIES = 25;

// Writes are chained so concurrent calls cannot interleave their
// read-modify-write cycles and silently drop each other's entries.
let telemetryWrite = Promise.resolve();

const logSwallowed = (level, action, cause) => {
  const entry = {
    level,
    action,
    cause: String(cause?.message ?? cause),
    at: Date.now(),
  };
  telemetryWrite = telemetryWrite
    .then(() => chrome.storage.local.get(TELEMETRY_KEY))
    .then(({ [TELEMETRY_KEY]: existing = [] }) =>
      chrome.storage.local.set({
        [TELEMETRY_KEY]: [...existing, entry].slice(-TELEMETRY_MAX_ENTRIES),
      })
    )
    .catch(() => {
      // Storage itself unavailable (e.g. quota); nothing more we can do.
    });
  return telemetryWrite;
};

// ── Parser (loaded inline for service worker) ──
// In the extension, parser.js is loaded via importScripts or inlined.
// For testing, it's required via module.exports.
let parser;
try {
  importScripts("parser.js");
  parser = globalThis;
} catch (e) {
  parser = typeof require !== "undefined" ? require("./parser.js") : {};
  // In the packaged extension this only fires if the bundled file is
  // missing or fails to parse — a real misconfiguration. Under Node
  // (tests, build tooling) it fires on every load and is expected, so
  // it's logged at "debug" rather than "error".
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-parser",
    e
  );
}

let snapshotValidator;
try {
  importScripts("profile-snapshot.js");
  snapshotValidator = globalThis;
} catch (e) {
  snapshotValidator =
    typeof require !== "undefined" ? require("./profile-snapshot.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-profile-snapshot",
    e
  );
}

// ── Shared envelope/dispatch (vendored bridge-core) ──
let bridgeEnvelope;
try {
  importScripts("bridge-envelope.js");
  bridgeEnvelope = globalThis;
} catch (e) {
  bridgeEnvelope =
    typeof require !== "undefined" ? require("./bridge-envelope.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-bridge-envelope",
    e
  );
}

// ── Identity-free cookie transport (vendored bridge-core) ──
let sessionFetch;
try {
  importScripts("session-fetch.js");
  sessionFetch = globalThis;
} catch (e) {
  sessionFetch =
    typeof require !== "undefined" ? require("./session-fetch.js") : {};
  void logSwallowed(
    typeof require !== "undefined" ? "debug" : "error",
    "load-session-fetch",
    e
  );
}

// ── Train2Go call surface ──
//
// Defense-in-depth path allowlist, enforced in the service worker before any
// fetch runs (it used to live in the now-deleted content-script relay). Locked
// against drift by scripts/check-bridge-privacy-surface.mjs, which parses
// `method: "..."` and `pattern: /.../` off each single physical line — don't
// let prettier wrap the long regexes.
const ALLOWED = [
  { method: "GET", pattern: /^\/api\/v2\/profile\/ping$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/weekly\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  // prettier-ignore
  { method: "GET", pattern: /^\/api\/v2\/workplan\/daily\/\d{4}-\d{2}-\d{2}(\?user=\d+(&source=\w+)?)?$/ },
  { method: "GET", pattern: /^\/api\/v2\/workplan\/tooltip\/activity\/\d+$/ },
  // Server-rendered HTML page used by the zones-sync feature; data is
  // extracted by parseDetailsHtml below.
  { method: "GET", pattern: /^\/user\/details$/ },
];

const isAllowed = (method, path) =>
  sessionFetch.isPathAllowed(ALLOWED, method, path);

// Reads the response body dispatching by Content-Type: text/html pages are
// returned verbatim (the details page is parsed downstream by
// parseDetailsHtml); everything else is a JSON API payload.
const parseBody = (contentType, body) =>
  /^\s*text\/html\b/i.test(contentType || "") ? body : JSON.parse(body);

// ── SW-direct cookie fetch ──
//
// GET a first-party Train2Go endpoint on the user's existing cookie session
// via the identity-free session-fetch master. Returns the same envelope the
// callers below already consume: { ok, status, data } on success, or
// { ok:false, needsReauth?, status?, error } on a dead session / failure.
const train2goFetch = async (path, method = "GET") => {
  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TRAIN2GO_ORIGIN}${path}`,
    method,
    fetchImpl: fetch,
  });
  if (!res.ok) {
    return {
      ok: false,
      ...(res.needsReauth ? { needsReauth: true } : {}),
      ...(typeof res.status === "number" ? { status: res.status } : {}),
      error: res.error,
    };
  }
  let data;
  try {
    data = parseBody(res.contentType, res.body);
  } catch {
    return { ok: false, status: res.status, error: "Malformed response body" };
  }
  return { ok: true, status: res.status, data };
};

// ── Actions ──

let lastPingedUserId = null;

// Spread session FIRST, then BRIDGE_MANIFEST, so manifest fields
// (id/name/version/protocolVersion/capabilities) cannot be spoofed by
// a future Train2Go API change that returns its own keys with the same
// names. This matches the garmin-bridge precedence and is enforced by
// the "manifest fields take precedence" test.
const ping = async () => {
  try {
    const res = await train2goFetch("/api/v2/profile/ping");
    if (!res?.ok) {
      return { ...BRIDGE_MANIFEST, sessionActive: false };
    }
    const session = parser.parsePingJson(res.data);
    if (session.userId) lastPingedUserId = session.userId;
    return {
      ...session,
      ...BRIDGE_MANIFEST,
      sessionActive: session.sessionActive,
      userId: session.userId,
      userName: session.userName,
    };
    // session may also carry coachName / notes — both are spread above
    // and only the BRIDGE_MANIFEST keys are explicitly overwritten.
  } catch (e) {
    // Network failure, malformed response, or parser error — degrade to
    // "no session" rather than throwing, so a transient Train2Go outage
    // doesn't break the popup/detection flow. The cause is still recorded.
    void logSwallowed("warn", "ping", e);
    return { ...BRIDGE_MANIFEST, sessionActive: false };
  }
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  // Preserve the session-expiry signal end-to-end: the envelope surfaces
  // needsReauth so the SPA can prompt a re-login.
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

const readWeek = async (date, userId) => {
  const path = `/api/v2/workplan/weekly/${date}?user=${userId}`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw toBridgeError("Read week failed", res);

  const html = res.data?.data?.replace?.["#workplan"] ?? "";
  return { activities: parser.parseWeeklyHtml(html) };
};

const readDay = async (date, userId) => {
  const path = `/api/v2/workplan/daily/${date}?user=${userId}&source=sidebar`;
  const res = await train2goFetch(path);
  if (!res?.ok) throw toBridgeError("Read day failed", res);

  const html = res.data?.data?.content ?? "";
  // Backfill `date` from the request param: the daily HTML fragment
  // is single-day, so `parseDailyHtml` cannot extract the date the
  // way `parseWeeklyHtml` does (via the `workplan-table-date-YYYY-MM-DD`
  // CSS-class anchor — absent in the daily endpoint). Without this
  // step, `expandDay` upserts records with `date: ""`, causing the
  // activity to drop out of every per-day calendar bucket — the
  // visible symptom is the card disappearing the moment the user
  // opens its detail dialog (which lazy-fetches via expandDay).
  const activities = parser.parseDailyHtml(html).map((a) => ({ ...a, date }));
  // The day-scoped comment thread lives in the same fragment (right
  // column). Additive payload — older SPAs ignore `comments`.
  const comments = parser.extractComments(html);
  return { activities, comments };
};

// Reads the server-rendered /user/details page and extracts a raw-shape
// `ZonesPayload` per the parser's allowlist. The SPA-side syncZones use
// case maps this to Kaiord-domain thresholds; the bridge stays
// platform-shaped.
const readDetails = async () => {
  const res = await train2goFetch("/user/details");
  if (!res?.ok) throw toBridgeError("Read details failed", res);
  // train2goFetch returns the raw HTML body for text/html responses.
  const html = typeof res.data === "string" ? res.data : "";
  return parser.parseDetailsHtml(html);
};

const openTrain2Go = async () => {
  await chrome.tabs.create({ url: TRAIN2GO_DASHBOARD });
};

const persistSnapshot = async (snapshot) => {
  const result = snapshotValidator.validateSnapshot(snapshot);
  if (!result.ok) {
    const err = new Error(result.error);
    err.retryable = false;
    throw err;
  }
  const receivedAt = Date.now();
  await chrome.storage.local.set({
    profileSnapshot: { ...result.value, receivedAt },
    lastPushReceipt: { at: receivedAt, name: result.value.profile.name },
  });
  return { storedAt: receivedAt };
};

const clearSnapshot = async () => {
  await chrome.storage.local.remove([
    "profileSnapshot",
    "lastWeeklyRollup",
    "lastPushReceipt",
  ]);
  return null;
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
      return await ping();
    case "read-week":
      if (!message.userId) throw new Error("Missing userId");
      return await readWeek(message.date, message.userId);
    case "read-day":
      if (!message.userId) throw new Error("Missing userId");
      return await readDay(message.date, message.userId);
    case "read-details":
      return await readDetails();
    case "open-train2go":
      await openTrain2Go();
      return null;
    case "profile-snapshot":
      return await persistSnapshot(message.snapshot);
    case "profile-snapshot-clear":
      return await clearSnapshot();
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
// Every external message is origin-pinned and action-allowlisted by the
// vendored guard (spec: bridge-core). The allowlist equals this bridge's
// full action surface — the popup uses the internal channel.

const EXTERNAL_ACTIONS = new Set([
  "ping",
  "read-week",
  "read-day",
  "read-details",
  "open-train2go",
  "profile-snapshot",
  "profile-snapshot-clear",
]);

const dispatch = bridgeEnvelope.createDispatch({
  handleAction,
  protocolVersion: PROTOCOL_VERSION,
});

const handleExternalMessage = bridgeEnvelope.createExternalDispatch({
  dispatch,
  externalActions: EXTERNAL_ACTIONS,
  protocolVersion: PROTOCOL_VERSION,
});

chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

// ── Internal messages (popup) ──

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
  dispatch(message, sendResponse)
);

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    TRAIN2GO_ORIGIN,
    EXTERNAL_ACTIONS,
    ALLOWED,
    isAllowed,
    parseBody,
    handleAction,
    handleExternalMessage,
    train2goFetch,
    ping,
    readWeek,
    readDay,
    readDetails,
    openTrain2Go,
    persistSnapshot,
    clearSnapshot,
    TELEMETRY_KEY,
    logSwallowed,
  };
}
