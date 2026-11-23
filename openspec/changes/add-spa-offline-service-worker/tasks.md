## B1. Assembly refactor (no behaviour change)

- [x] 1.1 Add `scripts/assemble-site.mjs` with `node:test` coverage. It runs these steps in order:
  - merge;
  - `version.json`, written exactly as `{"sha":"…"}\n`;
  - Umami substitution on the copies, failing when a placeholder remains;
  - inject the fallback;
  - the legacy `/editor/` page.

  The script copies with glob semantics: no top-level dotfiles, except the explicit landing `.nojekyll`. `--without docs` is required whenever docs are absent. The fixture includes dotfiles.

- [x] 1.2 `deploy-site.yml`: replace the inline merge, sed, inject and legacy steps with the script. "Verify merged artifact" and `check-css-asset-urls` stay as separate steps after it.
- [x] 1.3 `ci.yml` `e2e-prod-base`:
  - add `landing` to `expected-packages`;
  - run `assemble-site.mjs --without docs` and the manifest guard;
  - update the `check-ci-fanout-invariants` whitelist if it needs it.
- [x] 1.4 Switch `e2e/fixtures/merged-dist-server.ts` to call the script instead of copying and injecting by hand.
- [x] 1.5 Parity evidence: run the old inline YAML steps and the script over the same inputs, then `diff -r` the two trees. Report the result in the PR.

## B2. Stale-schema guard (D9)

- [x] 2.1 Add the `DECLARED_VERNO` constant and the `floor(native/10)` rule.
- [x] 2.2 Add the pre-open probe, run in `main.tsx` before the first render from an async `startApp` (no top-level await):
  - an absent database: the probe aborts the upgrade and reports "absent"; it never calls `deleteDatabase`;
  - two openers both survive: Dexie's open queued behind the probe still creates the database;
  - any error fails open;
  - the probe closes itself on `versionchange`;
  - it stays open until Dexie's open settles;
  - it reports "unknown" after a ~1.5 s deadline and closes a connection that opens late;
  - any throw in boot falls back to the normal render;
  - a stale probe never opens `db`, and nothing in `main.tsx`'s import graph opens it at module scope.
- [x] 2.3 Register the ready gate first, in the `KaiordDatabase` constructor. When stale it throws `StaleSchemaError`. Boot maps that error to "stale" and then calls `close({disableAutoOpen: true})`.
- [x] 2.4 Add the `versionchange` override: when stale it closes the database and returns `false`; on a delete or a same-major change it returns nothing.
- [x] 2.5 Add the boot gate:
  - looks up the registration with `getRegistration()`;
  - with no registration, shows the stale dialog first; its Reload is a plain `location.reload()`;
  - calls `update()`; if it rejects, or no worker is installing or waiting, shows the dialog with "Try again in a few minutes" and a Retry;
  - otherwise waits up to ~15 s for installed or redundant: installed means `SKIP_WAITING` plus reload, redundant or a timeout means the dialog;
  - uses a one-shot that is cleared on a non-stale boot.
- [x] 2.6 Add the blocking stale dialog in en/es, with:
  - Download draft (`.krd`);
  - Reload;
  - "Try again in a few minutes".
- [x] 2.7 Add `fake-indexeddb` tests for every D9 case in D10. Two are mandatory:
  - after a stale `versionchange`, the next query rejects with `DatabaseClosedError`;
  - a later vip ready subscriber does not hang.

## B3. Service worker

- [x] 3.1 Add the worker, `packages/workout-spa-editor/sw/sw-precache.js`, `sw-retention.js` and `sw.js` (one classic script once the emitter concatenates them, each part under the file cap):
  - a verified install with `cache: "reload"`, a digest check and copy-forward;
  - `?__rev=` keys;
  - shell matching for `/app/` and `/app/index.html` only;
  - lookup across every cache;
  - per-client `HELLO` records, with the "unrecorded live client → delete nothing" prune rule;
  - `SKIP_WAITING`;
  - `CLIENT_COUNT`.
- [x] 3.2 Add `scripts/emit-spa-service-worker.mjs` with `node:test` coverage, plus its `--kill` body (navigates only controlled clients, no claim, no fetch handler). `assemble-site.mjs` calls it as the last step, with `--sw-kill`.
- [x] 3.3 Add the guard, `scripts/check-spa-service-worker.mjs` (a CLI like `check-site-csp`, so it always runs on the tree it is given), with negative fixtures in `scripts/check-spa-service-worker.test.mjs`. Wire it as the last step before `upload-pages-artifact` and into `e2e-prod-base`, with the expected mode taken from `vars.SPA_SW_KILL_SWITCH`.
- [x] 3.4 Add the registration module (`src/lib/service-worker/`):
  - PROD and Save-Data gates;
  - registration after `load`, once the browser is idle;
  - hello at boot and on every `controllerchange`;
  - update checks on visibility and on a throttled 60-minute timer.
- [x] 3.5 Add `lib/unsaved-edits.ts`, fed by `useBeforeUnloadGuard`, and `lib/pending-flushes.ts`, used by `use-prompt-autosave`.
- [x] 3.6 Implement the update flow (`UpdatePrompt`, a persistent region of its own rather than a toast from the queue, so nothing can dismiss it):
  - a silent cold-start apply, only within 10 s, with no input, nothing unsaved and a single window client;
  - otherwise a persistent toast;
  - on click, in order: gate, flush, `SKIP_WAITING`, then reload only the clicking tab;
  - en/es strings.
- [x] 3.7 Optional, LOW: broadcast the unsaved flag on a `BroadcastChannel`, so the toast can mention unsaved changes in another window. Decided against: it gates nothing (each tab blocks its own reload on its own edits, and other tabs never reload), and it would add a channel to the initial JS for an informational line.
- [x] 3.8 Set Playwright `use.serviceWorkers: "block"` and add `e2e/offline-service-worker.spec.ts` (`@service-worker`, added to the `e2e-prod-base` grep). It covers:
  - offline cold start, including a lazy route never visited;
  - an update while dirty, then while clean, with a second page;
  - retention across two activations;
  - install integrity;
  - a mid-session schema bump to 380 or higher;
  - the kill switch, with exactly one navigation.

  CI runs it on Chromium; it also passes on Firefox and WebKit locally (the kill switch leaves the reloaded page under the dying worker, which has no fetch handler, until its next load in those two).

- [x] 3.9 Add `docs/runbooks/spa-service-worker.md` and its row in `docs/runbooks/AGENTS.md`. It covers the ≈10-minute edge delay, that `navigate()` drops unsaved edits, and the manual fallback.

## Every PR

- [x] 4.1 Run all mobile e2e projects locally and report the result. 2026-11-23, dev server, Mobile Chrome + Mobile Safari + Mobile-768: 1131 passed, 169 skipped, 2 failed. `zones-sync` (c) on Mobile Chrome passed 3 of 3 on a rerun (flaky). `scheduled-lifecycle` on Mobile Safari fails at a keyboard `toBeFocused` on the Move dialog, and fails the same way on the base commit `1bdd733b4` without this change: pre-existing, not caused by it.
- [x] 4.2 Run `pnpm lint`, `pnpm test:scripts`, the affected package tests and `openspec validate --strict`.
