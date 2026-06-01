---
"@kaiord/core": patch
"@kaiord/workout-spa-editor": patch
---

fix(core): make `canonicalHash` isomorphic (sync SHA-256, no `node:crypto`)

`canonicalHash` used `node:crypto`'s `createHash`, which the build emitted as a
bare `import { createHash } from "crypto"`. In the browser bundle `createHash`
resolved to `undefined`, so any browser code path that hashed an export payload
(the integration-policy export/push ledger via `computeExportHash`) crashed, and
Vite's dev server crashed the whole SPA at module-eval.

Switch to a sync, isomorphic SHA-256 (`@noble/hashes`). The UTF-8 bytes hashed
and the hex digest are byte-for-byte identical to the previous implementation —
verified against `node:crypto` in a test — so persisted external-ids stay
stable. This removes the dev-only `crypto` stub workaround in the editor's Vite
config.
