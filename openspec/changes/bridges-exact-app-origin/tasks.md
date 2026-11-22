## 1. Message contract (seam 3)

- [x] 1.1 Shared envelope test master: the exact App origin is accepted; every subdomain, `www` included, is refused; dev ports are accepted only under a manifest that declares them; a refused origin gets no answer (red first).
- [x] 1.2 `bridge-envelope.js` master: string comparison to `https://kaiord.com`, dev origins bound to the loaded manifest, no `sendResponse` for a refused origin; `pnpm bridge:sync` to all five bridges.
- [x] 1.3 Each bridge's `background.test.js` drives its registered `onMessageExternal` listener: a foreign origin, a `kaiord.com` subdomain, `www`, a dev port in a packaged build and an empty sender get no answer and reach no Platform; `set-theme` from a subdomain stores nothing.
- [x] 1.4 Existing positive paths use the exact App origin.

## 2. Manifests and root guard (seam 1)

- [x] 2.1 `scripts/check-bridge-exact-origin.test.mjs` (red first), then `scripts/check-bridge-exact-origin.mjs`, wired as `pnpm lint:bridge-exact-origin` in `lint:parallel`.
- [x] 2.2 All ten manifests declare `https://kaiord.com/*` for `externally_connectable` and the announce content script.
- [x] 2.3 Refresh `scripts/fixtures/bridge-privacy-surface.json`.

## 3. Truth

- [x] 3.1 `privacy-justification.md` of each bridge, train2go `cws-privacy-practices.txt`, READMEs and AGENTS name the exact origin.
- [x] 3.2 Public privacy policy and `packages/docs/scripts/check-privacy-policy.mjs` require the exact origin.
- [x] 3.3 Delta specs for bridge-core, garmin-bridge, train2go-bridge, whoop-bridge, extension-store-publish, bridge-runtime-discovery and privacy-policy.

## 4. Quality gates

- [x] 4.1 Bridge suites, `pnpm test:scripts`, `pnpm lint:bridges`, `pnpm lint:specs` and the touched guards pass.
- [x] 4.2 Changeset for the five bridges.
