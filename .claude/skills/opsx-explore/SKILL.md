---
name: opsx-explore
description: Investigate a topic or feature area before proposing a change. Researches codebase and generates understanding.
---

Explore a feature area in the Kaiord codebase to build understanding before creating a proposal.

## Steps

1. Read `openspec/config.yaml` for project constraints
2. Read relevant specs in `openspec/specs/` for the domain area
3. Read `CLAUDE.md` and `AGENTS.md` for project rules
4. Search the codebase for related code:
   - Domain types and schemas in `packages/core/src/domain/`
   - Port interfaces in `packages/core/src/ports/`
   - Application use cases in `packages/core/src/application/`
   - Adapter implementations in relevant `packages/*/src/adapters/`
5. Identify existing patterns, dependencies, and constraints
6. Present findings to the user with:
   - What exists today
   - What hexagonal layers are involved
   - What external dependencies are used
   - Gaps or opportunities for the proposed feature
7. Ask the user if they want to proceed with `/opsx:propose`

## Output

A conversational summary — no files created. This is a research phase.
