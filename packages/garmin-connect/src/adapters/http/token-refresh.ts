import { createServiceApiError } from "@kaiord/core";
import { exchangeOAuth2 } from "./garmin-sso";
import { fetchOAuthConsumer } from "./oauth-consumer";
import type { FetchFn, OAuthConsumer, OAuth1Token, OAuth2Token } from "./types";
import type { Logger } from "@kaiord/core";

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

const notifyAll = (subs: RefreshSubscriber[], token: string): void => {
  subs.forEach((s) => s.resolve(token));
};

const rejectAll = (subs: RefreshSubscriber[], error: unknown): void => {
  subs.forEach((s) => s.reject(error));
};

const getOrFetchConsumer = async (
  state: TokenState,
  fetchFn: FetchFn
): Promise<OAuthConsumer> => {
  if (state.consumer) return state.consumer;
  state.consumer = await fetchOAuthConsumer(fetchFn);
  return state.consumer;
};

const doRefreshToken = async (
  state: TokenState,
  fetchFn: FetchFn,
  logger: Logger
): Promise<void> => {
  if (!state.oauth1Token || !state.oauth2Token) {
    throw createServiceApiError("No tokens available for refresh", 401);
  }
  const cons = await getOrFetchConsumer(state, fetchFn);
  state.oauth2Token = await exchangeOAuth2(state.oauth1Token, cons, fetchFn);
  logger.info("OAuth2 token refreshed");
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

  return {
    state,
    ensureFreshToken: async (): Promise<void> => {
      if (isRefreshing) {
        await new Promise<string>((resolve, reject) => {
          subscribers.push({ resolve, reject });
        });
        return;
      }
      isRefreshing = true;
      try {
        await doRefreshToken(state, fetchFn, logger);
        if (state.oauth2Token)
          notifyAll(subscribers, state.oauth2Token.access_token);
        subscribers = [];
      } catch (error) {
        rejectAll(subscribers, error);
        subscribers = [];
        throw error;
      } finally {
        isRefreshing = false;
      }
    },
  };
};
