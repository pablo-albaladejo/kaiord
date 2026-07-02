/**
 * Kaiord WHOOP Bridge — OAuth token lifecycle
 *
 * WHOOP is a confidential OAuth client (see W.1 decision,
 * .omc/research/whoop-auth-decision.md): the token exchange and refresh both
 * require client_id + client_secret, and refresh tokens ROTATE and are
 * SINGLE-USE. This module owns that lifecycle with three hard guarantees:
 *
 *   1. Atomic persistence BEFORE use — the rotated refresh token is written to
 *      storage in a single set() call before the new access token is returned,
 *      so a crash mid-refresh can never strand kaiord on an already-consumed
 *      refresh token.
 *   2. Serialized refreshes — concurrent callers share one in-flight refresh
 *      promise, so two requests can never spend the same single-use token.
 *   3. Loud failure — `invalid_grant` (rotated/revoked/expired) clears tokens
 *      and sets `needsReauth`, surfaced to the SPA as staleness, never silent.
 *
 * All I/O is injected (`storage`, `fetchFn`, identity helpers) so the lifecycle
 * is unit-testable without a live browser.
 */

const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const SCOPES = "offline read:recovery read:sleep read:cycles read:profile";
const REFRESH_SCOPE = "offline";
const EXPIRY_SKEW_MS = 60_000;

const STORAGE_CREDS = "whoopCredentials";
const STORAGE_TOKENS = "whoopTokens";
const STORAGE_STATE = "whoopAuthState";

const needsReauthError = (message) => {
  const err = new Error(message || "WHOOP authorization required");
  err.needsReauth = true;
  return err;
};

const createWhoopAuth = (deps) => {
  const { storage, fetchFn, getRedirectURL, launchWebAuthFlow } = deps;
  const now = deps.now ?? (() => Date.now());
  const randomState = deps.randomState ?? defaultRandomState;

  let refreshInFlight = null;

  const readCreds = async () =>
    (await storage.get([STORAGE_CREDS]))[STORAGE_CREDS];
  const readTokens = async () =>
    (await storage.get([STORAGE_TOKENS]))[STORAGE_TOKENS];
  const persistTokens = (tokens) => storage.set({ [STORAGE_TOKENS]: tokens });

  const setState = async (patch) => {
    const current = (await storage.get([STORAGE_STATE]))[STORAGE_STATE] ?? {};
    await storage.set({ [STORAGE_STATE]: { ...current, ...patch } });
  };

  const tokenRequest = async (params) => {
    const res = await fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    const text = await res.text();
    const json = text ? safeJson(text) : {};
    if (!res.ok) {
      const err = new Error(
        json.error_description ||
          json.error ||
          `Token request failed: ${res.status}`
      );
      err.oauthError = json.error;
      err.status = res.status;
      throw err;
    }
    return json;
  };

  const toTokens = (json, previousRefresh) => ({
    accessToken: json.access_token,
    // Rotation: prefer the new refresh token; fall back only if WHOOP omitted one.
    refreshToken: json.refresh_token || previousRefresh,
    expiresAt: now() + (json.expires_in ?? 0) * 1000,
    scope: json.scope ?? SCOPES,
  });

  const doRefresh = async () => {
    const tokens = await readTokens();
    if (!tokens?.refreshToken) throw needsReauthError();
    const creds = await readCreds();
    if (!creds?.clientId) throw needsReauthError("Missing WHOOP credentials");
    let json;
    try {
      json = await tokenRequest({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        scope: REFRESH_SCOPE,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      });
    } catch (err) {
      if (err.oauthError === "invalid_grant" || err.status === 400) {
        await storage.remove([STORAGE_TOKENS]);
        await setState({ needsReauth: true, lastError: err.message });
        throw needsReauthError(err.message);
      }
      throw err;
    }
    const next = toTokens(json, tokens.refreshToken);
    await persistTokens(next); // ATOMIC + BEFORE the token is handed out
    await setState({ needsReauth: false, lastError: null });
    return next.accessToken;
  };

  const refreshAccessToken = () => {
    if (!refreshInFlight) {
      refreshInFlight = doRefresh().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  };

  const getAccessToken = async () => {
    const tokens = await readTokens();
    if (!tokens?.accessToken) throw needsReauthError();
    if (now() >= tokens.expiresAt - EXPIRY_SKEW_MS) return refreshAccessToken();
    return tokens.accessToken;
  };

  const connect = async () => {
    const creds = await readCreds();
    if (!creds?.clientId || !creds?.clientSecret) {
      throw new Error("Add your WHOOP client ID and secret first");
    }
    const redirectUri = getRedirectURL();
    const state = randomState();
    const authUrl = `${AUTH_URL}?${new URLSearchParams({
      response_type: "code",
      client_id: creds.clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    })}`;
    const redirect = await launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
    const params = new URL(redirect).searchParams;
    if (params.get("state") !== state) throw new Error("OAuth state mismatch");
    const code = params.get("code");
    if (!code) throw new Error(params.get("error") || "No authorization code");
    const json = await tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    });
    await persistTokens(toTokens(json, undefined));
    await setState({ needsReauth: false, lastError: null });
    return { authenticated: true };
  };

  const disconnect = async () => {
    await storage.remove([STORAGE_TOKENS, STORAGE_STATE]);
    return { authenticated: false };
  };

  const getAuthState = async () => {
    const store = await storage.get([
      STORAGE_TOKENS,
      STORAGE_STATE,
      STORAGE_CREDS,
    ]);
    const tokens = store[STORAGE_TOKENS];
    const state = store[STORAGE_STATE] ?? {};
    return {
      authenticated: !!tokens?.accessToken && !state.needsReauth,
      needsReauth: !!state.needsReauth,
      hasCredentials: !!store[STORAGE_CREDS]?.clientId,
      lastError: state.lastError ?? null,
      lastSyncAt: state.lastSyncAt ?? null,
    };
  };

  return {
    getAccessToken,
    refreshAccessToken,
    connect,
    disconnect,
    getAuthState,
    setState,
  };
};

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function defaultRandomState() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

if (typeof module !== "undefined") {
  module.exports = {
    createWhoopAuth,
    AUTH_URL,
    TOKEN_URL,
    SCOPES,
    STORAGE_CREDS,
    STORAGE_TOKENS,
    STORAGE_STATE,
  };
}
