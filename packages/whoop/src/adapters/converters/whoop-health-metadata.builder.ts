import type { KRDMetadata } from "@kaiord/core";

/**
 * Builds the `metadata` block for a WHOOP-sourced health KRD. Health KRDs
 * MUST omit `metadata.sport` (the `krd-format` conditional refinement), so
 * this helper produces a workout-free metadata block by construction.
 */
export const buildWhoopHealthMetadata = (created: string): KRDMetadata => ({
  created,
  manufacturer: "whoop",
});
