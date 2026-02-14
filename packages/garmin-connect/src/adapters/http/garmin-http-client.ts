import type { Logger } from "@kaiord/core";
import { createServiceApiError } from "@kaiord/core";
import type {
  FetchFn,
  GarminHttpClient,
  OAuth1Token,
  OAuth2Token,
} from "./types";
import { createTokenRefreshManager } from "./token-refresh";

export type { GarminHttpClient } from "./types";

export const createGarminHttpClient = (
  logger: Logger,
  fetchFn: FetchFn = globalThis.fetch
): GarminHttpClient => {
  const refresh = createTokenRefreshManager(fetchFn, logger);

  const makeRequest = (url: string, init?: RequestInit): Promise<Response> => {
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

  const authFetch = async (
    url: string,
    init?: RequestInit
  ): Promise<Response> => {
    if (!refresh.state.oauth2Token) {
      throw createServiceApiError("Not authenticated", 401);
    }
    if (refresh.state.oauth2Token.expires_at < Math.floor(Date.now() / 1000)) {
      await refresh.ensureFreshToken();
    }

    const res = await makeRequest(url, init);

    if (res.status === 401) {
      await refresh.ensureFreshToken();
      const retry = await makeRequest(url, init);
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

  return {
    get: async <T>(url: string): Promise<T> => {
      const res = await authFetch(url);
      return (await res.json()) as T;
    },
    post: async <T>(url: string, body: unknown): Promise<T> => {
      const res = await authFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body !== null ? JSON.stringify(body) : undefined,
      });
      return (await res.json()) as T;
    },
    del: async <T>(url: string): Promise<T> => {
      const res = await authFetch(url, {
        method: "POST",
        headers: { "X-Http-Method-Override": "DELETE" },
      });
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    },
    setTokens: (o1: OAuth1Token, o2: OAuth2Token): void => {
      refresh.state.oauth1Token = o1;
      refresh.state.oauth2Token = o2;
    },
    clearTokens: (): void => {
      refresh.state.oauth1Token = undefined;
      refresh.state.oauth2Token = undefined;
      refresh.state.consumer = undefined;
    },
    getOAuth2Token: () => refresh.state.oauth2Token,
  };
};
