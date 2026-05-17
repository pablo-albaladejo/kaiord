---
"@kaiord/workout-spa-editor": minor
---

UX redesign Phase 2.4: reserve the `/settings/:tab?` route and ship
two mechanical guards that future PRs will rely on.

This is PR E of the Phase 1+2 roadmap. The route is registered behind
the `ux2026.unifiedSettings` feature flag (default `false`); when the
flag is on, the new `SettingsPage` renders a stub that redirects
`/settings` to `/settings/profile` and validates the tab name against
the six canonical tabs (`profile`, `zones`, `connections`, `ai`,
`appearance`, `privacy`). When the flag is off, the route redirects
to `/calendar` so legacy behaviour is unchanged. Migrating the actual
tab content from `SettingsPanel` and `ProfileManager` is a follow-up
(PR E+1) to keep this PR reviewable.

New mechanical guards (shipped, not deferred):

- **`R-StranglerExpiry`** (`scripts/check-strangler-expiry.mjs`) —
  every `// @strangler-until: YYYY-MM-DD` marker in
  `packages/workout-spa-editor/src/**` MUST have a date on or after
  today. Past dates fail CI, forcing strangler shims to be deleted
  (or their TTL extended with explicit justification). Pattern
  mirrored from `scripts/check-archive-dates.mjs`.
- **`R-SettingsSingleEntry`** (`scripts/check-settings-single-entry.mjs`)
  — when `ux2026.unifiedSettings` is `true`, files under
  `packages/workout-spa-editor/src/components/**` (outside the
  `ALLOWLIST`) MUST NOT import `SettingsPanel` or `ProfileManager`
  directly; the canonical entry is `/settings/<tab>`. No-op while the
  flag is `false` so the strangler period stays unblocked.

Both guards have co-located `node:test` suites and are picked up by
`pnpm test:scripts`. This is a `minor` bump because the new
`/settings/:tab?` route is a public surface change.
