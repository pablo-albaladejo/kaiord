## 1. Worker and generator

- [ ] 1.1 `packages/workout-spa-editor/sw/sw.js`: precache install, activate cleanup (keep N and N-1), fetch (in-scope GET only, all-cache lookup, navigation to cached shell), `SKIP_WAITING` message
- [ ] 1.2 `scripts/emit-spa-service-worker.mjs` (+ `node:test`): walk `<dist>`, exclusions, SHA-256 revisions, `<v>` hash, write `sw.js`; `--kill` emits the self-destruct worker
- [ ] 1.3 `scripts/dist-service-worker.test.mjs` guard (D6), gated by `REQUIRE_SPA_DIST`; negative fixtures: empty, missing file, rewritten shell, listed map

## 2. Registration and update toast

- [ ] 2.1 Registration module (PROD only, base scope, silent failure, hourly visible update check) + vitest with a fake `navigator.serviceWorker`
- [ ] 2.2 Update toast with Reload action, en/es strings, discard-edits confirmation, reload only the clicking tab
- [ ] 2.3 Wire from `main.tsx` after first render
- [ ] 2.4 Schema-skew guard (D9): pre-open version probe, `versionchange` override with `disableAutoOpen: true`, blocking stale-code dialog (en/es) + `fake-indexeddb` tests

## 3. Deploy and CI

- [ ] 3.1 `deploy-site.yml`: "Generate SPA service worker" after "Inject SPA route fallback" (honouring `vars.SPA_SW_KILL_SWITCH`), then the guard
- [ ] 3.2 CI `build` job site guards: assemble, generate, guard
- [ ] 3.3 `docs/runbooks/spa-service-worker.md` + index row in `docs/runbooks/AGENTS.md`

## 4. E2E

- [ ] 4.1 Playwright `use.serviceWorkers: "block"` globally
- [ ] 4.2 `e2e/offline-service-worker.spec.ts` (chromium, `allow`): offline cold start + unvisited lazy route; v2 shows toast without reloading
- [ ] 4.3 Run the full mobile projects locally and report

## 5. Verification

- [ ] 5.1 Real-browser check on the assembled tree: offline start, update toast, kill switch unregisters
- [ ] 5.2 `pnpm lint`, `pnpm test:scripts`, SPA tests, `openspec validate`
