/**
 * Kaiord Bridge Core — Bearer Fetch transport (vendored)
 *
 * Master: packages/_shared/bridge-core/bearer-fetch.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * Identity-free `Authorization: Bearer` transport for token-based bridges
 * whose service worker calls a first-party API directly (no cookies). It
 * knows how to:
 *   - send a JSON body (`Content-Type: application/json`) OR a multipart
 *     `FormData` body (no Content-Type, so the runtime sets the boundary),
 *   - drop ambient cookies (`credentials:"omit"`) — the Bearer token is the
 *     only credential,
 *   - normalize any response into an envelope
 *     (`{ ok, status, data }` | `{ ok:false, status, body }`), or, with
 *     `raw: true`, hand the answer over unread
 *     (`{ ok, status, contentType, body }` | `{ ok:false, status }`),
 *   - retry ONCE on a 401 by re-minting the token, and flag `needsReauth`
 *     when the retry is also rejected so the caller can prompt a re-login.
 *
 * This module holds ZERO identity: no host names, bridge ids, request paths,
 * consumer keys, OAuth signer, or capability strings. The consuming bridge
 * supplies the base URL, the token lifecycle (`getToken` / `refreshToken`
 * hooks that resolve to an access-token string), and the request via
 * parameters (guard: IDENTITY_TOKENS in
 * scripts/check-bridge-core-parity.test.mjs).
 */

// Wrapped so its names never meet another master's or the worker's own
// top-level declarations: importScripts shares one global lexical scope.
const bearerFetchMaster = (() => {
  const NO_CONTENT_STATUS = 204;
  const UNAUTHORIZED_STATUS = 401;
  const ERROR_BODY_MAX_CHARS = 300;

  // Build the fetch init for a Bearer request. A `FormData` body is passed
  // through untouched so the runtime attaches the multipart boundary; any other
  // non-empty body is JSON-encoded.
  const buildInit = (method, body, accessToken) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const init = {
      method: method || "GET",
      headers,
      credentials: "omit",
    };
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      init.body = body;
    } else if (body !== undefined && body !== null) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    return init;
  };

  // A raw answer is handed over unread: the caller's App reads it. A refusal
  // keeps only its status, so no error page travels with it.
  const rawEnvelope = async (r) => {
    if (!r.ok) return { ok: false, status: r.status };
    const contentType =
      r.headers && typeof r.headers.get === "function"
        ? r.headers.get("content-type") || ""
        : "";
    const body = r.status === NO_CONTENT_STATUS ? "" : await r.text();
    return { ok: true, status: r.status, contentType, body };
  };

  // One Bearer call against `${baseUrl}${path}`, normalized to an envelope.
  const bearerFetch = async ({
    baseUrl,
    path,
    method,
    body,
    accessToken,
    fetchImpl,
    raw = false,
  }) => {
    const r = await fetchImpl(
      `${baseUrl}${path}`,
      buildInit(method, body, accessToken)
    );
    if (raw) return rawEnvelope(r);
    if (r.status === NO_CONTENT_STATUS) {
      return { ok: true, status: NO_CONTENT_STATUS, data: null };
    }
    if (r.ok) return { ok: true, status: r.status, data: await r.json() };
    const text = await r.text().catch(() => "");
    return {
      ok: false,
      status: r.status,
      body: text.slice(0, ERROR_BODY_MAX_CHARS),
    };
  };

  /**
   * Bearer request with a single 401→re-mint retry. `getToken(fetchImpl)` and
   * `refreshToken(fetchImpl)` are injected hooks that each resolve to an
   * access-token string; the bridge owns the token store and mint flow. A 401
   * that survives the retry sets `needsReauth: true` on the envelope.
   */
  const bearerRequest = async ({
    baseUrl,
    path,
    method,
    body,
    getToken,
    refreshToken,
    fetchImpl,
    raw = false,
  }) => {
    const accessToken = await getToken(fetchImpl);
    let res = await bearerFetch({
      baseUrl,
      path,
      method,
      body,
      accessToken,
      fetchImpl,
      raw,
    });
    if (res.status === UNAUTHORIZED_STATUS) {
      const reminted = await refreshToken(fetchImpl);
      res = await bearerFetch({
        baseUrl,
        path,
        method,
        body,
        accessToken: reminted,
        fetchImpl,
        raw,
      });
      if (res.status === UNAUTHORIZED_STATUS)
        res = { ...res, needsReauth: true };
    }
    return res;
  };

  return { bearerFetch, bearerRequest };
})();

if (typeof module !== "undefined") {
  module.exports = bearerFetchMaster;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bearerFetch = bearerFetchMaster.bearerFetch;
  self.bearerRequest = bearerFetchMaster.bearerRequest;
}
