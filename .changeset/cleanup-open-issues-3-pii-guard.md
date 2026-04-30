---
---

chore: lock in PII / secret-leakage guard for SPA editor toast and console strings (closes #395)

Adds `scripts/check-no-pii-leakage.mjs`, a `pnpm test:scripts`-wired static-source check that fails CI if any `toast.*` or `console.*` call under `packages/workout-spa-editor/src/{components,hooks,lib}/**` passes a non-static first argument. Four dispatch shapes covered: member, computed-member, destructured (`const { error } = useToastContext()`), and re-bound (`const ctx = useToastContext()`). Ten existing call sites refactored to SCREAMING_SNAKE_CASE constants. Existing `use-ai-tab-handlers.audit.test.ts` kept as defense-in-depth.
