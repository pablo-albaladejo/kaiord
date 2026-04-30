/**
 * Shared types for the per-sport zone use cases.
 *
 * `ZoneType` mirrors the legacy `store/profile-store/types.ts` definition;
 * it is duplicated here so the application layer does not depend on the
 * Zustand store package (which is being deleted in Phase 1B).
 */

export type ZoneType = "heartRateZones" | "powerZones" | "paceZones";
