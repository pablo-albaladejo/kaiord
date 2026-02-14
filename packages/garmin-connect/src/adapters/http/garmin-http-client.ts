import type { Logger } from "@kaiord/core";
import { createServiceApiError } from "@kaiord/core";
import type { OAuthConsumer } from "./oauth-signer";
import type { OAuth1Token, OAuth2Token } from "./garmin-sso";
import { exchangeOAuth2 } from "./garmin-sso";
import { OAUTH_CONSUMER_URL } from "./urls";

type FetchFn = typeof globalThis.fetch;

export type GarminHttpClient = {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body: unknown) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
  setTokens: (oauth1: OAuth1Token, oauth2: OAuth2Token) => void;
  clearTokens: () => void;
  getOAuth2Token: () => OAuth2Token | undefined;
};

export const createGarminHttpClient = (
  logger: Logger,
  fetchFn: FetchFn = globalThis.fetch
): GarminHttpClient => {
  let oauth1Token: OAuth1Token | undefined;
  let oauth2Token: OAuth2Token | undefined;
  let consumer: OAuthConsumer | undefined;
  let isRefreshing = false;
  type RefreshSubscriber = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  };
  let refreshSubscribers: RefreshSubscriber[] = [];

  const fetchConsumer = async (): Promise<OAuthConsumer> => {
    if (consumer) return consumer;
    const res = await fetchFn(OAUTH_CONSUMER_URL);
    if (!res.ok) {
      throw createServiceApiError(
        `Failed to fetch OAuth consumer: ${res.status}`,
        res.status
      );
    }
    const data = (await res.json()) as {
      consumer_key: string;
      consumer_secret: string;
    };
    consumer = { key: data.consumer_key, secret: data.consumer_secret };
    return consumer;
  };

  const refreshToken = async (): Promise<void> => {
    if (!oauth1Token || !oauth2Token) {
      throw createServiceApiError("No tokens available for refresh", 401);
    }
    const cons = await fetchConsumer();
    oauth2Token = await exchangeOAuth2(oauth1Token, cons, fetchFn);
    logger.info("OAuth2 token refreshed");
  };

  const waitForRefresh = (): Promise<string> =>
    new Promise((resolve, reject) => {
      refreshSubscribers.push({ resolve, reject });
    });

  const notifySubscribers = (): void => {
    refreshSubscribers.forEach((s) => {
      s.resolve(oauth2Token!.access_token);
    });
    refreshSubscribers = [];
  };

  const rejectSubscribers = (error: unknown): void => {
    refreshSubscribers.forEach((s) => {
      s.reject(error);
    });
    refreshSubscribers = [];
  };

  const authFetch = async (
    url: string,
    init?: RequestInit
  ): Promise<Response> => {
    if (!oauth2Token) {
      throw createServiceApiError("Not authenticated", 401);
    }

    if (oauth2Token.expires_at < Math.floor(Date.now() / 1000)) {
      if (isRefreshing) {
        const token = await waitForRefresh();
        return fetchFn(url, {
          ...init,
          headers: { ...init?.headers, Authorization: `Bearer ${token}` },
        });
      }
      isRefreshing = true;
      try {
        await refreshToken();
        notifySubscribers();
      } catch (error) {
        rejectSubscribers(error);
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    const res = await fetchFn(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${oauth2Token.access_token}`,
      },
    });

    if (res.status === 401) {
      if (isRefreshing) {
        const token = await waitForRefresh();
        return fetchFn(url, {
          ...init,
          headers: { ...init?.headers, Authorization: `Bearer ${token}` },
        });
      }
      isRefreshing = true;
      try {
        await refreshToken();
        notifySubscribers();
      } catch (error) {
        rejectSubscribers(error);
        throw error;
      } finally {
        isRefreshing = false;
      }
      return fetchFn(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${oauth2Token.access_token}`,
        },
      });
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
      return (await res.json()) as T;
    },

    setTokens: (o1: OAuth1Token, o2: OAuth2Token): void => {
      oauth1Token = o1;
      oauth2Token = o2;
    },

    clearTokens: (): void => {
      oauth1Token = undefined;
      oauth2Token = undefined;
      consumer = undefined;
    },

    getOAuth2Token: () => oauth2Token,
  };
};
