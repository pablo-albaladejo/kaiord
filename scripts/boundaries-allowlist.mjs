/**
 * Shrink-only allowlist for `boundaries/dependencies` in @kaiord/workout-spa-editor.
 *
 * Every entry is a file that imported `src/adapters/**` from a higher layer at
 * the moment the guard was repaired (the rule had been silently vacuous, so the
 * debt accumulated unchecked). Entries may be REMOVED once the underlying
 * import is gone; entries may never be ADDED — `scripts/check-boundaries-
 * allowlist.mjs` fails the build on growth, on a stale entry, and on any entry
 * lacking a reason.
 *
 * Do not add a file here to make a new violation go green. Fix the import.
 */

/** Reasons shared by whole buckets of entries, so the split stays legible. */
const REASON = {
  // Bucket A — 4 files.
  T2G_SPORT:
    "application/ calls resolveT2GSport() from adapters/train2go. The map is a " +
    "correct anti-corruption translation (Train2Go vocabulary -> KRD sport), so the " +
    "adapter file is where it belongs; the fix is to invert the call so the adapter " +
    "resolves sport and hands the application already-KRD values. That reshapes the " +
    "coaching-conversion call chain across 4 files and is a behaviour-bearing redesign.",

  // Bucket B — 17 files.
  LIVE_QUERY:
    "Page-scoped hook colocated under components/ that opens a Dexie `useLiveQuery` " +
    "against the `db` singleton. This is the pattern CLAUDE.md documents ('Dexie + " +
    "useLiveQuery for all persisted data, one query per page'), so the guard and the " +
    "written architecture currently disagree. Needs an explicit decision: either " +
    "reclassify colocated `use-*` hooks as spa-hooks, or introduce a port/repository " +
    "indirection for every live query.",

  // Bucket C — 4 files.
  COMPOSITION_ROOT:
    "Component-layer file constructs adapter repositories itself " +
    "(createDexie*Repository / createDexiePersistence), duplicating composition-root " +
    "work that src/hooks/ already owns for 12+ other repositories. Mechanically " +
    "fixable by the same extraction used for hooks/integration-policy-repo.ts, but " +
    "each site wires different repos into a bespoke use-case call, so it is not a " +
    "single safe sweep.",

  // Bucket D — 2 files.
  ADAPTER_EXPORTS_UI:
    "Imports a React hook / converter that lives in adapters/train2go but is really " +
    "presentation-adjacent. The honest fix is to move the imported module out of " +
    "adapters/, which changes the adapter package's public surface.",

  // Bucket E — 1 file.
  BRIDGE_TRANSPORT:
    "Imports bridge discovery + transport directly to drive the WHOOP import flow. " +
    "There is no port for bridge transport yet; introducing one is a design task.",
};

/** @type {ReadonlyArray<{ file: string, reason: string }>} */
export const BOUNDARIES_ALLOWLIST = Object.freeze(
  [
    // --- A: application/ -> adapters/train2go ---
    ["src/application/coaching/build-coaching-draft-krd.ts", REASON.T2G_SPORT],
    [
      "src/application/coaching/convert-coaching-activity-manual-helpers.ts",
      REASON.T2G_SPORT,
    ],
    [
      "src/application/coaching/convert-coaching-activity-with-ai-helpers.ts",
      REASON.T2G_SPORT,
    ],
    [
      "src/application/coaching/convert-coaching-activity-with-ai-idempotency.ts",
      REASON.T2G_SPORT,
    ],

    // --- B: colocated page hooks using the Dexie `db` singleton ---
    [
      "src/components/molecules/CoachingCard/use-coaching-day-comments.ts",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/molecules/CoachingCard/use-coaching-dialog-state.ts",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/molecules/GarminPushButton/GarminPushButton.tsx",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/organisms/CoachingSidebar/use-coaching-sidebar.ts",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/pages/CreateWorkout/use-save-and-push.ts",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/pages/Daily/use-today-workouts-live.ts",
      REASON.LIVE_QUERY,
    ],
    [
      "src/components/pages/WorkoutDetail/use-workout-detail-record.ts",
      REASON.LIVE_QUERY,
    ],
    ["src/components/pages/batch-process-one.ts", REASON.LIVE_QUERY],
    ["src/components/pages/calendar-hooks.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-batch-runner.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-batch-state.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-calendar-live-queries.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-coaching-draft.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-dialog-handlers.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-editor-actions.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-schedule-template.ts", REASON.LIVE_QUERY],
    ["src/components/pages/use-workout-record.ts", REASON.LIVE_QUERY],

    // --- C: component layer acting as composition root ---
    ["src/components/pages/batch-prepare.ts", REASON.COMPOSITION_ROOT],
    [
      "src/components/pages/calendar-dnd/use-grid-reschedule.ts",
      REASON.COMPOSITION_ROOT,
    ],
    [
      "src/components/pages/health/labs/dashboard/use-lab-dashboard-params.ts",
      REASON.COMPOSITION_ROOT,
    ],
    [
      "src/components/pages/health/labs/use-lab-import.ts",
      REASON.COMPOSITION_ROOT,
    ],

    // --- D: adapter module that is really UI-adjacent ---
    [
      "src/components/organisms/CoachingSidebar/CoachingSidebar.tsx",
      REASON.ADAPTER_EXPORTS_UI,
    ],
    [
      "src/components/organisms/ProfileManager/components/use-linked-account-row.ts",
      REASON.ADAPTER_EXPORTS_UI,
    ],

    // --- E: bridge transport with no port yet ---
    [
      "src/components/pages/health/labs/use-whoop-lab-import.ts",
      REASON.BRIDGE_TRANSPORT,
    ],
  ]
    .map(([file, reason]) => Object.freeze({ file, reason }))
    .sort((a, b) => a.file.localeCompare(b.file))
);

/** Package root the allowlist paths are relative to, from the repo root. */
export const ALLOWLIST_PACKAGE_ROOT = "packages/workout-spa-editor";

/**
 * High-water mark. The allowlist may shrink below this, never grow past it.
 * Lower this number whenever entries are removed so the ratchet keeps tightening.
 */
export const BOUNDARIES_ALLOWLIST_MAX = 28;

/** Repo-root-relative globs, for `ignores` in eslint.config.js. */
export const boundariesAllowlistPaths = () =>
  BOUNDARIES_ALLOWLIST.map((e) => `${ALLOWLIST_PACKAGE_ROOT}/${e.file}`);
