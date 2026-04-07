import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";

import type { FetchFn, OAuthConsumer } from "./types";
import { OAUTH_CONSUMER_URL } from "./urls";

export const fetchOAuthConsumer = async (
  fetchFn: FetchFn,
  logger: Logger
): Promise<OAuthConsumer> => {
  logger.debug("[SSO] Fetching OAuth consumer credentials");
  const res = await fetchFn(OAUTH_CONSUMER_URL);
  if (!res.ok) {
    logger.error("[SSO] OAuth consumer fetch failed", { status: res.status });
    throw createServiceAuthError(
      `Failed to fetch OAuth consumer: ${res.status} ${res.statusText}`
    );
  }
  logger.debug("[SSO] OAuth consumer fetch", { status: res.status });
  const data = (await res.json()) as {
    consumer_key: string;
    consumer_secret: string;
  };
  return { key: data.consumer_key, secret: data.consumer_secret };
};
