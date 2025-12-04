import { z } from "zod";

/**
 * Zod schema for KRD event object.
 *
 * Validates workout events (start, stop, pause, lap, etc.).
 *
 * @example
 * ```typescript
 * import { krdEventSchema } from '@kaiord/core';
 *
 * const event = krdEventSchema.parse({
 *   timestamp: '2025-01-15T10:30:00Z',
 *   eventType: 'lap',
 *   data: 1
 * });
 * ```
 */
export const krdEventSchema = z.object({
  timestamp: z.string().datetime(),
  eventType: z.enum([
    "start",
    "stop",
    "pause",
    "resume",
    "lap",
    "marker",
    "timer",
  ]),
  eventGroup: z.number().int().optional(),
  data: z.number().int().optional(),
});

/**
 * TypeScript type for KRD event, inferred from {@link krdEventSchema}.
 *
 * Represents a workout event (start, stop, pause, lap, etc.).
 */
export type KRDEvent = z.infer<typeof krdEventSchema>;
