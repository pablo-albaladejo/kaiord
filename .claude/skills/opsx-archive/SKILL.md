---
name: opsx-archive
description: Archive a completed change after its PR is merged. Moves artifacts to the archive directory.
---

Archive a completed OpenSpec change.

## Prerequisites

- All tasks in `tasks.md` are checked `[x]`
- The PR has been merged (or the user confirms completion)

## Steps

1. Read `openspec/changes/<slug>/tasks.md` — verify all complete
2. Add completion date to the top of `proposal.md`:
   ```
   > Completed: YYYY-MM-DD
   ```
3. Move `openspec/changes/<slug>/` to `openspec/changes/archive/<slug>/`
4. If the change introduced new domain capabilities, sync the relevant specs:
   - Merge delta specs from `openspec/changes/archive/<slug>/specs/` into `openspec/specs/`
   - Or suggest running `/opsx:sync` for a thorough update

## After Archiving

Confirm the archive with `npx openspec status`.
