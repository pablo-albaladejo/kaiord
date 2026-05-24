import { z } from "zod";

/**
 * Zod schema for KRD metadata object.
 *
 * Validates file-level metadata including creation timestamp, device information, and sport type.
 *
 * @example
 * ```typescript
 * import { krdMetadataSchema } from '@kaiord/core';
 *
 * // Validate metadata
 * const result = krdMetadataSchema.safeParse({
 *   created: '2025-01-15T10:30:00Z',
 *   manufacturer: 'garmin',
 *   product: 'fenix7',
 *   sport: 'running',
 *   subSport: 'trail'
 * });
 *
 * if (result.success) {
 *   console.log('Valid metadata:', result.data);
 * }
 * ```
 */
export const krdMetadataSchema = z.object({
  created: z.iso.datetime(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
  serialNumber: z.string().optional(),
  /**
   * @see sportSchema for known sport values. Accepts custom strings for forward compatibility.
   *
   * Optional at the metadata level because health-metric KRD types
   * (sleep, weight, HRV, daily wellness, body composition, stress)
   * have no associated sport. A conditional refinement on `krdSchema`
   * still requires `sport` for the three legacy workout/activity/course
   * types so v1.x consumers see no change for those.
   */
  sport: z.string().optional(),
  subSport: z.string().optional(),
});

/**
 * TypeScript type for KRD metadata, inferred from {@link krdMetadataSchema}.
 *
 * Contains file-level metadata including creation timestamp, device information, and sport type.
 */
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
