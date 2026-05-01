/**
 * AutoMatchDismissal — records that the user dismissed the auto-match
 * suggestion banner for a given (profileId, weekStart). The 24h expiry
 * is interpreted in the use case via `DISMISSAL_TTL_MS`.
 *
 * `dismissedAt` is sourced from an injected clock for test determinism.
 */

import { z } from "zod";

export const autoMatchDismissalSchema = z.object({
  profileId: z.string().min(1),
  /** Monday (ISO week-start) of the dismissed week, YYYY-MM-DD. */
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dismissedAt: z.iso.datetime(),
});

export type AutoMatchDismissal = z.infer<typeof autoMatchDismissalSchema>;
