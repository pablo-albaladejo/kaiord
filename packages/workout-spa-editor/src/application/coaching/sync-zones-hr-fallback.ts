/**
 * Specific → Generic → skip fallback chain for HR-derived data
 * (D-FB1). Co-located with `sync-zones-payload-mapper.ts` so that
 * the parent file stays under the 80-line cap.
 */
import type { HrBandBlock, ZonesPayload } from "../../types/coaching-zones";

const hasAnyBand = (block: HrBandBlock | undefined): boolean =>
  Boolean(block && (block.z1 || block.z2 || block.z3 || block.z4 || block.z5));

export const resolveHrBands = (
  payload: ZonesPayload,
  sport: "cycling" | "running" | "swimming"
): HrBandBlock | undefined => {
  const specific = payload.hrZones?.[sport];
  if (hasAnyBand(specific)) return specific;
  const generic = payload.hrZones?.generic;
  if (hasAnyBand(generic)) return generic;
  return undefined;
};

// Tolerates both payload shapes: pre-full-bands (only `z4Upper`
// present) and post-full-bands (only the `z4` band object — `z4Upper`
// is a derived convenience the parser fills, but consumers shouldn't
// require it).
const lthrFromBlock = (block: HrBandBlock | undefined): number | undefined => {
  if (!block) return undefined;
  if (typeof block.z4Upper === "number" && block.z4Upper > 0) {
    return block.z4Upper;
  }
  return block.z4?.upper;
};

export const resolveLthrScalar = (
  payload: ZonesPayload,
  sport: "cycling" | "running" | "swimming"
): number | undefined => {
  const specific = lthrFromBlock(payload.hrZones?.[sport]);
  if (typeof specific === "number" && specific > 0) return specific;
  return lthrFromBlock(payload.hrZones?.generic);
};
