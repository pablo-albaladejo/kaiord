import type { FetchFn, OAuthConsumer } from "./types";
import { createServiceAuthError } from "@kaiord/core";
import { OAUTH_CONSUMER_URL } from "./urls";

export const fetchOAuthConsumer = async (
  fetchFn: FetchFn
): Promise<OAuthConsumer> => {
  const res = await fetchFn(OAUTH_CONSUMER_URL);
  if (!res.ok) {
    throw createServiceAuthError(
      `Failed to fetch OAuth consumer: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as {
    consumer_key: string;
    consumer_secret: string;
  };
  return { key: data.consumer_key, secret: data.consumer_secret };
};
