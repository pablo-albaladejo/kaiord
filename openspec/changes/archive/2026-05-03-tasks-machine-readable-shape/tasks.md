<!-- opsx-ship: chunking
Single PR — pure tooling + docs change, no code in packages/**.
-->

## 1. Marker grammar in SPEC_TEMPLATE + AGENTS

- [x] 1.1 `openspec/SPEC_TEMPLATE.md` gains paragraph 7 documenting the `> Tasks: <C> completed, <D> deferred` marker — placement (top of `tasks.md`, before any chunking HTML comment), shape, and contract that the lint enforces ratio when present.
- [x] 1.2 `AGENTS.md` "Spec Awareness" section updated alongside the existing `> Deferred to:` paragraph, noting the new marker, placement, and that authors SHOULD add it when archiving.
- [x] 1.3 `pnpm lint:specs` passes.

## 2. Script — ratio invariant + legacy cap fallback

- [x] 2.1 `scripts/check-archive-followups.mjs` v2 parses `> Tasks: <C> completed, <D> deferred`. Per archive: marker present → ratio + audit checks (D ≤ C; declared D = actual `> Deferred to:` count); marker absent → legacy absolute-cap fallback (current behavior).
- [x] 2.2 Malformed `> Tasks:` marker (non-numeric counts, wrong field order, partial fields) fails the lint with a parse error naming the file and line.
- [x] 2.3 Mismatch between declared `D` and actual count of `> Deferred to: #N` in the same file fails with a clear message ("declares N deferred but tasks.md contains M lines — counts must agree").
- [x] 2.4 `ABSOLUTE_DEFERRAL_CAP` stays exported (for legacy archives without the marker).

## 3. Tests — co-located node:test branches

- [x] 3.1 New: v2 healthy ratio (5 deferred / 30 completed) — pass even though 5 ≥ legacy cap.
- [x] 3.2 New: v2 overscoped ratio (5 deferred / 2 completed) — fail with "5 deferred > 2 completed — change was overscoped" message.
- [x] 3.3 New: v2 declared/actual mismatch — declared 3, actual 2 in body — fail with mismatch message.
- [x] 3.4 New: v2 malformed marker (non-numeric counts) — fail with parse error.
- [x] 3.5 New: v2 zero deferred + non-zero completed — pass.
- [x] 3.6 New: v2 boundary D = C — pass (invariant is `D ≤ C`).
- [x] 3.7 New: legacy at-cap archive — fail message includes hint "add > Tasks: ..." for upgrade path.
- [x] 3.8 All 8 pre-existing tests still pass (zero deferrals, below-cap, malformed deferred-to, multi-archive, missing tasks.md). Total: 15/15 green.

## 4. Live spec update

- [x] 4.1 `openspec/specs/archive-followups-guard/spec.md` rewritten to reflect the v2 contract: 5 requirements (Deferred-to marker, Tasks marker, Ratio invariant, Legacy cap fallback, Architectural mirror). `> Synced:` updated to today + this change slug.
- [x] 4.2 `npx openspec validate --specs --strict` passes.
- [x] 4.3 `npx openspec validate tasks-machine-readable-shape --strict` passes.

## 5. Validate + commit

- [x] 5.1 `pnpm test:scripts` — 15 archive-followups tests pass; total scripts test suite passes.
- [x] 5.2 `pnpm lint:archive-followups` — passes against current archive state (the existing `2026-05-01-calendar-coaching-redesign` archive at 5 deferrals, no marker, stays under legacy cap of 6).
- [x] 5.3 `pnpm lint:specs` — 33/33 passes.
- [x] 5.4 Pre-commit + pre-push hooks pass.
- [ ] 5.5 PR opens; reviewer can verify (a) test coverage of both modes, (b) backward-compat (existing archives still pass), (c) the SPEC_TEMPLATE/AGENTS docs guide authors to use the marker on new archives.
