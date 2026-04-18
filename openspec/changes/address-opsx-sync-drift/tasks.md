# Tasks

> **Implementation split**: Tasks 1–4 ship in PR #TBD (fix/opsx-sync-drift). Tasks 5–6 (SPA UI for batch cost confirmation and monthly usage panel) will ship in a follow-up PR before this change is archived. The delta spec at `specs/spa-ai-batch/spec.md` stays inside this change folder until both PRs have landed.

## 1. Docs fix — CWS_TRAIN2GO_EXTENSION_ID in the setup guide

- [x] 1.1 Read `docs/cws-credentials-setup.md` and locate the "GitHub Secrets" / phase-7 section that lists `CWS_EXTENSION_ID`.
- [x] 1.2 Extend the table (or enumerate list) with a row for `CWS_TRAIN2GO_EXTENSION_ID`, mirroring how `CWS_EXTENSION_ID` is described. Pluralize surrounding prose ("the extension IDs", "each extension's listing").
- [x] 1.3 Re-run `pnpm -C packages/docs lint` and `pnpm -C packages/docs test` — the `check-privacy-policy.mjs` and other lint scripts must stay green; no new violations expected since the file is not currently under their scope.
- [ ] 1.4 Open GitHub PR UI / preview to verify the Markdown rendering of the new row.

## 2. Branding spec — document the `@import` pattern (tiny clarification)

- [x] 2.1 Re-read `openspec/specs/branding/spec.md` §"Shared brand color tokens" — confirm whether the existing sentence covers the `@import` usage pattern clearly enough.
- [x] 2.2 If ambiguous, add one sentence under that requirement clarifying that consumers import via `@import url('../../../styles/brand-tokens.css')` (or equivalent relative path) and that no `package.json` dependency is needed.
- [x] 2.3 Run `pnpm lint:specs` to confirm the spec still parses and the sync date is honoured.

## 3. Context-menu spec — verify code matches scenarios

- [x] 3.1 Read `openspec/specs/spa-editor-context-menu/spec.md` §"Custom context menu for editor area" scenarios.
- [x] 3.2 Cross-check against `packages/workout-spa-editor/src/components/organisms/EditorContextMenu/` for: right-click on unselected item, right-click within multi-selection, right-click on empty area with clipboard content, right-click with no applicable actions (passthrough to native), keyboard hint labels. **Verified**: `EditorMenuItem` renders `hint` with platform-aware symbols (`⌘X` on macOS via `modifierSymbol`, `Ctrl+X` elsewhere) from `utils/platform.ts`; `showPaste`/`showDelete`/`showSelectAll` flags gate rendering; `EditorContextMenu.tsx` wires Radix `onOpenChange` with `hasEdit` / `hasStructural` state per spec.
- [x] 3.3 If a scenario is not implemented, patch the component to match the spec. Add or extend a unit/integration test per gap. **No patches needed** — all spec scenarios map to existing code paths.
- [x] 3.4 `pnpm -C packages/workout-spa-editor test -- --run EditorContextMenu` — 19 tests passing.

## 4. CI link checker — lychee integration

- [x] 4.1 Create `lychee.toml` at repo root with offline-only, internal-URL-only scope, VitePress + per-package-draft-docs exclusions, and Playwright report exclusion.
- [x] 4.2 Create `scripts/lint-links.sh` wrapper that enumerates markdown files matching the scope and invokes `lychee --config lychee.toml`.
- [x] 4.3 Add `check-links` job to `.github/workflows/ci.yml` using `taiki-e/install-action@v2` to fetch the `lychee` binary, then runs `bash scripts/lint-links.sh` — runs in parallel with the `lint` matrix. Wired into the existing `notify-failure` aggregator.
- [x] 4.4 Run locally: fixed 7 real broken links surfaced on the first pass — stale FLAKINESS-\* docs in e2e README, stale workflow filenames in scripts/README, stale cross-package doc refs in packages/core/docs/\*. Link checker now exits 0 with 135 valid + 188 external excluded.
- [x] 4.5 `pnpm lint:specs` continues green; `pnpm lint:links` added as root script for local use (not included in `pnpm lint` to avoid installing lychee on every Node matrix run).

## 5. SPA — Batch cost-confirmation dialog

- [ ] 5.1 Create `packages/workout-spa-editor/src/components/ai-batch/BatchCostConfirmation.tsx` — presentational dialog with provider / token count / USD cost / disclaimer / Confirm + Cancel, styled with Tailwind. Under 60 LOC per React component rule.
- [ ] 5.2 Create `packages/workout-spa-editor/src/hooks/useBatchCostEstimate.ts` — thin wrapper over `estimateTokens` + `estimateCost` from the existing AI helpers. Returns `{ provider, inputTokens, outputTokens, costUsd }`. Under 40 LOC.
- [ ] 5.3 Intercept the existing "Process all with AI" CTA on the calendar to open the dialog before dispatching. Wire Cancel → no-op, Confirm → existing batch processor invocation. Ephemeral React state only.
- [ ] 5.4 Unit tests for the hook (mocked `estimateTokens`/`estimateCost`). Component test covering Cancel and Confirm paths with AAA structure.
- [ ] 5.5 Verify the first scenario under `spa-ai-batch` delta (`Confirmation dialog renders before dispatch`) passes against the component.
- [ ] 5.6 Coverage for new code ≥70% (frontend threshold).

## 6. SPA — Monthly usage panel

- [ ] 6.1 Create `packages/workout-spa-editor/src/components/settings/UsagePanel.tsx` — uses `useLiveQuery` over the `UsageRecord` Dexie table, filters `yearMonth` to current + previous 5 months, groups by `(yearMonth, provider)`, renders a sortable table of provider / inputTokens / outputTokens / costUsd. Under 60 LOC.
- [ ] 6.2 Wire the panel into the existing Settings layout (likely under `settings/AiTab` or a new `Usage` tab). No new Dexie schema or migration.
- [ ] 6.3 Component test asserting that rows render for the months that have records, and omit months with no records. Cover the empty state.
- [ ] 6.4 Verify the second scenario under `spa-ai-batch` delta (`Usage panel shows current + previous five months`) passes.
- [ ] 6.5 Coverage ≥70%.

## 7. Changeset + PR hygiene

- [ ] 7.1 `pnpm exec changeset` — one patch bump for `@kaiord/workout-spa-editor` (SPA components) and no bump for `@kaiord/core`. Description: "Address opsx-sync-drift: AI batch cost dialog + monthly usage panel".
- [ ] 7.2 `pnpm -r test && pnpm -r build && pnpm lint` all green. `pnpm lint:specs` 22/22.
- [ ] 7.3 Run `/opsx-verify` against `address-opsx-sync-drift` — scenarios for the spa-ai-batch delta must be observable against the running SPA.
- [ ] 7.4 Open PR. After merge: `/opsx-archive address-opsx-sync-drift` to fold the delta spec into canonical `openspec/specs/spa-ai-batch/spec.md` and refresh `openspec/changes/archive/README.md` via `pnpm archive:index`.

## 8. Post-merge backstop

- [ ] 8.1 Re-run `opsx-sync` audit on the full 22 specs. Expect zero DRIFT / zero MINOR_DRIFT findings for the items this change targets.
- [ ] 8.2 If the link-checker advisory window surfaces a large backlog of broken internal links, triage and open a follow-up cleanup change (out of scope for this one).
