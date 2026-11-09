/**
 * Resolves the WHOOP sports catalog (`activities-service/v1/sports/history`)
 * into an `id -> name` lookup so `syncWhoopActivities` can label each
 * workout's numeric `sport_id`.
 */
import { buildSportCatalog, whoopSportsResponseSchema } from "@kaiord/whoop";

import { errorMessage } from "../../utils/error-message";
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
      error: errorMessage(err),
    };
  }
  if (!result.ok) return { ok: false, error: result.error };
  const parsed = whoopSportsResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { ok: false, error: "Malformed WHOOP sports response" };
  }
  return { ok: true, catalog: buildSportCatalog(parsed.data) };
};
