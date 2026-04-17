---
name: opsx-archive
description: Archive a completed change after its PR is merged. Moves artifacts to the archive directory.
---

Archive a completed OpenSpec change.

## Invariant

The archive folder's date prefix MUST equal the `> Completed:` marker
inside its `proposal.md`. Enforced in CI by `pnpm lint:archive`
(backed by `scripts/check-archive-dates.mjs`); break once and every
future reader is lied to. After archiving, also run
`pnpm archive:index` to refresh the auto-generated
`openspec/changes/archive/README.md`.

## Prerequisites

- All tasks in `tasks.md` are checked `[x]`
- The PR has been merged (or the user confirms completion)

## Steps

1. Read `openspec/changes/<slug>/tasks.md` — verify all complete
2. Add completion date to the top of `proposal.md`:
   ```
   > Completed: YYYY-MM-DD
   ```
3. Move `openspec/changes/<slug>/` to `openspec/changes/archive/YYYY-MM-DD-<slug>/` where `YYYY-MM-DD` is today's archive date (matching the `> Completed:` marker). The date prefix is assigned once and MUST NOT change afterwards — this preserves `git log --follow` history.
4. If the change introduced new domain capabilities, sync the relevant specs:
   - Merge delta specs from `openspec/changes/archive/YYYY-MM-DD-<slug>/specs/` into `openspec/specs/`
   - Or suggest running `/opsx:sync` for a thorough update

## After Archiving

1. Confirm the archive with `npx openspec status`.
2. Run `pnpm archive:index` to regenerate `openspec/changes/archive/README.md`.
   Stage and commit the diff — CI will fail via `pnpm lint:archive-index`
   otherwise.
3. If you see `pnpm lint:archive` fail, check that the folder date prefix
   matches the `> Completed:` marker inside `proposal.md` exactly.
4. If you see `pnpm lint:archive-index` fail, re-run `pnpm archive:index`
   and commit the diff — the committed README has drifted from the
   generator output.
