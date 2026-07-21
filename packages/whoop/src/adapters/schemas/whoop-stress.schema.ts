import { z } from "zod";

/**
 * Schema for the WHOOP internal `health-service/v2/stress-bff/{date}`
 * response — a ~1.7MB UI-shaped BFF. Modelled BFF-tolerant: only the field
 * the converter needs a typed guarantee for (`gauge.gauge_fill_percentage`,
 * the day's average stress as a 0–1 fraction) is pulled out; everything
 * else, including the `stress_graph` timeline, is left as `unknown` so a
 * UI-shape drift anywhere else in the payload never breaks the parse.
 * `extractStressPoints` walks `stress_graph` defensively instead.
 */
const gaugeSchema = z
  .object({ gauge_fill_percentage: z.number().nullish() })
  .nullish();

export const whoopStressResponseSchema = z.object({
  gauge: gaugeSchema,
  stress_graph: z.unknown().nullish(),
});

export type WhoopStressResponse = z.infer<typeof whoopStressResponseSchema>;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

/**
 * Defensively walks `stress_graph.graph.plots[].plot.segments[].points[]`
 * for numeric `position_y` readings (0–1 stress value per point, ~816/day).
 * Every level is optional-chained and `Array.isArray`-guarded, so any
 * structural mismatch in the un-modelled `stress_graph` blob — a missing
 * plot, non-array segments, a garbled point — degrades to an empty result
 * rather than throwing.
 */
export const extractStressPoints = (bff: WhoopStressResponse): number[] => {
  const plots = asRecord(asRecord(bff.stress_graph)?.graph)?.plots;
  if (!Array.isArray(plots)) return [];

  const points: number[] = [];
  for (const plotEntry of plots) {
    const segments = asRecord(asRecord(plotEntry)?.plot)?.segments;
    if (!Array.isArray(segments)) continue;
    for (const segment of segments) {
      const segmentPoints = asRecord(segment)?.points;
      if (!Array.isArray(segmentPoints)) continue;
      for (const point of segmentPoints) {
        const positionY = asRecord(point)?.position_y;
        if (typeof positionY === "number") points.push(positionY);
      }
    }
  }
  return points;
};
