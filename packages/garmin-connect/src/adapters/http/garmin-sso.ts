import type { Logger } from "@kaiord/core";
import type { FetchFn, OAuth1Token, OAuth2Token } from "./types";
import { fetchOAuthConsumer } from "./oauth-consumer";
import { getLoginTicket } from "./sso-login";
import { getOAuth1Token, exchangeOAuth2 as exchange } from "./sso-oauth";

export type { OAuth1Token, OAuth2Token } from "./types";
export type SsoResult = { oauth1: OAuth1Token; oauth2: OAuth2Token };

/**
 * Garmin Connect SSO login flow.
 * The fetchFn must be cookie-aware (persist cookies across requests).
 * Use fetch-cookie or similar wrapper for Node.js environments.
 */
export const garminSso = async (
  username: string,
  password: string,
  logger: Logger,
  fetchFn: FetchFn = globalThis.fetch
): Promise<SsoResult> => {
  logger.info("Starting Garmin Connect SSO login");

  const consumer = await fetchOAuthConsumer(fetchFn);
  const ticket = await getLoginTicket(username, password, fetchFn, logger);
  logger.debug("SSO ticket obtained");

  const oauth1 = await getOAuth1Token(ticket, consumer, fetchFn);
  logger.debug("OAuth1 token obtained");

  const oauth2 = await exchange(oauth1, consumer, fetchFn);
  logger.info("Garmin Connect SSO login successful");

  return { oauth1, oauth2 };
};

export { exchangeOAuth2 } from "./sso-oauth";
