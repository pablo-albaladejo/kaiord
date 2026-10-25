## Context

The editor deploys to GitHub Pages at `/app/`, alongside the landing page (`/`)
and the docs (`/docs/`). Routing uses the hash (#1157), so every in-app URL
resolves to a single request for `/app/` (that is, `index.html`). Vite emits
content-hashed chunks. A deploy replaces the whole tree, and Pages stops
serving the previous hashes.

Measured on `main` 489313464 (`VITE_BASE_PATH=/app/ vite build`):

| Set                                                                           | Files | Raw     | Over the wire                   |
| ----------------------------------------------------------------------------- | ----- | ------- | ------------------------------- |
| `.js`                                                                         | 245   | 3.24 MB | 0.97 MB gz                      |
| `.css`                                                                        | 2     | 85 KB   | 17 KB gz                        |
| `.map`                                                                        | 241   | 13.8 MB | none (never requested by users) |
| Precache set: all of the above except maps, plus shell, manifest, icons, font | 256   | 3.41 MB | **≈1.06 MB**                    |
| What the shell loads up front (`index.html` script + modulepreload + css)     | 58    | none    | 310 KB gz                       |

The largest single file is `kaiord-fit-*.js` at 476 KB, under any per-file cap.

Two deploy steps rewrite `app/index.html` after `vite build` has finished:
"Substitute analytics website id" (`sed` on `dist/index.html`) and "Inject SPA
route fallback" (`inject-spa-fallback.mjs`, which adds the `?p=` decoder to
`<head>`). Any precache manifest computed during `vite build` therefore records
a revision for a file that is not the one that ships.

## Goals / Non-Goals

**Goals:** the installed app and returning visitors start with no network and
run every feature that needs none. A deploy never leaves a client on a shell
whose chunks are gone. An update never discards work without the user asking
for it. Production can turn the worker off without a code change.

**Non-Goals:** offline sync with bridges or AI (they stay network-only),
background sync, push, and caching anything outside `/app/`. Opening and
sharing files into the app (`share_target`, `file_handlers`) is the next
change, `add-spa-file-share-handlers`.

## Decisions

### D1. Precache the entire build of one deploy; runtime-cache nothing same-origin

**Claim checked.** "A precache keyed to the build, holding every hashed chunk
of that version, keeps an old client consistent until it updates." This holds
under three conditions:

1. **The shell and its chunks come from the same cache.** The worker answers
   navigations with the cached `index.html` from the same versioned cache that
   holds the chunks it references, so the shell is never fresher than its
   chunks.
2. **Every chunk the shell can reach is in that cache.** That includes
   lazy-only chunks that no route has requested yet. This is why the
   precache takes everything and runtime caching (stale-while-revalidate,
   cache-on-first-use) is rejected. A chunk cached only on first use goes
   missing as soon as a deploy removes it from Pages, which is exactly the
   #1566 failure. The generator includes every file under `assets/`, and the
   guard (D6) fails if one is missing.
3. **The cache survives until no client runs it.** A waiting worker does not
   touch the active cache. The active worker's `activate` deletes only
   versions older than the previous one, so it keeps N and N-1 (see D2 for
   why N-1 matters).

**Excluded:** `*.map` (13.8 MB, devtools only), `version.json` (it must always
reflect the live deploy), `AGENTS.md`, `.nojekyll`, and `og-image-editor.png`
(read by crawlers, never by the app). These pass through to the network.

**Cost:** about 1.06 MB once per deploy, downloaded in the background after
first paint. A first visit already pays 310 KB of it. 3.4 MB of storage is far
below the Cache Storage quotas of Chromium, Firefox and Safari. Safari can
still evict the storage of a non-installed site that has gone unused; the
worker then reinstalls from the network on the next online visit.

**Cache key.** The cache name is `kaiord-app-<v>`, where `<v>` is the first 12
hex digits of the SHA-256 over the sorted `url revision` lines. Each
revision is the SHA-256 of the file's shipped bytes. `<v>` is embedded in
`sw.js`, so every deploy that changes any shipped byte changes `sw.js`
byte-wise, which is what makes the browser install a new worker.

### D2. Update strategy: prompt, never auto-reload (the proposed default, kept)

Kept as proposed, for three reasons.

- **Unsaved work is real.** The editor keeps an in-progress workout in the
  Zustand `workout-store`, and `use-confirm-discard-edits.ts` already exists
  to guard it. A silent `skipWaiting` plus reload, or an auto-reload on
  `controllerchange`, would bypass that guard.
- **Nothing forces an update.** Under D1 the old version stays fully
  consistent, so there is no correctness pressure to switch.
- **The alternative is no better.** "Activate on next cold start", which is
  the browser default with no `skipWaiting`, still applies. The toast is just
  a faster path: if a user never clicks it, closing every window of the app
  activates the new worker on the next launch.

**Flow.**

1. `registration.waiting` exists at registration time, or an `installed`
   state arrives while a controller already exists.
2. The app shows a persistent toast: "New version available" with a "Reload"
   action, plus "Nueva versión disponible · Recargar" in `es`. It never
   auto-dismisses.
3. On click, the page posts `{type: "SKIP_WAITING"}` to the waiting worker.
4. On `controllerchange`, that tab alone calls `location.reload()`. A
   module-level flag is set by the click, and only a tab with it set reloads.
5. If the editor has unsaved edits, the click first goes through the same
   confirmation that discarding edits already uses.

**Other tabs.** They receive `controllerchange` but do not reload. They keep
running version N-1, whose cache the new worker keeps (D1.3). From then on
their navigations and imports are answered by the new worker. Its fetch
handler looks up the request in **every** `kaiord-app-*` cache
(`caches.match`), so old chunks still resolve.

**Update checks.** The browser checks `sw.js` on each navigation, at most
every 24 h, bypassing the HTTP cache (`updateViaCache` defaults to
`"imports"`). An installed app can stay open for days, so the page also calls
`registration.update()` on `visibilitychange` to visible, at most once an
hour.

### D3. Coexisting with chunk-reload recovery: the worker is the first line, recovery is the backstop

Existing code:

- `src/lib/chunk-reload.ts`: `isChunkLoadError` plus `reloadOnceForChunkError`.
  The loop guard is a one-shot reload with a 10 s sessionStorage cooldown and
  an in-memory flag, and it is skipped during a leave.
- Its callers are `main.tsx` (`vite:preloadError`, prevented),
  `RouteErrorBoundary.tsx` (render-time chunk errors), and `lazyImport`
  (`lib/lazy-import.ts`, which turns an `undefined` module into a
  chunk-pattern error).

Interaction:

- **Controlled client.** Every chunk the client can reach is in the cache
  (D1.2), so `vite:preloadError` cannot fire for a stale hash, whether
  online or offline. The recovery stays dormant.
- **A reload while a new worker is waiting.** It is still served by the old
  active worker, so the shell and chunks are version N-1 and consistent. No
  loop. This is why the existing reload is safe to keep.
- **Uncontrolled client.** This covers a first visit before `activate`, a
  hard reload (shift-reload bypasses the worker), and a browser that has
  service workers disabled. Behaviour is exactly as today: recovery reloads
  once, and the cooldown stops a loop.
- **Two-versions-back tab.** A tab still on N-2 after two deploys has had its
  cache deleted. A lazy import 404s, recovery reloads once, and the tab is
  now on the newest version. That reload is unprompted, but it is today's
  behaviour, and only after two deploys while the tab stayed open.
- **Offline plus uncontrolled.** The chunk fetch fails, recovery reloads
  once, the reload fails, and the cooldown hands over to the route boundary.
  This is unchanged.

**Who wins.** The worker decides what is served. Recovery is never disabled
and never called by the worker. They cannot fight, because recovery only acts
on a failed import, and under a worker that only happens in the
uncontrolled or N-2 cases above, where a reload is the right answer.

### D4. Scope `/app/`, production only

- **The file.** It lives at `app/sw.js`. The maximum scope is the script's
  directory, so `/app/` is enforced by the browser and not just by an option.
  It is registered with `{scope: import.meta.env.BASE_URL}`.
- **What the fetch handler intercepts.** Only same-origin GET requests whose
  path starts with the scope. Of those, it answers precached URLs and
  navigations; everything else falls through to the network with no
  `respondWith`. The landing and the docs live outside the scope and are
  never controlled.
- **When registration runs.** Only when `import.meta.env.PROD` is set and
  `"serviceWorker" in navigator`, from `main.tsx` after the first render.
  `vite dev` never registers a worker. A local `vite build` plus
  `vite preview` serves no `sw.js` (the generator runs in assembly, not in
  `vite build`). The registration then rejects with a 404, and the rejection
  is caught and swallowed with no console noise or toast.

### D5. Tests

- **Unit (vitest).**
  - The registration module: it registers only when PROD, uses the base
    scope, wires the waiting and installed paths to the toast callback, and
    on click posts `SKIP_WAITING` then reloads once on `controllerchange`.
    Uses a fake `navigator.serviceWorker`.
  - The toast copy in en and es.
- **Generator plus guard (`node:test`).** Fixture trees covering an empty
  `assets/`, a missing file, a `.map`, and a shell rewritten after
  generation.
- **Playwright.**
  - The global `use` gets `serviceWorkers: "block"`. That covers every
    existing spec, including the `E2E_PROD_BASE` specs, which serve a real
    build through `merged-dist-server`.
  - One new spec, `e2e/offline-service-worker.spec.ts`, opts back in with
    `test.use({ serviceWorkers: "allow" })` and runs only on chromium.
    Playwright documents service-worker support as Chromium-only. The spec:
    1. serves the merged tree with the generator applied;
    2. waits for `navigator.serviceWorker.ready`;
    3. calls `context.setOffline(true)`;
    4. reloads and asserts the editor renders and that a lazy route (one
       never visited online) opens.
    5. A second case regenerates a changed tree (v2) and asserts that the
       toast appears and that nothing reloads until the click.
  - The mobile projects only run on `main`, so the full mobile set is run
    locally before the PR, and that run is reported.

### D6. Dist guard: no green on empty

The guard is `packages/workout-spa-editor/scripts/dist-service-worker.test.mjs`.
It is gated like the manifest guard (`REQUIRE_SPA_DIST`, `SPA_DIST`,
`SPA_BASE`) and asserts that:

- `sw.js` exists at the dist root, and its embedded scope equals `SPA_BASE`.
- The manifest it embeds is non-empty and lists **every** file under
  `assets/` except `.map`. It does that as set equality with the directory,
  not a count threshold, so a dropped chunk fails.
- Every listed URL exists on disk, and each revision equals the SHA-256 of
  the bytes on disk. This catches any step that rewrites `index.html` after
  generation.
- No `.map`, `version.json` or `AGENTS.md` is listed.
- `index.html` is listed, as are the icons the web manifest names.

It runs in `deploy-site.yml` right after the generator, over
`merged-dist/app`, and in the CI `build` job's site guards.

### D7. Tooling: a hand-written worker plus a generator script, with no new dependency

- **`vite-plugin-pwa` (generateSW or injectManifest).** Rejected. It computes
  the manifest inside `vite build`, before two deploy steps rewrite
  `index.html`, so the shell revision would be wrong on every deploy where
  only the injected content changes. Its update API
  (`virtual:pwa-register`, `registerType: "prompt"`, `onNeedRefresh` and
  `updateSW()`) is the same flow as D2. It also brings `workbox-window` into
  the page and the workbox runtime into the worker.
- **`workbox-build` injectManifest run post-assembly.** This fixes the
  timing. But injectManifest "does not compile or bundle `swSrc`" (Workbox
  docs), so using `workbox-precaching` in the worker would need a separate
  bundling step for one file. The default `maximumFileSizeToCacheInBytes` of
  2 MB is a silent-skip footgun, though no file reaches it today.
- **Hand-written.** About 60 lines of worker
  (install/activate/fetch/message) and about 60 lines of generator (walk,
  hash, emit). Zero dependencies, nothing added to the page bundle beyond the
  registration module (well under 1 KB), and full control over the D1 and D2
  details. Workbox's revision-based precaching and outdated-cache cleanup are
  the only parts we would use, and both are a few lines here. Chosen.

The worker source lives at `packages/workout-spa-editor/sw/sw.js` as plain
ES2020, outside `src/` so Vite never bundles it. The generator
`scripts/emit-spa-service-worker.mjs` substitutes the manifest and `<v>` into
it.

### D8. Kill switch

Pages cannot send `Clear-Site-Data`, so the switch is a worker.

- **The switch.** `emit-spa-service-worker.mjs --kill` writes a `sw.js` that,
  on `install`, calls `skipWaiting()`. On `activate` it deletes every
  `kaiord-app-*` cache, unregisters itself, and calls `client.navigate()` on
  each open window so it reloads unworkered.
- **Why it reaches every client.** The browser fetches `sw.js` past the HTTP
  cache on navigation and on the hourly `update()`, so even a client whose
  shell is broken picks up the kill switch. The one invariant this relies on
  is that **`sw.js` is never renamed.**
- **Turning it on.** `deploy-site.yml` passes `--kill` when the repository
  variable `SPA_SW_KILL_SWITCH` is `"1"`. Pablo sets it with `gh variable
set` (repo-settings class, never an agent), then re-runs the deploy or
  pushes. The page's registration code stays unchanged: it re-registers the
  kill worker, which unregisters again. That is harmless, and the guard
  asserts the killed `sw.js` has no fetch handler.
- **Turning it off.** Unset the variable and deploy. Clients install the
  normal worker on their next visit.
- **The runbook.** `docs/runbooks/spa-service-worker.md`, linked from the
  workflow step (per `docs/runbooks/AGENTS.md`). It covers symptoms, the
  switch, how to verify that `/app/sw.js` serves the kill body, how long it
  takes (next navigation, or about an hour for a long-open app), rollback,
  and the manual per-device fallback (site settings → clear data).

## Risks / Trade-offs

- **A bad worker is sticky.** That is the reason D8 exists and `sw.js` is
  never renamed.
- **Users see an older version for longer.** A user who ignores the toast
  stays on version N. That is intentional (D2), and closing the app picks up
  the update.
- **A shift-reload bypasses the worker.** It then behaves like today, with
  recovery as the backstop (D3).
- **The worker is not bundled.** It is hand-written ES2020, kept minimal and
  covered by the e2e plus the guard; vitest does not cover the worker
  itself.

## Open Questions

- **The reload confirmation when edits are unsaved (D2.5).** It reuses
  `use-confirm-discard-edits`. If wiring that guard into a global toast
  needs more than a store read, the fallback is to block the click with a
  toast asking the user to save first.
