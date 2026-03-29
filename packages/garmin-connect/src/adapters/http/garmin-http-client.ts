import { authFetch } from "./garmin-auth-fetch";
import { createTokenRefreshManager } from "./token-refresh";
import type {
  FetchFn,
  GarminHttpClient,
  OAuth1Token,
  OAuth2Token,
} from "./types";
import type { Logger } from "@kaiord/core";

export type { GarminHttpClient } from "./types";

export const createGarminHttpClient = (
  logger: Logger,
  fetchFn: FetchFn = globalThis.fetch
): GarminHttpClient => {
  const refresh = createTokenRefreshManager(fetchFn, logger);
  const fetch = (url: string, init?: RequestInit) =>
    authFetch(url, init, refresh, fetchFn);

  return {
    get: async <T>(url: string): Promise<T> => {
      const res = await fetch(url);
      return (await res.json()) as T;
    },
    post: async <T>(url: string, body: unknown): Promise<T> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body !== null ? JSON.stringify(body) : undefined,
      });
      return (await res.json()) as T;
    },
    del: async <T>(url: string): Promise<T> => {
      const res = await fetch(url, {
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
