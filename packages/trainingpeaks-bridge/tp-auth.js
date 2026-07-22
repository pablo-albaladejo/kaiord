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

// Auth errors carry needsReauth so the SPA can prompt a TrainingPeaks login.
const authError = (message) => {
  const err = new Error(message);
  err.needsReauth = true;
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
// cookie travels automatically; a dead cookie (redirect/401/403) surfaces as
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
      res.error || "TrainingPeaks session expired — sign in and retry"
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
 * the same envelope the master does: { ok, status, data } | { ok:false, … }.
 */
const tpapiFetch = (path, method, body, fetchImpl) =>
  bearerCore().bearerRequest({
    baseUrl: TPAPI,
    path,
    method,
    body,
    getToken: accessTokenAfterEnsure,
    refreshToken: accessTokenAfterExchange,
    fetchImpl,
  });

/**
 * Session probe for the SPA connection pill: forces a cookie→token exchange to
 * confirm the session is live. Returns { ok, athleteId } or a needsReauth
 * envelope. Never returns any credential value.
 */
const checkTokenExchange = async (fetchImpl) => {
  try {
    const record = await exchangeAndSave(fetchImpl);
    return { ok: true, athleteId: record.athleteId };
  } catch (e) {
    return { ok: false, needsReauth: !!e.needsReauth, error: e.message };
  }
};

const api = {
  TPAPI,
  TOKEN_PATH,
  TOKEN_KEY,
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
  checkTokenExchange,
};

if (typeof module !== "undefined") {
  module.exports = api;
} else if (typeof self !== "undefined") {
  self.tpAuth = api;
}
