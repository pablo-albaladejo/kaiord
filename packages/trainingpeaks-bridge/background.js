/**
 * Kaiord TrainingPeaks Bridge — Background Service Worker
 *
 * SW-direct TrainingPeaks metrics access with NO password. The durable
 * credential is the user's own `Production_tpAuth` session cookie; the service
 * worker exchanges it (cookie-only) for a short-lived Bearer and calls
 * `tpapi.trainingpeaks.com` directly (see tp-auth.js for the dual transport).
 * No TrainingPeaks tab, content script, or cookie access is involved.
 *
 * Routes SPA ↔ background messages for session probe, metric reads, and the
 * (optional) weight write. Metric JSON is returned raw — parsing lives in
 * `@kaiord/trainingpeaks` and runs SPA-side; this bridge never imports it. The
 * session cookie is never read or exposed; session presence is a boolean only.
 */

const PROTOCOL_VERSION = 1;
const OPEN_TRAININGPEAKS_URL = "https://app.trainingpeaks.com/";

const BRIDGE_MANIFEST = {
  id: "trainingpeaks-bridge",
  name: "TrainingPeaks",
  version: "10.0.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body", "write:body"],
};

// ── Shared envelope/dispatch (vendored bridge-core) ──
let bridgeEnvelope;
try {
  importScripts("bridge-envelope.js");
  bridgeEnvelope = globalThis;
} catch {
  bridgeEnvelope =
    typeof require !== "undefined" ? require("./bridge-envelope.js") : {};
}

// ── Identity-free transports (vendored bridge-core) ──
// Loaded BEFORE tp-auth.js so it can read self.cookieSessionFetch (cookie
// token exchange) and self.bearerRequest (Bearer data calls).
try {
  importScripts("session-fetch.js");
} catch {
  // Node test path resolves the master via require inside tp-auth.js.
}
try {
  importScripts("bearer-fetch.js");
} catch {
  // Node test path resolves the master via require inside tp-auth.js.
}

// ── Dual-transport auth (bridge-specific; cookie→token→Bearer) ──
let tpAuth;
try {
  importScripts("tp-auth.js");
  tpAuth = globalThis.tpAuth;
} catch {
  tpAuth = typeof require !== "undefined" ? require("./tp-auth.js") : {};
}

// ── TrainingPeaks call surface ──
//
// Defense-in-depth allowlist (single-physical-line entries, locked by
// scripts/check-bridge-privacy-surface.mjs): the cookie-only token endpoint,
// the metric-range read, and the single-metric write. The SPA never supplies a
// raw path — athlete id / date range are interpolated here — but the bridge
// still refuses any tpapi request outside this set.
// prettier-ignore — each entry MUST stay on one physical line so the privacy
// surface guard (scripts/check-bridge-privacy-surface.mjs) can extract it.
// prettier-ignore
const ALLOWED = [
  { method: "GET", pattern: /^\/users\/v3\/token$/ },
  { method: "GET", pattern: /^\/metrics\/v3\/athletes\/\d+\/consolidatedtimedmetrics\/[^\/]+\/[^\/]+$/ },
  { method: "POST", pattern: /^\/metrics\/v3\/athletes\/\d+\/consolidatedtimedmetric$/ },
];

const isAllowed = (method, path) =>
  ALLOWED.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// Data-call wrapper: refuse a disallowed path, else delegate to the Bearer
// transport (which mints/refreshes the token from the cookie as needed).
const tpFetch = async (path, method, body) => {
  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  return tpAuth.tpapiFetch(path, method || "GET", body, fetch);
};

const toBridgeError = (fallback, res) => {
  const msg =
    res?.error ?? `${fallback}${res?.status ? `: ${res.status}` : ""}`;
  const err = new Error(msg);
  if (typeof res?.status === "number") err.status = res.status;
  if (res?.needsReauth) err.needsReauth = true;
  return err;
};

// ── Read throttle ──
// TrainingPeaks 429s on rapid requests; clients self-throttle to ~150 ms
// between calls. Space consecutive reads by the remaining interval (mirrors
// garmin's MIN_INTERVAL pattern; here we delay rather than reject so the SPA
// still receives its data).
const MIN_READ_INTERVAL_MS = 150;
let lastReadAt = 0;

const sleep = (ms) =>
  ms > 0
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();

const spaceReads = async (minIntervalMs) => {
  const wait = Math.max(0, minIntervalMs - (Date.now() - lastReadAt));
  if (wait > 0) await sleep(wait);
  lastReadAt = Date.now();
};

// ── Actions ──

// Session probe for the SPA connection pill. Reports a boolean plus the
// resolved athlete id (so the SPA can build write payloads); never the token.
const checkSession = async () => {
  const result = { ...BRIDGE_MANIFEST };
  try {
    const probe = await tpAuth.checkTokenExchange(fetch);
    result.authenticated = probe.ok === true;
    if (probe.ok) result.athleteId = probe.athleteId;
  } catch {
    result.authenticated = false;
  }
  return result;
};

// GET the consolidated timed metrics for a date range. Returns the raw JSON —
// never parsed here (parsing lives in @kaiord/trainingpeaks, SPA-side).
const readMetrics = async (message, opts = {}) => {
  const { minIntervalMs = MIN_READ_INTERVAL_MS } = opts;
  const { start, end } = message;
  if (!start || !end) throw new Error("Missing start/end date range");
  const athleteId = message.athleteId ?? (await tpAuth.ensureAthleteId(fetch));
  if (athleteId === null || athleteId === undefined) {
    throw new Error("Could not resolve TrainingPeaks athlete id");
  }
  await spaceReads(minIntervalMs);
  const path = `/metrics/v3/athletes/${athleteId}/consolidatedtimedmetrics/${start}/${end}`;
  const res = await tpFetch(path, "GET");
  if (!res?.ok) throw toBridgeError("Metrics read failed", res);
  return res.data;
};

// POST a single consolidated timed metric (a type-9 weight payload built
// SPA-side by @kaiord/trainingpeaks). The bridge relays the JSON as-is.
const pushWeight = async (message) => {
  const metric = message.metric;
  if (!metric) throw new Error("Missing metric payload");
  const athleteId =
    message.athleteId ??
    metric.athleteId ??
    (await tpAuth.ensureAthleteId(fetch));
  if (athleteId === null || athleteId === undefined) {
    throw new Error("Could not resolve TrainingPeaks athlete id");
  }
  const path = `/metrics/v3/athletes/${athleteId}/consolidatedtimedmetric`;
  const res = await tpFetch(path, "POST", metric);
  if (!res?.ok) throw toBridgeError("Weight push failed", res);
  return res.data;
};

const openTrainingPeaks = async () => {
  await chrome.tabs.create({ url: OPEN_TRAININGPEAKS_URL });
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
    case "checkSession":
      return await checkSession();
    case "read-metrics":
      return await readMetrics(message);
    case "push-weight":
      return await pushWeight(message);
    case "open-trainingpeaks":
      await openTrainingPeaks();
      return null;
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
// Every external message is origin-pinned and action-allowlisted by the
// vendored envelope guard. The allowlist equals this bridge's full external
// action surface — the popup uses the internal channel.
const EXTERNAL_ACTIONS = new Set([
  "ping",
  "checkSession",
  "read-metrics",
  "push-weight",
  "open-trainingpeaks",
]);

const dispatch = bridgeEnvelope.createDispatch({
  handleAction,
  protocolVersion: PROTOCOL_VERSION,
});

const dispatchExternal = bridgeEnvelope.createExternalDispatch({
  dispatch,
  externalActions: EXTERNAL_ACTIONS,
  protocolVersion: PROTOCOL_VERSION,
});

if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener((message, sender, respond) =>
    dispatchExternal(message, sender, respond)
  );
  chrome.runtime.onMessage.addListener((message, _sender, respond) =>
    dispatch(message, respond)
  );
}

// Exported for testing
if (typeof module !== "undefined") {
  module.exports = {
    PROTOCOL_VERSION,
    BRIDGE_MANIFEST,
    ALLOWED,
    isAllowed,
    tpFetch,
    checkSession,
    readMetrics,
    pushWeight,
    openTrainingPeaks,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
    MIN_READ_INTERVAL_MS,
  };
}
