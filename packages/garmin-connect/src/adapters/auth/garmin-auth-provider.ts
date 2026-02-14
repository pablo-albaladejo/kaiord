import type { AuthProvider, Logger, TokenStore } from "@kaiord/core";
import { createConsoleLogger, createServiceAuthError } from "@kaiord/core";
import type { GarminHttpClient } from "../http/garmin-http-client";
import { createGarminHttpClient } from "../http/garmin-http-client";
import { createCookieFetch } from "../http/cookie-fetch";
import { garminSso } from "../http/garmin-sso";
import { garminTokensSchema } from "../schemas/garmin-token.schema";

export type GarminAuthProviderOptions = {
  logger?: Logger;
  tokenStore?: TokenStore;
  fetchFn?: typeof globalThis.fetch;
};

export type GarminAuthProviderResult = {
  auth: AuthProvider;
  httpClient: GarminHttpClient;
};

export const createGarminAuthProvider = (
  options?: GarminAuthProviderOptions
): GarminAuthProviderResult => {
  const logger = options?.logger ?? createConsoleLogger();
  const tokenStore = options?.tokenStore;
  const fetchFn = options?.fetchFn ?? createCookieFetch();
  const httpClient = createGarminHttpClient(logger, fetchFn);
  let currentOAuth1:
    | { oauth_token: string; oauth_token_secret: string }
    | undefined;

  const auth: AuthProvider = {
    login: async (username, password) => {
      const result = await garminSso(username, password, logger, fetchFn);
      currentOAuth1 = result.oauth1;
      httpClient.setTokens(result.oauth1, result.oauth2);
      if (tokenStore) {
        await tokenStore.save({
          oauth1: result.oauth1,
          oauth2: result.oauth2,
        });
      }
    },

    is_authenticated: () => {
      const token = httpClient.getOAuth2Token();
      if (!token) return false;
      return token.expires_at > Math.floor(Date.now() / 1000);
    },

    export_tokens: async () => {
      const token = httpClient.getOAuth2Token();
      if (!token || !currentOAuth1) {
        throw createServiceAuthError("No tokens to export");
      }
      return { oauth1: currentOAuth1, oauth2: token };
    },

    restore_tokens: async (data) => {
      const parsed = garminTokensSchema.parse(data);
      currentOAuth1 = parsed.oauth1;
      httpClient.setTokens(parsed.oauth1, parsed.oauth2);
      logger.info("Tokens restored from stored session");
    },

    logout: async () => {
      currentOAuth1 = undefined;
      httpClient.clearTokens();
      if (tokenStore) {
        await tokenStore.clear();
      }
      logger.info("Logged out from Garmin Connect");
    },
  };

  return { auth, httpClient };
};
