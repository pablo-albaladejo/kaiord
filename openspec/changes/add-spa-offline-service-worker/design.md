## Context

The editor is served from GitHub Pages at `/app/`. The landing page (`/`) and the docs (`/docs/`) sit next to it. Routing lives in the hash fragment (#1157), so every in-app URL resolves to one request for `/app/`, which is `index.html`. Vite emits content-hashed chunks. A deploy replaces the whole tree, and once it lands Pages no longer serves the previous hashes. Pages answers every file with `Cache-Control: max-age=600`, and its CDN edge caches them for the same 10 minutes.

Measured on `main` 489313464 (`VITE_BASE_PATH=/app/ vite build`):

| Set                                                                           | Files | Raw     | Over the wire                |
| ----------------------------------------------------------------------------- | ----- | ------- | ---------------------------- |
| `.js`                                                                         | 245   | 3.24 MB | 0.97 MB gz                   |
| `.css`                                                                        | 2     | 85 KB   | 17 KB gz                     |
| `.map`                                                                        | 241   | 13.8 MB | — (never requested by users) |
| Precache set: everything above except maps, plus shell, manifest, icons, font | 256   | 3.41 MB | **≈1.06 MB**                 |
| What the shell loads up front (`index.html` script + modulepreload + css)     | 58    | —       | 310 KB gz                    |

The largest single file is `kaiord-fit-*.js` at 476 KB.

Two deploy steps rewrite `app/index.html` after `vite build` has finished:

- "Substitute analytics website id", a `sed` over `dist/index.html`.
- "Inject SPA route fallback", `inject-spa-fallback.mjs`, which puts the `?p=` decoder into `<head>`.

A precache manifest computed inside `vite build` would therefore record a revision for a shell that is not the one that ships. CI is worse off still. Its `build` job builds the SPA with base `/` and runs none of the merge, sed or inject steps, so a guard over that tree cannot see the deploy's shape.

## Goals / Non-Goals

**Goals:**

- The installed app and returning visitors start with no network and run every feature that does not need one.
- A deploy never leaves a client on a shell whose chunks are gone.
- An update never discards unsaved work.
- Old code never touches a database that newer code has upgraded.
- Production can turn the worker off without a code change.

**Non-Goals:**

- Offline bridge sync and offline AI. Both stay network-only.
- Background sync and push.
- Caching anything outside `/app/`.
- `share_target` and `file_handlers`. These belong to the next change, `add-spa-file-share-handlers`.

## Decisions

### D1. Precache one deploy's whole build, verified byte for byte

**Checking the claim.** The claim is that a precache keyed to the build, holding every hashed chunk of that version, keeps an old client consistent until it updates. It holds only if all four of these are true:

1. **The shell and its chunks come from one consistent set.** Navigations are answered with the cached shell of the active worker's version, and that cache holds every chunk the shell references.
2. **Every reachable chunk is in that set, lazy ones included.** So the precache takes everything, and same-origin runtime caching is rejected. A chunk cached on first use goes missing the moment a deploy removes it from Pages, and that is the #1566 failure. The guard enforces set equality with `assets/` (D6).
3. **The bytes in cache N are N's bytes.** This does not hold by default. Install fetches go through the HTTP cache, and Pages sets `max-age=600`. An install that runs within 10 minutes of a visit could store N-1's `index.html` under N's name: a stale shell inside a cache that looks fresh. Three measures close this:
   - every install fetch uses `{cache: "reload"}`, which bypasses the browser's HTTP cache;
   - URLs that are not content-hashed (`index.html`, `manifest.webmanifest`, the icons, the font) are fetched and stored as `<url>?__rev=<revision>`. That gives each revision its own Cache Storage key, which D2's copy-forward relies on. It does **not** bust the CDN edge. I measured this on prod on 2026-10-25: three fresh random queries on `/app/apple-touch-icon.png?q=<random>` came back `MISS`, then `HIT`, then `HIT`, so Fastly drops the query from its cache key. For up to 10 minutes after a deploy, the edge can still serve N-1's bytes for any URL;
   - every response is digested with `crypto.subtle.digest("SHA-256", …)` and compared with its manifest revision. **Any mismatch fails the whole install.** This check is what actually guarantees the bytes, because no request option reaches past the edge. The browser keeps the current worker and tries again on the next update check (D4), so an edge that is still serving N-1 delays the update by at most ≈10 minutes and never produces a mixed cache.
4. **A cache lives as long as any client runs it.** See D3.

**Excluded, and passed through to the network:**

- `*.map`, which only devtools read.
- `version.json`, which must always reflect the live deploy.
- `AGENTS.md` and `.nojekyll`.
- `og-image-editor.png`, which crawlers read and the app never does.

**Naming.**

- Each revision is the SHA-256 (hex) of the file's shipped bytes.
- `<v>` is the first 12 hex digits of the SHA-256 over the sorted `url revision` lines.
- The cache is named `kaiord-app-<v>`.
- `<v>` and the manifest are embedded in `sw.js`, so any changed shipped byte changes `sw.js` and triggers a browser update.

### D2. Per-deploy cost: copy forward what is unchanged, register late, respect Save-Data

**Copy forward.** Install does not re-download unchanged files. For each manifest entry it looks up the same request key (a hashed URL, or `url?__rev=<revision>`) in the existing `kaiord-app-*` caches. If it finds one, it digests the stored body against the revision and copies it into the new cache. Only misses and mismatches go to the network.

- Vendor chunks (`vendor-ui`, `vendor-zod`, `kaiord-fit`, `kaiord-tcx`, …) change only when a dependency is bumped.
- A typical feature deploy re-downloads the touched route chunks, the entry and the shell, not 1.06 MB.

**Registration timing.**

- Registration waits for the `load` event and then for `requestIdleCallback`, so it never competes with first paint.
- Safari does not implement `requestIdleCallback`, so it gets a `setTimeout` of 2 s.
- It is skipped entirely when `navigator.connection?.saveData` is true.

**What a first visit costs.** It already pays 310 KB. The remaining ≈750 KB downloads in the background, once.

### D3. Retention: delete a version only when no live client runs it

The reviewer's objection to the earlier "keep N and N-1" rule is correct. A waiting worker can be replaced, and an installed window can stay open across two deploys. Once its cache is deleted, its next lazy import 404s, and chunk-reload reloads it without asking. Two replacements were weighed.

- **(a) Keep your own cache plus the outgoing active worker's, recorded in a meta entry.** Rejected. It is still keyed to workers, not to clients, so a window two activations behind loses its cache.
- **(b) Clients report the version they run. Chosen.** Retention then follows the thing that can break, which is a live page. It costs one message per page load and a few bytes of meta.

Mechanism:

1. **Hello.** At boot the page posts `{type: "HELLO", entry: <URL of its own index-*.js module script>}` to `navigator.serviceWorker.controller`. The entry URL is unique to a build, and the page can read it from its own DOM, so the page needs no version constant.
2. **Recording.** The worker finds every `kaiord-app-*` cache that holds that entry. Usually there is one. A shell-only deploy, such as an analytics-id change, shares the entry, and then all matches are kept. It records `event.source.id → [v…]` in a JSON entry of cache `kaiord-app-meta`.
3. **Pruning.** Pruning runs on `activate` and after each hello:
   - `live` is the set of ids from `clients.matchAll({type: "window", includeUncontrolled: true})`;
   - `keep` is `{own v} ∪ versions recorded for live ids`;
   - every `kaiord-app-*` cache not in `keep` is deleted, and the records of dead ids are dropped.
4. **Serialisation.** Meta writes and prunes run through one promise chain inside the worker. Events in a single worker run concurrently, and a lost write would let a live version be pruned.
5. **Lookup.** The fetch handler looks up its own cache first and then every `kaiord-app-*` cache, so a page on an older retained version still resolves its chunks.

**What is not covered.** A page that never had a controller (a first visit, a shift-reload) sends no hello and is unprotected. Its chunks come from the network, as they do today, and chunk-reload remains the backstop (D5). Storage is bounded by the number of distinct versions among open windows.

### D4. Updates: a prompt, never an automatic reload, and gated before activation

**How a waiting worker is detected.** There are two signals:

- `registration.waiting` is already set at registration time;
- `updatefound`, followed by `installed`, fires while a controller exists.

**When an update is found.**

1. **Silent apply on a cold start.** If the update is found within 10 s of load and before the first `pointerdown` or `keydown`, and the unsaved flag is clear, it is applied with no toast. This is accepted per the review: no input means there is nothing to lose.
2. **Otherwise, a persistent toast.** It reads "New version available" with a "Reload" action, and in Spanish "Nueva versión disponible · Recargar". It never auto-dismisses.

**On click, in this order. The gate always comes before `SKIP_WAITING`, never after it.**

1. **Unsaved edits block the update.** If the module-level unsaved flag is set, the click shows "Save your changes to update" ("Guarda los cambios para actualizar") and stops. Nothing is posted to the worker. The flag lives in `lib/unsaved-edits.ts`. It is written by the same effect that arms `beforeunload` in `use-editor-save.ts` (`useBeforeUnloadGuard(armed)`), so the two can never disagree. There is no discard confirmation; this is the team-lead's decision. The editor has no autosave: `isDirty` lives in `use-editor-edit-mode.ts`.
2. **Pending debounced autosaves are flushed.** `use-prompt-autosave` registers its `flush` in `lib/pending-flushes.ts` while a timer is pending. The update path awaits every registered flush. A reload runs no React cleanup, so without this the timer would be lost.
3. **The worker is told to skip waiting.** `{type: "SKIP_WAITING"}` is posted to the waiting worker.
4. **Only the clicking tab reloads.** On `controllerchange`, the tab whose click set the module flag calls `location.reload()`. No other tab reloads.

**Other tabs.** They see `controllerchange` and do not reload. They keep running their version: its cache is retained while they live (D3), and the new worker's lookup finds their chunks. **The exception is a schema bump.** If the new version upgrades the IndexedDB schema, those tabs stop at D9's blocking dialog. They do not keep working.

**Update checks.**

- The browser checks `sw.js` on navigation, bypassing the HTTP cache (`updateViaCache` defaults to `"imports"`).
- An installed app can stay open for days with no navigation, so the page also calls `registration.update()` on every `visibilitychange` to visible and on a 60-minute interval. Each check is throttled to once per 60 minutes.

### D5. Coexisting with chunk-reload: the worker comes first, recovery is the backstop

**The existing recovery.**

- `src/lib/chunk-reload.ts` holds `isChunkLoadError` and `reloadOnceForChunkError`. The reload is one-shot, with a 10 s sessionStorage cooldown, an in-memory flag, and a skip while the page is being left.
- It is called from `main.tsx` on `vite:preloadError` (the default is prevented there), from `RouteErrorBoundary.tsx`, and from `lazyImport` (`lib/lazy-import.ts`).

**How the two interact.**

- **Controlled page.** All its chunks are retained (D1, D3), so a stale hash cannot fail. Recovery stays dormant, online and offline.
- **A reload while a worker is waiting.** It is served by the still-active worker, so it gets a consistent version and cannot loop.
- **Uncontrolled page.** This covers a first visit, a shift-reload, and service workers being disabled. Behaviour is today's: one reload, then the cooldown hands over to the boundary.
- **Who wins.** The worker decides what is served. Recovery is never disabled and never driven by the worker. It acts only on a failed import, which under a worker happens only on an uncontrolled page, where a reload is the right answer.

### D6. One assembly script, one guard last, and a real CI home

**One assembly script.** `scripts/assemble-site.mjs` replaces the inline steps of `deploy-site.yml` with a single ordered pipeline:

1. merge the landing, SPA and docs dists;
2. write `app/version.json`;
3. substitute the analytics id, on the merged copies, from the `UMAMI_WEBSITE_ID` env var (left as the placeholder when it is unset, as today);
4. run `inject-spa-fallback`;
5. emit the legacy `/editor/` page;
6. emit the service worker, **always the last mutation**.

**Who calls it.** Three callers share it:

- `deploy-site.yml`, which keeps its check steps (`check-css-asset-urls`, `check-site-links`, the marker, IndexNow) as separate steps;
- CI, through the `e2e-prod-base` job;
- the e2e fixture `merged-dist-server.ts`, which today copies and injects by hand.

**Docs.** `--docs <dir>` is required unless `--without docs` is passed explicitly. Only CI and the fixture pass it, because they lack the VitePress dist.

**Guards, last.** `scripts/dist-service-worker.test.mjs` (`REQUIRE_SPA_DIST`, `SPA_DIST`, `SPA_BASE`) runs over the assembled `app/` and asserts:

- `sw.js` exists, and its embedded scope equals `SPA_BASE`;
- the manifest is non-empty, and the non-map files under `assets/` equal the manifest's hashed entries **as sets**;
- every listed file exists, and its bytes digest to its revision, which catches a rewrite of any file after emit;
- `index.html` and the web manifest's icons are listed, under `?__rev=`;
- none of the excluded files is listed.

In `deploy-site.yml` the guard is the **last step before `upload-pages-artifact`**, with the kill switch's expected mode passed in (D8).

**CI home.** `e2e-prod-base` already holds a `/app/` build from its global setup.

- It adds `landing` to `consume-build-artifacts`' `expected-packages`. `packages/landing/dist` is in the `packages/*/dist/` upload.
- It runs `assemble-site.mjs --without docs`, then the manifest guard and the service-worker guard.
- The new e2e is tagged `@service-worker`, and the tag joins the job's `--grep` (`ci.yml:979`).

### D7. Scope, shell matching, and production-only registration

**Scope.**

- The file is `app/sw.js`. Its maximum scope is its own directory, so the browser itself caps the scope at `/app/`.
- It is registered with `{scope: import.meta.env.BASE_URL}`.

**What the fetch handler does.**

- **Shell.** Only same-origin `GET` navigations to exactly `/app/` or `/app/index.html` are answered, with `ignoreSearch`, from the cached shell.
- **Assets.** Requests for precached URLs are answered from cache.
- **Everything else** passes through with no `respondWith`. That includes other in-scope paths, `version.json`, maps and cross-origin requests. Controlled and uncontrolled pages therefore behave identically for every URL outside the precache.

**Registration.** It runs only when `import.meta.env.PROD` is set and `"serviceWorker" in navigator` is true, and is timed as in D2.

- `vite dev` never registers.
- `vite build` plus `vite preview` serves no `sw.js`, because emit happens in assembly. That registration rejects with a 404, which is caught silently.

**Documented limitation.** The `/editor/*` and legacy-path bridge lives in the root `404.html`, outside the scope, so it needs the network. An old `/editor/...` link opened offline shows the browser's offline page. `/app/` itself works.

### D8. Kill switch

Pages cannot send `Clear-Site-Data`, so the kill switch is itself a worker. `assemble-site.mjs --sw-kill` (equivalently `emit-spa-service-worker.mjs --kill`) writes a `sw.js` that behaves as follows:

- **`install`:** calls `skipWaiting()`.
- **`activate`:** deletes every `kaiord-app-*` cache, including `kaiord-app-meta`, then unregisters itself. It then calls `navigate(url)` on each window from `clients.matchAll({type: "window"})`.

**SHALL invariants:**

- `matchAll` is called with its default `includeUncontrolled: false`, so the kill worker navigates only the clients it controls;
- it never calls `clients.claim()`;
- it has no `fetch` handler.

**Why it cannot loop.** A reloaded page is uncontrolled. It registers `sw.js` again, which installs the kill worker again. That worker activates over zero controlled clients, navigates nobody, and unregisters.

**How it is turned on.**

- `deploy-site.yml` passes `--sw-kill` when `vars.SPA_SW_KILL_SWITCH == "1"`.
- The guard is told the expected mode, and in kill mode asserts the kill body (no `fetch` handler, no `claim`).
- Pablo sets the variable with `gh variable set` (the repo-settings class, never an agent) and re-runs the deploy.
- To turn it off, unset the variable and deploy again.

**How long it takes to reach clients.**

- Pages' edge `max-age=600` means up to **≈10 minutes** after the deploy before the edge serves the new `sw.js`.
- After that, a client picks it up on its next navigation, on becoming visible, or within the 60-minute interval (D4).
- The URL `sw.js` is **never renamed**. This is the one invariant the switch depends on.

**Runbook.** `docs/runbooks/spa-service-worker.md` is linked from the deploy step, and its index row is added to `docs/runbooks/AGENTS.md`. It covers:

- symptoms;
- turning the switch on;
- checking that `/app/sw.js` serves the kill body;
- the timing above;
- that `navigate()` **drops unsaved edits** in the windows it reloads;
- rollback;
- the manual fallback per device (site settings → clear data).

**Automated.** The e2e assembles the tree normally, takes control, then reassembles it with `--sw-kill`. It asserts that the registration is gone, the caches are empty, the page ends up uncontrolled, and the page navigated exactly once.

### D9. IndexedDB schema skew: old code never touches a newer database

**How the skew arises.** A page running N-1 meets a database that N has already upgraded. This already happens in production today: a tab left open across a deploy does it. D4 makes it longer-lived, because other tabs deliberately stay on their version. A cold start can also produce it, once a newer page has upgraded the database. **This code is the future N-1**, so the guard ships in this change.

**What Dexie 4.4.6 actually does.** This was read in `node_modules/dexie/dist/dexie.mjs` and confirmed independently by the review. None of these cases fails hard.

- **Opening an older declared version (≈4594).** `tryOpenDB` catches the `VersionError` and retries with `nativeVerToOpen = 0`. That opens the database at whatever version is installed.
- **Schema diff on open.** `verifyInstalledSchema` ignores any table or index that only N has.
  - **The exception (≈4561).** `schemaPatchMode` kicks in when N dropped an index or a table that N-1 declares, or changed an index definition. The old client then bumps the native version by one and re-creates what it expects. The same path ("Schema was extended without increasing the number…") can also bump a database that **no newer deploy** ever touched.
- **`versionchange` (≈5942).** The default handler closes with `disableAutoOpen: false`, so the next query reopens silently. Handlers are chained with `reverseStoppableEventChain` (≈547). A later subscriber runs **first**, and the default runs after it unless that subscriber returns `false`. The default's `close({disableAutoOpen: false})` (≈6082) re-enables `autoOpen`.

The net effect is that N-1 code reads and writes rows that N's `upgrade()` has already rewritten. The database is at v37 with 21 `upgrade()` functions. **The result is silent corruption, not a visible break.**

**Comparison rule.** The rule is `Math.floor(nativeVersion / 10) > DECLARED_VERNO`. `DECLARED_VERNO` is a module constant captured right after `registerKaiordVersions(db)` and before any open, so 37 today. It is never the live `db.verno`, because Dexie rewrites `db.verno` from the installed version on open.

`native > verno * 10` is wrong. A legitimate `schemaPatchMode` bump, or the "extended without increasing" path, can take a database from 370 to 371+ with no newer deploy at all. Under `>` the **newest** code would then call itself stale forever, and the kill switch cannot repair a database. With `floor(…/10)`, a database at 371–379 still belongs to code at 37. Only 380+ (a real `version(38)`) is newer.

**Decision.**

1. **Pre-open probe.** It runs before Dexie first opens, beside `probeStorage` (`adapters/dexie/storage-probe.ts`, driven by `store/storage-store.ts`).
   - **Read the installed version.** It calls `indexedDB.open("kaiord-spa")` with no version argument, which never upgrades an existing database, and reads `result.version`.
   - **Absent database.** If `onupgradeneeded` fires with `oldVersion === 0`, the probe aborts that transaction, closes, and calls `deleteDatabase`, the way Dexie's own autoSchema does (≈4528–4535). It then reports **absent, not stale**. Otherwise the probe would leave an empty v1 behind, and Dexie would see `oldVersion = 1`. With `wasCreated` false, Dexie would replay all 37 versions and 21 upgraders. That is slow, it throws on any primary-key change, and it skips `_onDatabaseCreated`.
   - **Never block another tab.** The probe sets `onversionchange` to close its own connection, so it never blocks another tab's upgrade.
   - **Fail open.** Any probe error (private mode, blocked storage, `open` rejected) reports **unknown**. Boot then continues with the normal open, so a probe failure never shows the stale dialog by itself.
   - **Stale.** If the version is stale by the rule above, Dexie is never opened. That also closes the `schemaPatchMode` hole for the old code.
   - **Fresh.** If it is not stale, the probe connection **stays open until Dexie's `open()` settles**, and only then closes. This narrows the probe-to-open race. While the probe is open, another tab's upgrade has to deliver a `versionchange` to the existing connections. If Dexie's connection is already open, the step-3 override catches it. If Dexie's request is still queued, FIFO ordering lets Dexie open first at the declared version, and the override catches it right after.
2. **Post-open gate.** One ordering is still uncovered: an upgrader whose request was queued _before_ Dexie's. Dexie then hits `VersionError`, retries at version 0, opens the newer database, and no `versionchange` ever fires.
   - So a `db.on("ready")` subscriber checks `Math.floor(db.idbdb.version / 10) > DECLARED_VERNO`. When that holds, it calls `db.close({ disableAutoOpen: true })` and sets the stale state.
   - The close lands while `isBeingOpened`, so `open()` rejects with `DatabaseClosedError`. `storage-store` maps that rejection to **stale**, not to `"failed"`.
   - The check is synchronous. It returns nothing, so it does not hold up readiness the way a returned promise would.
3. **Mid-session override.** It runs from `db.on("versionchange", handler)`. When `ev.newVersion` is non-null and `Math.floor(ev.newVersion / 10) > DECLARED_VERNO`, the handler:
   - calls `db.close({ disableAutoOpen: true });`
   - sets the stale state;
   - **returns `false`**, so Dexie's default `close({disableAutoOpen: false})` never runs and never re-enables autoOpen.

   On a delete (`newVersion` null), or on a same-major bump, it returns nothing, so the default still runs and keeps today's close-and-reopen. **Mandatory test:** after a stale `versionchange`, the next query rejects with `DatabaseClosedError`.

4. **Boot gate (stale at boot).** There are no edits at boot. The gate calls `registration.update()`, waits for `installed`, posts `SKIP_WAITING`, and reloads, with no dialog. A sessionStorage one-shot key prevents a loop, as in chunk-reload. If no newer worker exists, or the one-shot has already fired, it falls through to step 5. That happens on an uncontrolled page that upgraded ahead of a deploy still propagating.
5. **Blocking dialog.** It is used mid-session, and at boot when the gate cannot update. It cannot be dismissed. The title is "Kaiord was updated in another window", in en and es. It has two actions:
   - **Download draft** appears whenever `workout-store` holds a `currentWorkout`. It saves that KRD as JSON through a `Blob` to `<name>.krd`, a file that `FileUpload` already re-imports (`accept` includes `.krd`). A draft is never stranded. The database is closed, so it cannot be saved there.
   - **Reload** runs the step-4 update-then-reload path. If nothing newer is found, the dialog stays up and offers a retry. `beforeunload` still prompts when the editor is dirty.
6. **Optional, LOW.** The per-tab unsaved flag (D4) is broadcast on a `BroadcastChannel("kaiord-unsaved")`. The update toast can then add "Unsaved changes in another window" before the user activates Reload. This is informational only and gates nothing across tabs. It is built only if it fits within the file limits; it is not required for the gates.

**Rejected alternatives.**

- **Network-first navigation.** It updates silently on every reload, against D4, and does nothing offline or for open tabs.
- **A backward-compatible-migrations policy.** No guard could enforce it, and 21 existing upgrades already break it.
- **Keeping auto-reopen.** That is the corruption path.

### D10. Tests

**Vitest.**

- **Registration module, with a fake `navigator.serviceWorker`:**
  - PROD gate, Save-Data skip, base scope, and swallowing a failed registration;
  - the waiting path and the installed path;
  - the silent cold-start apply, and its denial after input or with the unsaved flag set;
  - the click order: the unsaved flag blocks before anything is posted, flushes are awaited, then `SKIP_WAITING`, then a single reload on `controllerchange`;
  - visible and interval update throttling;
  - the hello message.
- **Unsaved flag:** fed by `useBeforeUnloadGuard`, cleared on disarm.
- **D9, with `fake-indexeddb`:**
  - a database at native 380 makes the probe report stale and Dexie never opens;
  - native 371 (a schemaPatchMode bump) is **not** stale, and Dexie opens;
  - an absent database makes the probe report absent and leaves no database behind; Dexie then creates it fresh, and `_onDatabaseCreated` fires;
  - when the probe errors, boot continues and no stale state is set;
  - the probe closes itself on `versionchange`;
  - the post-open gate: a database upgraded to 380 between probe and open ends stale, and `open()` rejects with `DatabaseClosedError`;
  - **mandatory:** a stale `versionchange` (380) makes the next query reject with `DatabaseClosedError`, because the override returned `false` and no auto-reopen happened;
  - a delete `versionchange` keeps auto-reopen;
  - the boot gate's one-shot;
  - Download draft produces JSON that `FileUpload` re-imports.
- **Copy:** toast and dialog text in en and es.

**`node:test`.**

- **Emitter:** walk, exclusions, revisions, `<v>`, the `?__rev=` URLs, and the kill body.
- **Guard negatives:**
  - an empty manifest;
  - a missing file;
  - a chunk under `assets/` that the manifest omits;
  - a listed map;
  - a shell rewritten after emit;
  - the kill mode against a normal body, and the reverse.
- **`assemble-site.mjs`:**
  - step order (emit is last);
  - Umami substitution on the copies;
  - `--without docs` is required when docs are missing.

**Worker source.** `sw/sw.js` is plain ES2020 kept outside `src/`. Its install, fetch, hello, prune and kill logic is exercised through Playwright, not vitest.

**Playwright.** The global `use` gets `serviceWorkers: "block"`, which covers every existing spec. `e2e/offline-service-worker.spec.ts` is tagged `@service-worker`. It runs only on chromium, because Playwright documents service-worker support as Chromium-only, and opts in with `test.use({ serviceWorkers: "allow" })` over `merged-dist-server`, which calls the real assembly. Its cases:

1. **Offline cold start.** Wait for control, go `context.setOffline(true)`, reload, and open a lazy route that was never visited online.
2. **Update while dirty.** Reassemble as v2 and assert that a toast appears and nothing reloads. A dirty editor blocks the update. A clean one reloads only the clicking page, and a second page keeps working.
3. **Retention.** A page on v1 survives two activations, its unvisited lazy chunk still resolves, and nothing reloads.
4. **Install integrity.** A shell served with the wrong bytes during install leaves the old worker active.
5. **Schema bump mid-session.** Bump the database from a second page to native ≥ 380, a real major version. The first page shows the dialog, and Download draft yields the draft.
6. **Kill switch.** As described in D8.

**Mobile projects.** They run only on `main`, so they are run locally, in full, before the PR, and the result is reported.

### D11. Tooling: a hand-written worker plus an emitter, with no new dependency

- **`vite-plugin-pwa` is rejected.** It computes the manifest inside `vite build`, before the shell is rewritten, so the shell's revision would be wrong. Its prompt flow (`registerType: "prompt"`, `onNeedRefresh`, `updateSW()`) is D4 anyway.
- **`workbox-build` `injectManifest` after assembly is also rejected.** It fixes the timing, but per the Workbox docs it "does not compile or bundle `swSrc`". Using `workbox-precaching` would therefore need a bundling step for one file. The 2 MB `maximumFileSizeToCacheInBytes` default silently skips files.
  - Workbox would not provide D1.3's digest check, D2's copy-forward or D3's client-keyed retention anyway. They would be custom code inside it.
- **Hand-written is chosen.** It is ≈120 lines of worker in `packages/workout-spa-editor/sw/sw.js`, outside `src/` so Vite never bundles it, plus ≈80 lines of emitter. It adds 0 dependencies. The page-side registration and the hello together stay well under 2 KB.

## Risks / Trade-offs

- **A bad worker is sticky.** That is why D8 exists, and why `sw.js` is never renamed.
- **A user can stay on N for days by ignoring the toast.** This is intended. Closing every window of the app applies the update.
- **A schema-bumping deploy interrupts other open tabs with D9's dialog.** It happens once per such deploy, and it is the price of not corrupting data.
- **A shift-reload or a first visit is unprotected by D3.** That page uses the network, as today, with chunk-reload as the backstop.
- **The `/editor/*` legacy bridge does not work offline (D7).**
