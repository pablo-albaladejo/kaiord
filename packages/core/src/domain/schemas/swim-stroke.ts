import { z } from "zod";

/**
 * Zod schema for swim stroke type enumeration.
 *
 * Defines swimming stroke types for workout steps.
 *
 * @example
 * ```typescript
 * import { swimStrokeSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const freestyle = swimStrokeSchema.enum.freestyle;
 * const backstroke = swimStrokeSchema.enum.backstroke;
 *
 * // Validate swim stroke
 * const result = swimStrokeSchema.safeParse('freestyle');
 * if (result.success) {
 *   console.log('Valid swim stroke:', result.data);
 * }
 * ```
 */
export const swimStrokeSchema = z.enum([
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "drill",
  "mixed",
  "im",
]);

/**
 * TypeScript type for swim stroke, inferred from {@link swimStrokeSchema}.
 *
 * String literal union of supported swim stroke types.
 */
export type SwimStroke = z.infer<typeof swimStrokeSchema>;

/**
 * Bidirectional mapping from swim stroke to FIT protocol numeric values.
 *
 * Used for converting KRD swim strokes to FIT format.
 *
 * @example
 * ```typescript
 * import { SWIM_STROKE_TO_FIT } from '@kaiord/core';
 *
 * const fitValue = SWIM_STROKE_TO_FIT.freestyle; // 0
 * ```
 */
export const SWIM_STROKE_TO_FIT = {
  freestyle: 0,
  backstroke: 1,
  breaststroke: 2,
  butterfly: 3,
  drill: 4,
  mixed: 5,
  im: 5,
} as const satisfies Record<SwimStroke, number>;

/**
 * Bidirectional mapping from FIT protocol numeric values to swim stroke.
 *
 * Used for converting FIT format to KRD swim strokes.
 *
 * @example
 * ```typescript
 * import { FIT_TO_SWIM_STROKE } from '@kaiord/core';
 *
 * const stroke = FIT_TO_SWIM_STROKE[0]; // 'freestyle'
 * ```
 */
export const FIT_TO_SWIM_STROKE: Record<number, SwimStroke> = {
  0: "freestyle",
  1: "backstroke",
  2: "breaststroke",
  3: "butterfly",
  4: "drill",
  5: "mixed",
};
