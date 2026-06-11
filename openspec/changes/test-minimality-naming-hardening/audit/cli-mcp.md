I now have everything needed. The `config-integration.test.ts` confirms all 6 tests assert only `toBeDefined()` (no observable outcome). The MCP garmin tests have a few `toHaveBeenCalledWith` but always alongside an observable `result.content`/`isError` assertion, so they're not pure mock-call tests. I have a complete picture. Let me compile the audit findings.

## CLI PACKAGE (`packages/cli`)

### redundant

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/commands/config-integration.test.ts:21-218` — all 6 `it()` blocks assert only `expect(result.exitCode).toBeDefined()` (verified: grep finds 6 occurrences, all in this file; no test inspects stdout/stderr/output file). `exitCode` is _always_ defined after `execa(...,{reject:false})`, so every assertion is vacuously true regardless of whether config merging worked — why: tests spawn the real binary (~15s timeout each) yet verify nothing about config behavior (the config files written are never shown to have any effect); a config-loading regression would pass all 6 — fix: either assert the observable effect (e.g. output file written to `defaultOutputDir`, `--verbose` produced log lines, invalid config still succeeded with a warning) or delete the file entirely and rely on `config-loader.test.ts` which already unit-tests `loadConfig`/`mergeWithConfig` with real assertions. ~6 deletable as-is.

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/utils/file-handler.test.ts:234-312` — `describe("validatePathSecurity")` (2 cases) and `describe("isNodeSystemError")` (3 cases) re-test functions that `file-handler.ts` only re-exports (lines 13-14: `export { isNodeSystemError } from "./fs-errors"; export { validatePathSecurity } from "./path-security"`). The same functions are exhaustively tested in `path-security.test.ts` (22 cases) and `fs-errors.test.ts` (7 cases) — why: identical equivalence classes (null byte, shell metachar, `code` property) tested 2-3× through a pass-through re-export; no branch in `file-handler` distinguishes them — fix: delete the `validatePathSecurity` and `isNodeSystemError` describe blocks from `file-handler.test.ts` (keep only `readFile`/`writeFile`/`findFiles`). ~5 deletable.

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/utils/error-formatter.test.ts:236-371` vs `packages/cli/src/utils/format-violations.test.ts` — `error-formatter.ts` only re-exports `formatToleranceViolations`/`formatValidationErrors` from `format-violations.ts` (lines 8-11). Both test files assert the same `"Validation errors:"`/`"Tolerance violations:"`/`"expected 300, got 301"`/empty-array → `""`/negative-deviation-absolute-value behaviors against the same function — why: full overlap of the violation-formatter equivalence classes across two files; `error-formatter.test.ts` adds nothing for these two functions — fix: remove the `formatValidationErrors` and `formatToleranceViolations` describe blocks from `error-formatter.test.ts`; keep `format-violations.test.ts` (it additionally covers TTY/FORCE_COLOR branches). ~5-6 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/error-formatter.test.ts:265-279` — exact duplicate of `:237-252`: same describe, both titled "should format validation errors with field paths", same single-error input shape, same `toContain("version: Required field missing")` assertion — why: literal copy with no distinguishing input/branch — fix: delete one. 1 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/format-detector.test.ts:91-150` (`validateFormat`) and `:153-176` (`fileFormatSchema`) — `validateFormat("fit"/"krd"/"tcx"/"zwo")` are 4 near-identical happy-path cases for a thin Zod-`safeParse` wrapper, and `fileFormatSchema` re-tests the same enum the wrapper delegates to (valid "fit" / invalid "invalid") — why: per-format re-testing of the underlying Zod enum (arg-parser-library behavior), and `fileFormatSchema` duplicates `validateFormat`'s valid/invalid classes — fix: collapse the four `validateFormat` valid cases into one `it.each(["fit","krd","tcx","zwo"])`; drop `fileFormatSchema` valid/invalid (covered by `validateFormat`). ~4 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/file-handler.test.ts:42-82` (read KRD/TCX/ZWO as string) and `:140-180` (write KRD/TCX/ZWO from string) — three text formats are the same equivalence class in the implementation: `readFile`/`writeFile` branch only on `format === "fit"` vs else (see `file-handler.ts:26-31, 65-69`); KRD/TCX/ZWO take the identical `else` branch — why: three tests exercise one branch with no discriminating logic — fix: `it.each(["krd","tcx","zwo"])` for read and for write (or keep one representative each). ~4 deletable.

- [SEVERITY low] [CATEGORY redundant] `packages/cli/src/utils/format-detector.test.ts:10-48` — `detectFormat` `.fit/.krd/.tcx/.zwo` are four parallel cases differing only by literal; ideal `it.each`. Also `detectFormat` here overlaps MCP's `detectFormatFromPath` tests (`format-registry.test.ts`) which test the identical extension-detection concept in another package (acceptable cross-package, noting for awareness). Count: ~3 collapsible.

### gap

- [SEVERITY med] [CATEGORY gap] `packages/cli/src/commands/convert-integration.test.ts` — no test for unsupported format-combination errors (e.g. `--output-format invalid`, or text→FIT with mismatched data) and no test asserting the _content_ of a non-KRD output (TCX/ZWO conversions go untested end-to-end at the CLI layer; only FIT→KRD and KRD→FIT round trips exist) — why: happy path FIT↔KRD is well covered but the multi-format matrix and bad-format-arg path are untested at integration level — fix: add a `--output-format zwo`/`tcx` conversion test asserting output markers, and an invalid-format exit-code test.

- [SEVERITY low] [CATEGORY gap] `packages/cli/src/utils/file-handler.test.ts:94-102` — "should throw error for permission denied" reads `/root/protected.fit` and only asserts `.rejects.toThrow()` (no message/code) — why: on many CI environments `/root` may be readable or absent → this either tests ENOENT (already covered) or is environment-dependent; it does not actually assert the `Permission denied:` branch — fix: simulate EACCES via a mocked `fsReadFile` rejection like `directory-handler.test.ts` does, and assert the `"Permission denied"` message.

### name

- [SEVERITY low] [CATEGORY name] `packages/cli/src/commands/garmin/{list,login,logout,push}.test.ts` — describe blocks are named after the internal function (`describe("listCommand")`, `"loginCommand"`, `"pushCommand"`) rather than user-observable behavior — why: convention elsewhere uses the user-facing tool/command name; minor, the `it()` titles themselves are behavior-focused — fix: rename to `"garmin list"` / `"garmin login"` etc. Count ~4 files.

## MCP PACKAGE (`packages/mcp`)

### redundant

- [SEVERITY high] [CATEGORY redundant] `packages/mcp/src/tools/kaiord-list-formats.test.ts:50-66` ("should mark FIT as binary…") and `:31-48` ("should include format details") — these re-assert the exact `binary`/`extension`/`name` data already exhaustively asserted in `format-registry.test.ts:22-54`; `kaiord-list-formats.ts` is a pure `Object.entries(FORMAT_REGISTRY).map(...)` pass-through (verified source) — why: the MCP-client round trip adds no discrimination over the unit test of the registry it serializes; the binary-flag and extension classes are tested in `format-registry.test.ts`, `tool-schemas.test.ts`, AND here — fix: keep one list-formats test that asserts the JSON envelope/shape (`toHaveLength(5)` + names present); delete the per-field `binary`/`extension` re-assertions. ~2 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/mcp/src/types/tool-schemas.test.ts:31-66` (`BINARY_FORMATS` + `isBinaryFormat`) vs `packages/mcp/src/utils/format-registry.test.ts:22-41` (`FORMAT_REGISTRY.*.binary`) — both assert "fit is binary, tcx/zwo/gcn/krd are not" against parallel sources of the same fact (verified: `BINARY_FORMATS` is an independent hardcoded `new Set(["fit"])`, not derived from the registry) — why: same equivalence class (one binary format) tested across two files plus `list-formats`; `isBinaryFormat` is a one-line `BINARY_FORMATS.has` wrapper, so `isBinaryFormat` + `BINARY_FORMATS` is itself a double-test in the same file — fix: merge `isBinaryFormat`/`BINARY_FORMATS` into one block; this is a genuine duplicate-source-of-truth risk worth flagging to architecture too (consider deriving `BINARY_FORMATS` from `FORMAT_REGISTRY`). ~2 collapsible.

- [SEVERITY med] [CATEGORY redundant] `packages/mcp/src/utils/format-registry.test.ts:57-141` (`detectFormatFromPath`, 5 per-format cases) — FIT/TCX/ZWO/GCN/KRD detection cases differ only by literal extension; the impl is one `Object.entries(...).find(extension===ext)` (verified `detect-format-from-path.ts`) with no per-format branch — why: re-tests one code path 5× — fix: `it.each([["file.fit","fit"],...])`; keep the distinct null/case-insensitive/no-dot cases. ~4 collapsible.

- [SEVERITY low] [CATEGORY redundant] `packages/mcp/src/tools/kaiord-inspect.test.ts:23-39` ("should return summary for KRD file") and `:41-57` ("should detect format from file extension") — both write a `.krd`, call inspect with `input_file`, and assert `content[0].text` contains `"Type:"`; the second adds only `isError` undefined — why: same input equivalence class (a `.krd` file path, auto-detected) tested twice; the second's title implies extension-detection discrimination that isn't exercised (no non-`.krd` extension or `input_format` override is compared) — fix: merge into one, or make the second genuinely test override/mismatch. 1 deletable.

- [SEVERITY low] [CATEGORY redundant] `packages/mcp/src/tools/convert-to-krd.test.ts:38-49` ("KRD file to KRD object") and `:77-88` ("auto-detect format from file extension") — both write a `.krd` file, call `convertToKrd(filePath, undefined, undefined, logger)`, assert `version === "1.0"`; byte-identical call signature — why: same equivalence class, the "auto-detect" title describes the same code path the first test already hits (format undefined → detect from `.krd`) — fix: delete one. 1 deletable.

### gap

- [SEVERITY med] [CATEGORY gap] `packages/mcp/src/tools/kaiord-get-{hrv-history,recovery-status,sleep-history,weight-history}.test.ts` — each has only a single happy-path `it()` and no `skipped`/error case, while the sibling `kaiord-get-health-summary.test.ts:45-59` does test the `skipped`-count path — why: asymmetric coverage; the `skipped` counter and invalid-file handling in these four tools is untested even though every response shape includes `skipped` — fix: add one `["/nonexistent/file.fit"]` case per tool asserting `skipped === 1` (or factor a shared `it.each` over the four tools). 4 gaps.

- [SEVERITY med] [CATEGORY gap] `packages/mcp/src/tools/convert-from-krd.test.ts` — no test for the `output_format: "invalid"`/unsupported-format error path (the CLI's `krd-converter.test.ts` covers `"Unsupported output format"`, but the MCP `convert-from-krd` does not) and no FIT/GCN/ZWO content round-trip beyond TCX/KRD/FIT-binary — why: error branch and several writer formats untested in MCP layer — fix: add an unsupported-format rejection test.

- [SEVERITY low] [CATEGORY gap] `packages/mcp/src/tools/kaiord-validate.test.ts:55-67` and `:69-81` — both error cases ("invalid JSON", "schema mismatch") assert only `isError === true`, not the message — why: a misrouted error (e.g. file-not-found surfacing instead of schema error) would still pass; minor — fix: assert the error text distinguishes the two failure modes.

### name

- [SEVERITY low] [CATEGORY name] `packages/mcp/src/tools/kaiord-garmin-{list,login,logout,push}.test.ts` and `garmin-client-state.test.ts:33` ("should create a singleton client") — a handful of titles lean on implementation vocabulary ("singleton client", "should pass limit and offset options" at `kaiord-garmin-list.test.ts:74`) rather than observable outcome — why: "pass limit and offset" describes the mock-call (`toHaveBeenCalledWith({limit:5,offset:10})`) not a user-visible result; acceptable as a thin wiring assertion but the title overstates behavior — fix: reword to the observable ("should forward pagination to the workout service") or fold into the list happy-path. Count ~3 (low).

## SCRIPTS (`scripts/*.test.mjs`, node:test)

### redundant

- [SEVERITY low] [CATEGORY redundant] `scripts/check-converter-has-tests.test.mjs:52-68` (`.test.tsx` and `.spec.ts` sibling) — two near-identical cases differing only by sibling extension; same "no violation" branch — candidate for `it.each` over `[".test.tsx",".spec.ts"]`. Same shape in `check-mapper-no-tests.test.mjs:60-76` (`.test.tsx`/`.spec.ts` variants). ~2-3 collapsible each, low value to change.

- [SEVERITY low] [CATEGORY redundant] `scripts/it-title-extractor.test.mjs` and `scripts/measure-it-titles-histogram.test.mjs` — overlapping coverage of the same parsing concerns (`it.skip/only/todo/fails`, `it.each` outer-title, `\bit\b` boundary rejecting `submit`/`commit`) — why: two title-extraction utilities tested with parallel fixtures; not strictly redundant (different functions: `findItTitles` returns positions, `extractFirstWords` returns words) but the `\bit\b` and `it.each` edge cases are duplicated — fix: none required; note only. 0 safely deletable.

### name / general

- No naming or vacuous-assertion issues found in scripts. Titles are behavior-focused, names use real-outcome language, and every check has a real-tree smoke test plus sandboxed positive/negative cases. The `assert.equal(result.status, 0)` + `assert.match(stderr/stdout, ...)` pattern always pairs an exit code with an observable message — exemplary.

---

## Per-package verdicts

**`packages/cli`** — Redundancy: **C** (re-export pass-throughs tested 2-3×: path-security, fs-errors, violation formatters; per-format/per-flag fan-out). Completeness: **B** (error paths generally well covered via exit codes; gaps in multi-format conversion and the EACCES branch). Naming: **A-** (titles are behavior-focused and observable; only describe-block names lean internal).
Top 3 actions: (1) delete the duplicate `validatePathSecurity`/`isNodeSystemError` blocks in `file-handler.test.ts` and the violation-formatter blocks in `error-formatter.test.ts`; (2) make `config-integration.test.ts` assert observable effects or delete it (6 vacuous `toBeDefined()` tests); (3) `it.each` the per-format read/write/detect/validate fan-out.
Approx deletable/collapsible: **~30 `it()` blocks** (~6 config, ~5 file-handler dupes, ~6 error-formatter dupes, ~1 exact dup, ~8 format fan-out, ~4 misc).

**`packages/mcp`** — Redundancy: **B-** (the binary-format fact is asserted across `tool-schemas`, `format-registry`, and `kaiord-list-formats`; a few twin happy-path tests). Completeness: **B-** (strong client-level happy/error coverage for convert/diff/inspect/validate; the four health-history tools lack skipped/error cases; convert-from-krd lacks unsupported-format path). Naming: **A-** (MCP-client tests assert real `content`/`isError` payloads; titles describe behavior).
Top 3 actions: (1) consolidate the binary-format/extension assertions to one source-of-truth test and stop re-asserting them through `list-formats`; (2) add `skipped`/invalid-file cases to hrv/recovery/sleep/weight history tools; (3) `it.each` the per-format `detectFormatFromPath` cases and merge the twin convert-to-krd/inspect `.krd` tests.
Approx deletable/collapsible: **~14 `it()` blocks** (~2 list-formats, ~2 tool-schemas, ~4 detect-format fan-out, ~2 twin happy paths) plus **~4-5 to add** (health error paths).

**`scripts/*.test.mjs`** — Redundancy: **A-** (minor sibling-extension fan-out worth `it.each`). Completeness: **A** (positive + negative + real-tree smoke + calendar/edge cases throughout). Naming: **A** (outcome-focused; `status`+message pairing).
Top 3 actions: (1) optionally `it.each` the `.test.tsx`/`.spec.ts` sibling variants in converter/mapper checks; (2) none material; (3) none. Approx deletable: **~0** (a handful collapsible into `it.each` but no dead/vacuous tests).

**Total approx deletable/collapsible across all three: ~44 `it()` blocks** (CLI ~30, MCP ~14, scripts ~0 truly deletable), with **~4-5 net-new** MCP health error-path tests recommended to balance over-tested happy paths.

Relevant files:

- `/Users/pablo/development/kaiord/packages/cli/src/commands/config-integration.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/file-handler.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/error-formatter.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/format-violations.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/format-detector.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/path-security.test.ts`
- `/Users/pablo/development/kaiord/packages/cli/src/utils/fs-errors.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-list-formats.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/types/tool-schemas.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/utils/format-registry.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-get-hrv-history.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-get-recovery-status.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-get-sleep-history.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-get-weight-history.test.ts`
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/convert-from-krd.test.ts`

===NEXT-BLOCK===

I've completed the audit of the test suites across `packages/cli`, `packages/mcp`, and `scripts/*.test.mjs`. Here is the summary of what I found.

## Headline findings

**The single biggest issue** is in `packages/cli/src/commands/config-integration.test.ts`: all 6 tests assert only `expect(result.exitCode).toBeDefined()`, which is vacuously true after every `execa(...,{reject:false})` call. These tests spawn the real binary (~15s timeout each) but verify nothing about config behavior — a config-loading regression would pass all 6. Either assert observable effects or delete the file.

**Re-export pass-throughs tested 2-3×** (CLI): `file-handler.ts` only re-exports `validatePathSecurity`/`isNodeSystemError`, yet they're tested in `file-handler.test.ts` AND their own dedicated files. Same for the violation formatters tested in both `error-formatter.test.ts` and `format-violations.test.ts`. There's even an exact-duplicate `it()` in `error-formatter.test.ts` (lines 237 and 265, identical title and body).

**Binary-format fact triple-tested** (MCP): "fit is binary, others are not" is asserted in `tool-schemas.test.ts`, `format-registry.test.ts`, and again through the MCP client in `kaiord-list-formats.test.ts` — which is a pure pass-through serializer of `FORMAT_REGISTRY`.

**Coverage asymmetry** (MCP): the four health-history tools (hrv/recovery/sleep/weight) have only a single happy-path test each with no `skipped`/error case, while their sibling `health-summary` does test the skipped path.

**Scripts are exemplary** — behavior-focused names, sandboxed positive/negative cases, real-tree smoke tests, calendar edge cases. Nothing truly deletable; only minor `it.each` collapsing opportunities.

## Grades

| Package              | Redundancy | Completeness | Naming |
| -------------------- | ---------- | ------------ | ------ |
| `packages/cli`       | C          | B            | A-     |
| `packages/mcp`       | B-         | B-           | A-     |
| `scripts/*.test.mjs` | A-         | A            | A      |

**Approx deletable/collapsible: ~44 `it()` blocks** (CLI ~30, MCP ~14, scripts ~0), with **~4-5 net-new** MCP health error-path tests recommended to balance over-tested happy paths.

The full structured findings (with file:line, evidence, why, and fix for each) and per-package top-3 actions are in my detailed report above. Note: I deliberately excluded the mechanically-enforced conventions (it-title "should " prefix, AAA comments) per your instructions, and confirmed the MCP client-wiring tests are genuine integration tests (they assert `result.content`/`isError` payloads), not pure mock-call assertions — so they were not flagged.

===NEXT-BLOCK===

The audit is complete. The detailed structured findings with file:line evidence, per-package verdicts, top-3 actions, and deletable counts were delivered in my analysis above.

Key relevant files for follow-up action (absolute paths):

**CLI — redundancy cleanup:**

- `/Users/pablo/development/kaiord/packages/cli/src/commands/config-integration.test.ts` (6 vacuous `toBeDefined()` tests)
- `/Users/pablo/development/kaiord/packages/cli/src/utils/file-handler.test.ts` (duplicate `validatePathSecurity`/`isNodeSystemError` blocks)
- `/Users/pablo/development/kaiord/packages/cli/src/utils/error-formatter.test.ts` (duplicate violation-formatter blocks + exact-dup `it()` at L237/L265)
- `/Users/pablo/development/kaiord/packages/cli/src/utils/format-detector.test.ts` (per-format fan-out → `it.each`)

**MCP — consolidation + gaps:**

- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-list-formats.test.ts` (re-asserts `FORMAT_REGISTRY` data)
- `/Users/pablo/development/kaiord/packages/mcp/src/types/tool-schemas.test.ts` + `/Users/pablo/development/kaiord/packages/mcp/src/utils/format-registry.test.ts` (binary-format fact duplicated)
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/kaiord-get-hrv-history.test.ts`, `kaiord-get-recovery-status.test.ts`, `kaiord-get-sleep-history.test.ts`, `kaiord-get-weight-history.test.ts` (missing skipped/error-path coverage)
- `/Users/pablo/development/kaiord/packages/mcp/src/tools/convert-from-krd.test.ts` (missing unsupported-format error path)

No further investigation is pending. If you'd like, I can proceed to draft the concrete edits (deletions + `it.each` collapses + the ~4-5 new MCP health error-path tests), but that authoring work should go through a separate executor pass rather than this review lane.

===NEXT-BLOCK===

The audit is complete and the full findings have been delivered. No work remains in this review lane.

To recap the actionable output for whoever picks up the implementation:

**Top priorities (high severity):**

1. `packages/cli/src/commands/config-integration.test.ts` — 6 vacuous `exitCode.toBeDefined()` tests; assert observable effects or delete.
2. `packages/cli/src/utils/file-handler.test.ts` — delete the `validatePathSecurity`/`isNodeSystemError` blocks (re-export pass-throughs already tested in `path-security.test.ts` / `fs-errors.test.ts`).
3. `packages/cli/src/utils/error-formatter.test.ts` — delete the violation-formatter blocks (re-exported from `format-violations.test.ts`) and the exact-duplicate `it()` at L237/L265.
4. `packages/mcp/src/tools/kaiord-list-formats.test.ts` — drop the per-field binary/extension re-assertions (pure `FORMAT_REGISTRY` pass-through).

**Gaps to fill (~4-5 new tests):** add skipped/invalid-file cases to the MCP hrv/recovery/sleep/weight history tools, and an unsupported-format rejection test to `convert-from-krd.test.ts`.

**Verdicts:** CLI redundancy C / completeness B / naming A-; MCP B- / B- / A-; scripts A- / A / A. Approx ~44 `it()` blocks deletable or collapsible.

Authoring the actual edits should go through a separate executor pass to keep authoring and review in distinct lanes. Let me know if you want me to hand this off.

===NEXT-BLOCK===

# Test Suite Audit — `packages/cli`, `packages/mcp`, `scripts/*.test.mjs`

Format: `- [SEVERITY] [CATEGORY] file:line — evidence — why — fix`

---

## PACKAGE: `packages/cli`

### redundant

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/commands/config-integration.test.ts:21-218` — all 6 `it()` blocks assert only `expect(result.exitCode).toBeDefined()` (verified: grep finds exactly 6 occurrences, all in this file; no test inspects stdout/stderr/output file) — `exitCode` is always defined after `execa(...,{reject:false})`, so every assertion is vacuously true; these spawn the real binary (~15s timeout each) yet a config-loading regression would pass all 6 — fix: assert the observable effect (output file written to `defaultOutputDir`, `--verbose` produced log lines, invalid config still succeeded) or delete the file and rely on `config-loader.test.ts` which already unit-tests `loadConfig`/`mergeWithConfig` with real assertions. ~6 deletable.

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/utils/file-handler.test.ts:234-312` — `describe("validatePathSecurity")` (2 cases) and `describe("isNodeSystemError")` (3 cases) re-test functions that `file-handler.ts:13-14` only re-exports (`export { isNodeSystemError } from "./fs-errors"; export { validatePathSecurity } from "./path-security"`); the same functions are exhaustively tested in `path-security.test.ts` (22 cases) and `fs-errors.test.ts` (7 cases) — identical equivalence classes (null byte, shell metachar, `code` property) tested 2-3× through a pass-through re-export with no distinguishing branch — fix: delete the `validatePathSecurity` and `isNodeSystemError` describe blocks from `file-handler.test.ts`; keep only `readFile`/`writeFile`/`findFiles`. ~5 deletable.

- [SEVERITY high] [CATEGORY redundant] `packages/cli/src/utils/error-formatter.test.ts:236-371` vs `packages/cli/src/utils/format-violations.test.ts` — `error-formatter.ts:8-11` only re-exports `formatToleranceViolations`/`formatValidationErrors` from `format-violations.ts`; both files assert the same `"Validation errors:"`/`"Tolerance violations:"`/`"expected 300, got 301"`/empty-array→`""`/negative-deviation-absolute-value behaviors against the same function — full overlap of the violation-formatter equivalence classes across two files — fix: remove the `formatValidationErrors`/`formatToleranceViolations` describe blocks from `error-formatter.test.ts`; keep `format-violations.test.ts` (it additionally covers TTY/FORCE_COLOR branches). ~5-6 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/error-formatter.test.ts:265-279` — exact duplicate of `:237-252`: same describe, both titled "should format validation errors with field paths", same single-error input, same `toContain("version: Required field missing")` — literal copy with no distinguishing input/branch — fix: delete one. 1 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/format-detector.test.ts:91-150` (`validateFormat`) and `:153-176` (`fileFormatSchema`) — `validateFormat("fit"/"krd"/"tcx"/"zwo")` are 4 near-identical happy paths for a thin Zod-`safeParse` wrapper, and `fileFormatSchema` re-tests the same enum the wrapper delegates to — per-format re-testing of the underlying Zod enum (arg-parser-library behavior), and `fileFormatSchema` duplicates `validateFormat`'s valid/invalid classes — fix: collapse the four valid cases into one `it.each`; drop `fileFormatSchema` valid/invalid. ~4 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/cli/src/utils/file-handler.test.ts:42-82` (read KRD/TCX/ZWO as string) and `:140-180` (write KRD/TCX/ZWO from string) — three text formats are one equivalence class in the impl: `readFile`/`writeFile` branch only on `format === "fit"` vs else (`file-handler.ts:26-31, 65-69`); KRD/TCX/ZWO take the identical else branch — three tests exercise one branch — fix: `it.each(["krd","tcx","zwo"])` for read and for write. ~4 deletable.

- [SEVERITY low] [CATEGORY redundant] `packages/cli/src/utils/format-detector.test.ts:10-48` — `detectFormat` `.fit/.krd/.tcx/.zwo` are four parallel cases differing only by literal — ideal `it.each` — fix: collapse. ~3 collapsible.

### gap

- [SEVERITY med] [CATEGORY gap] `packages/cli/src/commands/convert-integration.test.ts` — no test for unsupported format-combination errors (`--output-format invalid`) and no test asserting the content of a non-KRD output (TCX/ZWO conversions go untested end-to-end at the CLI; only FIT→KRD and KRD→FIT exist) — happy-path FIT↔KRD is well covered but the multi-format matrix and bad-format-arg path are untested at integration level — fix: add a `--output-format zwo`/`tcx` conversion test asserting output markers, plus an invalid-format exit-code test.

- [SEVERITY low] [CATEGORY gap] `packages/cli/src/utils/file-handler.test.ts:94-102` — "should throw error for permission denied" reads `/root/protected.fit` and asserts only `.rejects.toThrow()` (no message/code) — on many CI envs `/root` is absent/readable, so this tests ENOENT (already covered) or is env-dependent; it never actually asserts the `Permission denied:` branch — fix: simulate EACCES via a mocked `fsReadFile` rejection (as `directory-handler.test.ts` does) and assert the `"Permission denied"` message.

### name

- [SEVERITY low] [CATEGORY name] `packages/cli/src/commands/garmin/{list,login,logout,push}.test.ts` — describe blocks named after the internal function (`describe("listCommand")`, `"pushCommand"`, etc.) rather than user-observable behavior; the `it()` titles themselves are fine — fix: rename to `"garmin list"` / `"garmin login"` etc. ~4 files.

---

## PACKAGE: `packages/mcp`

### redundant

- [SEVERITY high] [CATEGORY redundant] `packages/mcp/src/tools/kaiord-list-formats.test.ts:31-66` ("should include format details" + "should mark FIT as binary…") — re-assert the exact `binary`/`extension`/`name` data already exhaustively asserted in `format-registry.test.ts:22-54`; `kaiord-list-formats.ts` is a pure `Object.entries(FORMAT_REGISTRY).map(...)` pass-through (verified source) — the MCP-client round trip adds no discrimination over the unit test of the registry it serializes; binary-flag/extension classes are tested in `format-registry.test.ts`, `tool-schemas.test.ts`, AND here — fix: keep one list-formats test asserting the JSON envelope/shape (`toHaveLength(5)` + names present); delete per-field `binary`/`extension` re-assertions. ~2 deletable.

- [SEVERITY med] [CATEGORY redundant] `packages/mcp/src/types/tool-schemas.test.ts:31-66` (`BINARY_FORMATS` + `isBinaryFormat`) vs `packages/mcp/src/utils/format-registry.test.ts:22-41` (`FORMAT_REGISTRY.*.binary`) — both assert "fit is binary, tcx/zwo/gcn/krd are not" against parallel sources of the same fact (verified: `BINARY_FORMATS` is an independent hardcoded `new Set(["fit"])`, not derived from the registry); `isBinaryFormat` is a one-line `BINARY_FORMATS.has` wrapper so `isBinaryFormat`+`BINARY_FORMATS` is a double-test in the same file — same equivalence class across three files plus a duplicate-source-of-truth risk — fix: merge `isBinaryFormat`/`BINARY_FORMATS` into one block; flag to architecture (consider deriving `BINARY_FORMATS` from `FORMAT_REGISTRY`). ~2 collapsible.

- [SEVERITY med] [CATEGORY redundant] `packages/mcp/src/utils/format-registry.test.ts:57-141` (`detectFormatFromPath`, 5 per-format cases) — FIT/TCX/ZWO/GCN/KRD cases differ only by literal extension; impl is one `Object.entries(...).find(extension===ext)` (verified `detect-format-from-path.ts`) with no per-format branch — re-tests one path 5× — fix: `it.each([["file.fit","fit"],...])`; keep the distinct null/case-insensitive/no-dot cases. ~4 collapsible.

- [SEVERITY low] [CATEGORY redundant] `packages/mcp/src/tools/kaiord-inspect.test.ts:23-39` ("should return summary for KRD file") and `:41-57` ("should detect format from file extension") — both write a `.krd`, call inspect with `input_file`, assert `content[0].text` contains `"Type:"`; the second adds only `isError` undefined — same input equivalence class (auto-detected `.krd` path) twice; the "detect format" title implies discrimination not exercised (no non-`.krd` extension or override compared) — fix: merge, or make the second genuinely test override/mismatch. 1 deletable.

- [SEVERITY low] [CATEGORY redundant] `packages/mcp/src/tools/convert-to-krd.test.ts:38-49` ("KRD file to KRD object") and `:77-88` ("auto-detect format from file extension") — both write a `.krd`, call `convertToKrd(filePath, undefined, undefined, logger)`, assert `version === "1.0"`; byte-identical call signature — same equivalence class; the "auto-detect" title describes the same code path the first already hits (format undefined → detect from `.krd`) — fix: delete one. 1 deletable.

### gap

- [SEVERITY med] [CATEGORY gap] `packages/mcp/src/tools/kaiord-get-{hrv-history,recovery-status,sleep-history,weight-history}.test.ts` — each has only a single happy-path `it()` and no `skipped`/error case, while sibling `kaiord-get-health-summary.test.ts:45-59` does test the skipped path — asymmetric coverage; the `skipped` counter and invalid-file handling are untested even though every response shape includes `skipped` — fix: add one `["/nonexistent/file.fit"]` case per tool asserting `skipped === 1` (or a shared `it.each` over the four tools). 4 gaps.

- [SEVERITY med] [CATEGORY gap] `packages/mcp/src/tools/convert-from-krd.test.ts` — no test for the unsupported-`output_format` error path (the CLI's `krd-converter.test.ts` covers `"Unsupported output format"`, but MCP `convert-from-krd` does not) and no GCN/ZWO writer content round-trip — error branch and several writer formats untested at MCP layer — fix: add an unsupported-format rejection test.

- [SEVERITY low] [CATEGORY gap] `packages/mcp/src/tools/kaiord-validate.test.ts:55-67` and `:69-81` — both error cases ("invalid JSON", "schema mismatch") assert only `isError === true`, not the message — a misrouted error (e.g. file-not-found surfacing instead of schema error) would still pass — fix: assert the error text distinguishes the two failure modes.

### name

- [SEVERITY low] [CATEGORY name] `packages/mcp/src/tools/kaiord-garmin-list.test.ts:74` ("should pass limit and offset options") and `packages/mcp/src/utils/garmin-client-state.test.ts:33` ("should create a singleton client") — titles lean on implementation vocabulary; "pass limit and offset" describes the mock-call (`toHaveBeenCalledWith({limit:5,offset:10})`) not a user-visible result — acceptable as thin wiring assertions but the title overstates behavior — fix: reword to the observable ("should forward pagination to the workout service") or fold into the list happy-path. ~3 (low).

Note: the MCP client-wiring tests (`kaiord_convert`, `kaiord_diff`, `kaiord_inspect`, `kaiord_validate`, garmin tools) were checked and are genuine integration tests — they assert `result.content[0].text`/`isError` payloads, not pure mock-call registration — so they are NOT flagged as useless wiring tests.

---

## SCRIPTS (`scripts/*.test.mjs`, node:test — exempt from it-title/AAA rules)

### redundant

- [SEVERITY low] [CATEGORY redundant] `scripts/check-converter-has-tests.test.mjs:52-68` (`.test.tsx` and `.spec.ts` sibling) — two near-identical cases differing only by sibling extension, same "no violation" branch — candidate for `it.each` over `[".test.tsx",".spec.ts"]`; same shape in `scripts/check-mapper-no-tests.test.mjs:60-76` — fix: optional `it.each`, low value. ~2-3 collapsible each.

- [SEVERITY low] [CATEGORY redundant] `scripts/it-title-extractor.test.mjs` and `scripts/measure-it-titles-histogram.test.mjs` — overlapping fixtures for the same parsing concerns (`it.skip/only/todo/fails`, `it.each` outer-title, `\bit\b` boundary rejecting `submit`/`commit`) — not strictly redundant (different functions: `findItTitles` returns positions, `extractFirstWords` returns words) but the edge cases are duplicated — fix: none required; note only. 0 safely deletable.

### name / general

- No naming or vacuous-assertion issues. Titles are behavior-focused, names use real-outcome language, every check has a real-tree smoke test plus sandboxed positive/negative cases, and the `assert.equal(result.status, 0)` + `assert.match(stderr/stdout, ...)` pattern always pairs an exit code with an observable message. Exemplary.

---

## PER-PACKAGE VERDICTS

**`packages/cli`** — Redundancy: **C** · Completeness: **B** · Naming: **A-**
Re-export pass-throughs tested 2-3× (path-security, fs-errors, violation formatters) and per-format/per-flag fan-out drag redundancy down; error paths are otherwise well covered via exit codes; gaps in multi-format conversion and the EACCES branch; titles are behavior-focused (only describe-block names lean internal).
Top 3 actions: (1) delete the duplicate `validatePathSecurity`/`isNodeSystemError` blocks in `file-handler.test.ts` and the violation-formatter blocks in `error-formatter.test.ts`; (2) make `config-integration.test.ts` assert observable effects or delete it (6 vacuous tests); (3) `it.each` the per-format read/write/detect/validate fan-out.
Approx deletable/collapsible: **~30 `it()` blocks** (~6 config, ~5 file-handler dupes, ~6 error-formatter dupes, ~1 exact dup, ~8 format fan-out, ~4 misc).

**`packages/mcp`** — Redundancy: **B-** · Completeness: **B-** · Naming: **A-**
The binary-format fact is asserted across `tool-schemas`, `format-registry`, and `kaiord-list-formats`; a few twin happy-path tests exist; client-level happy/error coverage for convert/diff/inspect/validate is strong, but the four health-history tools lack skipped/error cases and convert-from-krd lacks the unsupported-format path; MCP-client tests assert real payloads.
Top 3 actions: (1) consolidate the binary-format/extension assertions to one source of truth and stop re-asserting through `list-formats`; (2) add `skipped`/invalid-file cases to hrv/recovery/sleep/weight history tools; (3) `it.each` the `detectFormatFromPath` cases and merge the twin convert-to-krd/inspect `.krd` tests.
Approx deletable/collapsible: **~14 `it()` blocks** (~2 list-formats, ~2 tool-schemas, ~4 detect-format fan-out, ~2 twin happy paths), plus **~4-5 net-new** health/convert error-path tests recommended.

**`scripts/*.test.mjs`** — Redundancy: **A-** · Completeness: **A** · Naming: **A**
Positive + negative + real-tree smoke + calendar/edge cases throughout; only minor sibling-extension fan-out worth `it.each`.
Top 3 actions: (1) optionally `it.each` the `.test.tsx`/`.spec.ts` sibling variants in converter/mapper checks; (2) none material; (3) none.
Approx deletable: **~0** truly deletable (a handful collapsible into `it.each`, no dead/vacuous tests).

---

## TOTALS

- **Approx deletable/collapsible across all three: ~44 `it()` blocks** (CLI ~30, MCP ~14, scripts ~0 truly deletable).
- **Recommended net-new: ~4-5 MCP error-path tests** (4 health-history skipped cases + 1 convert-from-krd unsupported-format), to balance over-tested happy paths.

Authoring the edits should be routed to a separate executor pass to keep authoring and review in distinct lanes.
