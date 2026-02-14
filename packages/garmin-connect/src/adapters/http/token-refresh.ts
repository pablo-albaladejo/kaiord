import type { Logger } from "@kaiord/core";
import { createServiceApiError } from "@kaiord/core";
import type { FetchFn, OAuthConsumer, OAuth1Token, OAuth2Token } from "./types";
import { exchangeOAuth2 } from "./garmin-sso";
import { fetchOAuthConsumer } from "./oauth-consumer";

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export type TokenState = {
  oauth1Token: OAuth1Token | undefined;
  oauth2Token: OAuth2Token | undefined;
  consumer: OAuthConsumer | undefined;
};

export type TokenRefreshManager = {
  ensureFreshToken: () => Promise<void>;
  state: TokenState;
};

export const createTokenRefreshManager = (
  fetchFn: FetchFn,
  logger: Logger
): TokenRefreshManager => {
  const state: TokenState = {
    oauth1Token: undefined,
    oauth2Token: undefined,
    consumer: undefined,
  };
  let isRefreshing = false;
  let subscribers: RefreshSubscriber[] = [];

  const getConsumer = async (): Promise<OAuthConsumer> => {
    if (state.consumer) return state.consumer;
    state.consumer = await fetchOAuthConsumer(fetchFn);
    return state.consumer;
  };

  const refreshToken = async (): Promise<void> => {
    if (!state.oauth1Token || !state.oauth2Token) {
      throw createServiceApiError("No tokens available for refresh", 401);
    }
    const cons = await getConsumer();
    state.oauth2Token = await exchangeOAuth2(state.oauth1Token, cons, fetchFn);
    logger.info("OAuth2 token refreshed");
  };

  const waitForRefresh = (): Promise<string> =>
    new Promise((resolve, reject) => {
      subscribers.push({ resolve, reject });
    });

  const notifySubscribers = (): void => {
    if (!state.oauth2Token) return;
    const token = state.oauth2Token.access_token;
    subscribers.forEach((s) => {
      s.resolve(token);
    });
    subscribers = [];
  };

  const rejectSubscribers = (error: unknown): void => {
    subscribers.forEach((s) => {
      s.reject(error);
    });
    subscribers = [];
  };

  return {
    state,
    ensureFreshToken: async (): Promise<void> => {
      if (isRefreshing) {
        await waitForRefresh();
        return;
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
    },
  };
};
