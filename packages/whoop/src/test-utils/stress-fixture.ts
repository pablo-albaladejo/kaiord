import type { WhoopStressResponse } from "../adapters/schemas/whoop-stress.schema";

/**
 * Minimal synthetic WHOOP `health-service/v2/stress-bff/{date}` response.
 * NOT a full scrub — the real payload is ~1.7MB of UI-only fields the
 * schema deliberately doesn't model. Carries just the gauge fraction and a
 * two-point `stress_graph` timeline the converter and extractor tests need.
 */

export const STRESS_GAUGE_FRACTION = 0.47;
export const STRESS_POINT_LOW = 0.4;
export const STRESS_POINT_HIGH = 0.62;

export const STRESS_BFF_FIXTURE: WhoopStressResponse = {
  gauge: { gauge_fill_percentage: STRESS_GAUGE_FRACTION },
  stress_graph: {
    graph: {
      plots: [
        {
          plot: {
            segments: [
              {
                points: [
                  { position_y: STRESS_POINT_LOW },
                  { position_y: STRESS_POINT_HIGH },
                ],
              },
            ],
          },
        },
      ],
    },
  },
};
