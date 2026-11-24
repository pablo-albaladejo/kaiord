/**
 * resolveEffectiveSource — the multi-source read resolver (F3.2).
 *
 * Given (profileId, dataType, day), returns the effective record(s):
 *   - a choice in force (the matrix is not off, see `readAuthorityChoice`):
 *     "union" keeps every source's record; "priority" reads the first
 *     source in `sourceOrder` that has data that day, falls back to the next,
 *     and with no source with data returns an explicit empty result.
 *   - no choice in force: "automatic" for a kind the App picks an Authority
 *     for (`automatic-authority.ts`), else "union".
 *
 * Under "priority" the order consulted is `sourceOrder ∩ enabled import
 * policies`, "manual" exempt (it has no policy row). Under "automatic" no
 * record is dropped: a source the rule does not name, or whose import is
 * off, is read last rather than never.
 *
 * `getRecordsForDay` is injected so this stays adapter-free.
 */
import type { ManagedDataType } from "@kaiord/core";

import {
  type AuthorityInForceDeps,
  loadAuthorityInForce,
} from "./authority-in-force";

export type SourcedRecord<T> = {
  sourceBridgeId: string;
  record: T;
};

export type ResolveEffectiveSourceDeps<T> = AuthorityInForceDeps & {
  getRecordsForDay: (input: {
    profileId: string;
    dataType: ManagedDataType;
    day: string;
  }) => Promise<SourcedRecord<T>[]>;
};

export type ResolveEffectiveSourceInput = {
  profileId: string;
  dataType: ManagedDataType;
  day: string;
};

type Ranked = "priority" | "automatic";

export type ResolveEffectiveSourceResult<T> =
  | { mode: "union"; records: SourcedRecord<T>[] }
  | { mode: Ranked; effective: SourcedRecord<T>; usedFallback: boolean }
  | { mode: Ranked; effective: undefined; usedFallback: false };

const resolveInOrder = <T>(
  mode: Ranked,
  order: readonly string[],
  recordsForDay: readonly SourcedRecord<T>[]
): ResolveEffectiveSourceResult<T> => {
  for (let i = 0; i < order.length; i++) {
    const match = recordsForDay.find((r) => r.sourceBridgeId === order[i]);
    // Under "automatic" the order IS the rule, so no match is a fallback.
    if (match) {
      return {
        mode,
        effective: match,
        usedFallback: mode === "priority" && i > 0,
      };
    }
  }
  const unnamed = mode === "automatic" ? recordsForDay.at(-1) : undefined;
  return unnamed
    ? { mode, effective: unnamed, usedFallback: true }
    : { mode, effective: undefined, usedFallback: false };
};

export const resolveEffectiveSource = async <T>(
  deps: ResolveEffectiveSourceDeps<T>,
  input: ResolveEffectiveSourceInput
): Promise<ResolveEffectiveSourceResult<T>> => {
  const { profileId, dataType } = input;
  const [recordsForDay, authority] = await Promise.all([
    deps.getRecordsForDay(input),
    loadAuthorityInForce(deps, { profileId, dataType }),
  ]);
  return authority.mode === "union"
    ? { mode: "union", records: recordsForDay }
    : resolveInOrder(
        authority.mode === "priority" ? "priority" : "automatic",
        authority.sourceOrder,
        recordsForDay
      );
};
