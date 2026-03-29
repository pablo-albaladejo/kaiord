import { createServiceApiError } from "@kaiord/core";
import type { TokenRefreshManager } from "./token-refresh";
import type { FetchFn } from "./types";

const makeRequest = (
  url: string,
  init: RequestInit | undefined,
  refresh: TokenRefreshManager,
  fetchFn: FetchFn
): Promise<Response> => {
  if (!refresh.state.oauth2Token) {
    throw createServiceApiError("Token unavailable after refresh", 401);
  }
  return fetchFn(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${refresh.state.oauth2Token.access_token}`,
    },
  });
};

export const authFetch = async (
  url: string,
  init: RequestInit | undefined,
  refresh: TokenRefreshManager,
  fetchFn: FetchFn
): Promise<Response> => {
  if (!refresh.state.oauth2Token) {
    throw createServiceApiError("Not authenticated", 401);
  }
  if (refresh.state.oauth2Token.expires_at < Math.floor(Date.now() / 1000)) {
    await refresh.ensureFreshToken();
  }
  const res = await makeRequest(url, init, refresh, fetchFn);
  if (res.status === 401) {
    await refresh.ensureFreshToken();
    const retry = await makeRequest(url, init, refresh, fetchFn);
    if (!retry.ok) {
      throw createServiceApiError(
        `API request failed after token refresh: ${retry.statusText}`,
        retry.status
      );
    }
    return retry;
  }
  if (!res.ok) {
    throw createServiceApiError(
      `API request failed: ${res.statusText}`,
      res.status
    );
  }
  return res;
};
