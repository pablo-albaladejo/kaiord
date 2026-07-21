/**
 * Kaiord Tanita Bridge — Background Service Worker
 *
 * SW-direct MyTANITA export capture: the service worker fetches the user's
 * own CSV export from their logged-in mytanita.eu session with
 * `credentials:"include"`, so the HttpOnly `TANITASESS` session cookie
 * travels automatically. No password, no `cookies` permission, no content
 * script on mytanita.eu.
 *
 * The raw CSV text is returned verbatim — never parsed here. Parsing lives
 * in @kaiord/tanita and runs SPA-side; this bridge does not import it. The
 * session cookie is never read or exposed; session presence is reported to
 * callers only as a boolean.
 */

const PROTOCOL_VERSION = 1;
const TANITA_ORIGIN = "https://mytanita.eu";
const EXPORT_CSV_PATH = "/en/user/export-csv";

const BRIDGE_MANIFEST = {
  id: "tanita-bridge",
  name: "Tanita",
  version: "10.0.0",
  protocolVersion: PROTOCOL_VERSION,
  capabilities: ["read:body"],
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

// ── Identity-free cookie transport (vendored bridge-core) ──
let sessionFetch;
try {
  importScripts("session-fetch.js");
  sessionFetch = globalThis;
} catch {
  sessionFetch =
    typeof require !== "undefined" ? require("./session-fetch.js") : {};
}

// ── Tanita call surface ──
//
// Defense-in-depth allowlist: the SPA only ever triggers the fixed export
// path (no caller-supplied path reaches fetch), but the bridge still
// refuses any mytanita.eu request outside this set. Locked against drift by
// scripts/check-bridge-privacy-surface.mjs (single-physical-line entries).
const ALLOWED = [{ method: "GET", pattern: /^\/en\/user\/export-csv$/ }];

const isAllowed = (method, path) =>
  sessionFetch.isPathAllowed(ALLOWED, method, path);

// A 200 whose body is an HTML document (not CSV) means mytanita served a
// login page in place of the export — the session is dead even though no
// redirect fired. Detected by content-type or a leading HTML tag.
const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i;
const HTML_BODY_RE = /^\s*<(?:!doctype|html)\b/i;

const looksLikeHtml = (contentType, body) =>
  HTML_CONTENT_TYPE_RE.test(contentType || "") || HTML_BODY_RE.test(body || "");

// GET the CSV export on the user's cookie session. Returns raw CSV text —
// never parsed here. On a dead session (opaqueredirect / 3xx / login HTML)
// returns needsReauth so the SPA can prompt a re-login.
const fetchExportCsv = async (method = "GET") => {
  if (!isAllowed(method, EXPORT_CSV_PATH)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TANITA_ORIGIN}${EXPORT_CSV_PATH}`,
    method,
    headers: { Accept: "text/csv,*/*" },
    fetchImpl: fetch,
  });
  if (!res.ok) {
    return { ok: false, needsReauth: !!res.needsReauth, error: res.error };
  }
  if (looksLikeHtml(res.contentType, res.body)) {
    return {
      ok: false,
      needsReauth: true,
      error: "Session expired — open mytanita.eu, sign in, and retry",
    };
  }
  return { ok: true, csv: res.body };
};

// ── Actions ──

// The single read action. Returns { csv } with the raw export text; throws
// (carrying needsReauth) so the envelope surfaces the reauth flag SPA-side.
const readExportCsv = async () => {
  const res = await fetchExportCsv("GET");
  if (!res.ok) {
    const err = new Error(res.error || "Export failed");
    if (res.needsReauth) err.needsReauth = true;
    throw err;
  }
  return { csv: res.csv };
};

// Session probe for the SPA connection pill. Reports only a boolean — the
// extension never sees the HttpOnly cookie, so no credential value can leak.
// Manifest identity keys are spread FIRST and the boolean added after, and
// the probe result is a boolean literal (never the response body).
const checkSession = async () => {
  const result = { ...BRIDGE_MANIFEST };
  try {
    const res = await fetchExportCsv("GET");
    result.authenticated = res.ok === true;
  } catch {
    result.authenticated = false;
  }
  return result;
};

const handleAction = async (message) => {
  switch (message.action) {
    case "ping":
    case "checkSession":
      return await checkSession();
    case "read-export-csv":
      return await readExportCsv();
    default:
      throw new Error(`Unknown action: ${message.action}`);
  }
};

// ── External messages (SPA ↔ Extension) ──
//
// Every external message is origin-pinned and action-allowlisted by the
// vendored guard as a second layer over the manifest's
// externally_connectable. The allowlist equals this bridge's full action
// surface — there is no popup-only action.
const EXTERNAL_ACTIONS = new Set(["ping", "checkSession", "read-export-csv"]);

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
    TANITA_ORIGIN,
    EXPORT_CSV_PATH,
    ALLOWED,
    isAllowed,
    looksLikeHtml,
    fetchExportCsv,
    readExportCsv,
    checkSession,
    handleAction,
    dispatch,
    dispatchExternal,
    isAllowedSenderOrigin: bridgeEnvelope.isAllowedSenderOrigin,
    EXTERNAL_ACTIONS,
  };
}
