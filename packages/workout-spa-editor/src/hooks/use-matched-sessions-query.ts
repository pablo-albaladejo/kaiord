/**
 * Bounded `useLiveQuery` source for `useMatchedSessions`: one
 * profile+date-range scan against `sessionMatches`. Extracted so the
 * hook entry stays under the per-file line cap.
 */

import { db } from "../adapters/dexie/dexie-database";
import type { SessionMatch } from "../types/session-match";

const lastDayOf = (days: string[]): string =>
  days.length > 0 ? (days.at(-1) ?? days[0]!) : "";
const firstDayOf = (days: string[]): string => days[0] ?? "";

export const queryMatchesForWeek = async (
  profileId: string,
  days: string[]
): Promise<SessionMatch[]> =>
  db
    .table<SessionMatch>("sessionMatches")
    .where("[profileId+date]")
    .between(
      [profileId, firstDayOf(days)],
      [profileId, lastDayOf(days)],
      true,
      true
    )
    .toArray();
