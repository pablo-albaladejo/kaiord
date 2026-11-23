/**
 * Group factory for `group-conflicts.ts`; `ConflictGroupList` names each
 * group from its sport and kind.
 */
import type { BandGroup } from "./group-conflicts";

export const buildGroup = (
  sport: BandGroup["sport"],
  kind: BandGroup["kind"]
): BandGroup => ({
  groupKey: `${sport}.${kind}`,
  sport,
  kind,
  conflicts: [],
});
