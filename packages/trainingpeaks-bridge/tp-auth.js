/**
 * Kaiord TrainingPeaks Bridge — dual-transport auth (bridge-specific, NOT vendored)
 *
 * TrainingPeaks is special: the durable credential is the browser's
 * `Production_tpAuth` session cookie (a domain-wide `.trainingpeaks.com`
 * cookie, so it reaches `tpapi.trainingpeaks.com` automatically), and every
 * DATA call needs a short-lived Bearer minted FROM that cookie. Two vendored
 * identity-free masters cooperate:
 *
 *   1. token exchange — `GET https://tpapi.trainingpeaks.com/users/v3/token`
 *      COOKIE-ONLY (NO Authorization header) via the `session-fetch` master
 *      (`credentials:"include"`). Returns a ~1h `access_token`; cached in
 *      `chrome.storage.local` with a 60s refresh buffer.
 *   2. data calls — the cached Bearer via the `bearer-fetch` master
 *      (`credentials:"omit"` + `Authorization: Bearer`). On a 401 the master
 *      calls `refreshToken`, which re-runs the token exchange once (that is
 *      the "refresh").
 *
 * The session cookie is never read, stored, or logged — the browser attaches
 * it to the exchange request automatically and the extension only ever holds
 * the minted access token. The TrainingPeaks host/paths/type-ids live here (in
 * the bridge), never in the shared masters.
 */

const TPAPI = "https://tpapi.trainingpeaks.com";
const TOKEN_PATH = "/users/v3/token";
const TOKEN_KEY = "tpAccessToken";
const EXPIRY_SKEW_SEC = 60;

// The credential-handshake surface: the endpoint the session cookie is sent
// to in exchange for a Bearer. Read by
// scripts/check-bridge-privacy-surface.mjs into the golden fixture.
//
// This path is deliberately absent from background.js's ALLOWED: the App's
// `request` may never reach it, because its answer is the token itself.
// `exchangeToken` below calls `cookieSessionFetch` directly and never
// consults `isAllowed`; this declaration is what keeps it in the golden.
//
// Written out rather than composed from TPAPI/TOKEN_PATH: the guard records
// string literals, and an interpolated `${TPAPI}${TOKEN_PATH}` would reach
// the golden as placeholder text. tp-auth.test.js pins this list against
// the URL the exchange actually requests.
const AUTH_ENDPOINTS = ["https://tpapi.trainingpeaks.com/users/v3/token"];

const nowSec = () => Math.floor(Date.now() / 1000);

// ── Vendored masters (session-fetch cookie transport + bearer-fetch) ──
// In the service worker they are loaded via importScripts and exposed on
// `self`; in Node tests they resolve via require.
let sessionCoreCache;
const sessionCore = () => {
  if (sessionCoreCache) return sessionCoreCache;
  sessionCoreCache =
    typeof require !== "undefined"
      ? require("./session-fetch.js")
      : { cookieSessionFetch: self.cookieSessionFetch };
  return sessionCoreCache;
};

let bearerCoreCache;
const bearerCore = () => {
  if (bearerCoreCache) return bearerCoreCache;
  bearerCoreCache =
    typeof require !== "undefined"
      ? require("./bearer-fetch.js")
      : { bearerRequest: self.bearerRequest };
  return bearerCoreCache;
};

// A failed exchange carries needsReauth only when the session-fetch master
// saw a dead session (a redirect or a 401, the answer
// docs/connectors-research/trainingpeaks.md documents for an expired
// cookie). A 403 or a 500 is TrainingPeaks failing, not a revoked sign-in,
// and keeps its status instead; so does a 200 without a token (or without
// JSON), which no research or fixture identifies as the sign-in page.
const authError = (message, res = {}) => {
  const err = new Error(message);
  if (res.needsReauth) err.needsReauth = true;
  if (typeof res.status === "number") err.status = res.status;
  err.retryable = true;
  return err;
};

// ── Token store (chrome.storage.local; survives SW cold starts) ──

const loadToken = async () => {
  const r = await chrome.storage.local.get(TOKEN_KEY);
  return r[TOKEN_KEY] ?? null;
};

const saveToken = (record) => chrome.storage.local.set({ [TOKEN_KEY]: record });

const clearToken = () => chrome.storage.local.remove(TOKEN_KEY);

const isExpired = (record) =>
  !record ||
  typeof record.expiresAt !== "number" ||
  record.expiresAt - EXPIRY_SKEW_SEC <= nowSec();

// ── Cookie-only token exchange (NO Authorization header) ──
//
// Uses the session-fetch master with `credentials:"include"` so the domain
// cookie travels automatically; a dead cookie (a redirect or a 401) surfaces as
// needsReauth. The JSON body carries `{ token:{access_token,expires_in},
// athleteId, … }` — we keep only the access token, its expiry, and the athlete
// id (`user.personId`) used to build data-endpoint paths.
const exchangeToken = async (fetchImpl) => {
  const res = await sessionCore().cookieSessionFetch({
    url: `${TPAPI}${TOKEN_PATH}`,
    method: "GET",
    headers: { Accept: "application/json" },
    fetchImpl,
  });
  if (!res.ok) {
    throw authError(
      res.error || "TrainingPeaks session expired — sign in and retry",
      res
    );
  }
  let payload;
  try {
    payload = JSON.parse(res.body);
  } catch {
    throw authError("TrainingPeaks token exchange returned a non-JSON body");
  }
  const accessToken = payload?.token?.access_token;
  if (!accessToken) {
    throw authError("TrainingPeaks token exchange returned no access token");
  }
  const expiresIn = Number(payload?.token?.expires_in) || 0;
  const record = {
    accessToken,
    expiresAt: nowSec() + expiresIn,
    athleteId: payload?.athleteId ?? null,
  };
  await saveToken(record);
  return record;
};

// Single-flight the exchange so a cold-start stampede (ping + read firing at
// once) does not run it several times.
let exchangeInFlight = null;
const exchangeAndSave = (fetchImpl) => {
  if (!exchangeInFlight) {
    exchangeInFlight = exchangeToken(fetchImpl).finally(() => {
      exchangeInFlight = null;
    });
  }
  return exchangeInFlight;
};

// Return a usable token record, minting/refreshing + persisting as needed.
const ensureToken = async (fetchImpl) => {
  const record = await loadToken();
  if (isExpired(record)) return exchangeAndSave(fetchImpl);
  return record;
};

const accessTokenAfterEnsure = async (fetchImpl) =>
  (await ensureToken(fetchImpl)).accessToken;
const accessTokenAfterExchange = async (fetchImpl) =>
  (await exchangeAndSave(fetchImpl)).accessToken;

// The athlete id (`user.personId`) resolved from the token exchange.
const ensureAthleteId = async (fetchImpl) =>
  (await ensureToken(fetchImpl)).athleteId;

/**
 * Data-call surface: a Bearer request against tpapi with a single
 * 401→re-exchange retry, delegated to the vendored bearer-fetch master. Returns
 * the same envelope the master does: { ok, status, data } | { ok:false, … },
 * or with `raw` the answer unread: { ok, status, contentType, body }.
 */
const tpapiFetch = (path, method, body, fetchImpl, { raw = false } = {}) =>
  bearerCore().bearerRequest({
    baseUrl: TPAPI,
    path,
    method,
    body,
    getToken: accessTokenAfterEnsure,
    refreshToken: accessTokenAfterExchange,
    fetchImpl,
    raw,
  });

/**
 * The Session check: reads the token record a real request minted and makes
 * no request. The token endpoint is the only one the session cookie
 * authenticates, and calling it mints a token, so without a still-valid token
 * there is no cheaper way to tell: the answer is "not-checked", and the first
 * real request finds out. Never returns any credential value.
 */
const checkStoredToken = async () => {
  try {
    return isExpired(await loadToken()) ? "not-checked" : "signed-in";
  } catch {
    return "not-checked";
  }
};

const api = {
  TPAPI,
  TOKEN_PATH,
  TOKEN_KEY,
  AUTH_ENDPOINTS,
  EXPIRY_SKEW_SEC,
  nowSec,
  isExpired,
  loadToken,
  saveToken,
  clearToken,
  exchangeToken,
  ensureToken,
  ensureAthleteId,
  tpapiFetch,
  checkStoredToken,
};

if (typeof module !== "undefined") {
  module.exports = api;
} else if (typeof self !== "undefined") {
  self.tpAuth = api;
}
