<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# openspec

## Purpose

Spec-driven development workflow powered by `@fission-ai/openspec`. Every
non-trivial feature or fix starts with a proposal here before any code is
written. Canonical domain specs live alongside active proposals and the
archived history of completed changes.

## Key Files

| File               | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `SPEC_TEMPLATE.md` | Canonical shape for new domain specs (under `specs/`). `pnpm lint:specs` validates structure. |
| `config.yaml`      | OpenSpec project configuration (constraints used by AI planners)                              |

## Subdirectories

| Directory  | Purpose                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `specs/`   | Domain specifications — the durable contract for architecture, formats, ports (see `specs/AGENTS.md`)    |
| `changes/` | Proposals (active in `changes/*`, completed in `changes/archive/YYYY-MM-DD-*`) (see `changes/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- **Before non-trivial code**: check `changes/` for an active proposal that
  covers the work. If none exists, run `/opsx:propose` to create one.
- **Spec files MUST follow `SPEC_TEMPLATE.md`** — `pnpm lint:specs` runs the
  structural lint (`scripts/check-spec-format.mjs`) plus
  `openspec validate --specs`. Leaving any `<...>` placeholder fails CI.
- **Archives**: every directory under `changes/archive/` MUST be named
  `YYYY-MM-DD-<slug>` where the date prefix matches the
  `> Completed:` marker inside `proposal.md`. Enforced by
  `pnpm lint:archive` (`scripts/check-archive-dates.mjs`).
- **Archive index**: `changes/archive/README.md` is generated. After
  archiving, run `pnpm archive:index` to refresh it. CI verifies freshness
  with `pnpm lint:archive-index`.
- **Deferred tasks**: a task deferred to a follow-up issue MUST be marked
  with a `> Deferred to: #N` blockquote (positive integer, `#`-prefixed).
  At archive time, `> Tasks: <C> completed, <D> deferred` MUST appear at
  the top of `tasks.md`; `D` must equal the deferral marker count, and the
  ratio invariant `D ≤ C` is enforced by `pnpm lint:archive-followups`.

### Testing Requirements

- `pnpm lint:specs` — structural + OpenSpec validation.
- `pnpm lint:archive` — archive folder date invariant.
- `pnpm lint:archive-index` — generated index parity.
- `pnpm lint:archive-followups` — deferral marker invariants.
  All four run as part of `pnpm lint` and in CI.

### Common Patterns

- A proposal directory contains: `proposal.md`, `design.md`, `tasks.md`,
  and (often) `delta-specs/` patches for canonical specs.
- Tasks are checkboxed; tick `[x]` as work progresses. Mid-implementation
  changes to scope require an update to the proposal, not silent divergence.

## Dependencies

### Internal

Specs reference `packages/core/` for the canonical architecture rules. Archives
reference past PR numbers and adjacent specs.

### External

- `@fission-ai/openspec` (devDependency) — `validate --specs` enforces the
  spec contract.

<!-- MANUAL: -->
