import type { OAuth1Token, OAuth2Token } from "../http/types";

export type TokenManager = {
  getAccessToken: () => string | undefined;
  getOAuth1Token: () => OAuth1Token | undefined;
  getOAuth2Token: () => OAuth2Token | undefined;
  getGeneration: () => number;
  isAuthenticated: () => boolean;
  setTokens: (oauth1: OAuth1Token, oauth2: OAuth2Token) => Promise<void>;
  clearTokens: () => Promise<void>;
  refresh: () => Promise<void>;
  init: () => Promise<{ restored: boolean }>;
};

export type TokenReader = Pick<
  TokenManager,
  "getAccessToken" | "getGeneration" | "refresh" | "isAuthenticated"
>;

export type RefreshFn = (oauth1: OAuth1Token) => Promise<OAuth2Token>;
