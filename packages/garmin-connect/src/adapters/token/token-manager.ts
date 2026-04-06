import type { Logger, TokenStore } from "@kaiord/core";

import type { TokenState } from "./token-manager.helpers";
import {
  doRefresh,
  isExpired,
  persistBestEffort,
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
  const s: TokenState = {
    oauth1: undefined,
    oauth2: undefined,
    generation: 0,
    refreshPromise: undefined,
  };

  return {
    getAccessToken: () => s.oauth2?.access_token,
    getOAuth1Token: () => (s.oauth1 ? { ...s.oauth1 } : undefined),
    getOAuth2Token: () => (s.oauth2 ? { ...s.oauth2 } : undefined),
    getGeneration: () => s.generation,
    isAuthenticated: () => !!s.oauth2 && !isExpired(s.oauth2),
    setTokens: async (o1, o2) => {
      s.oauth1 = o1;
      s.oauth2 = o2;
      s.generation++;
      logger.info("Tokens set", { generation: s.generation });
      await persistBestEffort(tokenStore, o1, o2, logger);
    },
    clearTokens: async () => {
      s.oauth1 = undefined;
      s.oauth2 = undefined;
      s.refreshPromise = undefined;
      s.generation++;
      logger.info("Tokens cleared");
      if (tokenStore) await tokenStore.clear();
    },
    refresh: async () => {
      if (s.refreshPromise) return s.refreshPromise;
      return doRefresh(s, refreshFn, logger, tokenStore);
    },
    init: async () => {
      if (s.oauth1 && s.oauth2) return { restored: false };
      if (!tokenStore) return { restored: false };
      return restoreFromStore(s, tokenStore, logger);
    },
  };
};
