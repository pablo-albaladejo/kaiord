/**
 * What a placement run reports (design §3.3 step 9). `reason` is a closed
 * enum of app-authored values, safe for analytics and the chat tool.
 */
export const PLACEMENT_FAILURE_REASONS = [
  "busy",
  "settling",
  "record-deleted",
  "guard-failed",
  "library-missing",
  "library-id-unknown",
  "schedule-endpoint",
  "schedule-rejected",
  "needs-reauth",
  "deadline-before-send",
  "library-push-failed",
  "no-export-route",
  "placement-interrupted",
  /** Pace zone targets the profile cannot resolve to ranges: no zones
      and no threshold pace, a referenced zone undefined, or a sport
      without pace zones (`PaceZonesUnavailableReason`). */
  "missing-pace-zones",
  "incomplete-pace-zones",
  "unsupported-pace-zone-sport",
] as const;
export type PlacementFailureReason = (typeof PLACEMENT_FAILURE_REASONS)[number];

export type LibraryOnlyReason =
  "insecure-context" | "unsupported-browser" | "bridge-outdated";

export type PlacementResult =
  | { kind: "scheduled" }
  | { kind: "moved" }
  | { kind: "unchanged" }
  /** `dates`: where the entries left behind sit, for the UI. */
  | { kind: "duplicate-left"; dates: string[] }
  /** `canConfirm`: "It's in Garmin" is offered; `sendAfter`: the gate. */
  | { kind: "uncertain"; date: string; canConfirm: boolean; sendAfter?: number }
  | { kind: "library-only"; reason: LibraryOnlyReason }
  | {
      kind: "failed";
      reason: PlacementFailureReason;
      retryable: boolean;
      retryAfter?: number;
      /** `record-deleted` only: an entry may remain in Garmin on it. */
      date?: string;
    };

export type PlacementResultKind = PlacementResult["kind"];

export const failed = (
  reason: PlacementFailureReason,
  retryable: boolean,
  extra: { retryAfter?: number; date?: string } = {}
): PlacementResult => ({ kind: "failed", reason, retryable, ...extra });

/** A workout deleted mid-run: the delete wins, nothing is recreated. */
export const recordDeleted = (date?: string): PlacementResult =>
  failed("record-deleted", false, date ? { date } : {});

/** Absence inside the POST gate: no POST until `retryAfter`. */
export const settling = (retryAfter: number): PlacementResult =>
  failed("settling", true, { retryAfter });

/** `garmin-synced` success (design §3.8): neither `failed` nor `uncertain`. */
export const isPlacementSent = (result: PlacementResult): boolean =>
  result.kind !== "failed" && result.kind !== "uncertain";
