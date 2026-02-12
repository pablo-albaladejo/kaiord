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
 *   eventType: 'event_lap',
 *   data: 1
 * });
 * ```
 */
export const krdEventSchema = z.object({
  timestamp: z.iso.datetime(),
  eventType: z.enum([
    "event_start",
    "event_stop",
    "event_pause",
    "event_resume",
    "event_lap",
    "event_marker",
    "event_timer",
    "event_workout_step_change",
    "event_session_start",
    "event_activity_start",
  ]),
  eventGroup: z.number().int().optional(),
  data: z.number().int().optional(),
  message: z.string().max(256).optional(),
});

/**
 * TypeScript type for KRD event, inferred from {@link krdEventSchema}.
 *
 * Represents a workout event (start, stop, pause, lap, etc.).
 */
export type KRDEvent = z.infer<typeof krdEventSchema>;
