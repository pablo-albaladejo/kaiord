# @kaiord/docs

## 0.0.1

### Patch Changes

- a2888cf: Close eight spec-vs-code drift gaps identified by the 2026-04-20
  `/opsx-sync` audit. No public API breaks; the SPA changes are
  internal to `@kaiord/workout-spa-editor` and ship behind a Dexie
  v2+v3 schema bump with additive, backwards-compatible migrations.

  **`@kaiord/workout-spa-editor` (minor — new UI affordances, new
  Dexie stores, additive schema):**
  - Surface a storage-unavailable banner when `probeStorage()` reports
    failure ("Storage unavailable — changes in this session won't be
    saved"). Wired through a new `storage-store` + single-mount
    invariant in `MainLayout`.
  - Introduce `BridgeStatus = "verified" | "unavailable" | "removed"`.
    Pruning now transitions `unavailable → removed` after 24h (with a
    user notification) and deletes the row 24h after that. Registry
    persists to a new `bridges` Dexie store so the lifecycle timers
    survive browser restarts.
  - Pin the Train2Go 30s detection cache behavior (never-detected,
    cached-and-stale, cached-not-installed, no-rolling-window).
  - Advance `modifiedAt` on every KRD edit via a new
    `onWorkoutMutation` helper wired into the editor save path — edits
    in STRUCTURED/READY now bump the timestamp, not only the legacy
    PUSHED→MODIFIED transition.
  - Enrich `BatchProgress` with `counts` and per-workout `byId` so the
    calendar batch-progress panel can render per-workout status.
  - Split `UsageRecord.totalTokens` into `inputTokens` / `outputTokens`
    (derived `totalTokens` retained for legacy readers, Zod `.refine`
    pins the invariant). Dexie v3 migration backfills legacy rows
    (`inputTokens = totalTokens`, `outputTokens = 0`, `legacy: true`);
    the usage-panel renderer shows `—` for `outputTokens` on legacy
    rows.

  **`@kaiord/docs` (patch — head meta tag + token-parsing helper):**
  - Add `<meta name="theme-color">` to the VitePress docs head. Value
    is parsed at config-load time from `--brand-bg-primary` in
    `styles/brand-tokens.css`; CI invariant blocks re-introducing a
    hex literal under `packages/docs/`.

  **Repo-level** (not a publishable-package bump, called out here for
  the release log):
  - `.changeset/config.json` adds `@kaiord/garmin-bridge` and
    `@kaiord/train2go-bridge` to `linked[0]` so bridge extensions
    version in lockstep; guarded by `scripts/check-changeset-config.test.mjs`.
