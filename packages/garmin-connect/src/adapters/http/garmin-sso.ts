import type { Logger } from "@kaiord/core";

import { fetchOAuthConsumer } from "./oauth-consumer";
import { getLoginTicket } from "./sso-login";
import { exchangeOAuth2 as exchange, getOAuth1Token } from "./sso-oauth";
import type { FetchFn, OAuth1Token, OAuth2Token } from "./types";

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
  fetchFn: FetchFn
): Promise<SsoResult> => {
  logger.info("Starting Garmin Connect SSO login");

  logger.info("[SSO] Step 1/4: OAuth consumer");
  const consumer = await fetchOAuthConsumer(fetchFn, logger);

  logger.info("[SSO] Step 2/4: Login ticket");
  const ticket = await getLoginTicket(username, password, fetchFn, logger);

  logger.info("[SSO] Step 3/4: OAuth1 token");
  const oauth1 = await getOAuth1Token(ticket, consumer, fetchFn, logger);

  logger.info("[SSO] Step 4/4: OAuth2 exchange");
  const oauth2 = await exchange(oauth1, consumer, fetchFn, logger);

  logger.info("Garmin Connect SSO login successful");
  return { oauth1, oauth2 };
};

export { exchangeOAuth2 } from "./sso-oauth";
