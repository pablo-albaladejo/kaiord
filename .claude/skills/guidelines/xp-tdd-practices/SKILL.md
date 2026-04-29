---
name: xp-tdd-practices
description: Read this guideline when creating implementation tasks, doing TDD, deciding task order, or working on any feature with observable behavior.
---

# XP & TDD Practices — Kaiord

## TDD task format

Every implementation task with behavior (use cases, adapters, converters, components, hooks) uses the preceding-sibling RED → GREEN → REFACTOR pattern:

```markdown
- [ ] parent feature
  - [ ] write failing test for X (RED)
  - [ ] implement X — minimal passing code (GREEN)
  - [ ] refactor X (REFACTOR)
```

The failing test task MUST immediately precede its implementation task. Do not batch tests at the end.

## Tasks without behavior

Types, interfaces, DTOs, config files, and pure wiring tasks are plain checkboxes — no TDD format.

## Bug fixes

A bug fix that changes observable behavior MUST start with a failing regression test that reproduces the bug, then the fix that makes it pass.

## Task ordering — inside-out

Order tasks strictly by layer:

```
domain types/schemas → ports → application use cases → adapters → CLI/MCP wiring → docs/changeset
```

Within each layer, apply RED → GREEN → REFACTOR ordering.

## Task sizing

Each checkbox should be implementable + testable in one focused commit (~30–60 min). Split larger items into nested sub-checkboxes.

## Final validation group

Every task list ends with this block (in order):

```markdown
- [ ] pnpm -r test:coverage (thresholds: 80% core, 70% frontend)
- [ ] pnpm -r build (zero warnings)
- [ ] pnpm lint (zero errors/warnings; includes lint:specs, lint:archive, lint:archive-index)
- [ ] /opsx:verify against all spec scenarios
- [ ] pnpm exec changeset (for any user-visible change)
- [ ] Update affected domain specs in openspec/specs/ and run pnpm lint:specs
```
