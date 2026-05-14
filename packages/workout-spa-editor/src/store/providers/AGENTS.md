<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/store/providers/`

## Purpose

Observability + id-generation seams that the workout store wires through at composition time.

## Key Files

- `focus-telemetry.ts` / `.test.ts` + `.test-fixtures.ts` — `FocusTelemetry` function type and `FocusTelemetryContext`. Lets consumers (Sentry/Datadog/...) plug in a stable callback to observe focus events from `useFocusAfterAction`. See `store/README.md` for severity-to-alert guidance.
- `id-provider.ts` / `.test.ts` — `IdProvider` port + default crypto-random implementation; swap in a deterministic id source for tests.
- `item-id.ts` / `.test.ts` — `ItemId` branded-string type + helpers.

## For AI Agents

### Working In This Directory

1. **The id provider is a port** because tests need deterministic ids. Don't call `crypto.randomUUID()` directly inside actions — go through the provider.
2. **Focus-telemetry callbacks MUST be stable references.** A dev-mode ref-stability guard in the provider warns on inline arrows.

### Testing Requirements

- `id-provider.test.ts` pins the deterministic-id test seam.
- `focus-telemetry.test.ts` covers the canary-event wiring.

## Dependencies

### Internal

- `../focus/focus-target.types`.

### External

- `crypto.randomUUID` (default id source; can be swapped in tests).

<!-- MANUAL: -->
