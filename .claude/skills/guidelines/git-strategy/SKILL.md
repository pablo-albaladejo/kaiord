---
name: git-strategy
description: Read this guideline when creating commits, opening PRs, writing changeset descriptions, branching, or before running any git command that modifies history.
---

# Git Strategy — Kaiord

## PRs are mandatory

All changes go through a PR — even one-line fixes. NEVER push directly to `main`.

## Hooks must never be bypassed

NEVER use `HUSKY=0`, `--no-verify`, or any mechanism that skips pre-commit hooks. If a hook fails, fix the underlying issue.

## Conventional commits

Format: `type(scope): description`

Valid types: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`, `perf`

Valid scopes:
```
core  fit  tcx  zwo  garmin  garmin-connect  ai  cli  mcp
spa-editor  garmin-bridge  train2go-bridge
openspec  ci  docs  scripts
```

## Changesets

- One changeset per change (not per package) — packages in the linked array bump together
- The changeset is the **last commit** on the feature branch before requesting review
- Run `pnpm exec changeset` and follow the interactive prompt
- `garmin-bridge` and `train2go-bridge` are in the `linked` array — they need changesets when changed
- `workout-spa-editor` is not in `linked` or `ignore` — needs a changeset if changed
- The `private: true` flag prevents publishing but does not exempt a package from changesets

## OpenSpec archive naming

- Archive folder: `openspec/changes/archive/YYYY-MM-DD-<slug>/`
- Date prefix MUST equal the `> Completed: YYYY-MM-DD` marker in `proposal.md`
- Once assigned, the date MUST NOT change (preserves `git log --follow`)
- `openspec/changes/archive/README.md` is auto-generated — run `pnpm archive:index` to refresh, NEVER hand-edit it

## Quick reference

```bash
pnpm install && pnpm -r build          # bootstrap
pnpm -r test                           # all tests
pnpm -r test:coverage                  # with coverage
pnpm lint                              # lint + type-check + spec/archive lints
pnpm lint:fix                          # auto-fix
pnpm lint:specs                        # spec structure lint
pnpm archive:index                     # regenerate archive README
```

`-r` = recursive (all packages). Root-only commands (`pnpm lint`, `pnpm archive:index`) drop `-r`.
