/**
 * Canvas colours for a lab chart's reference region.
 *
 * The region is chrome, not data, so it derives from the hairline role rather
 * than from a hue — the danger ramp shares zone 5's hue, and a lab result is
 * not a training zone. A one-sided threshold has no fill to carry it, so its
 * edge line is drawn at a stronger alpha than a two-sided band's fill edges.
 */
import { readThemeColor } from "../../../../charts/uplot-base/chart-theme";
import type { ReferenceBand } from "./reference-band";

const BAND_EDGE_PCT = 30;
const BAND_FILL_PCT = 10;
const THRESHOLD_PCT = 55;
// Mirrors the :root value of --edge (--border, n-300).
const FALLBACK_EDGE = "#d4d4d4";

// uPlot paints to a canvas, so the alpha has to be baked into the colour
// string. `--edge` resolves to an oklch() literal off the ramp, so `color-mix`
// (the same idiom --glass-bg uses in index.css) is what dilutes it.
const fade = (color: string, percent: number): string =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

export type ReferenceBandStyle = { edgeStroke: string; fill: string };

export const referenceBandStyle = (
  band: ReferenceBand | null
): ReferenceBandStyle => {
  const edge = readThemeColor("--edge", FALLBACK_EDGE);
  const edgePercent =
    band?.kind === "threshold" ? THRESHOLD_PCT : BAND_EDGE_PCT;
  return {
    edgeStroke: fade(edge, edgePercent),
    fill: fade(edge, BAND_FILL_PCT),
  };
};
