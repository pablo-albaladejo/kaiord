---
name: opsx-propose
description: Create a structured proposal with specs, design decisions, and implementation tasks for a new feature or change.
---

Create a complete OpenSpec change artifact for the proposed feature.

## Before Creating

1. Read `openspec/config.yaml` for project constraints and rules
2. Read relevant existing specs in `openspec/specs/`
3. Read `CLAUDE.md` and `AGENTS.md` for project standards
4. If the topic is unfamiliar, suggest running `/opsx:explore` first

## Process

Ask the user to describe what they want to build. Discuss scope, constraints, and trade-offs BEFORE writing any artifacts. This is the debate phase — challenge assumptions, propose alternatives, and align on the approach.

Once aligned, create `openspec/changes/<slug>/` with these files in order:

### 1. proposal.md

```markdown
# Proposal: <title>

## Problem
Why this change is needed. What pain point it solves.

## Solution
What will be built. High-level approach.

## Affected Packages
Which @kaiord/* packages are touched and why.

## Breaking Changes
Any public API changes (mark with **BREAKING** if applicable).

## Constraints
- Architecture layer(s): domain / ports / application / adapters
- Referenced specs: openspec/specs/<domain>/spec.md
```

### 2. specs/<domain>/spec.md

Requirements using SHALL/MUST/SHOULD/MAY keywords. Each requirement gets a name and scenarios in Given/When/Then format. Include round-trip scenarios when touching converters.

### 3. design.md

Technical decisions with rationale and alternatives considered. Reference which hexagonal layer each decision affects. Justify any new dependencies. Include migration plan if changing public API.

### 4. tasks.md

Implementation checklist ordered by hexagonal layer:
1. Domain types/schemas
2. Port interfaces
3. Application use cases
4. Adapter implementations
5. Tests (unit + round-trip)
6. Documentation updates
7. Changeset

Use `- [ ]` checkbox format so `/opsx:apply` can track progress.

## After Creating

Run `npx openspec status` to confirm artifacts are registered. Present the proposal to the user for review before proceeding to `/opsx:apply`.
