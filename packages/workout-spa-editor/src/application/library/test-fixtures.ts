/**
 * Shared fixture helpers for application/library/*.test.ts.
 */

import type { KRD } from "../../types/krd";

export const NOW = "2026-04-30T00:00:00.000Z";

export const makeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: NOW, sport: "cycling" },
});
