import { createConsoleLogger, createServiceAuthError } from "@kaiord/core";
import { createCookieFetch } from "../http/cookie-fetch";
import { createGarminHttpClient } from "../http/garmin-http-client";
import { garminSso } from "../http/garmin-sso";
import { garminTokensSchema } from "../schemas/garmin-token.schema";
import type { GarminHttpClient } from "../http/garmin-http-client";
import type { AuthProvider, Logger, TokenStore } from "@kaiord/core";

export type GarminAuthProviderOptions = {
  logger?: Logger;
  tokenStore?: TokenStore;
  fetchFn?: typeof globalThis.fetch;
};

export type GarminAuthProviderResult = {
  auth: AuthProvider;
  httpClient: GarminHttpClient;
};

type AuthState = {
  oauth1: { oauth_token: string; oauth_token_secret: string } | undefined;
};

type AuthContext = {
  httpClient: GarminHttpClient;
  state: AuthState;
  tokenStore: TokenStore | undefined;
  logger: Logger;
  fetchFn: typeof globalThis.fetch;
};

const buildAuthProvider = (ctx: AuthContext): AuthProvider => ({
  login: async (username, password) => {
    const result = await garminSso(username, password, ctx.logger, ctx.fetchFn);
    ctx.state.oauth1 = result.oauth1;
    ctx.httpClient.setTokens(result.oauth1, result.oauth2);
    if (ctx.tokenStore) {
      await ctx.tokenStore.save({
        oauth1: result.oauth1,
        oauth2: result.oauth2,
      });
    }
  },
  is_authenticated: () => {
    const token = ctx.httpClient.getOAuth2Token();
    if (!token) return false;
    return token.expires_at > Math.floor(Date.now() / 1000);
  },
  export_tokens: async () => {
    const token = ctx.httpClient.getOAuth2Token();
    if (!token || !ctx.state.oauth1) {
      throw createServiceAuthError("No tokens to export");
    }
    return { oauth1: ctx.state.oauth1, oauth2: token };
  },
  restore_tokens: async (data) => {
    const parsed = garminTokensSchema.parse(data);
    ctx.state.oauth1 = parsed.oauth1;
    ctx.httpClient.setTokens(parsed.oauth1, parsed.oauth2);
    ctx.logger.info("Tokens restored from stored session");
  },
  logout: async () => {
    ctx.state.oauth1 = undefined;
    ctx.httpClient.clearTokens();
    if (ctx.tokenStore) await ctx.tokenStore.clear();
    ctx.logger.info("Logged out from Garmin Connect");
  },
});

export const createGarminAuthProvider = (
  options?: GarminAuthProviderOptions
): GarminAuthProviderResult => {
  const logger = options?.logger ?? createConsoleLogger();
  const tokenStore = options?.tokenStore;
  const fetchFn = options?.fetchFn ?? createCookieFetch();
  const httpClient = createGarminHttpClient(logger, fetchFn);
  const state: AuthState = { oauth1: undefined };
  const auth = buildAuthProvider({
    httpClient,
    state,
    tokenStore,
    logger,
    fetchFn,
  });
  return { auth, httpClient };
};
