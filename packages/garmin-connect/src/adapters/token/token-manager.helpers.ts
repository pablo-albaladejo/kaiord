import type { Logger, TokenStore } from "@kaiord/core";
import { createServiceApiError } from "@kaiord/core";

import { nowEpochSeconds } from "../http/time";
import type { OAuth1Token, OAuth2Token } from "../http/types";
import { garminTokensSchema } from "../schemas/garmin-token.schema";
import type { RefreshFn } from "./token-manager.types";

export type TokenState = {
  oauth1: OAuth1Token | undefined;
  oauth2: OAuth2Token | undefined;
  generation: number;
  refreshPromise: Promise<void> | undefined;
};

export const persistBestEffort = async (
  store: TokenStore | undefined,
  oauth1: OAuth1Token,
  oauth2: OAuth2Token,
  logger: Logger
): Promise<void> => {
  if (!store) return;
  try {
    await store.save({ oauth1, oauth2 });
  } catch (error) {
    logger.warn("Failed to persist tokens", {
      errorName: error instanceof Error ? error.name : typeof error,
    });
  }
};

export const isExpired = (oauth2: OAuth2Token | undefined): boolean =>
  !oauth2 || oauth2.expires_at <= nowEpochSeconds();

export const refreshTokens = (
  state: TokenState,
  refreshFn: RefreshFn,
  logger: Logger,
  tokenStore: TokenStore | undefined
): Promise<void> => {
  if (!state.oauth1) {
    throw createServiceApiError("No OAuth1 token for refresh", 401);
  }
  const currentOAuth1 = state.oauth1;
  const generationAtStart = state.generation;
  state.refreshPromise = refreshFn(currentOAuth1)
    .then(async (newOAuth2) => {
      if (state.generation !== generationAtStart) return;
      state.oauth2 = newOAuth2;
      state.generation++;
      logger.info("Token refreshed", { generation: state.generation });
      await persistBestEffort(tokenStore, currentOAuth1, newOAuth2, logger);
    })
    .finally(() => {
      state.refreshPromise = undefined;
    });
  return state.refreshPromise;
};

export const restoreFromStore = async (
  state: TokenState,
  tokenStore: TokenStore,
  logger: Logger
): Promise<{ restored: boolean }> => {
  const storedTokens = await tokenStore.load();
  if (!storedTokens) return { restored: false };
  if (state.oauth1 && state.oauth2) return { restored: false };
  const parsed = garminTokensSchema.safeParse(storedTokens);
  if (!parsed.success) return { restored: false };
  state.oauth1 = parsed.data.oauth1;
  state.oauth2 = parsed.data.oauth2;
  state.generation++;
  if (isExpired(state.oauth2)) logger.warn("Restored tokens are expired");
  logger.info("Tokens restored from store", { generation: state.generation });
  return { restored: true };
};
