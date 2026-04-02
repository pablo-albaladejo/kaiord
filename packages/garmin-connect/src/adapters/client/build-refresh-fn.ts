import { fetchOAuthConsumer } from "../http/oauth-consumer";
import { exchangeOAuth2 } from "../http/sso-oauth";
import type { FetchFn, OAuthConsumer } from "../http/types";
import type { RefreshFn } from "../token/token-manager.types";

export const buildRefreshFn = (fetchFn: FetchFn): RefreshFn => {
  let consumer: OAuthConsumer | undefined;

  return async (oauth1) => {
    try {
      consumer ??= await fetchOAuthConsumer(fetchFn);
      return await exchangeOAuth2(oauth1, consumer, fetchFn);
    } catch {
      consumer = undefined;
      consumer = await fetchOAuthConsumer(fetchFn);
      return exchangeOAuth2(oauth1, consumer, fetchFn);
    }
  };
};
