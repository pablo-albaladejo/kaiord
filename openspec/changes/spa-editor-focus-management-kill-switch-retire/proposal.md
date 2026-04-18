## Why

**This is a placeholder that reserves the slug for a future retirement proposal.** The retirement criteria are defined in `spa-editor-focus-management-hardening` Decision 6:

1. No `kill-switch-active` telemetry event has been received from production for **90 consecutive days**, AND
2. **Two consecutive major version releases** have shipped with focus management enabled.

When both conditions hold, this proposal is filled in to remove the kill-switch infrastructure added by the hardening change.

## What Changes

**TBD — to be filled in when the retirement criteria are met.**

Scope enumerated in hardening Decision 6 (copy here when activating this proposal):
- Remove `src/hooks/use-focus-kill-switch.ts` and its tests
- Remove `/settings/focus-diagnostics` route and `FocusDiagnosticsPage.tsx`
- Remove `FocusKillSwitchBanner.tsx` and its tests
- Remove Help menu "Troubleshooting → Focus Diagnostics" entry
- Remove all kill-switch-related scenarios from `spec.md`
- Remove `kill-switch-active` event type from the telemetry spec
- Remove kill-switch README.md sections
- Remove `kill-switch-active` row from the severity table
- Remove `VITE_KAIORD_FOCUS_MANAGEMENT` documentation and deploy-workflow references

## Impact

- **Placeholder only.** No code changes while this proposal is in placeholder state.
- When activated, scope is entirely within `@kaiord/workout-spa-editor`.
- Prerequisite: the retirement criteria in hardening Decision 6 hold at activation time.
