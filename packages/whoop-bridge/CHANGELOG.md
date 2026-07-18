# @kaiord/whoop-bridge

## 10.0.0

### Minor Changes

- d21424e: Adopt the vendored bridge-core masters (`packages/_shared/bridge-core/`): shared response envelope/dispatch factories, announce content script (driven by a per-bridge `bridge-identity.js`), popup utilities, snapshot popup module + shared CSS (garmin/train2go), profile-snapshot validator, and test mocks — synced byte-identically via `pnpm bridge:sync` and locked by a parity guard. External dispatch is now uniformly origin-pinned and action-allowlisted in every bridge (previously only snapshot actions were origin-checked in garmin/train2go); allowlists equal each bridge's full external action surface, so SPA flows are unaffected. The train2go announce message now matches its ping manifest (name + `read:training-zones`), fixing a pre-existing announce/ping divergence.
