/**
 * Kaiord Garmin Bridge — OAuth token minting (bridge-specific, NOT vendored)
 *
 * Replaces the cookie/CSRF relay with a portable OAuth token. The user's
 * existing connect.garmin.com session is exchanged ONCE for OAuth tokens
 * (no password prompt); thereafter the service worker calls
 * connectapi.garmin.com directly with `Authorization: Bearer`.
 *
 * Flow (a JS port of garth's sso.py, verified against the live API):
 *   1. getTicketFromSession — the browser's SSO session (cookie CASTGC on
 *      sso.garmin.com) issues a service ticket for the mobile service
 *      WITHOUT re-authenticating.
 *   2. preauthorized — OAuth1-sign (2-legged) the ticket → OAuth1 token.
 *   3. exchange       — OAuth1-sign (3-legged) → OAuth2 Bearer token.
 * The OAuth2 access token is refreshed by re-running `exchange` with the
 * long-lived OAuth1 token (~1 year); if that fails, we re-mint from the
 * session. Tokens live in chrome.storage.local (survive SW cold starts).
 *
 * The consumer key/secret are Garmin's public reverse-engineered values
 * (same as garth / thegarth.s3.amazonaws.com/oauth_consumer.json). Hardcoded
 * so the bridge needs no extra host permission; bump if Garmin rotates them.
 */

const CONSUMER = {
  key: "fc3e99d2-118c-44b8-8ae3-03370dde24c0",
  secret: "E08WAR897WEy2knn7aFBrvegVAf0AFdWBBF",
};
const CONNECTAPI = "https://connectapi.garmin.com";
const SSO_SIGNIN = "https://sso.garmin.com/sso/signin";
const CLIENT_ID = "GCM_ANDROID_DARK";
const LOGIN_URL = "https://mobile.integration.garmin.com/gcm/android";
const OAUTH1_KEY = "garminOAuth1";
const OAUTH2_KEY = "garminOAuth2";
const EXPIRY_SKEW_SEC = 60;

const nowSec = () => Math.floor(Date.now() / 1000);

// ── OAuth1 HMAC-SHA1 signer (verified byte-for-byte against oauth-1.0a) ──

// RFC-3986 percent-encoding as OAuth1 requires.
const enc = (s) =>
  encodeURIComponent(s).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );

const nonce = () => {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Web Crypto HMAC-SHA1 — the same code path in the service worker and in the
// Node test runner (both expose globalThis.crypto.subtle).
const hmacSha1B64 = async (keyStr, baseStr) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyStr),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(baseStr));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
};

/**
 * Build an `Authorization: OAuth …` header. `extraParams` are non-query
 * params folded into the signature base (the POST body for exchange).
 * `token` (the resource-owner {key, secret}) makes it a 3-legged signature.
 */
const sign = async (method, url, extraParams, token) => {
  const u = new URL(url);
  const baseUrl = u.origin + u.pathname;

  const oauth = {
    oauth_consumer_key: CONSUMER.key,
    oauth_nonce: nonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(nowSec()),
    oauth_version: "1.0",
  };
  if (token) oauth.oauth_token = token.key;

  const all = {};
  for (const [k, v] of u.searchParams) all[k] = v;
  for (const k in extraParams) all[k] = extraParams[k];
  for (const k in oauth) all[k] = oauth[k];

  const paramStr = Object.keys(all)
    .sort()
    .map((k) => `${enc(k)}=${enc(all[k])}`)
    .join("&");
  const base = [method.toUpperCase(), enc(baseUrl), enc(paramStr)].join("&");
  const signingKey = `${enc(CONSUMER.secret)}&${token ? enc(token.secret) : ""}`;
  oauth.oauth_signature = await hmacSha1B64(signingKey, base);

  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${enc(k)}="${enc(oauth[k])}"`)
      .join(", ")
  );
};

// ── Auth errors carry needsReauth so the SPA can prompt a Garmin login ──

const authError = (stage, status) => {
  const err = new Error(
    stage === "ticket"
      ? "No Garmin session. Open Garmin Connect, sign in, then retry."
      : `Garmin auth failed at ${stage}${status ? ` (${status})` : ""}`
  );
  err.needsReauth = true;
  err.retryable = true;
  return err;
};

// ── Minting: session → ticket → OAuth1 → OAuth2 ──

const getTicketFromSession = async (fetchImpl) => {
  const url = `${SSO_SIGNIN}?${new URLSearchParams({
    service: LOGIN_URL,
    clientId: CLIENT_ID,
    gauthHost: "https://sso.garmin.com/sso",
    locale: "en_US",
  })}`;
  const r = await fetchImpl(url, {
    credentials: "include",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const html = await r.text();
  const m = html.match(/ticket=([A-Za-z0-9-]+)/);
  if (!m) throw authError("ticket");
  return m[1];
};

const preauthorized = async (ticket, fetchImpl) => {
  const url =
    `${CONNECTAPI}/oauth-service/oauth/preauthorized` +
    `?ticket=${enc(ticket)}&login-url=${enc(LOGIN_URL)}&accepts-mfa-tokens=true`;
  const auth = await sign("GET", url, {}, null);
  const r = await fetchImpl(url, {
    headers: { Authorization: auth },
    credentials: "include",
  });
  if (!r.ok) throw authError("preauthorized", r.status);
  const p = new URLSearchParams(await r.text());
  const oauth_token = p.get("oauth_token");
  const oauth_token_secret = p.get("oauth_token_secret");
  if (!oauth_token || !oauth_token_secret) throw authError("preauthorized");
  return { oauth_token, oauth_token_secret };
};

// Also serves as the OAuth2 refresh: re-exchanging the OAuth1 token mints a
// fresh Bearer without touching the session.
const exchange = async (oauth1, fetchImpl) => {
  const url = `${CONNECTAPI}/oauth-service/oauth/exchange/user/2.0`;
  const bodyParams = { audience: "GARMIN_CONNECT_MOBILE_ANDROID_DI" };
  const auth = await sign("POST", url, bodyParams, {
    key: oauth1.oauth_token,
    secret: oauth1.oauth_token_secret,
  });
  const r = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
    credentials: "include",
  });
  if (!r.ok) throw authError("exchange", r.status);
  const t = await r.json();
  t.expires_at = nowSec() + (Number(t.expires_in) || 0);
  return t;
};

const mintFromSession = async (fetchImpl) => {
  const ticket = await getTicketFromSession(fetchImpl);
  const oauth1 = await preauthorized(ticket, fetchImpl);
  const oauth2 = await exchange(oauth1, fetchImpl);
  return { oauth1, oauth2 };
};

// ── Token store (chrome.storage.local; survives SW cold starts) ──

const loadTokens = async () => {
  const r = await chrome.storage.local.get([OAUTH1_KEY, OAUTH2_KEY]);
  return { oauth1: r[OAUTH1_KEY] ?? null, oauth2: r[OAUTH2_KEY] ?? null };
};

const saveTokens = ({ oauth1, oauth2 }) =>
  chrome.storage.local.set({ [OAUTH1_KEY]: oauth1, [OAUTH2_KEY]: oauth2 });

const clearTokens = () => chrome.storage.local.remove([OAUTH1_KEY, OAUTH2_KEY]);

const isOAuth2Expired = (oauth2) =>
  !oauth2 ||
  typeof oauth2.expires_at !== "number" ||
  oauth2.expires_at - EXPIRY_SKEW_SEC <= nowSec();

// Single-flight the 3-hop mint so a cold-start stampede (ping + snapshot +
// activities firing at once) does not run it three times.
let mintInFlight = null;
const mintAndSave = (fetchImpl) => {
  if (!mintInFlight) {
    mintInFlight = mintFromSession(fetchImpl)
      .then(async (tokens) => {
        await saveTokens(tokens);
        return tokens;
      })
      .finally(() => {
        mintInFlight = null;
      });
  }
  return mintInFlight;
};

// Return a usable {oauth1, oauth2}, minting or refreshing + persisting as
// needed.
const ensureToken = async (fetchImpl) => {
  const tokens = await loadTokens();
  if (!tokens.oauth1 || !tokens.oauth2) return mintAndSave(fetchImpl);
  if (isOAuth2Expired(tokens.oauth2)) {
    try {
      const oauth2 = await exchange(tokens.oauth1, fetchImpl);
      const refreshed = { oauth1: tokens.oauth1, oauth2 };
      await saveTokens(refreshed);
      return refreshed;
    } catch {
      return mintAndSave(fetchImpl); // OAuth1 dead → re-mint from session
    }
  }
  return tokens;
};

const bearerFetch = async (path, method, body, oauth2, fetchImpl) => {
  const headers = { Authorization: `Bearer ${oauth2.access_token}` };
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetchImpl(`${CONNECTAPI}${path}`, {
    method: method || "GET",
    headers,
    credentials: "omit", // token-only; no ambient cookies
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (r.status === 204) return { ok: true, status: 204, data: null };
  if (r.ok) return { ok: true, status: r.status, data: await r.json() };
  const text = await r.text().catch(() => "");
  return { ok: false, status: r.status, body: text.slice(0, 300) };
};

/**
 * The bridge's Garmin call surface. Returns the same envelope the old
 * content-script relay did: { ok, status, data } | { ok:false, status, body }.
 * A 401 (token rejected despite not being expired) triggers one re-mint and
 * retry before surfacing the failure.
 */
const connectapiFetch = async (path, method, body, fetchImpl) => {
  let tokens = await ensureToken(fetchImpl);
  let res = await bearerFetch(path, method, body, tokens.oauth2, fetchImpl);
  if (res.status === 401) {
    tokens = await mintAndSave(fetchImpl);
    res = await bearerFetch(path, method, body, tokens.oauth2, fetchImpl);
  }
  return res;
};

const api = {
  CONSUMER,
  CONNECTAPI,
  sign,
  getTicketFromSession,
  preauthorized,
  exchange,
  refresh: exchange,
  mintFromSession,
  loadTokens,
  saveTokens,
  clearTokens,
  isOAuth2Expired,
  ensureToken,
  connectapiFetch,
};

if (typeof module !== "undefined") {
  module.exports = api;
} else if (typeof self !== "undefined") {
  self.garminOAuth = api;
}
