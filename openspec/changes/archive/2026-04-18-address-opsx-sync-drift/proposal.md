> Completed: 2026-04-18

## Why

The 2026-04-18 opsx-sync audit (commit `305284d2`) fixed one spec-drift finding in `garmin-bridge` and surfaced five more that were out of scope for a pure spec-to-code sync. Those five drifts are now an explicit backlog mixing missing implementation (CI link checker, AI cost estimation / usage UI), stale documentation (`CWS_TRAIN2GO_EXTENSION_ID`), and spec-level clarifications (context-menu right-click, branding token importability). Left open, each becomes a broken promise in a capability spec — which is exactly what we invested in `pnpm lint:specs` to prevent.

## What Changes

- **Doc link checker (code + CI)**: add `lychee` (or equivalent) as a CI step wired into `.github/workflows/ci.yml`, validating internal Markdown links across `packages/docs/` and root docs. Fulfils `doc-drift-prevention` spec requirement "CI pipeline SHALL check all internal links".
- **CWS credentials doc**: update `docs/cws-credentials-setup.md` to document `CWS_TRAIN2GO_EXTENSION_ID` alongside `CWS_EXTENSION_ID`, matching the matrix in `.github/workflows/cws-publish.yml` and the scenarios in `cws-auto-publish` spec.
- **AI cost-estimation + monthly usage UI (SPA)**: implement the batch confirmation dialog (provider name, estimated input/output tokens, estimated USD cost, disclaimer) wired to existing `estimateTokens`/`estimateCost` helpers; implement a Settings → Usage panel reading the existing `UsageRecord` schema to display current + recent months. Fulfils `spa-ai-batch` requirements that currently exist in spec with no UI behind them.
- **Context-menu right-click spec clarifications**: extend `spa-editor-context-menu` spec with scenarios for right-click on empty editor area (no selection), right-click on an item that is part of a multi-selection, and the keyboard-hint label format (e.g., `Cmd+C`). Verify the existing `EditorContextMenu` component matches; patch if behaviour differs.
- **Branding token importability**: clarify in the `branding` spec that shared CSS tokens are imported via relative `@import` paths from `styles/brand-tokens.css` (no workspace package dependency) — documenting the shipping pattern so future consumers follow it.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `spa-ai-batch`: add two concrete UI-level scenarios (batch confirmation dialog rendering, usage panel rendering) so the existing `Cost estimation before batch processing` and `Monthly AI usage tracking` requirements have testable surface. Existing requirement text is preserved.

**No other delta specs.** Per the 2026-04-18 audit re-read, the drifts in `doc-drift-prevention`, `cws-auto-publish`, `spa-editor-context-menu`, and `branding` are not spec gaps — the existing specs already encode the correct requirements (CI link checker, both CWS secrets documented, right-click coverage including empty area + multi-selection, and `@import`-pattern tokens). Those items are code/doc gaps, addressed in this change's `tasks.md` without modifying their spec files.

## Impact

- **Packages**: `@kaiord/workout-spa-editor` (new React components for cost dialog + usage panel), `@kaiord/docs` (new docs/cws-credentials-setup.md content), `@kaiord/core` (no change — `UsageRecord` already exists).
- **Hexagonal layer**: adapters (SPA UI) + infrastructure (CI workflow) + docs. Domain and ports untouched.
- **Public API**: no breaking changes. All additions are additive.
- **New runtime deps**: none for the SPA (uses existing Tailwind + Zustand + Dexie). CI-only dep: `lychee-action@v2` (no package in `package.json`).
- **Spec tests**: `pnpm lint:specs` remains 22/22 after delta specs merge into canonical specs via `/opsx-archive` at completion.
- **Follow-up work**: none — this change closes the audit backlog.
