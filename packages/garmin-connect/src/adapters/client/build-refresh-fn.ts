import type { Logger } from "@kaiord/core";

import { fetchOAuthConsumer } from "../http/oauth-consumer";
import { exchangeOAuth2 } from "../http/sso-oauth";
import type { FetchFn, OAuthConsumer } from "../http/types";
import type { RefreshFn } from "../token/token-manager.types";

export const buildRefreshFn = (fetchFn: FetchFn, logger: Logger): RefreshFn => {
  let consumer: OAuthConsumer | undefined;

  return async (oauth1) => {
    consumer ??= await fetchOAuthConsumer(fetchFn, logger);
    try {
      return await exchangeOAuth2(oauth1, consumer, fetchFn, logger);
    } catch {
      consumer = undefined;
      consumer = await fetchOAuthConsumer(fetchFn, logger);
      return exchangeOAuth2(oauth1, consumer, fetchFn, logger);
    }
  };
};
