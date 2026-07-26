/**
 * Resolves the WHOOP sports catalog (`activities-service/v1/sports/history`)
 * into an `id -> name` lookup so `syncWhoopActivities` can label each
 * workout's numeric `sport_id`. Split out of sync-whoop-activities.use-case.ts
 * to keep that file under the per-file line cap.
 */
import { buildSportCatalog, whoopSportsResponseSchema } from "@kaiord/whoop";

import type { WhoopFetchResult } from "./whoop-fetch-result";

export type WhoopSportCatalogOutcome =
  { ok: true; catalog: Map<number, string> } | { ok: false; error?: string };

export const resolveWhoopSportCatalog = async (
  fetchSports: () => Promise<WhoopFetchResult>
): Promise<WhoopSportCatalogOutcome> => {
  let result: WhoopFetchResult;
  try {
    result = await fetchSports();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!result.ok) return { ok: false, error: result.error };
  const parsed = whoopSportsResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { ok: false, error: "Malformed WHOOP sports response" };
  }
  return { ok: true, catalog: buildSportCatalog(parsed.data) };
};
