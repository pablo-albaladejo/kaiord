import type { z } from "zod";

import type { WhoopHttpClient } from "../http/types";
import { buildCollectionPath, type WhoopQuery } from "../http/urls";
import { whoopPaginatedSchema } from "../schemas/whoop-paginated.schema";

/**
 * Safety cap on cursor pages so a malformed/looping `next_token` cannot spin
 * forever. 200 pages × 25 records ≈ 5 000 records, far beyond a normal sync
 * window while staying inside the 10 000/day WHOOP request budget.
 */
export const MAX_PAGES = 200;

/**
 * Walks a WHOOP collection endpoint cursor-by-cursor, validating each page
 * with `recordSchema`, and returns every record. Rate-limit back-off (429,
 * `X-RateLimit-*`) and auth live in the injected `WhoopHttpClient`, so this
 * helper only follows `next_token`.
 */
export const fetchAllRecords = async <T extends z.ZodTypeAny>(
  httpClient: WhoopHttpClient,
  basePath: string,
  recordSchema: T,
  query: WhoopQuery = {},
  onTruncated?: (basePath: string) => void
): Promise<z.infer<T>[]> => {
  const pageSchema = whoopPaginatedSchema(recordSchema);
  const records: z.infer<T>[] = [];
  let nextToken: string | undefined = query.nextToken;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const path = buildCollectionPath(basePath, { ...query, nextToken });
    const raw = await httpClient.get<unknown>(path);
    const parsed = pageSchema.parse(raw);
    records.push(...parsed.records);
    if (!parsed.next_token) return records;
    nextToken = parsed.next_token;
  }

  onTruncated?.(basePath);
  return records;
};
