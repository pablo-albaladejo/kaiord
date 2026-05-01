---
"@kaiord/workout-spa-editor": patch
---

fix(spa-editor): align wouter Router base with Vite deploy base so /editor/<route> URLs survive refresh

URLs deep-linked into the SPA editor now consistently include the `/editor/` prefix, matching the deploy path. Pre-fix bookmarks pointing at `kaiord.com/<route>` (without the prefix) never survived a refresh; the canonical address is now `kaiord.com/editor/<route>`. Open SPA tabs may briefly show a one-time URL update on the next navigation as the new base takes effect.

Internally the SPA bootstrap now wraps `<App />` in `<Router base={computeRouterBase(import.meta.env.BASE_URL)}>`, so wouter routes match against the deploy-relative path. The pre-existing rafgraph 404 fallback (introduced in `cleanup-open-issues-may-2026`) now matches the URLs the SPA actually emits.

A new production-base e2e suite (`packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, gated by `E2E_PROD_BASE=1`, exercised via the new CI job `e2e-prod-base`) builds the SPA with `VITE_BASE_PATH=/editor/` and serves it through a custom Node static-server fixture that mimics GitHub Pages' 404 contract byte-equally, so the regression cannot silently re-introduce. The rafgraph injection logic was extracted from the deploy workflow into `scripts/inject-spa-fallback.mjs` so production and tests share a single source of truth.
