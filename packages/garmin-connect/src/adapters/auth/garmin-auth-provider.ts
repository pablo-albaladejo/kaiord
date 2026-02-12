import type { AuthProvider, Logger, TokenStore } from "@kaiord/core";
import { createConsoleLogger, createServiceAuthError } from "@kaiord/core";
import type { GarminHttpClient } from "../http/garmin-http-client";
import { createGarminHttpClient } from "../http/garmin-http-client";
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
  const fetchFn = options?.fetchFn ?? globalThis.fetch;
  const httpClient = createGarminHttpClient(logger, fetchFn);

  const auth: AuthProvider = {
    login: async (username, password) => {
      const result = await garminSso(username, password, logger, fetchFn);
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
      if (!token) {
        throw createServiceAuthError("No tokens to export");
      }
      return { oauth1: {}, oauth2: token };
    },

    restore_tokens: async (data) => {
      const parsed = garminTokensSchema.parse(data);
      httpClient.setTokens(parsed.oauth1, parsed.oauth2);
      logger.info("Tokens restored from stored session");
    },

    logout: async () => {
      httpClient.setTokens(
        { oauth_token: "", oauth_token_secret: "" },
        {
          access_token: "",
          refresh_token: "",
          token_type: "",
          expires_in: 0,
          refresh_token_expires_in: 0,
          expires_at: 0,
        }
      );
      if (tokenStore) {
        await tokenStore.clear();
      }
      logger.info("Logged out from Garmin Connect");
    },
  };

  return { auth, httpClient };
};
