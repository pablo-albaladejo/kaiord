/**
 * Coaching transport port — application-layer abstraction over a
 * platform-specific extension transport (Train2Go today, future others).
 *
 * Implementations (adapters) wrap `chrome.runtime.sendMessage` and map
 * platform-specific wire shapes to `CoachingActivityRecord` BEFORE
 * crossing this port. Use cases consume only the port — they never see
 * `Train2GoActivity` or any other platform-specific shape.
 *
 * `userId` and any platform ids carried inside `CoachingActivityRecord`
 * MUST be stringified at the JSON parse boundary inside the adapter
 * (never `String(parsedNumber)` after the fact, which is lossy for ids
 * above Number.MAX_SAFE_INTEGER).
 */

import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { ZonesPayload } from "../../types/coaching-zones";

export type CoachingPingResult = {
  sessionActive: boolean;
  externalUserId: string | null;
  externalUserName: string | null;
};

export type CoachingTransport = {
  /** Platform identifier emitted on every record this transport produces. */
  source: string;
  /** Verifies session and returns identifying info during the connect flow. */
  ping: (signal?: AbortSignal) => Promise<CoachingPingResult>;
  /** Opens the platform's authenticated tab (e.g., app.train2go.com). */
  openExternal: () => Promise<void>;
  /**
   * Fetches the week's activities for the given external user.
   * `weekStart` is YYYY-MM-DD (ISO Monday). Returns activities already
   * mapped to CoachingActivityRecord (with `profileId` filled by the
   * adapter from the use-case-supplied profileId argument).
   */
  readWeek: (
    profileId: string,
    weekStart: string,
    externalUserId: string
  ) => Promise<CoachingActivityRecord[]>;
  /**
   * Fetches a single day's activities (typically returns every activity
   * for that day, including siblings of the clicked one). Used by
   * `expandDay` to populate descriptions.
   */
  readDay: (
    profileId: string,
    date: string,
    externalUserId: string
  ) => Promise<CoachingActivityRecord[]>;
  /**
   * Fetches the user's training thresholds and physiological values.
   * Optional: only Train2Go implements it today; Garmin (when present)
   * leaves it unset. The `syncZones` use case checks for presence and
   * short-circuits with `{ ok: false, reason: "unsupported" }` when
   * absent. Returns `null` when the platform has nothing to share for
   * this user (e.g., session expired silently).
   */
  readZones?: (
    externalUserId: string,
    signal?: AbortSignal
  ) => Promise<ZonesPayload | null>;
};
