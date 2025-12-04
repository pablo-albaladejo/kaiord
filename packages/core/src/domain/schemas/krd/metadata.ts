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
  created: z.string().datetime(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
  serialNumber: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
});

/**
 * TypeScript type for KRD metadata, inferred from {@link krdMetadataSchema}.
 *
 * Contains file-level metadata including creation timestamp, device information, and sport type.
 */
export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
