/**
 * Kaiord Bridge Core — Cookie Session Fetch (vendored)
 *
 * Master: packages/_shared/bridge-core/session-fetch.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * Identity-free cookie transport for SW-direct bridges: the service worker
 * fetches a first-party export with `credentials:"include"`, so the site's
 * own HttpOnly session cookie travels automatically — no `cookies`
 * permission, no content script on the integration site, and no credentials
 * ever handled by the extension. The raw response body is returned as text;
 * all parsing is the caller's (or its SPA's) concern.
 *
 * This module holds ZERO identity: no host names, bridge ids, request
 * paths, or capability strings. The consuming bridge supplies the origin,
 * the path allowlist, and the request via parameters (guard: IDENTITY_TOKENS
 * in scripts/check-bridge-core-parity.test.mjs).
 */

// 3xx status range. `redirect:"manual"` turns a login bounce into an
// opaqueredirect (status 0, type "opaqueredirect") instead of following it;
// a bare 3xx is treated the same way.
const REDIRECT_STATUS_MIN = 300;
const REDIRECT_STATUS_MAX = 399;
// Auth-challenge statuses that likewise mean the cookie session is dead.
const UNAUTHORIZED_STATUS = 401;
const FORBIDDEN_STATUS = 403;

// Defense-in-depth path-allowlist matcher. The rules array (method + RegExp
// pattern) belongs to the caller; this only applies it.
const isPathAllowed = (allowed, method, path) =>
  allowed.some(
    (rule) => rule.method === (method || "GET") && rule.pattern.test(path)
  );

// A redirect (manual opaqueredirect or a bare 3xx) means the session cookie
// no longer authenticates the request — the caller maps this to a
// re-authentication prompt.
const isSessionRedirect = (response) =>
  response.type === "opaqueredirect" ||
  response.redirected === true ||
  (typeof response.status === "number" &&
    response.status >= REDIRECT_STATUS_MIN &&
    response.status <= REDIRECT_STATUS_MAX);

// 401/403 mean the request was received but the session is not authorized.
const isAuthChallenge = (response) =>
  response.status === UNAUTHORIZED_STATUS ||
  response.status === FORBIDDEN_STATUS;

/**
 * Fetch a first-party resource on the user's existing cookie session.
 * Returns a normalized envelope; the body is returned as raw text so the
 * caller owns all parsing.
 *
 *   { ok: true, status, body, contentType }
 *   { ok: false, needsReauth: true, error }   // session dead
 *   { ok: false, status, error }              // other non-2xx
 */
const cookieSessionFetch = async ({
  url,
  method = "GET",
  headers,
  fetchImpl,
}) => {
  const response = await fetchImpl(url, {
    method,
    credentials: "include",
    redirect: "manual",
    headers,
  });

  if (isSessionRedirect(response) || isAuthChallenge(response)) {
    return {
      ok: false,
      needsReauth: true,
      error: "Session expired — sign in again and retry",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Request failed: ${response.status}`,
    };
  }

  const contentType =
    response.headers && typeof response.headers.get === "function"
      ? response.headers.get("content-type") || ""
      : "";
  const body = await response.text();
  return { ok: true, status: response.status, body, contentType };
};

if (typeof module !== "undefined") {
  module.exports = {
    REDIRECT_STATUS_MIN,
    REDIRECT_STATUS_MAX,
    isPathAllowed,
    isSessionRedirect,
    isAuthChallenge,
    cookieSessionFetch,
  };
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.isPathAllowed = isPathAllowed;
  self.isSessionRedirect = isSessionRedirect;
  self.isAuthChallenge = isAuthChallenge;
  self.cookieSessionFetch = cookieSessionFetch;
}
