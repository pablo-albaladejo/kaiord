/**
 * Wire envelope for a WHOOP bridge `whoop-fetch` relay. The bridge content
 * script returns `{ ok, status, data }` for an allowed read (`data` = the
 * parsed JSON body) or `{ ok: false, error }` for a blocked/failed fetch.
 *
 * Kept in the application layer so the transport adapter and the sync use case
 * share one definition; `safeParse` at the bridge edge is defense-in-depth
 * against a WHOOP internal-API shape drift.
 */
import { z } from "zod";

export const whoopFetchResultSchema = z.object({
  ok: z.boolean(),
  status: z.number().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type WhoopFetchResult = z.infer<typeof whoopFetchResultSchema>;
