/**
 * WHOOP developer-API v2 paths and query-string helpers.
 *
 * Paths are relative to the client base (`https://api.prod.whoop.com/developer`),
 * which the injected `WhoopHttpClient` prepends. `limit` is capped at 25 by
 * the WHOOP API; `nextToken` drives cursor pagination.
 */

export const RECOVERY_PATH = "/v2/recovery";
export const SLEEP_PATH = "/v2/activity/sleep";

/** WHOOP caps the collection `limit` query parameter at 25 (default 10). */
export const WHOOP_MAX_LIMIT = 25;

export type WhoopQuery = {
  limit?: number;
  start?: string;
  end?: string;
  nextToken?: string;
};

export const buildCollectionPath = (
  basePath: string,
  query: WhoopQuery = {}
): string => {
  const params = new URLSearchParams();
  const limit = Math.min(query.limit ?? WHOOP_MAX_LIMIT, WHOOP_MAX_LIMIT);
  params.set("limit", String(limit));
  if (query.start) params.set("start", query.start);
  if (query.end) params.set("end", query.end);
  if (query.nextToken) params.set("nextToken", query.nextToken);
  return `${basePath}?${params.toString()}`;
};
