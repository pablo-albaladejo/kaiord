/**
 * Bridges that actually handle `profile-snapshot` / `profile-snapshot-clear`.
 *
 * Snapshot vendoring is deliberately limited to these two — see
 * `openspec/specs/bridge-core/spec.md` and the `SNAPSHOT_BRIDGES` list in
 * `scripts/sync-bridge-core.mjs`, which is the sync script's own copy of this
 * same set (a parity test keeps the two honest). Pushing a snapshot at any
 * other discovered bridge just burns its rate-limit budget on an action it
 * has no handler for.
 */
export const SNAPSHOT_CAPABLE_BRIDGE_IDS: readonly string[] = [
  "garmin-bridge",
  "train2go-bridge",
];
