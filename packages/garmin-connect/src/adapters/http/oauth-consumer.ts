import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";

import type { FetchFn, OAuthConsumer } from "./types";
import { OAUTH_CONSUMER_URL } from "./urls";

export const fetchOAuthConsumer = async (
  fetchFn: FetchFn,
  logger: Logger
): Promise<OAuthConsumer> => {
  logger.debug("[SSO] Fetching OAuth consumer credentials");
  const response = await fetchFn(OAUTH_CONSUMER_URL);
  if (!response.ok) {
    logger.error("[SSO] OAuth consumer fetch failed", {
      status: response.status,
    });
    throw createServiceAuthError(
      `Failed to fetch OAuth consumer: ${response.status} ${response.statusText}`
    );
  }
  logger.debug("[SSO] OAuth consumer fetch", { status: response.status });
  const tokenJson = (await response.json()) as {
    consumer_key: string;
    consumer_secret: string;
  };
  return { key: tokenJson.consumer_key, secret: tokenJson.consumer_secret };
};
