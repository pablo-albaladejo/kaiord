## Why

`kaiord.com/app/` installs as an app (#1566), but the installed app is
useless without a connection. Every chunk loads from the network, so a cold
start in a gym basement or on a plane shows the browser's offline page. The
editor itself needs no network: workouts, the library and the calendar all
live in IndexedDB.

#1566 left the service worker out on purpose. A worker that caches the shell
can leave an installed client running an `index.html` whose chunks the host
no longer serves. This change adds offline support together with the update
strategy that #1566 said it would need.

## What Changes

- **The worker.** A hand-written service worker, `app/sw.js`, scoped to `/app/`.
  - It precaches the whole build of one deploy: every JS and CSS chunk, the font, the icons, the manifest and the shell.
  - Every byte is verified against a SHA-256 revision at install. A mismatch fails the install.
  - Unchanged entries are copied forward from older caches, so they are not downloaded again.
  - It serves the shell only for `/app/` and `/app/index.html`. Everything else that is not precached passes through untouched.
  - A cache is kept for as long as a live window still runs that version.
- **Assembly.** A single `scripts/assemble-site.mjs` assembles the published tree for the deploy, for CI and for the e2e fixture. The steps run in this order: merge, `version.json`, analytics id, route fallback, legacy `/editor/`, and service-worker emit last. A dist guard is the last step before the Pages upload.
- **Registration.** It runs only in production builds, after `load` once the browser is idle, and never under Save-Data. The dev server never has a worker.
- **Updates.** The app never reloads on its own once the user has interacted.
  - A persistent toast says "New version available · Reload" (en/es).
  - Unsaved edits block the update with "Save your changes to update".
  - Pending autosaves are flushed before `SKIP_WAITING`, and only the tab that was clicked reloads.
  - On a cold start with no input yet, the update is applied silently.
- **Schema skew.** Old code never opens a database that newer code has upgraded through Dexie, and never reads or writes app data in it. The only access is a version-less pre-open probe that reads the version number, plus a `versionchange` close with auto-reopen disabled.
  - At boot, the editor updates and reloads.
  - Mid-session, a blocking dialog asks the user to reload.
- **Kill switch.** A repository variable makes the deploy emit a `sw.js` that destroys itself. It never claims clients and never loops. The procedure is documented in a new runbook.
- **Tests.** Every e2e runs with `serviceWorkers: "block"`, except one `@service-worker` Chromium spec. That spec runs in CI's `e2e-prod-base` over the real assembly.

## Capabilities

### New Capabilities

- `spa-offline`: the editor's service worker, covering precache, update
  prompt, scope, kill switch and guards.

### Modified Capabilities

- `branding`: the installable manifest requirement drops its clause that
  forbids a service worker.

## Impact

- **Packages.** `@kaiord/workout-spa-editor` (private) changes in these places:
  - the worker source;
  - registration, the update flow, the unsaved-edits flag and the pending-flush registry;
  - the schema-skew guard and its dialog;
  - en/es strings;
  - the Playwright config;
  - the merged-dist e2e fixture.
- **Repo tooling.** Three new scripts: `assemble-site.mjs`, `emit-spa-service-worker.mjs` and the dist guard, each with `node:test`.
- **CI/deploy.**
  - `deploy-site.yml`: the inline assembly steps become one script call, and the guard is the last step before upload.
  - `ci.yml`: `e2e-prod-base` assembles, runs the guards and runs `@service-worker`.
- **Dependencies.** None added.
- **Users.**
  - A first visit downloads about 750 KB more in the background, once.
  - Each later deploy re-downloads only the files that changed.
  - A deploy that bumps the database schema interrupts other open tabs once, with a reload dialog.
