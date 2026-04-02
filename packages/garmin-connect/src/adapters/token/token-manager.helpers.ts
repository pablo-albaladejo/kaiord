import { createServiceApiError } from "@kaiord/core";
import { garminTokensSchema } from "../schemas/garmin-token.schema";
import type { RefreshFn } from "./token-manager.types";
import type { OAuth1Token, OAuth2Token } from "../http/types";
import type { Logger, TokenStore } from "@kaiord/core";

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
    logger.warn("Failed to persist tokens", { error });
  }
};

export const isExpired = (oauth2: OAuth2Token | undefined): boolean =>
  !oauth2 || oauth2.expires_at <= Date.now() / 1000;

export const doRefresh = (
  s: TokenState,
  refreshFn: RefreshFn,
  logger: Logger,
  tokenStore: TokenStore | undefined
): Promise<void> => {
  if (!s.oauth1) {
    throw createServiceApiError("No OAuth1 token for refresh", 401);
  }
  const currentOAuth1 = s.oauth1;
  s.refreshPromise = refreshFn(currentOAuth1)
    .then(async (newOAuth2) => {
      s.oauth2 = newOAuth2;
      s.generation++;
      logger.info("Token refreshed", { generation: s.generation });
      await persistBestEffort(tokenStore, currentOAuth1, newOAuth2, logger);
    })
    .finally(() => {
      s.refreshPromise = undefined;
    });
  return s.refreshPromise;
};

export const restoreFromStore = async (
  s: TokenState,
  tokenStore: TokenStore,
  logger: Logger
): Promise<{ restored: boolean }> => {
  const data = await tokenStore.load();
  if (!data) return { restored: false };
  if (s.oauth1 && s.oauth2) return { restored: false };
  const parsed = garminTokensSchema.safeParse(data);
  if (!parsed.success) return { restored: false };
  s.oauth1 = parsed.data.oauth1;
  s.oauth2 = parsed.data.oauth2;
  s.generation++;
  if (isExpired(s.oauth2)) logger.warn("Restored tokens are expired");
  logger.info("Tokens restored from store", { generation: s.generation });
  return { restored: true };
};
