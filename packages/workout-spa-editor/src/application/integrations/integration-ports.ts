/**
 * Integration data ports — application-layer contracts for the bridge
 * operations not covered by `CoachingTransport`
 * (application/coaching/coaching-transport-port.ts), which remains the
 * port for coaching-plan and training-zones reads.
 *
 * Per-integration adapters (adapters/<integration>/) implement these over
 * the shared bridge transport; consumers depend on the port types, never
 * on adapter internals (spec: spa-integration-adapters). Policy gating is
 * unaffected — `resolveImportPolicies`/`resolveExportPolicies` still
 * decide whether an operation runs.
 */

import type { ProfileSnapshot } from "@kaiord/core";

import type { GarminActivitiesResponse } from "../import/garmin-activity-schema";

/** Minimal bridge coordinates every push/read needs. */
export type BridgeTarget = { bridgeId: string; extensionId: string };

/** Read the athlete's recent activities via an installed bridge. */
export type FetchActivities = (
  extensionId: string
) => Promise<GarminActivitiesResponse>;

export type PushWorkoutResult =
  | { status: "success"; garminWorkoutId: string | null }
  | { status: "error"; message: string; redetect: boolean }
  | { status: "invalidated" };

/** Push a platform-shaped workout payload via an installed bridge. */
export type PushWorkout = (
  extensionId: string,
  payload: unknown
) => Promise<PushWorkoutResult>;

/** Push the active profile snapshot to a discovered bridge. */
export type PushProfileSnapshot = (
  bridge: BridgeTarget,
  snapshot: ProfileSnapshot,
  fingerprint: string,
  fingerprintMap: Map<string, string>
) => Promise<void>;
