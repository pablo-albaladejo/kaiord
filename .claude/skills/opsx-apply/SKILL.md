---
name: opsx-apply
description: Implement a change guided by its OpenSpec artifacts. Reads proposal, design, and tasks before writing code.
---

Implement the change described in an active OpenSpec change.

## Before Implementing

1. Read `openspec/changes/<slug>/proposal.md` — understand the why
2. Read `openspec/changes/<slug>/specs/` — understand the requirements
3. Read `openspec/changes/<slug>/design.md` — understand the technical decisions
4. Read `openspec/changes/<slug>/tasks.md` — get the implementation checklist
5. Read referenced domain specs in `openspec/specs/`
6. Read `openspec/config.yaml` for code style and quality rules

## Implementation Rules

- Follow the task order in `tasks.md` (hexagonal: domain -> ports -> application -> adapters)
- Mark each `- [ ]` as `- [x]` in `tasks.md` when completed
- Do NOT diverge from the design decisions — if something needs to change, flag it to the user
- Files <= 100 lines (tests exempt), functions < 40 LOC
- Use `type` not `interface`, separate type imports
- Domain schemas: snake_case, adapter schemas: camelCase
- Converters require tests, mappers do not
- All code and comments in English

## After Each Task

- Run relevant tests: `pnpm --filter @kaiord/<pkg> test`
- Update `tasks.md` checkbox

## After All Tasks

- Run full verification: `pnpm -r test && pnpm -r build && pnpm lint:fix`
- Suggest running `/opsx:verify` to confirm spec compliance
