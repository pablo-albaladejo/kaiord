import { createConsoleLogger, createServiceAuthError } from "@kaiord/core";
import { createCookieFetch } from "../http/cookie-fetch";
import { garminSso } from "../http/garmin-sso";
import { garminTokensSchema } from "../schemas/garmin-token.schema";
import type { FetchFn } from "../http/types";
import type { TokenManager } from "../token/token-manager.types";
import type { AuthProvider, Logger } from "@kaiord/core";

export type GarminAuthProviderOptions = {
  tokenManager: TokenManager;
  logger?: Logger;
  fetchFn?: FetchFn;
};

const buildAuthProvider = (
  tm: TokenManager,
  logger: Logger,
  fetchFn: FetchFn
): AuthProvider => ({
  login: async (username, password) => {
    const result = await garminSso(username, password, logger, fetchFn);
    await tm.setTokens(result.oauth1, result.oauth2);
  },
  is_authenticated: () => tm.isAuthenticated(),
  export_tokens: async () => {
    const oauth1 = tm.getOAuth1Token();
    const oauth2 = tm.getOAuth2Token();
    if (!oauth1 || !oauth2) {
      throw createServiceAuthError("No tokens to export");
    }
    return { oauth1: { ...oauth1 }, oauth2: { ...oauth2 } };
  },
  restore_tokens: async (data) => {
    const parsed = garminTokensSchema.parse(data);
    await tm.setTokens(parsed.oauth1, parsed.oauth2);
    logger.info("Tokens restored from stored session");
  },
  logout: async () => {
    await tm.clearTokens();
    logger.info("Logged out from Garmin Connect");
  },
});

export const createGarminAuthProvider = (
  options: GarminAuthProviderOptions
): AuthProvider => {
  const logger = options.logger ?? createConsoleLogger();
  const fetchFn = options.fetchFn ?? createCookieFetch();
  return buildAuthProvider(options.tokenManager, logger, fetchFn);
};
