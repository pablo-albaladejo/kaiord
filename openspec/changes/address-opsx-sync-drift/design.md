## Context

The opsx-sync audit on `main` at commit `305284d2` found five drift items that a pure spec-to-code sync could not resolve on its own: two code gaps, one doc gap, and two spec-refinement items. The audit commit already updated `garmin-bridge` spec; this change closes the rest without further spec drift.

All five items live in different layers but share two constraints:

1. `pnpm lint:specs` must remain 22/22 after the change merges and `/opsx-archive` folds delta specs into canonical ones.
2. The SPA changes must stay under the 100-LOC-per-file / 60-LOC-per-React-component rule, using Zustand for runtime and Dexie for persisted state (no new stores for transient UI).

## Goals / Non-Goals

**Goals:**
- Implement a CI internal-link checker that fails PRs when Markdown links break, satisfying the existing `doc-drift-prevention` SHALL.
- Document `CWS_TRAIN2GO_EXTENSION_ID` in `docs/cws-credentials-setup.md` so the page matches `cws-publish.yml` and the `cws-auto-publish` spec scenarios.
- Ship a batch-confirmation dialog (provider, estimated tokens, estimated cost, disclaimer) and a Settings → Usage panel (current + previous 5 months) using existing helpers and schema — no new domain types.
- Extend `spa-editor-context-menu` spec with three scenarios (empty-area right-click, multi-selection right-click, keyboard-hint label format) and verify `EditorContextMenu` against them.
- Clarify the brand-token import pattern in `branding` spec.

**Non-Goals:**
- Expanding LLM token-accounting beyond the existing `estimateTokens`/`estimateCost` helpers.
- Adding external link checking (only internal links across the repo).
- Enforcing brand tokens via ESLint / bundler rules.
- Replacing `chrome.storage.session`, Zustand or Dexie patterns.
- Touching the 22 canonical specs beyond the 5 marked in the proposal.

## Decisions

### CI link checker: `lychee-action` over `markdown-link-check`

- **Choice**: `lycheeverse/lychee-action@v2` (Rust, parallel, HTTP/2-ready, native GitHub Actions wrapper).
- **Rationale**: `markdown-link-check` is node-based and sequential; our docs tree is ~375 Markdown files. `lychee` is an order of magnitude faster and already fails the build on non-2xx internal links by default. Configuration via `lychee.toml`.
- **Scope**: internal links only (exclude external URLs via `--exclude ^https?://` or the equivalent config toggle). External-link verification is explicitly out of scope; it's noisy and flakes on network glitches.
- **Wiring**: new `check-links` job in `.github/workflows/ci.yml` run in parallel with `lint`, with `continue-on-error: false`. No separate workflow — a single job keeps the matrix surface small.
- **Layer**: infrastructure.

### CWS credentials doc: add a table row, not a new section

- **Choice**: extend the existing "GitHub Secrets" table in `docs/cws-credentials-setup.md` with one row for `CWS_TRAIN2GO_EXTENSION_ID` and update the surrounding prose to pluralize ("extension IDs").
- **Rationale**: the file is already structured as a per-phase setup guide — introducing a new section would suggest the train2go case needs distinct credentials, which it doesn't (only the `*_EXTENSION_ID` differs between matrix entries).
- **Layer**: docs.

### AI cost dialog: reuse `estimateTokens`/`estimateCost`, no new domain types

- **Choice**: add `BatchCostConfirmation` React component + `useBatchCostEstimate` hook. Component is presentation-only; hook wraps `estimateTokens` + `estimateCost` over the pending batch input. Dialog intercepts the existing "Process with AI" CTA before it dispatches to the batch processor.
- **Rationale**: the domain already owns the math. Adding a new application-level use case would duplicate logic. The hook is a thin React adapter keeping the React tree functional.
- **State**: ephemeral (useState inside the dialog container), per CLAUDE.md rule "Local UI → React state". Nothing goes to Zustand or Dexie.
- **Layer**: adapter (React UI). Domain/ports untouched.

### Monthly usage panel: read-only Dexie live query

- **Choice**: new `UsagePanel` under Settings with a `useLiveQuery` on the existing `UsageRecord` table filtered by `yearMonth` for the current + previous 5 months. Renders provider / total tokens / total USD per row.
- **Rationale**: the schema ships already (`UsageRecord` with `yearMonth`, `provider`, `inputTokens`, `outputTokens`, `costUsd`). A read-only panel needs no write path, no new repo methods, and no new Dexie migration.
- **State**: Dexie is the source; `useLiveQuery` binds it into the component. Per CLAUDE.md: "Persisted data → Dexie. Local UI → React state." The panel holds no local state.
- **Layer**: adapter (React UI).

### Context-menu spec extension: scenarios only, no requirement change

- **Choice**: add three `#### Scenario:` blocks under the existing "Custom context menu" requirement. If `EditorContextMenu` diverges, patch it to match the spec.
- **Rationale**: the requirement text already covers right-click semantics abstractly; the gap is scenario coverage. Adding new SHALLs would create a migration surface for a non-problem.
- **Layer**: spec + possibly adapter (React component).

### Branding tokens: spec sentence, no code change

- **Choice**: one additional sentence in the `branding` spec clarifying the `@import` pattern. No ESLint rule, no CSS-in-JS migration.
- **Rationale**: the pattern already ships and works. The drift was purely documentary.
- **Layer**: spec.

## Risks / Trade-offs

- **[Risk] `lychee` flags legitimate anchor links** → Mitigation: seed `lychee.toml` with `--include-fragments = true` AND an allowlist for known VitePress auto-anchors. Run once on a throwaway branch and ratchet down violations before enabling as required check.
- **[Risk] Cost estimates drift from real provider billing** → Mitigation: the dialog's cost line carries an explicit "estimate, not a bill" disclaimer. Monthly usage panel shows actual accumulated tokens/cost as recorded after each run — a separate signal from the estimate.
- **[Risk] `UsagePanel` over-queries Dexie on re-render** → Mitigation: `useLiveQuery` is already memoized per query spec; filter by the 6-month window once at mount.
- **[Risk] Context-menu scenarios catch bugs in `EditorContextMenu` we must fix in-scope** → Mitigation: add a brief "if found, fix here" task; if the gap is larger than one component, split into a follow-up change and soften the spec temporarily.
- **[Risk] Lychee CI step adds ~30s to PR feedback** → Mitigation: run in parallel with the existing `lint` job; the bottleneck remains `test` + `test-frontend`.
- **[Trade-off] We ship spec clarifications without renumbering the 22 canonical specs** → Accepted; `pnpm lint:specs` + `npx openspec validate --specs` cover the invariant.

## Migration Plan

1. Land the change under a single feature branch. PR splits are acceptable if reviewers prefer per-area chunks (CI, docs, AI UI, usage UI, spec-only) — but the tasks are authored so a single merge is viable.
2. CI check `check-links` starts as an informational check (advisory) for one week, then flips to required. The flip happens in a follow-up PR that edits `.github/workflows/ci.yml` advisory flag.
3. Rollback strategy: revert the feature branch. The CI step, docs edits, and SPA additions are all additive — no data migration, no stored state, no API contract change.
4. After merge: `/opsx-archive` folds delta specs into canonical ones and refreshes `openspec/changes/archive/README.md`; `pnpm lint:specs` verifies 22/22 still pass.

## Open Questions

- Should the `check-links` step also validate links inside spec Markdown under `openspec/`? Current plan: yes, since specs are first-class docs and a broken link there is a real defect. Revisit if noise outweighs signal.
- Should the `UsagePanel` expose a CSV/JSON export? Out of scope for this change; deferrable to a follow-up with its own proposal.
- Keyboard-hint label format for the context menu — do we follow macOS `⌘C` symbols or the portable `Cmd+C` string? Spec will standardize on `Cmd+C` / `Ctrl+C` for portability; macOS symbol variant is an optional cosmetic follow-up.
