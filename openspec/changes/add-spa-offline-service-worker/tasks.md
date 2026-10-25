## 1. Worker, emitter, assembly

- [ ] 1.1 `packages/workout-spa-editor/sw/sw.js`, covering D1, D2, D3 and D7:
  - verified install with `cache: "reload"`, a digest check, and copy-forward;
  - `?__rev=` keys;
  - shell matching only `/app/` and `/app/index.html`;
  - lookup across all caches;
  - `HELLO` registry and serialised prune;
  - `SKIP_WAITING`.
- [ ] 1.2 `scripts/emit-spa-service-worker.mjs`, with `node:test`:
  - walk, exclusions, revisions, `<v>`, `?__rev=` URLs;
  - `--kill` body, where activation navigates only controlled clients, with no claim and no fetch handler.
- [ ] 1.3 `scripts/assemble-site.mjs`, with `node:test`:
  - steps: merge, `version.json`, Umami substitution on the copies, inject fallback, legacy `/editor/`, then SW emit last;
  - `--without docs` is required whenever docs are absent;
  - `--sw-kill`.
- [ ] 1.4 `scripts/dist-service-worker.test.mjs` guard (D6):
  - gated by `REQUIRE_SPA_DIST`, with an expected-mode input;
  - negative fixtures:
    - empty manifest;
    - missing file;
    - an `assets/` chunk the manifest omits;
    - a listed map;
    - a shell rewritten after emit;
    - mode mismatch.

## 2. Page side

- [ ] 2.1 Registration module:
  - PROD and Save-Data gates;
  - registers after `load` and then on idle, with a `setTimeout` on Safari;
  - base scope;
  - a failed registration is silent;
  - `HELLO` with the entry URL;
  - update checks on visible and every 60 minutes, throttled;
  - vitest with a fake `navigator.serviceWorker`.
- [ ] 2.2 `lib/unsaved-edits.ts`, fed by `useBeforeUnloadGuard` in `use-editor-save.ts`, plus `lib/pending-flushes.ts`, which `use-prompt-autosave` registers into.
- [ ] 2.3 Update flow:
  - cold-start silent apply (within 10 s, before any input, nothing unsaved);
  - persistent toast;
  - on click, in order: the unsaved-edits gate ("Save your changes to update"), await flushes, `SKIP_WAITING`, reload only the clicking tab;
  - en/es copy.
- [ ] 2.4 Schema-skew guard (D9):
  - pre-open version probe;
  - boot gate with a one-shot update-and-reload;
  - `versionchange` handled with `disableAutoOpen: true`;
  - blocking stale-code dialog in en/es;
  - `fake-indexeddb` tests.
- [ ] 2.5 Wire everything from `main.tsx` and the storage boot.

## 3. Deploy and CI

- [ ] 3.1 `deploy-site.yml`:
  - replace the inline merge, sed, inject and legacy steps with `assemble-site.mjs`, honouring `vars.SPA_SW_KILL_SWITCH`;
  - the SW guard is the last step before `upload-pages-artifact`.
- [ ] 3.2 `ci.yml` `e2e-prod-base`:
  - add `landing` to `expected-packages`;
  - run `assemble-site.mjs --without docs`, the manifest guard and the SW guard;
  - add `@service-worker` to `--grep`;
  - update the `check-ci-fanout-invariants` whitelist if it requires it.
- [ ] 3.3 `e2e/fixtures/merged-dist-server.ts` calls `assemble-site.mjs` instead of copying and injecting by hand.
- [ ] 3.4 Add `docs/runbooks/spa-service-worker.md` and its index row in `docs/runbooks/AGENTS.md`. Cover the ≈10-minute edge propagation and that `navigate()` drops unsaved edits.

## 4. E2E

- [ ] 4.1 Set `use.serviceWorkers: "block"` in the Playwright config for every project.
- [ ] 4.2 Add `e2e/offline-service-worker.spec.ts` (`@service-worker`, chromium, `allow`), covering:
  - offline cold start, including a lazy route never visited;
  - an update while dirty, then while clean, with a second page that keeps working;
  - retention across two activations;
  - an install-integrity failure;
  - a mid-session schema bump;
  - the kill switch, with exactly one navigation.
- [ ] 4.3 Run all the mobile projects locally and report the result.

## 5. Verification

- [ ] 5.1 Real-browser check on the assembled tree: offline start, the update toast, the kill switch.
- [ ] 5.2 Run `pnpm lint`, `pnpm test:scripts`, the SPA tests and `openspec validate --strict`.
