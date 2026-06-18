import type { ZoneMapEntry } from "../../components/organisms/ZoneMap";
import type { ZoneNumber } from "../zone-colors";
import { formatPace } from "./format";
import { ZONE_WEIGHTS, type ZoneBandModel } from "./zone-models";

type Bands = readonly [number, number, number, number];

function ascendingRanges(threshold: number, bounds: Bands, suffix: string) {
  const [a, b, c, d] = bounds.map((fraction) =>
    Math.round(threshold * fraction)
  );
  return [
    `< ${a}${suffix}`,
    `${a}–${b}${suffix}`,
    `${b}–${c}${suffix}`,
    `${c}–${d}${suffix}`,
    `> ${d}${suffix}`,
  ] as const;
}

function paceRanges(threshold: number, bounds: Bands, suffix: string) {
  const [a, b, c, d] = bounds.map((fraction) =>
    formatPace(threshold / fraction)
  );
  return [
    `> ${a}${suffix}`,
    `${b}–${a}${suffix}`,
    `${c}–${b}${suffix}`,
    `${d}–${c}${suffix}`,
    `< ${d}${suffix}`,
  ] as const;
}

/** Builds the 5 zone-map entries from a model, threshold value and suffix. */
export function buildZoneMap(
  model: ZoneBandModel,
  threshold: number,
  suffix: string
): ZoneMapEntry[] {
  const ranges =
    model.kind === "pace"
      ? paceRanges(threshold, model.bounds, suffix)
      : ascendingRanges(threshold, model.bounds, suffix);
  return model.names.map((name, i) => ({
    n: (i + 1) as ZoneNumber,
    name,
    range: ranges[i]!,
    pct: model.pcts[i]!,
    w: ZONE_WEIGHTS[i]!,
  }));
}
