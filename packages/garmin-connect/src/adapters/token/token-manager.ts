import type { Logger, TokenStore } from "@kaiord/core";

import type { TokenState } from "./token-manager.helpers";
import {
  isExpired,
  persistBestEffort,
  refreshTokens,
  restoreFromStore,
} from "./token-manager.helpers";
import type { RefreshFn, TokenManager } from "./token-manager.types";

type Options = {
  refreshFn: RefreshFn;
  logger: Logger;
  tokenStore?: TokenStore;
};

export const createTokenManager = (options: Options): TokenManager => {
  const { refreshFn, logger, tokenStore } = options;
  const state: TokenState = {
    oauth1: undefined,
    oauth2: undefined,
    generation: 0,
    refreshPromise: undefined,
  };

  return {
    getAccessToken: () => state.oauth2?.access_token,
    getOAuth1Token: () => (state.oauth1 ? { ...state.oauth1 } : undefined),
    getOAuth2Token: () => (state.oauth2 ? { ...state.oauth2 } : undefined),
    getGeneration: () => state.generation,
    isAuthenticated: () => !!state.oauth2 && !isExpired(state.oauth2),
    setTokens: async (oauth1Token, oauth2Token) => {
      state.oauth1 = oauth1Token;
      state.oauth2 = oauth2Token;
      state.generation++;
      logger.info("Tokens set", { generation: state.generation });
      await persistBestEffort(tokenStore, oauth1Token, oauth2Token, logger);
    },
    clearTokens: async () => {
      state.oauth1 = undefined;
      state.oauth2 = undefined;
      state.refreshPromise = undefined;
      state.generation++;
      logger.info("Tokens cleared");
      if (tokenStore) await tokenStore.clear();
    },
    refresh: async () => {
      if (state.refreshPromise) return state.refreshPromise;
      return refreshTokens(state, refreshFn, logger, tokenStore);
    },
    init: async () => {
      if (state.oauth1 && state.oauth2) return { restored: false };
      if (!tokenStore) return { restored: false };
      return restoreFromStore(state, tokenStore, logger);
    },
  };
};
