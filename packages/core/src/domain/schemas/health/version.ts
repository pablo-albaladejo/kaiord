import { z } from "zod";

/**
 * Major-version gate shared by every `extensions.health.<metric>` payload.
 *
 * Business rule: health payloads belong to the **v2.x line** — additive
 * minors (`2.0`, `2.1`, …) are accepted so forward-compatible fields can be
 * introduced without bumping the canonical KRD version, while any other
 * major (`1.x`, `3.x`) is rejected. Single-sourced here so the inevitable
 * v3 bump is a one-line change rather than six edits.
 */
export const HEALTH_SCHEMA_VERSION_PATTERN = /^2\.\d+$/;

/**
 * Zod field schema enforcing {@link HEALTH_SCHEMA_VERSION_PATTERN}. Imported
 * by all six health metric schemas as their `version` field.
 */
export const healthVersionSchema = z
  .string()
  .regex(HEALTH_SCHEMA_VERSION_PATTERN);
