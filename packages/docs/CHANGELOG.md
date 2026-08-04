# @kaiord/docs

## 0.0.3

### Patch Changes

- 8defa1c: Add a "Convert" section to the docs site with a hub and six long-tail
  "how to convert X to Y" pages (FIT↔ZWO, FIT↔TCX, ZWO↔Garmin). Each page
  covers the Editor, CLI, and SDK paths plus a grounded "what survives the
  conversion" table and per-pair gotchas. Link the hub from the sidebar, top
  nav, and the landing `llms.txt`.
- 9dd3625: Add the wave-2 long-tail converter pages to the docs site: the remaining six
  directed pairs (FIT↔Garmin, TCX↔ZWO, TCX↔Garmin). Each page covers the Editor,
  CLI, and SDK paths plus a grounded "what survives the conversion" table and
  per-pair gotchas. Every cell in the hub's conversion matrix is now a guided
  walkthrough, and the six new pages are linked from the sidebar.
- 42f3228: Emit `rel=canonical` on every docs page and align TechArticle URLs with the
  clean URLs actually served. Each docs page is reachable under three variants
  (clean, `.html`, and the `.md` LLM mirror); without a canonical, search
  engines pick arbitrarily across ~330 pages.
- a1ef519: Fix the docs theme-color helper reading the light `:root` value instead of
  the dark palette: `extractDarkBlock` matched a `.dark { … }` reference inside
  a comment (capturing an ellipsis) rather than the real `.dark` rule, so it
  silently fell back to `:root`. Anchor the selector to the start of a line.
  The brand-tokens tests (which pin the dark-first theme-color) pass again.

## 0.0.2

### Patch Changes

- 36efe53: Enable VitePress `cleanUrls` so canonical docs URLs are extensionless
  (better for search-engine and AI-agent citations; the `.html` files are
  still emitted, so existing links keep working), and fix the docs sitemap
  to include the `/docs/` base — VitePress does not prepend `base` to
  sitemap entries, so every URL pointed at the site root
  (`kaiord.com/CHANGELOG` instead of `kaiord.com/docs/CHANGELOG`).
- 7764f5d: Refresh the docs and editor OG images to match the platform brand: add the ambient radial glow and a sky-accented subtitle. The editor now ships its own OG card (og-image-editor.png, subtitle "Editor") instead of reusing the landing image, with its meta tags repointed accordingly. Both are reproducible via each package's generate-og-image.mjs script.

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
