<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# kaiord

## Purpose

Kaiord is an open-source health & fitness data framework: a TypeScript monorepo
for creating, converting, and managing workout/activity data across FIT, TCX,
ZWO, GCN, and the canonical KRD format. Built on a strict hexagonal /
ports-and-adapters architecture, with a CLI, MCP server for AI/LLM integration,
a React workout editor SPA, browser extensions for Garmin Connect and
Train2Go, and a VitePress documentation site.

## Key Files

| File                      | Description                                                               |
| ------------------------- | ------------------------------------------------------------------------- |
| `AGENTS.md`               | This file — strict AI/agent guidance (hexagonal rules, KRD, code style)   |
| `CLAUDE.md`               | Claude Code project instructions (commands, conventions, hexagonal rules) |
| `README.md`               | Human-facing project overview                                             |
| `CONTRIBUTING.md`         | Contributor workflow, OpenSpec flow, changesets                           |
| `DEPLOYMENT.md`           | Release/deployment notes                                                  |
| `LICENSE`                 | MIT license                                                               |
| `NOTICE`                  | Third-party attributions                                                  |
| `THIRD-PARTY-LICENSES.md` | Aggregated third-party license disclosures                                |
| `package.json`            | Workspace root manifest; lint/test/build scripts, pnpm overrides          |
| `pnpm-workspace.yaml`     | Declares `packages/*` as workspace members                                |
| `tsconfig.base.json`      | Base TypeScript config (strict mode) inherited by every package           |
| `eslint.config.js`        | Root ESLint flat config (boundaries, vitest rules, import sort)           |
| `knip.json`               | Dead-code / unused-export configuration                                   |
| `lychee.toml`             | Markdown link-checker configuration                                       |
| `commitlint.config.mjs`   | Conventional Commits rules                                                |
| `commitlint.vocab.mjs`    | Shared vocabulary/scopes for commit messages                              |
| `codecov.yml`             | Coverage upload configuration                                             |
| `CHANGELOG.md`            | Root changelog aggregating per-package changesets                         |

## Subdirectories

| Directory        | Purpose                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `packages/`      | All workspace packages (core + adapters + apps) (see `packages/AGENTS.md`)                    |
| `docs/`          | Project-level docs (architecture, KRD spec, runbooks) (see `docs/AGENTS.md`)                  |
| `openspec/`      | Spec-driven development workflow: proposals, domain specs, archive (see `openspec/AGENTS.md`) |
| `scripts/`       | Repo-wide tooling (lint guards, archive invariants, packaging) (see `scripts/AGENTS.md`)      |
| `styles/`        | Shared CSS/fonts consumed by frontend packages (see `styles/AGENTS.md`)                       |
| `test-fixtures/` | Real-world FIT/TCX/ZWO/GCN/KRD fixtures used across packages (see `test-fixtures/AGENTS.md`)  |
| `assets/`        | Brand/marketing assets used by frontends and docs (see `assets/AGENTS.md`)                    |

## For AI Agents

### Non-negotiables

- **Hexagonal architecture**: `domain` → `application` → `ports` → `adapters`.
  Inner layers MUST NOT import outer layers or external libraries.
- **KRD is canonical**: every conversion goes through KRD
  (`application/vnd.kaiord+json`). Zod schemas guard runtime; JSON Schema is
  emitted for external consumers via AJV.
- **Typed API**: TypeScript strict mode, no implicit `any`, no `any` escapes.
- **Never relax rules**: lint, coverage thresholds, and quality gates apply to
  ALL code including pre-existing violations. Fix the code, never downgrade
  the rule.
- **Zero tolerance**: zero ESLint warnings, zero TS errors, zero test warnings,
  zero build warnings, zero IDE warnings.
- **Round-trip safety**: time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm.

### Spec awareness

Before any non-trivial change:

1. Look in `openspec/changes/` for an active proposal matching the work.
2. If found, read `proposal.md`, `design.md`, and `tasks.md` before coding.
3. Reference `openspec/specs/` for canonical domain/architecture constraints.
4. Follow the hexagonal order in `tasks.md`; tick items `[x]` as you progress.
5. If no spec exists for a non-trivial change, run `/opsx:propose` first.

### Working in this directory

- Install with `pnpm install`; the workspace uses pnpm 9.15+ and Node ≥22.12.0.
- All source/comments/commits/docs MUST be in English (regardless of user
  language).
- Files ≤100 lines; functions <40 LOC (60 for React components). Tests exempt.
  - Do NOT write JSDoc preambles that justify file extractions, reference
    PRs/issues, or narrate prior code states. The 100-line cap is enforced by
    ESLint; the split itself does not need explanation. Choose a descriptive
    file name instead. Comments are reserved for non-obvious algorithm or
    invariant explanation.
- Prefer `type` over `interface`; separate type imports (`import type {...}`).
- Functions over classes; factories like `createValidator()`.
- Domain schemas: **snake_case** (`indoor_cycling`). Adapter schemas:
  **camelCase** (`indoorCycling`).
- Files: `kebab-case.ts`. Mappers `*.mapper.ts` (pure, no tests). Converters
  `*.converter.ts` (logic, requires tests).

### Testing requirements

- 80% coverage on `core` packages, 70% on frontend.
- Test conventions enforced mechanically (see `openspec/specs/test-conventions/`):
  - `R-ItTitleShould` — every `it()` title MUST start with `"should "`.
  - `R-ItBodyAAA` — every `it()` body MUST contain `// Arrange`, `// Act`,
    `// Assert` line comments in order, separated by blank lines.
- Verify before commit:
  ```bash
  pnpm -r build && pnpm -r test && pnpm lint:fix
  ```

### Mechanical guards (run via `pnpm test:scripts` / `pnpm lint`)

- `check-no-zustand-writethrough.mjs` — Zustand store MUST NOT write Dexie
  directly (R-DexieImport / R-PersistStateImport / R-AppDexieImport).
- `check-no-pii-leakage.mjs` — toast/`console.*` first args under SPA
  `{components,hooks,lib}/**` must be static literals (R-PIIInterpolation).
- `check-no-library-dual-mount.mjs` — only `LibraryPage.tsx` and
  `TemplatePickerDialog.tsx` may import the Library content component
  (R-LibraryNoDualMount).
- `check-session-match-id-shape.mjs` — every `coachingActivityId:` literal in a
  `sessionMatches` write call site and every `[profileId+coachingActivityId]`
  Dexie reader MUST be constructed via `buildCoachingActivityId(...)`,
  `toPersistedCoachingActivityId(...)`, or a `CoachingActivityRecord.id` access
  (R-SessionMatchIdShape).
- `check-archive-dates.mjs` — `openspec/changes/archive/YYYY-MM-DD-<slug>/`
  date prefix MUST equal the `> Completed:` marker inside `proposal.md`.
- `check-archive-followups.mjs` — `> Deferred to: #N` marker invariants.
- `check-spec-format.mjs` — domain spec structure (run as `pnpm lint:specs`).

### Common patterns

- **Strategy pattern**: format-agnostic conversions take a reader/writer
  injection. Pre-built and factory variants are exported by every adapter
  package:
  ```ts
  import { fitReader, createFitReader } from "@kaiord/fit";
  ```
- **Public API**:
  ```ts
  fromBinary(buf: Uint8Array, reader: BinaryReader, logger?: Logger): Promise<KRD>
  fromText(text: string, reader: TextReader, logger?: Logger): Promise<KRD>
  toBinary(krd: KRD, writer: BinaryWriter, logger?: Logger): Promise<Uint8Array>
  toText(krd: KRD, writer: TextWriter, logger?: Logger): Promise<string>
  ```
- **State (SPA editor)**: Zustand for editor runtime (undo/redo, selection,
  clipboard — never auto-persisted). Dexie + `useLiveQuery` for all persisted
  data. React state for ephemeral UI.

### Contribution flow

0. Active spec? If not, `/opsx:propose`.
1. Implement domain → application → ports → adapters (hexagonal order).
2. Add tests (unit + round-trip where applicable; AAA + `should ` titles).
3. `pnpm -r build && pnpm -r test && pnpm lint:fix`.
4. Add a changeset if version-worthy: `pnpm exec changeset`.
5. Update docs if public API changes.
6. After merge: `/opsx:archive`; then `pnpm archive:index` to refresh the index.

## Automated nightly maintenance (maintainer machine)

Autonomous **launchd jobs** run on the maintainer's Mac (not CI, not part of the
repo). They open **labeled PRs**; a paired watcher drives each PR's CI to green.
Recognize these bot-authored branches/labels — they appear without a human
opening them.

| launchd label                    | Schedule    | Script                          | Produces                                                    |
| -------------------------------- | ----------- | ------------------------------- | ----------------------------------------------------------- |
| `com.kaiord.nightly-test-review` | 03:15 daily | `~/.kaiord/nightly-test-review.sh` | `chore/nightly-test-review-*` → PR label `auto-test-review` |
| `com.kaiord.watch-test-review`   | every 20m   | `~/.kaiord/watch-test-review-pr.sh` | drives `auto-test-review` PRs to green + merges          |
| `com.kaiord.nightly-minify`      | 04:15 daily | `~/.kaiord/nightly-minify.sh`   | `chore/minify-<pkg>-*` → PR label `auto-minify`             |
| `com.kaiord.watch-minify-pr`     | every 20m   | `~/.kaiord/watch-minify-pr.sh`  | drives `auto-minify` PRs to green (merges only if opted in) |

Shared conventions: every script does `unset ANTHROPIC_API_KEY` to use the Claude
**subscription** login (`~/.claude`, never the paid API), runs
`claude -p --dangerously-skip-permissions --model claude-opus-4-8`, works in a
**dedicated worktree** under `~/development/kaiord.worktrees/` with `main` as the
fetch anchor, never merges from the nightly (only opens a labeled PR), and logs to
`~/.kaiord/*-YYYYMMDD.log`.

### Nightly minify (`nightly-minify.sh`)

Minimizes ONE package per night (queue `~/.kaiord/minify-queue.txt`, hexagonal
order `core → … → landing`), reducing `packages/<pkg>/src` to the least code that
still solves the problem: **dead code, duplication, needless indirection, and
redundant types only** — never rewriting for style, weakening tests, lowering
thresholds, widening `coverage.exclude`, or breaking the size/boundary
conventions. Local gate before the PR: `@kaiord/<pkg>` tests green + lint clean +
coverage (lines/statements/functions/branches) **≥ the pre-edit baseline**.
Outcomes update the queue line to `done` / `nochange` / `blocked`.

### Minify watcher (`watch-minify-pr.sh`)

Every 20 min: rebases conflicts, drives `auto-minify` PRs to green (fixing without
weakening tests/coverage, or reverting the offending reduction), and — only when
`MINIFY_AUTOMERGE=1` is set in `~/.kaiord/env` (OFF by default) — squash-merges on
green. Respects `hold` / `needs-human` / required-review gates. If a merge leaves
`main` red it opens a `needs-human` issue and never auto-edits production.

### Control

- Pause: `launchctl unload ~/Library/LaunchAgents/<label>.plist`; enable:
  `launchctl load -w ~/Library/LaunchAgents/<label>.plist`.
- Retry a package: set its line back to `pending` in `~/.kaiord/minify-queue.txt`.
- Opt into minify auto-merge: add `export MINIFY_AUTOMERGE=1` to `~/.kaiord/env`.

## Dependencies

### External

- **Node** ≥22.12.0, **pnpm** 9.15+ — workspace manager.
- **TypeScript** ^6 (strict mode, project references).
- **Vitest** — test runner across all packages.
- **ESLint** ^10 + `typescript-eslint`, `eslint-plugin-boundaries`,
  `@vitest/eslint-plugin`, `simple-import-sort` — lint stack.
- **Prettier** ^3 — formatter.
- **Changesets** — version bumps and changelog generation.
- **OpenSpec** (`@fission-ai/openspec`) — spec validation.
- **Husky** + lint-staged — pre-commit hooks.
- **Dependency-cruiser** — hexagonal architecture enforcement.
- **Knip** — dead-code detection.
- **size-limit**, **jscpd** — bundle size and duplication monitors.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
